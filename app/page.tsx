import Image from "next/image";
import FoldText from "@/components/FoldText";
import { NewsletterForm } from "./components/NewsletterForm";
import { talks } from "./data";
import { createPageMetadata, SITE_DESCRIPTION, SITE_NAME } from "./site-metadata";

export const metadata = createPageMetadata({
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
  path: "/",
  absoluteTitle: true,
});

export default function Home() {
  return (
    <main className="home-page" id="main-content" tabIndex={-1}>
      <section id="about" className="hero">
        <div className="hero-copy">
          <p className="eyebrow hero-eyebrow">History, Politics, Astroculture</p>
          <h1>
            <FoldText
              text="NYU Space Talks"
              foldStyle="paper"
              splitBy="char"
              hinge="top"
              trigger="scroll"
              foldAngle={92}
              duration={0.65}
              stagger={0.045}
              staggerFrom="start"
              ease="power3.out"
              loopDelay={1.4}
              hoverRefold={true}
              refoldRadius={140}
              refoldAngle={45}
              perspective={700}
              creaseShading={0.55}
              fontSize="clamp(2.5rem, 27cqi, 8.8rem)"
              fontWeight={400}
              className="hero-title-fold"
            />
          </h1>
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
                <h3>{talk.number}. {talk.title}</h3>
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
