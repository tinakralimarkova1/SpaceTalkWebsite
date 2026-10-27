import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const routes = ["/", "/archive", "/posters"];

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
  for (let i = 0; i < 4; i++) await nextControl(page, browserName);
  await expect(page.getByRole("navigation", { name: "Primary navigation" }).getByRole("link", { name: "Archive" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/archive$/);
  await page.getByRole("navigation", { name: "Primary navigation" }).getByRole("link", { name: "Posters" }).focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/posters$/);
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
