# Archive content

The archive program metadata is maintained in `app/data.ts` and rendered by `app/archive/page.tsx`. Add events to the appropriate season's `talks` array, keeping seasons newest first. Regular talks use title, speaker, affiliation, date, time, and optional location/comment. Panels and roundtables can additionally use context, chair, presentations, participants, and discussant.

Full talk abstracts copied from the original website are stored separately in `content/archive-abstracts.json`, keyed by season slug and exact talk title. The JSON includes its source URLs and retrieval date. Run `node --experimental-strip-types scripts/import-archive-abstracts.mjs` to refresh the file from the public season pages, then review the resulting diff before committing it. If a talk title changes in `app/data.ts`, update the corresponding JSON key or rerun the importer so the abstract continues to match.

Original talk images are stored under `public/archive-images/`; their talk-title mapping, source URLs, and retrieval date are recorded in `content/archive-images.json`. Run `node --experimental-strip-types scripts/import-archive-images.mjs` to refresh them. The importer only associates an image when it appears between a matched talk title and the next talk title on the original page, resizes it to a maximum of 1200×900, and converts it to WebP. Owner-supplied images that are absent from the original page are preserved through `content/archive-image-overrides.json`. As of 2026-11-02, 21 archived talks have source images. Talks without a source image use the text-only archive layout and do not display a fallback image.

The year navigation is generated from season slugs (`semester-YYYY`), linking to the first season listed for each year. Keep seasons newest first so those links target the newest archived semester. Archive and Posters share `app/components/YearNavigation.tsx` and its CSS module for consistent responsive styling.

## 2021 sources

Read from the original program website on 2026-10-26:

- [Spring 2021](https://www.space-talks.com/spring-2021): three events, including the Militant Astroculture roundtable and its participants.
- [Summer 2021](https://www.space-talks.com/summer-2021): three sessions, including five individual papers in the Planetary Poetics and Politics panel, a four-person roundtable, and a six-person workshop discussion. Conference/workshop context, chairs, and discussant are retained.

The original Summer 2021 page contains session programs and participant lists rather than abstracts, so those three dropdowns intentionally have no Abstract heading. The other archived seasons contain 42 imported abstracts in total. Years omitted from individual source dates were supplied from the season context. Time-zone labels are preserved as printed: Spring uses EST and the June 28 workshop uses CET, even though modern daylight-saving conversions may differ. Do not silently convert historical labels without confirmation from the program owner.

Summer 2021 is not assigned a numbered season because no season number is provided by the source. No location was invented for sessions without an explicit location. Spring 2021 remains Season I.

Historical talk numbers are rendered from `firstTalkNumberBySeason` in `app/archive/page.tsx`. Summer 2021 sessions are intentionally excluded from the sequence. The existing public archive begins with talk 2 in Spring 2021; talk 1 is not represented in the available archive content. Current-season numbers are stored directly with each talk in `app/data.ts` so newly announced talks do not renumber historical entries.

After edits, run the build and browser tests described in `docs/ACCESSIBILITY.md`. The browser suite verifies the 2021 event and participant counts, the 42 abstract records, 21 sourced images, the absence of fallback marks, keyboard expansion, and responsive layouts.
