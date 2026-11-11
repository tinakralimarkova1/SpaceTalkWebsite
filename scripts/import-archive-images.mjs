import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "playwright";
import sharp from "sharp";

import { archiveSeasons } from "../app/data.ts";

const SOURCE_ORIGIN = "https://www.space-talks.com";
const OUTPUT_DIRECTORY = resolve("public/archive-images");
const MANIFEST_PATH = resolve("content/archive-images.json");
const SOURCE_PATH_OVERRIDES = {
  "fall-2025": "2025-fall",
};
const manualImages = JSON.parse(
  await readFile(resolve("content/archive-image-overrides.json"), "utf8"),
);

function clean(value) {
  return value.replaceAll("\u00a0", " ").replaceAll("\u200b", "").replace(/\s+/g, " ").trim();
}

function normalize(value) {
  return clean(value)
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .toLocaleLowerCase("en");
}

function slugify(value) {
  return normalize(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function originalWixAsset(source) {
  return source.includes("/v1/") ? source.split("/v1/")[0] : source;
}

await mkdir(OUTPUT_DIRECTORY, { recursive: true });

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage();
const manifest = {
  _source: `${SOURCE_ORIGIN}/archive`,
  _retrieved: new Date().toISOString().slice(0, 10),
  _seasonSources: {},
};
let imageCount = 0;

try {
  for (const season of archiveSeasons) {
    const sourcePath = SOURCE_PATH_OVERRIDES[season.slug] ?? season.slug;
    const sourceUrl = `${SOURCE_ORIGIN}/${sourcePath}`;
    manifest._seasonSources[season.slug] = sourceUrl;
    await page.goto(sourceUrl, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.waitForTimeout(4_000);

    const nodes = await page.locator("h1,h2,h3,h4,h5,h6,p,img").evaluateAll((elements) =>
      elements.map((element) => element.tagName === "IMG"
        ? {
            type: "image",
            alt: element.alt,
            source: element.currentSrc || element.src,
          }
        : {
            type: "text",
            text: element.textContent ?? "",
          }),
    );
    const normalizedNodes = nodes.map((node) => normalize(node.type === "text" ? node.text : ""));
    const titleIndexes = new Map(
      season.talks.map((talk) => [
        talk.title,
        normalizedNodes.findIndex((value) => value === normalize(talk.title)),
      ]),
    );
    const seasonImages = {};

    for (const talk of season.talks) {
      const titleIndex = titleIndexes.get(talk.title) ?? -1;
      if (titleIndex < 0) continue;

      const nextTitleIndex = Math.min(
        ...[...titleIndexes.values()].filter((index) => index > titleIndex),
        nodes.length,
      );
      const image = nodes
        .slice(titleIndex + 1, nextTitleIndex)
        .find((node) => node.type === "image" && clean(node.alt) && node.source.includes("static.wixstatic.com"));
      if (!image) continue;

      const source = originalWixAsset(image.source);
      const response = await fetch(source);
      if (!response.ok) throw new Error(`Image request failed (${response.status}): ${source}`);

      const relativePath = `${season.slug}/${slugify(talk.title)}.webp`;
      const destination = resolve(OUTPUT_DIRECTORY, relativePath);
      await mkdir(resolve(OUTPUT_DIRECTORY, season.slug), { recursive: true });
      await sharp(Buffer.from(await response.arrayBuffer()))
        .resize({ width: 1200, height: 900, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 82 })
        .toFile(destination);

      seasonImages[talk.title] = {
        alt: clean(image.alt),
        path: `/archive-images/${relativePath}`,
        source,
      };
      imageCount += 1;
    }

    for (const [title, image] of Object.entries(manualImages[season.slug] ?? {})) {
      if (!seasonImages[title]) imageCount += 1;
      seasonImages[title] = image;
    }

    manifest[season.slug] = seasonImages;
    console.log(`${season.slug}: ${Object.keys(seasonImages).length}/${season.talks.length}`);
  }
} finally {
  await browser.close();
}

await writeFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(`Wrote ${imageCount} images and ${MANIFEST_PATH}`);
