import { createPageMetadata } from "../site-metadata";

export const metadata = createPageMetadata({
  title: "About",
  description: "Learn about the NYU Space Talks academic lecture series and its international community.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <main id="main-content" tabIndex={-1}>
      <section className="subpage-hero">
        <p className="eyebrow">NYU Space Talks</p>
        <h1>About</h1>
      </section>

      <section className="about-content" aria-label="About NYU Space Talks">
        <p>
          Inaugurated in spring 2021, NYU Space Talks: History, Politics, Astroculture is an academic
          lecture series convened by Alexander C.T. Geppert at NYU&apos;s{" "}
          <a href="https://cems.as.nyu.edu/page/home">Center for European and Mediterranean Studies</a>
          {" "}and <a href="https://shanghai.nyu.edu/">NYU Shanghai</a>, in collaboration with the{" "}
          <a href="https://as.nyu.edu/departments/history.html">Department of History</a> in New York
          City.
        </p>

        <p>
          Meeting once a month during term time, the series brings together emerging and established
          scholars to present and discuss the latest research on the history and politics of outer
          space, extraterrestrial life, planetary history and astroculture, both in Europe and around
          the globe. Held virtually in a seminar-like setting, NYU Space Talks combines scholarly
          exchange with open discussion. With over 1,300 subscribers from more than 50 countries and
          typically 70–90 participants per session, the series has developed into an ever-growing
          international academic community – something akin to a permanent conference.
        </p>

        <p>
          All NYU Space Talks are held live on Zoom. Everyone is welcome, but advance registration is
          required. Recordings are not made available.
        </p>
      </section>
    </main>
  );
}
