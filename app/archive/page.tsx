import Image from "next/image";

import { archiveSeasons } from "../data";
import { YearNavigation } from "../components/YearNavigation";
import { createPageMetadata } from "../site-metadata";
import archiveAbstracts from "../../content/archive-abstracts.json";
import archiveImages from "../../content/archive-images.json";
import { ArchiveTalkDisclosure } from "./ArchiveTalkDisclosure";

export const metadata = createPageMetadata({
  title: "Archive",
  description: "Explore past seasons and talks from the NYU Space Talks archive.",
  path: "/archive",
});

const seasonNumberBySlug: Record<string, string> = {
  "spring-2021": "Season I",
  "fall-2021": "Season II",
  "spring-2022": "Season III",
  "fall-2022": "Season IV",
  "spring-2023": "Season V",
  "fall-2023": "Season VI",
  "spring-2024": "Season VII",
  "fall-2024": "Season VIII",
  "spring-2025": "Season IX",
  "fall-2025": "Season X",
  "spring-2026": "Season XI",
};

const firstTalkNumberBySeason: Record<string, number> = {
  "spring-2021": 2,
  "fall-2021": 5,
  "spring-2022": 9,
  "fall-2022": 13,
  "spring-2023": 16,
  "fall-2023": 20,
  "spring-2024": 24,
  "fall-2024": 28,
  "spring-2025": 32,
  "fall-2025": 36,
  "spring-2026": 40,
};

const abstractsBySeason = archiveAbstracts as unknown as Record<string, Record<string, string>>;
const imagesBySeason = archiveImages as unknown as Record<
  string,
  Record<string, { alt: string; path: string; source: string }>
>;

export default function ArchivePage() {
  const firstSeasonByYear = new Map<string, string>();
  for (const season of archiveSeasons) {
    const year = season.slug.split("-")[1];
    if (!firstSeasonByYear.has(year)) firstSeasonByYear.set(year, season.slug);
  }
  const years = [...firstSeasonByYear].map(([year, slug]) => ({ year, href: `#${slug}` }));

  return (
    <main id="main-content" tabIndex={-1}>
      <section className="subpage-hero">
        <p className="eyebrow">NYU Space Talks</p>
        <h1>Archive</h1>
      </section>

      <YearNavigation label="Archive years" years={years} />

      <section className="section archive-index">
        {archiveSeasons.map((season) => (
          <article className="archive-season" id={season.slug} key={season.slug}>
            <div className="archive-season-heading">
              <h2>{season.season}</h2>
              {seasonNumberBySlug[season.slug] ? (
                <p className="archive-season-number">
                  {seasonNumberBySlug[season.slug]}
                </p>
              ) : null}
            </div>

            {season.talks.length > 0 ? (
              <div className="archive-talk-list">
                {season.talks.map((talk, talkIndex) => {
                  const abstract = abstractsBySeason[season.slug]?.[talk.title];
                  const sourceImage = imagesBySeason[season.slug]?.[talk.title];
                  const firstTalkNumber = firstTalkNumberBySeason[season.slug];
                  const talkNumber = firstTalkNumber ? firstTalkNumber + talkIndex : null;

                  return (
                    <ArchiveTalkDisclosure
                      key={talk.title}
                      summary={(
                        <>
                        <span className="talk-date">
                          <span>{talk.date}</span>
                        </span>
                        <span className="archive-talk-heading">
                          <span className="archive-talk-title">
                            {talkNumber ? `${talkNumber}. ` : ""}{talk.title}
                          </span>
                        </span>
                        </>
                      )}
                    >
                      <div className={`archive-talk-details ${sourceImage ? "archive-talk-details-with-image" : ""}`}>
                        {sourceImage ? (
                          <figure className="archive-talk-image archive-talk-image-source">
                            <Image
                              alt={sourceImage.alt}
                              height={900}
                              sizes="(max-width: 820px) calc(100vw - 84px), 30vw"
                              src={sourceImage.path}
                              width={1200}
                            />
                          </figure>
                        ) : null}
                        <div className="archive-talk-copy">
                          {talk.context ? <p>{talk.context}</p> : null}
                          {talk.speakers ? (
                            <p className="speaker archive-speaker-pairs" aria-label="Speakers">
                              {talk.speakers.map((speaker, index) => (
                                <span className="archive-speaker-pair" key={speaker.name}>
                                  {index > 0 ? ", " : ""}
                                  {speaker.name}
                                  {speaker.affiliation ? ` (${speaker.affiliation})` : ""}
                                </span>
                              ))}
                            </p>
                          ) : null}
                          {talk.speaker ? (
                            <p className="speaker">
                              {talk.speaker}{talk.affiliation ? <span> ({talk.affiliation})</span> : null}
                            </p>
                          ) : null}
                          {talk.comment ? (
                            <p className="comment">{talk.comment}</p>
                          ) : null}
                          {talk.chair ? <p>Chair: {talk.chair}</p> : null}
                          {abstract ? (
                            <div className="archive-talk-abstract">
                              <h3>Abstract</h3>
                              {abstract.split("\n\n").map((paragraph) => (
                                <p key={paragraph}>{paragraph}</p>
                              ))}
                            </div>
                          ) : null}
                          {talk.presentations ? (
                            <ul className="archive-presentations">
                              {talk.presentations.map((presentation) => (
                                <li key={presentation.title}>
                                  <h4>{presentation.title}</h4>
                                  <p className="speaker">
                                    {presentation.name}{presentation.affiliation ? <span> ({presentation.affiliation})</span> : null}
                                  </p>
                                </li>
                              ))}
                            </ul>
                          ) : null}
                          {talk.participants ? (
                            <ul className="archive-participants" aria-label="Participants">
                              {talk.participants.map((participant) => (
                                <li key={participant.name}>
                                  <strong>{participant.name}</strong>{participant.affiliation ? ` (${participant.affiliation})` : ""}
                                </li>
                              ))}
                            </ul>
                          ) : null}
                          {talk.discussant ? <p>Discussant: {talk.discussant}</p> : null}
                        </div>
                      </div>
                    </ArchiveTalkDisclosure>
                  );
                })}
              </div>
            ) : (
              <p className="archive-empty">{season.season}</p>
            )}
          </article>
        ))}
      </section>
    </main>
  );
}
