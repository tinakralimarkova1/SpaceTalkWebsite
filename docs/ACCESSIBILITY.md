# Accessibility and responsive checks

Reviewed 2026-10-26. These checks support, but do not certify, accessibility conformance.

Final local results: 58/58 browser tests and 24/24 newsletter regression tests passed. Production build/TypeScript and ESLint passed; npm audit reported zero vulnerabilities. Automated axe scans reported no violations in the tested states. Production desktop, mobile talk, and Summer 2021 screenshots were visually reviewed.

## Changes

- Added a keyboard-visible skip link, a focusable main landmark, a shared header/banner, and visible focus outlines.
- Enlarged navigation targets and made the header non-sticky on small screens.
- Kept each time range intact while allowing time-zone pairs to wrap when space is limited.
- Fixed the invalid archive heading margin and allowed headings, cards, and contact text to reflow at enlarged text sizes.
- Disabled parallax and smooth scrolling for reduced-motion preferences, including changes made while the page is open.
- Added contextual names to poster download/view links and kept newsletter status updates in a polite live region.
- Used one continuous 76% dark overlay to improve text contrast over bright image regions without introducing section boundaries.

## Repeatable checks

Install dependencies with `npm ci`. Tests use installed Google Chrome and Playwright WebKit; install the latter with `npx playwright install webkit`.

Run `npm run build`, then start `npm run start -- --port 3107` in another terminal. Run:

```sh
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3107 npm run test:browser
npm test
npm run lint
npm audit
```

The browser suite covers Home, Archive, and Posters at widths 320, 390, 768, 820, 1024, and 1440px in Chrome and WebKit. It checks overflow, heading/landmark structure, unbroken time ranges, 200% root text resizing, keyboard navigation, skip links, reduced motion, poster anchors/downloads, and the 2021 archive entries. Axe checks WCAG A/AA tags through 2.2 at 390px and 1440px. Screenshots and failure traces are generated under ignored `test-results/`.

Newsletter browser responses are mocked: these tests do not write to Google Sheets. Node tests cover server and Apps Script behavior separately.

On macOS, WebKit tests use Option-Tab to include links and buttons, matching [Safari's documented keyboard behavior](https://support.apple.com/guide/safari/keyboard-shortcuts-and-gestures-cpsh003/mac). They do not change user browser or operating-system preferences.

## Remaining manual checks

- Verify on a real iPhone/Safari and Android device, including background scrolling and PDF downloads.
- Use VoiceOver or NVDA to listen to labels, reading order, and form success/error announcements. Automated live-region assertions do not confirm spoken output.
- Check browser zoom, landscape orientation, and user-selected text settings. Root-font resizing is not a substitute for every browser zoom mode.
- Review visual contrast after any future background, overlay, or text-color changes. Axe does not reliably assess every text-on-image combination.
