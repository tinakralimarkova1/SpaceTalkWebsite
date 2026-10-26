import { archiveSeasons } from "../data";

export const metadata = {
  title: "Archive | NYU Space Talks",
  description: "NYU Space Talks archive.",
};

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

export default function ArchivePage() {
  return (
    <main id="main-content" tabIndex={-1}>
      <section className="subpage-hero">
        <h1>NYU Space Talks</h1>
        <p className="eyebrow archive-subtitle">Archive</p>
      </section>

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
                {season.talks.map((talk) => (
                  <article className="archive-talk" key={talk.title}>
                    <div className="talk-date">
                      <span>{talk.date}</span>
                      <strong>{talk.time}</strong>
                      {talk.location ? <small>{talk.location}</small> : null}
                    </div>
                    <div>
                      <h3>{talk.title}</h3>
                      {talk.context ? <p>{talk.context}</p> : null}
                      {talk.speaker ? (
                        <p className="speaker">
                          {talk.speaker}{talk.affiliation ? <span> ({talk.affiliation})</span> : null}
                        </p>
                      ) : null}
                      {talk.comment ? (
                        <p className="comment">{talk.comment}</p>
                      ) : null}
                      {talk.chair ? <p>Chair: {talk.chair}</p> : null}
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
                  </article>
                ))}
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
