# Archive content

The archive is maintained in `app/data.ts` and rendered by `app/archive/page.tsx`. Add events to the appropriate season's `talks` array, keeping seasons newest first. Regular talks use title, speaker, affiliation, date, time, and optional location/comment. Panels and roundtables can additionally use context, chair, presentations, participants, and discussant.

The year navigation is generated from season slugs (`semester-YYYY`), linking to the first season listed for each year. Keep seasons newest first so those links target the newest archived semester. Archive and Posters share `app/components/YearNavigation.tsx` and its CSS module for consistent responsive styling.

## 2021 sources

Read from the original program website on 2026-10-26:

- [Spring 2021](https://www.space-talks.com/spring-2021): three events, including the Militant Astroculture roundtable and its participants.
- [Summer 2021](https://www.space-talks.com/summer-2021): three sessions, including five individual papers in the Planetary Poetics and Politics panel, a four-person roundtable, and a six-person workshop discussion. Conference/workshop context, chairs, and discussant are retained.

As elsewhere in the archive, entries contain program metadata rather than full abstracts. Years omitted from individual source dates were supplied from the season context. Time-zone labels are preserved as printed: Spring uses EST and the June 28 workshop uses CET, even though modern daylight-saving conversions may differ. Do not silently convert historical labels without confirmation from the program owner.

Summer 2021 is not assigned a numbered season because no season number is provided by the source. No location was invented for sessions without an explicit location. Spring 2021 remains Season I.

After edits, run the build and browser tests described in `docs/ACCESSIBILITY.md`. The browser suite verifies the 2021 event and participant counts.
