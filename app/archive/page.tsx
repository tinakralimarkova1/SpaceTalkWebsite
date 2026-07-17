import Link from "next/link";
import { SiteHeader } from "../components/SiteHeader";
import { archiveSeasons } from "../data";

export const metadata = {
  title: "Archive | NYU Space Talks",
  description: "Past NYU Space Talks seasons and posters.",
};

export default function ArchivePage() {
  return (
    <main>
      <SiteHeader />
      <section className="subpage-hero">
        <p className="eyebrow">Archive</p>
        <h1>Past Seasons</h1>
        <p>
          Browse previous NYU Space Talks seasons in one place. This page will
          keep growing as more Wix archive material, posters, images, and links
          are migrated.
        </p>
      </section>

      <section className="section archive-index">
        {archiveSeasons.map((season) => (
          <article className="archive-season" id={season.slug} key={season.slug}>
            <div className="archive-season-heading">
              <p className="section-label">Archive</p>
              <h2>{season.season}</h2>
              <Link className="text-link" href={season.sourceUrl} target="_blank">
                Original Wix page
              </Link>
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
                      <p>{talk.summary}</p>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="archive-empty">
                This season is listed in the Wix archive, but its talk details
                still need to be migrated.
              </p>
            )}
          </article>
        ))}
      </section>
    </main>
  );
}
