# Handoff Notes

## What This Website Is

NYU Space Talks is a public lecture-series website. The current production site
is built in Wix at https://www.space-talks.com/. This repository is the custom
replacement.

## Main Files

- `app/page.tsx`: Edit page content, talks, archive list, and visible links.
- `app/globals.css`: Edit styling, layout, spacing, colors, and responsive
  behavior.
- `app/layout.tsx`: Edit metadata such as browser title and description.
- `public/`: Add final image files, favicons, Open Graph images, and downloads.
- `docs/migration-log.md`: Record changes as the migration continues.

## Current Known Placeholders

- RSVP links point to the Wix homepage until direct links are collected.
- Archive links point to the Wix homepage until archive pages or redirects are
  created.
- The mailing-list form is visual only and does not submit.
- Event imagery is represented by the page design, not final exported Wix
  images.

## Recommended Next Steps

1. Decide whether the final site should remain one page or use routes such as
   `/archive`, `/posters`, and `/fall-2026`.
2. Export Wix images and posters into `public/`.
3. Replace placeholder links with final URLs.
4. Connect the mailing-list form to the chosen service.
5. Deploy to Vercel preview.
6. Review with stakeholders.
7. Point the custom domain.

## Documentation Habit

For each meaningful change, add a dated bullet to `docs/migration-log.md` with:

- What changed.
- Why it changed.
- Any follow-up needed.
