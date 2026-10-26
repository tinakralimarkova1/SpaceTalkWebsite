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

- [Vercel deployment checklist](docs/DEPLOYMENT_CHECKLIST.md)
- [Backend and Supabase setup](docs/BACKEND_SETUP.md)
- [Newsletter form and Google Sheets setup](docs/NEWSLETTER_FORM.md)
- [Poster archive](docs/POSTERS.md)
- [Accessibility checks](docs/ACCESSIBILITY.md)
- [Archive content and sources](docs/ARCHIVE_CONTENT.md)
