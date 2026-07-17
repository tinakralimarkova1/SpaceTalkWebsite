const talks = [
  {
    title:
      "A Mountain in Space: Taixu and the Buddhist Imagination of the Cosmos",
    speaker: "Ben Van Overmeire",
    affiliation: "Duke Kunshan University",
    date: "Tuesday, 15 September 2026",
    time: "10-11:30 EDT",
    summary:
      "Taixu's attempt to reconcile Western astronomy with Buddhist cosmology, and the wider role of Buddhism in the human imagination of outer space.",
  },
  {
    title: "SETI@home 2.0: UFOs, Politics and the Science of Extraterrestrial Intelligence",
    speaker: "Christian Peters",
    affiliation: "Universität Bremen",
    comment: "Comment by Thore Bjørnvig, Copenhagen",
    date: "Tuesday, 13 October 2026",
    time: "10-11:30 EDT",
    summary:
      "A look at SETI, UAP, political attention, and how societies organize knowledge around evidence of other capable minds.",
  },
  {
    title: "The Kuafu Paradox: Why China's Flagship Solar Mission Failed to Launch",
    speaker: "Zhihui Zhang",
    affiliation: "Chinese Academy of Sciences",
    comment: "Comment by Zuoyue Wang, California State Polytechnic University",
    date: "Tuesday, 3 November 2026",
    time: "10-11:30 EST",
    summary:
      "The stalled Kuafu Program as a case study in geopolitical tensions, institutional priorities, and fragile international collaboration.",
  },
  {
    title: "When Is a Planet Just Right? Su-Shu Huang and the Concept of the Habitable Zone",
    speaker: "Michael Robinson",
    affiliation: "University of Hartford",
    date: "Tuesday, 1 December 2026",
    time: "10-11:30 EST",
    summary:
      "The evolution of Huang's habitable zone as an idea, from early SETI discussions to modern exoplanet research.",
  },
];

const archive = [
  "Spring 2026",
  "Fall 2025",
  "Spring 2025",
  "Fall 2024",
  "Spring 2024",
  "Fall 2023",
  "Spring 2023",
  "Fall 2022",
  "Spring 2022",
  "Fall 2021",
  "Summer 2021",
  "Spring 2021",
];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="nyu-link" href="https://as.nyu.edu/" aria-label="NYU Arts and Science">
          NYU
        </a>
        <nav aria-label="Primary navigation">
          <a href="#about">About</a>
          <a href="#schedule">Fall 2026</a>
          <a href="#archive">Archive</a>
          <a href="#contact">Contact</a>
        </nav>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">History, Politics, Astroculture</p>
          <h1>NYU Space Talks</h1>
          <p>
            A public lecture series convening scholars to present new research
            on outer space, extraterrestrial life, and astroculture in Europe
            and around the globe.
          </p>
          <div className="hero-actions">
            <a className="button primary" href="#schedule">
              View Fall 2026
            </a>
            <a className="button secondary" href="#contact">
              Join updates
            </a>
          </div>
        </div>
        <div className="orbital-visual" aria-hidden="true">
          <span className="planet planet-large" />
          <span className="planet planet-small" />
          <span className="orbit orbit-one" />
          <span className="orbit orbit-two" />
          <span className="star star-one" />
          <span className="star star-two" />
          <span className="star star-three" />
        </div>
      </section>

      <section id="about" className="section split">
        <div>
          <p className="section-label">/ About</p>
          <h2>Research conversations held online and open to all.</h2>
        </div>
        <div className="body-copy">
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
                <p>{talk.summary}</p>
                <a className="text-link" href="https://www.space-talks.com/" target="_blank">
                  RSVP details
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="archive" className="section archive-section">
        <div className="section-heading">
          <p className="section-label">/ Archive</p>
          <h2>Past seasons and posters</h2>
        </div>
        <ul className="archive-grid" aria-label="Archive seasons">
          {archive.map((season) => (
            <li key={season}>
              <a href="https://www.space-talks.com/" target="_blank">{season}</a>
            </li>
          ))}
        </ul>
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
          <h3>Mailing list placeholder</h3>
          <p>
            Connect this form to the final mailing-list provider before launch.
          </p>
          <label>
            First name
            <input name="firstName" type="text" />
          </label>
          <label>
            Last name
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
