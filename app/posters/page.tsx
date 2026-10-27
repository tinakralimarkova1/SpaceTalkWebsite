import Image from "next/image";

import styles from "./posters.module.css";

export const metadata = {
  title: "Posters | NYU Space Talks",
  description: "Past-season posters from NYU Space Talks.",
};

type Poster = {
  alt: string;
  pdf: string;
  preview: string;
};

type Season = {
  id: string;
  label: string;
  semester: "Fall" | "Spring";
  poster?: Poster;
};

type PosterYear = {
  seasons: Season[];
  year: string;
};

function posterEntry(id: string, label: string): Season {
  const semester = id.startsWith("fall-") ? "Fall" : "Spring";

  return {
    id,
    label,
    semester,
    poster: {
      alt: "NYU Space Talks " + label + " season poster",
      pdf: "/posters/space-talks-" + id + ".pdf",
      preview: "/posters/space-talks-" + id + ".jpg",
    },
  };
}

const posterYears: PosterYear[] = [
  {
    year: "2026",
    seasons: [
      posterEntry("fall-2026", "Fall 2026"),
      posterEntry("spring-2026", "Spring 2026"),
    ],
  },
  {
    year: "2025",
    seasons: [
      posterEntry("fall-2025", "Fall 2025"),
      posterEntry("spring-2025", "Spring 2025"),
    ],
  },
  {
    year: "2024",
    seasons: [
      posterEntry("fall-2024", "Fall 2024"),
      posterEntry("spring-2024", "Spring 2024"),
    ],
  },
  {
    year: "2023",
    seasons: [
      posterEntry("fall-2023", "Fall 2023"),
      posterEntry("spring-2023", "Spring 2023"),
    ],
  },
  {
    year: "2022",
    seasons: [
      posterEntry("fall-2022", "Fall 2022"),
      posterEntry("spring-2022", "Spring 2022"),
    ],
  },
  {
    year: "2021",
    seasons: [
      posterEntry("fall-2021", "Fall 2021"),
      posterEntry("spring-2021", "Spring 2021"),
    ],
  },
];

function PosterEntry({ season }: { season: Season }) {
  return (
    <article className={styles.posterCard} id={season.id}>
      <header className={styles.posterHeading}>
        <h3>{season.semester}</h3>
      </header>

      {season.poster ? (
        <>
          <a
            className={styles.posterPreview}
            href={season.poster.pdf}
            target="_blank"
            rel="noreferrer"
            aria-label={`Open the ${season.label} poster PDF`}
          >
            <Image
              src={season.poster.preview}
              alt={season.poster.alt}
              width={792}
              height={1224}
              sizes="(max-width: 820px) 92vw, 43vw"
            />
          </a>
          <div className={styles.posterActions}>
            <a
              className="button secondary"
              aria-label={`View ${season.label} poster PDF`}
              href={season.poster.pdf}
              target="_blank"
              rel="noreferrer"
            >
              View PDF
            </a>
            <a className="button primary" href={season.poster.pdf} download aria-label={`Download ${season.label} poster PDF`}>
              Download
            </a>
          </div>
        </>
      ) : (
        <div className={styles.posterPlaceholder}>
          <span>{season.label}</span>
          <strong>Poster coming soon</strong>
        </div>
      )}
    </article>
  );
}

export default function PostersPage() {
  return (
    <main id="main-content" tabIndex={-1}>
      <section className="subpage-hero">
        <p className="eyebrow">Season Archive</p>
        <h1>Posters</h1>
      </section>

      <nav className={styles.seasonNav} aria-label="Poster years">
        {posterYears.map((posterYear) => (
          <a href={"#year-" + posterYear.year} key={posterYear.year}>
            {posterYear.year}
          </a>
        ))}
      </nav>

      <section className={styles.posterArchive}>
        {posterYears.map((posterYear) => (
          <section
            className={styles.yearSection}
            id={"year-" + posterYear.year}
            key={posterYear.year}
          >
            <h2>{posterYear.year}</h2>
            <div className={styles.semesterGrid}>
              {posterYear.seasons.map((season) => (
                <PosterEntry key={season.id} season={season} />
              ))}
            </div>
          </section>
        ))}
      </section>
    </main>
  );
}
