import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "playwright";

import { archiveSeasons } from "../app/data.ts";

const SOURCE_ORIGIN = "https://www.space-talks.com";
const OUTPUT_PATH = resolve("content/archive-abstracts.json");
const SOURCE_PATH_OVERRIDES = {
  "fall-2025": "2025-fall",
};
const SEASONS_WITHOUT_ABSTRACTS = new Set(["summer-2021"]);

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

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage();
const output = {
  _source: `${SOURCE_ORIGIN}/archive`,
  _retrieved: new Date().toISOString().slice(0, 10),
  _seasonSources: {},
};
const missing = [];

try {
  for (const season of archiveSeasons) {
    const sourcePath = SOURCE_PATH_OVERRIDES[season.slug] ?? season.slug;
    const sourceUrl = `${SOURCE_ORIGIN}/${sourcePath}`;
    output._seasonSources[season.slug] = sourceUrl;
    await page.goto(sourceUrl, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.waitForTimeout(4_000);

    const textElements = (await page.locator("h1,h2,h3,h4,h5,h6,p").allInnerTexts())
      .map(clean)
      .filter(Boolean);
    const normalizedElements = textElements.map(normalize);
    const seasonAbstracts = {};
    const titleIndexes = new Map(
      season.talks.map((talk) => [
        talk.title,
        normalizedElements.findIndex((value) => value === normalize(talk.title)),
      ]),
    );

    for (const talk of season.talks) {
      const titleIndex = titleIndexes.get(talk.title) ?? -1;
      const locationIndex = normalizedElements.findIndex(
        (value, index) => index > titleIndex && value.startsWith("location:"),
      );
      const nextTitleIndex = Math.min(
        ...[...titleIndexes.values()].filter((index) => index > locationIndex),
        textElements.length,
      );
      const abstract = locationIndex >= 0
        ? textElements.slice(locationIndex + 1, nextTitleIndex).join("\n\n")
        : undefined;

      if (titleIndex < 0 || !abstract || abstract.length < 40) {
        if (!SEASONS_WITHOUT_ABSTRACTS.has(season.slug)) {
          missing.push(`${season.slug}: ${talk.title}`);
        }
        continue;
      }

      seasonAbstracts[talk.title] = abstract;
    }

    output[season.slug] = seasonAbstracts;
    console.log(`${season.slug}: ${Object.keys(seasonAbstracts).length}/${season.talks.length}`);
  }
} finally {
  await browser.close();
}

if (missing.length) {
  throw new Error(`Could not match every archive abstract:\n${missing.join("\n")}`);
}

await writeFile(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`, "utf8");
console.log(`Wrote ${OUTPUT_PATH}`);
