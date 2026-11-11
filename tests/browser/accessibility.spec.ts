import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const routes = ["/", "/archive", "/posters", "/thinking-outer-space"];

test("search and social metadata use the canonical custom domain", async ({ page, request }) => {
  const expected = [
    { path: "/", canonical: "https://www.space-talks.com", title: "NYU Space Talks" },
    { path: "/archive", canonical: "https://www.space-talks.com/archive", title: "Archive" },
    { path: "/posters", canonical: "https://www.space-talks.com/posters", title: "Posters" },
    {
      path: "/thinking-outer-space",
      canonical: "https://www.space-talks.com/thinking-outer-space",
      title: "Thinking Outer Space",
    },
  ];

  for (const pageMetadata of expected) {
    await page.goto(pageMetadata.path);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", pageMetadata.canonical);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", pageMetadata.title);
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", pageMetadata.canonical);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      "content",
      "https://www.space-talks.com/space-black.png",
    );
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary");
  }

  const robots = await request.get("/robots.txt");
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toContain("Sitemap: https://www.space-talks.com/sitemap.xml");

  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  const sitemapText = await sitemap.text();
  for (const pageMetadata of expected) expect(sitemapText).toContain(`<loc>${pageMetadata.canonical.replace(/\/$/, "")}</loc>`);
});

test("2021 archive includes the talks and full summer session programs", async ({ page }) => {
  await page.goto("/archive");
  const spring = page.locator("#spring-2021");
  const summer = page.locator("#summer-2021");
  await expect(spring.locator(".archive-talk")).toHaveCount(3);
  await expect(summer.locator(".archive-talk")).toHaveCount(3);
  await expect(summer.locator(".archive-presentations > li")).toHaveCount(5);
  await expect(summer.locator(".archive-participants").nth(0).locator("li")).toHaveCount(4);
  await expect(summer.locator(".archive-participants").nth(1).locator("li")).toHaveCount(6);
  await expect(summer.getByText(/^Chair:/)).toHaveCount(3);
  await expect(summer.getByText(/^Discussant:/)).toContainText("Caitríona Ní Dhúill");
  await expect(spring.locator(".archive-season-number")).toHaveText("Season I");
  await expect(summer.locator(".archive-season-number")).toHaveCount(0);
});

test("archive dropdowns reveal the abstracts from the original season pages", async ({ page }) => {
  await page.goto("/archive");
  await expect(page.locator(".archive-talk-abstract")).toHaveCount(42);
  await expect(page.locator(".archive-talk-image")).toHaveCount(21);
  await expect(page.locator(".archive-talk-image-source")).toHaveCount(21);
  await expect(page.locator(".archive-talk-image-fallback")).toHaveCount(0);
  await expect(page.locator("#spring-2024 .archive-talk-image-source")).toHaveCount(4);
  await expect(page.locator("#spring-2024 .archive-talk-image-fallback")).toHaveCount(0);
  await expect(page.locator("#fall-2024 .archive-talk").first().locator(".archive-talk-image-source")).toHaveCount(1);

  const firstTalk = page.locator(".archive-talk").first();
  await expect(firstTalk).not.toHaveAttribute("open", "");
  await firstTalk.locator("summary").focus();
  await page.keyboard.press("Enter");
  await expect(firstTalk).toHaveAttribute("open", "");
  await expect(firstTalk.getByRole("heading", { name: "Abstract" })).toBeVisible();
  await expect(firstTalk.locator(".archive-talk-image img")).toBeVisible();
  await expect.poll(() => firstTalk.locator("img").evaluate((image) => (image as HTMLImageElement).naturalWidth))
    .toBeGreaterThan(0);
  await expect(firstTalk.locator(".archive-talk-abstract p")).toContainText(
    "Several of the world’s wealthiest people",
  );
});

test("archive roundtables pair every speaker with their institution", async ({ page }) => {
  await page.goto("/archive");

  const roundtable = page.locator("#fall-2024 .archive-talk").filter({
    hasText: "Whither a Planetary Turn?",
  });
  await roundtable.locator("summary").click();

  await expect(roundtable.locator(".archive-speaker-pairs")).toHaveText(
    "Thore Bjørnvig (Copenhagen), Alexander C.T. Geppert (NYU/NYU Shanghai), Haitian Ma (Universiteit van Amsterdam), Tilmann Siebeneichner (ZZF Potsdam), Brad Tabas (ENSTA Bretagne)",
  );
  await expect(roundtable.locator(".archive-speaker-pairs")).toHaveCSS("color", "rgb(170, 178, 196)");
});

test("talk numbers follow the historical sequence and skip Summer 2021", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".talk-card h3")).toHaveText([
    /44\. A Mountain in Space/,
    /45\. SETI@home 2\.0/,
    /46\. The Kuafu Paradox/,
    /47\. When Is a Planet Just Right\?/,
  ]);

  await page.goto("/archive");
  await expect(page.locator("#spring-2026 .archive-talk-title")).toHaveText([
    /40\. How to Think Like a Space Billionaire/,
    /41\. Italy's Participation in Spacelab/,
    /42\. Eyes in the Sky/,
    /43\. Prelude to the Space Age/,
  ]);
  await expect(page.locator("#spring-2021 .archive-talk-title")).toHaveText([
    /2\. Dark Skies/,
    /3\. The Eighth Continent/,
    /4\. Militant Astroculture/,
  ]);
  const summerTitles = await page.locator("#summer-2021 .archive-talk-title").allTextContents();
  expect(summerTitles.every((title) => !/^\d+\./.test(title))).toBe(true);
});

test("archive dropdown animation respects reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/archive");
  const firstTalk = page.locator(".archive-talk").first();
  const summary = firstTalk.locator("summary");

  await summary.click();
  await expect(firstTalk).toHaveAttribute("open", "");
  await expect(firstTalk).not.toHaveCSS("overflow", "hidden");

  await summary.click();
  await expect(firstTalk).not.toHaveAttribute("open", "");
});

async function nextControl(page: Page, browserName: string) {
  // Safari on macOS uses Option-Tab to include links and buttons by default.
  await page.keyboard.press(browserName === "webkit" && process.platform === "darwin" ? "Alt+Tab" : "Tab");
}

for (const width of [320, 390, 768, 820, 1024, 1440]) {
  for (const route of routes) {
    test(`${route} fits at ${width}px with accessible headings and controls`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(route);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.getByRole("main")).toHaveCount(1);
      await expect(page.getByRole("banner")).toHaveCount(1);
      await expect(page.getByRole("banner").getByRole("link", { name: "NYU Arts & Science" }))
        .toHaveAttribute("href", "https://as.nyu.edu");
      const fontSizes = await page.evaluate(() => [...new Set(
        [...document.querySelectorAll<HTMLElement>("main *, .site-header *, .skip-link")]
          .filter((element) => element.getBoundingClientRect().width > 0 &&
            !element.closest(".honeypot-field, h1") &&
            !(innerWidth <= 600 && element.closest(".site-header nav")) &&
            [...element.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim()))
          .map((element) => getComputedStyle(element).fontSize),
      )]);
      expect(fontSizes.every((size) => ["16px", "20px", "32px", "56px"].includes(size))).toBe(true);
      const overflow = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>("main *, .site-header *")]
        .filter((element) => {
          const box = element.getBoundingClientRect();
          return box.width > 0 && !element.closest(".honeypot-field") &&
            (box.right > innerWidth + 1 || box.left < -1 || element.scrollWidth > element.clientWidth + 1 &&
              [".talk-time-row", ".archive-season-heading", "h1", ".signup-form"].some((selector) => element.matches(selector)));
        }).map((element) => element.className || element.tagName));
      expect(overflow).toEqual([]);
      if (route === "/archive") {
        const mismatchedHeadings = await page.locator(".archive-season-heading").evaluateAll((headings) =>
          headings.filter((heading) => {
            const title = heading.querySelector("h2");
            const number = heading.querySelector(".archive-season-number");
            return title && number && getComputedStyle(title).fontSize !== getComputedStyle(number).fontSize;
          }).map((heading) => heading.textContent));
        expect(mismatchedHeadings).toEqual([]);
      }
      if (route === "/") {
        for (const range of await page.locator(".talk-time-range").all()) {
          expect(await range.evaluate((element) => {
            const range = document.createRange();
            range.selectNodeContents(element);
            return range.getClientRects().length;
          })).toBe(1);
        }
      }
      if (width === 390 || width === 1440) {
        const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
        expect(result.violations).toEqual([]);
        await page.screenshot({ path: testInfo.outputPath("page.png"), fullPage: true });
      }
    });
  }
}

for (const width of [320, 390, 430, 600]) {
  test(`phone navigation stays on one row at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    const links = page.getByRole("navigation", { name: "Primary navigation" }).getByRole("link");
    const boxes = await links.evaluateAll((elements) => elements.map((element) => {
      const box = element.getBoundingClientRect();
      return { top: box.top, height: box.height, left: box.left, right: box.right, fontSize: getComputedStyle(element).fontSize };
    }));
    expect(boxes).toHaveLength(6);
    expect(new Set(boxes.map((box) => box.top)).size).toBe(1);
    for (const box of boxes) {
      expect(box.height).toBeGreaterThanOrEqual(44);
      expect(box.left).toBeGreaterThanOrEqual(0);
      expect(box.right).toBeLessThanOrEqual(width);
      expect(Number.parseFloat(box.fontSize)).toBeGreaterThanOrEqual(10);
      expect(Number.parseFloat(box.fontSize)).toBeLessThanOrEqual(13);
    }
  });
}

for (const route of routes) {
  test(`${route} supports 200% text resizing on a narrow screen`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(route);
    await page.addStyleTag({ content: "html { font-size: 200%; }" });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    const clipped = await page.locator("h1, .talk-time-row, .archive-season-heading, .signup-form").evaluateAll((elements) =>
      elements.filter((element) => element.scrollWidth > element.clientWidth + 1).map((element) => element.className || element.tagName));
    expect(clipped).toEqual([]);
  });

  test(`${route} has a working keyboard skip link and visible focus`, async ({ page, browserName }) => {
    await page.goto(route);
    await nextControl(page, browserName);
    const skip = page.getByRole("link", { name: "Skip to content" });
    await expect(skip).toBeFocused();
    await expect(skip).toBeInViewport();
    expect(await skip.evaluate((element) => getComputedStyle(element).outlineStyle)).toBe("solid");
    await page.keyboard.press("Enter");
    await expect(page.getByRole("main")).toBeFocused();
    if (await page.locator("main a[href], main input, main button").count()) {
      await nextControl(page, browserName);
      expect(await page.evaluate(() => document.querySelector("main")?.contains(document.activeElement))).toBe(true);
    }
  });
}

test("keyboard navigation can open Archive and Posters", async ({ page, browserName }) => {
  await page.goto("/");
  for (let i = 0; i < 5; i++) await nextControl(page, browserName);
  await expect(page.getByRole("navigation", { name: "Primary navigation" }).getByRole("link", { name: "Archive" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/archive$/);
  await page.getByRole("navigation", { name: "Primary navigation" }).getByRole("link", { name: "Posters" }).focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/posters$/);
});

test("navigation Home link returns to the NYU Space Talks hero", async ({ page }) => {
  await page.goto("/archive");
  const home = page.getByRole("navigation", { name: "Primary navigation" }).getByRole("link", { name: "Home" });
  await expect(home).toHaveAttribute("href", "/#about");
  await home.click();
  await expect(page).toHaveURL(/\/#about$/);
  await expect(page.getByRole("heading", { level: 1, name: "NYU Space Talks" })).toBeInViewport();
});

test("all displayed current-season time ranges use en dashes", async ({ page }) => {
  await page.goto("/");
  const times = await page.locator(".talk-date strong").allTextContents();
  expect(times.length).toBeGreaterThan(0);
  expect(times.every((time) => !/\d-\d/.test(time) && /\d–\d/.test(time))).toBe(true);
});

test("home load animation is brief and disabled by reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");

  const animation = await page.locator(".hero").evaluate((hero) => ({
    curtain: getComputedStyle(hero, "::before").animationDuration,
    curtainName: getComputedStyle(hero, "::before").animationName,
    stars: getComputedStyle(hero, "::after").animationName,
    content: getComputedStyle(hero.querySelector(".hero-copy")!).animationDuration,
  }));
  expect(animation).toEqual({
    curtain: "1.15s",
    curtainName: "hero-space-reveal",
    stars: "none",
    content: "0.9s",
  });

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  const reduced = await page.locator(".hero").evaluate((hero) => ({
    curtain: getComputedStyle(hero, "::before").display,
    content: getComputedStyle(hero.querySelector(".hero-copy")!).animationName,
  }));
  expect(reduced).toEqual({ curtain: "none", content: "none" });
});

test("reduced motion disables parallax and smooth scrolling, including preference changes", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const offset = () => page.evaluate(() => document.documentElement.style.getPropertyValue("--parallax-y"));
  await page.evaluate(() => window.scrollTo({ top: 600, behavior: "instant" }));
  await expect.poll(offset).toBe("");
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe("auto");
  expect(await page.locator(".site-background").evaluate((element) => getComputedStyle(element).willChange)).toBe("auto");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect.poll(offset).not.toBe("");
  await page.evaluate(() => window.scrollTo({ top: 1000, behavior: "instant" }));
  await expect.poll(offset).toBe("-80px");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect.poll(offset).toBe("");
});

test("newsletter supports keyboard submission and announces success/errors without live writes", async ({ page, browserName }) => {
  let status = 201;
  await page.route("**/api/newsletter", (route) => route.fulfill({
    status, contentType: "application/json",
    body: JSON.stringify({ message: status === 201 ? "Thank you. You have joined the mailing list." : "Too many signup attempts. Please try again later." }),
  }));
  await page.goto("/");
  for (const next of [201, 429]) {
    status = next;
    await page.getByLabel("First Name", { exact: true }).focus();
    await page.keyboard.type("Keyboard");
    await nextControl(page, browserName);
    await expect(page.getByLabel("Last Name", { exact: true })).toBeFocused();
    await page.keyboard.type("Test");
    await nextControl(page, browserName);
    await expect(page.getByLabel("Organization", { exact: true })).toBeFocused();
    await nextControl(page, browserName);
    await expect(page.getByLabel("Email", { exact: true })).toBeFocused();
    await page.keyboard.type("test@example.org");
    await nextControl(page, browserName);
    await expect(page.getByRole("button", { name: "Submit", exact: true })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("status")).toContainText(status === 201 ? "Thank you" : "Too many");
    await expect(page.getByRole("status")).toHaveAttribute("aria-live", "polite");
  }
});

test("archive year navigation links to each year's newest semester with a keyboard", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/archive");
  const links = page.getByRole("navigation", { name: "Archive years" }).getByRole("link");
  await expect(links).toHaveText(["2026", "2025", "2024", "2023", "2022", "2021"]);
  for (const link of await links.all()) {
    const year = await link.textContent();
    const slug = `${year === "2026" ? "spring" : "fall"}-${year}`;
    await expect(link).toHaveAttribute("href", `#${slug}`);
    await link.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(new RegExp(`#${slug}$`));
    await expect(page.locator(`#${slug} h2`)).toBeInViewport();
  }
});

test("poster year anchors and PDF downloads work with a keyboard", async ({ page }) => {
  await page.goto("/posters");
  await page.getByRole("navigation", { name: "Poster years" }).getByRole("link", { name: "2021" }).focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#year-2021$/);
  await expect(page.getByRole("heading", { name: "2021", exact: true })).toBeInViewport();
  await page.getByRole("link", { name: "Download Spring 2021 poster PDF", exact: true }).focus();
  const download = page.waitForEvent("download");
  await page.keyboard.press("Enter");
  expect((await download).suggestedFilename()).toBe("space-talks-spring-2021.pdf");
});
