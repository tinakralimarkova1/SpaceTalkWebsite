# NYU Space Talks

History, Politics, Astroculture

## Technology

- Next.js
- React
- TypeScript
- Supabase
- Vercel

## Local development

1. Install dependencies with `npm install`.
2. Configure `.env.local` using `.env.example`. Follow the newsletter setup guide for the Google Apps Script URL and shared secret. Supabase is not required by the current main-branch pages.
3. Start the website with `npm run dev`.
4. Open http://localhost:3000.

## Checks before release

- `npm test`: isolated newsletter regression tests; no real Sheets writes or emails.
- `npm run lint`: ESLint checks.
- `npm run build`: production build and TypeScript checks.
- `npm audit`: dependency vulnerability check.
- `npm run test:browser`: Chrome/WebKit layout and accessibility tests against a running website. See the accessibility guide for setup.
- Complete the live signup acceptance test in the newsletter guide after changing either the website or the deployed Apps Script.

## Documentation

The shared header uses the supplied NYU Arts & Science logo at `public/nyu-arts-and-science.svg`. Its link to `https://as.nyu.edu` is maintained in `app/components/SiteHeader.tsx`; sizing is in `app/globals.css`.

The browser-tab icon is `public/space-favicon.png`, converted from the supplied `space.png.avif` with transparency preserved. All pages use this icon through the metadata in `app/layout.tsx`.

Typography uses four shared tokens in `app/globals.css`: `--font-xl` (3.5rem / 56px), `--font-lg` (2rem / 32px), `--font-md` (1.25rem / 20px), and `--font-sm` (1rem / 16px). These are the default sizes at a 16px root font; they respect user text resizing. Hero h1 titles are the intentional exception: Home, Archive, and Posters retain their larger container-responsive title sizes. Keep all other text on the shared scale.

- [Vercel deployment checklist](docs/DEPLOYMENT_CHECKLIST.md)
- [Backend and Supabase setup](docs/BACKEND_SETUP.md)
- [Newsletter form and Google Sheets setup](docs/NEWSLETTER_FORM.md)
- [Poster archive](docs/POSTERS.md)
- [Accessibility checks](docs/ACCESSIBILITY.md)
- [Archive content and sources](docs/ARCHIVE_CONTENT.md)
