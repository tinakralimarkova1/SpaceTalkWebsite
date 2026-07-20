import { SiteHeader } from "../components/SiteHeader";
import { archiveSeasons } from "../data";

export const metadata = {
  title: "Archive | NYU Space Talks",
  description: "NYU Space Talks archive.",
};

export default function ArchivePage() {
  return (
    <main>
      <SiteHeader />
      <section className="subpage-hero">
        <p className="eyebrow">Archive</p>
        <h1>NYU Space Talks</h1>
      </section>

      <section className="section archive-index">
        {archiveSeasons.map((season) => (
          <article className="archive-season" id={season.slug} key={season.slug}>
            <div className="archive-season-heading">
              <p className="section-label">Archive</p>
              <h2>{season.season}</h2>
            </div>

            {season.talks.length > 0 ? (
              <div className="archive-talk-list">
                {season.talks.map((talk) => (
                  <article className="archive-talk" key={talk.title}>
                    <div className="talk-date">
                      <span>{talk.date}</span>
                      <strong>{talk.time}</strong>
                      <small>{talk.location}</small>
                    </div>
                    <div>
                      <h3>{talk.title}</h3>
                      <p className="speaker">
                        {talk.speaker} <span>({talk.affiliation})</span>
                      </p>
                      {talk.comment ? (
                        <p className="comment">{talk.comment}</p>
                      ) : null}
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
