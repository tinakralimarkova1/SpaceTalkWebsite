# Vercel deployment checklist

Review date: 2026-10-26
Reviewed branch: main
Project directory: /Users/tinakralimarkova/NYU_SpaceTalks/SpaceTalkWebsite

Status: dependencies and newsletter protections implemented on main. The user reported deploying the Sheet-only Apps Script revision. A subsequent retry of the approved existing test identity returned HTTP 201 and the normal success message through the website API. The earlier live signup/retry produced one row, confirmed by the user. Public launch is not yet cleared; no Vercel deployment or DNS change was performed.

## Verified locally

- [x] Production build and TypeScript check passed (`npm run build`).
- [x] ESLint passed (`npm run lint`).
- [x] All 58 Chrome/WebKit browser checks and 24 newsletter regression tests passed on 2026-10-26. Automated axe scans reported no violations in tested states; actual-device and screen-reader checks remain below.
- [x] `git diff --check` passed.
- [x] Built application started successfully with `next start` on temporary port 3107; stopped after testing.
- [x] Home, Archive, Posters, and favicon returned HTTP 200.
- [x] An unknown route returned HTTP 404.
- [x] All 12 poster PDFs and 12 JPEG previews exist and returned HTTP 200.
- [x] Referenced images in app/data.ts, app/layout.tsx, and app/globals.css exist.
- [x] Newsletter API rejected missing fields and invalid email addresses with HTTP 400.
- [x] Honeypot submissions returned without forwarding to Google; GET requests returned HTTP 405.
- [x] .env.local is excluded by Git; .env.example and package-lock.json are tracked.
- [x] Accounts and discussions remain outside main. No application page on main currently imports the Supabase helpers.

## Before public launch: code and newsletter

- [x] Updated Next.js and eslint-config-next to 16.4.3, sharp to 0.35.5, source-map-js to 1.2.2, and the additionally flagged dev dependency zod to 4.6.7. Full npm audit reports zero known vulnerabilities; lint, production build, and 24 current regression tests pass.
- [x] Verify the newsletter success message with a real Google submission. The live signup and retry both returned HTTP 201 and visibly showed success. The user confirmed exactly one Sheet row. Desktop/mobile browser tests also passed for mocked success and rate-limit states. The historical false-error cause was not conclusively established; the updated flow is now verified to return success.
- [x] Escape formula-like submitted text before writing to Sheets. Regression tests verify literal cell writes. Confirm with a harmless value such as =1+1 in a separate test Sheet after deployment.
- [x] Add locked, normalized-email deduplication. Retries preserve the existing row without sending notifications. Automated coverage passes, and the user confirmed the live test produced exactly one row after repeated submissions.
- [x] Add persistent Apps Script rate limits: five valid attempts/client/ten minutes and 200 globally/24-hour window. The route forwards an HMAC of Vercel's trusted IP header; raw IPs are not sent to Google. Honeypot, size limits, and same-origin checks remain. These limits protect downstream writes, not all traffic or execution quotas.
- [x] Superseded notification requirement: removed email sending and queue creation. Setup retires old notification triggers, preserves existing rows, and leaves historical extra columns untouched. See docs/NEWSLETTER_FORM.md.
- [x] Fixed the invalid archive-heading margin declaration in app/globals.css.
- [x] Added three Spring 2021 events and three Summer 2021 sessions from the original program pages, including panel papers and roundtable participants. See docs/ARCHIVE_CONTENT.md for source and time-zone notes.
- [ ] Review current-season content and registration behavior for completed events. As of this review, the September 15 and October 13 talks have passed, but still show Register.
- [ ] Verify the four Zoom registration destinations and the contact address, and obtain final content/design approval.

## Google setup and ownership

- [x] User reports replacing Apps Script, running setup, and deploying a New version. The endpoint returned the new structured validation response and successful live signup/retry responses.
- [x] User reports deploying the Sheet-only revision; a subsequent live retry returned HTTP 201 and the expected success message.
- [ ] Confirm setupNewsletterForm was run and the obsolete notification trigger is removed. The new source contains no email sending; any remaining old-handler invocation is a no-op. Recheck the Sheet has only one test row and remove the agreed test entry when finished.
- [ ] Confirm production uses the intended Google Sheet and Google account; keep test data separate from the actual mailing list.
- [ ] Verify obsolete notification triggers are removed. No notification recipient or tester email is required for the Sheet-only flow.
- [ ] Ensure the handover owner has appropriate access to the Sheet and script, and document which account deployed the script and authorizes Sheet access.
- [ ] Add a brief privacy notice explaining the submitted data, purpose, and contact for removal; establish an unsubscribe/removal process in the mailing workflow.
- [ ] Confirm the Sheet is private and shared only with the people managing the mailing list.

## Create and verify the Vercel deployment

- [ ] Confirm the release commit is pushed to origin/main before importing it into Vercel. The release includes newsletter code, poster assets, archive additions, browser tests, and handover docs; .env.local must remain excluded. Verify with `git status -sb` and `git rev-parse HEAD origin/main`.
- [ ] Decide who owns the Vercel project, GitHub repository, and domain for handover; verify the chosen plan supports that ownership and intended use. Do not assume a university site automatically qualifies as a personal Hobby project.
- [ ] Import the GitHub repository into Vercel with main as the production branch. Set Root Directory to the repository folder containing this package.json, not the absolute Mac path.
- [ ] Use the Next.js framework preset, npm ci for installation, npm run build, and the default Next.js output settings. Select a supported Node major compatible with package.json (Node 22.x matches its declared minimum).
- [ ] Add GOOGLE_APPS_SCRIPT_URL and NEWSLETTER_FORM_SECRET as server-only environment variables. The URL must end in /exec. Keep the secret out of NEXT_PUBLIC_ variables.
- [ ] Configure a separate test Sheet/script for Preview deployments if previews will accept signups. Do not indiscriminately point every preview at the production mailing list.
- [ ] Supabase variables are optional for the current main release because its pages do not use the clients. Keep accounts/discussions on their feature branch; database/auth activation is a separate launch.
- [ ] Deploy to a Vercel URL first and check build/function logs. Verify all routes, downloads, and image optimization there.
- [ ] Submit one intentional test signup on Vercel: exactly one Sheet row and a visible website success message, with no notification email. Test a retry to confirm duplicate handling.
- [ ] Test an unavailable backend in a test environment, confirming truthful feedback and that a retry cannot duplicate an entry.

## Browser and accessibility checks

Repeatable test instructions and limitations are in docs/ACCESSIBILITY.md.

- [x] Automated responsive checks in Chrome and WebKit at six widths from 320px to 1440px, including time ranges, archive headings, long titles, and contact layout.
- [x] Keyboard navigation, visible focus, skip links, poster anchors/downloads, and mocked newsletter success/error live-region assertions.
- [x] Automated axe checks at phone and desktop sizes and layout checks at 200% root text size. Darkened the shared image overlay to improve text contrast without section boundaries.
- [x] Reduced-motion support for parallax and smooth scrolling, including live preference changes.
- [ ] Listen to form announcements and verify reading order using VoiceOver or NVDA; automated checks do not replace a screen reader.
- [ ] Check real iPhone/Safari and Android devices, browser zoom, landscape mode, PDF viewing/downloads, and background scrolling.

## Domain cutover and search

- [ ] Add space-talks.com and www.space-talks.com to Vercel; choose one canonical host and redirect the other.
- [ ] Confirm registrar/DNS access. Record existing DNS settings, use the exact records Vercel supplies, and preserve email-related MX/TXT records. A registrar transfer is not required just to change website hosting.
- [ ] Inventory the old site's URLs and add permanent redirects for changed paths, especially archive pages and bookmarked resources. Keep the existing site available until the replacement is verified.
- [ ] Add canonical URLs, sitemap.xml, robots.txt, and social-sharing metadata/image. Basic page titles, descriptions, and a favicon already exist.
- [ ] After DNS changes, verify HTTPS, both hostnames, redirects, all three pages, poster downloads, and the newsletter from the custom domain.
- [ ] Keep a tested rollback path: previous DNS values and a known-good deployment. Document who can perform a rollback.

## Handover and optional polish

- [x] Updated docs/POSTERS.md to explain the posterEntry helper and missing-poster objects.
- [x] Clarified docs/BACKEND_SETUP.md: the released newsletter uses Google Sheets; Supabase accounts/discussions are separate feature work.
- [ ] Document how to add a season/talk/poster, deploy updates, inspect failures, change the Sheet configuration, and remove a subscriber.
- [ ] Agree who checks Vercel errors and Google Apps Script executions, including signup failures or Apps Script quota exhaustion.
- [ ] Consider smaller download PDFs and an optimized background image. The public assets total about 54.8 MiB; two PDFs exceed 10 MB and the background is about 1.9 MB. Poster previews already avoid loading full PDFs inline.
- [ ] Optional after launch: uptime monitoring, analytics, and running the existing regression tests in CI. These do not need to delay an informational-site preview.

## Reference points

- [Vercel Hobby plan](https://vercel.com/docs/plans/hobby)
- [Vercel terms](https://vercel.com/legal/terms)
- [Vercel custom-domain setup](https://vercel.com/docs/domains/set-up-custom-domain)
- [Google Sheets appendRow behavior](https://developers.google.com/apps-script/reference/spreadsheet/sheet#appendRow(Object))
