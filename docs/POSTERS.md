# Poster archive

The poster archive is available at `/posters`. It lists every Fall and Spring season from Spring 2021 onward, newest first.

## Files

Poster assets are stored in `public/posters` using this naming pattern:

```text
space-talks-fall-2024.pdf
space-talks-fall-2024.jpg
```

Each available season has:

- The original PDF for viewing and downloading.
- A JPEG preview rendered from the PDF's first page.

## Adding a poster

1. Rename the PDF using the established season pattern.
2. Put the PDF in `public/posters`.
3. Render the first page as a portrait JPEG approximately 1200 pixels tall.
4. Put the JPEG in `public/posters` with the same base filename.
5. Open `app/posters/page.tsx`.
6. Find the year in `posterYears`, or add a new year above the older years.
7. Add `posterEntry("fall-2027", "Fall 2027")` (using the actual season). This helper generates the PDF/preview paths and alt text. List Fall before Spring. For a missing poster, use an object with `id`, `label`, and `semester` but no `poster` property.
8. Run `npm run build` and confirm that View PDF and Download both work.

Keep the semester entry in place even when its poster is unavailable. This preserves the complete chronological archive and stable links to each season.
