import Link from "next/link";
import { SiteHeader } from "./components/SiteHeader";
import { archiveSeasons, talks } from "./data";

export default function Home() {
  return (
    <main>
      <SiteHeader />

      <section id="about" className="hero">
        <div className="hero-copy">
          <p className="eyebrow">History, Politics, Astroculture</p>
          <h1>NYU Space Talks</h1>
          <div className="hero-actions">
            <a className="button primary" href="#schedule">
              Fall 2026
            </a>
            <a className="button secondary" href="#contact">
              Sign Up
            </a>
          </div>
        </div>
        <div className="hero-about">
          <p>
            Each semester, established and upcoming scholars present the latest
            research on the history and politics of outer space, extraterrestrial
            life and astroculture, both in Europe and around the globe.
          </p>
          <p>
            Inaugurated in spring 2021, NYU Space Talks is a lecture series
            convened by Alexander C. T. Geppert at NYU&apos;s Center for
            European and Mediterranean Studies and NYU Shanghai with the
            Department of History in New York City.
          </p>
          <p>
            All NYU Space Talks are held on Zoom. Everybody is welcome, but
            advance registration is required.
          </p>
        </div>
      </section>

      <section id="schedule" className="section schedule-section">
        <div className="section-heading">
          <p className="section-label">/ Fall 2026</p>
          <h2>Season XII</h2>
        </div>
        <div className="talk-list">
          {talks.map((talk) => (
            <article className="talk-card" key={talk.title}>
              <div className="talk-date">
                <span>{talk.date}</span>
                <strong>{talk.time}</strong>
              </div>
              <div className="talk-content">
                <h3>{talk.title}</h3>
                <p className="speaker">
                  {talk.speaker} <span>({talk.affiliation})</span>
                </p>
                {talk.comment ? <p className="comment">{talk.comment}</p> : null}
                <a
                  className="text-link"
                  href="https://www.space-talks.com/"
                  rel="noreferrer"
                  target="_blank"
                >
                  RSVP
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section archive-section">
        <div className="section-heading">
          <p className="section-label">/ Archive</p>
          <h2>Archive</h2>
        </div>
        <ul className="archive-grid" aria-label="Archive seasons">
          {archiveSeasons.slice(0, 6).map((season) => (
            <li key={season.slug}>
              <Link href={`/archive#${season.slug}`}>{season.season}</Link>
            </li>
          ))}
        </ul>
        <Link className="button secondary archive-cta" href="/archive">
          Archive
        </Link>
      </section>

      <section id="contact" className="section contact-section">
        <div>
          <p className="section-label">/ Contact</p>
          <h2>Professor Alexander C. T. Geppert</h2>
          <p>New York University</p>
          <p>King Juan Carlos I of Spain Center</p>
          <p>53 Washington Square South, New York, NY 10012, USA</p>
          <a className="text-link" href="mailto:alexander.geppert@nyu.edu">
            alexander.geppert@nyu.edu
          </a>
        </div>
        <form className="signup-form">
          <p>If you want to receive updates about future NYU Space Talks, please join our mailing list.</p>
          <label>
            First Name
            <input name="firstName" type="text" />
          </label>
          <label>
            Last Name
            <input name="lastName" type="text" />
          </label>
          <label>
            Organization
            <input name="organization" type="text" />
          </label>
          <label>
            Email
            <input name="email" type="email" />
          </label>
          <button type="button">Submit</button>
        </form>
      </section>
    </main>
  );
}
