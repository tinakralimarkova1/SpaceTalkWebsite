import Image from "next/image";
import { NewsletterForm } from "./components/NewsletterForm";
import { talks } from "./data";

export default function Home() {
  return (
    <main id="main-content" tabIndex={-1}>
      <section id="about" className="hero">
        <div className="hero-copy">
          <p className="eyebrow hero-eyebrow">History, Politics, Astroculture</p>
          <h1>NYU Space Talks</h1>
          <div className="hero-actions">
            <a className="button primary" href="#schedule">
              Fall 2026
            </a>
            <a className="button secondary" href="#contact">
              Newsletter
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
                <strong className="talk-times">
                  {[talk.time.split("/").slice(0, 2), talk.time.split("/").slice(2)].map(
                    (timeRow) => (
                      <span className="talk-time-row" key={timeRow.join("/")}>
                        {timeRow.map((time) => {
                          const [range, zone] = time.trim().split(/\s+/);
                          return (
                            <span className="talk-time" key={time}>
                              <span className="talk-time-range">{range}</span>{" "}{zone}
                            </span>
                          );
                        })}
                      </span>
                    ),
                  )}
                </strong>
              </div>
              <div className="talk-heading">
                <h3>{talk.title}</h3>
                <p className="speaker">
                  {talk.speaker} <span>({talk.affiliation})</span>
                </p>
                {talk.comment ? <p className="comment">{talk.comment}</p> : null}
              </div>
              <div className="talk-image-frame">
                <Image
                  className="talk-image"
                  src={talk.image}
                  alt={talk.imageAlt}
                  fill
                  sizes="(max-width: 820px) 100vw, 28vw"
                />
              </div>
              <div className="talk-content">
                <p className="talk-description">{talk.description}</p>
                <a
                  className="rsvp-button"
                  href={talk.registrationUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  Register
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="contact" className="section contact-section">
        <div>
          <p className="section-label">/ Contact</p>
          <h2 className="contact-name">Professor Alexander C. T. Geppert</h2>
          <p>New York University</p>
          <p>NYU Shanghai</p>
          <p>53 Washington Square South, New York, NY 10012, USA</p>
          <a className="text-link" href="mailto:alexander.geppert@nyu.edu">
            alexander.geppert@nyu.edu
          </a>
        </div>
        <NewsletterForm />
      </section>
    </main>
  );
}
