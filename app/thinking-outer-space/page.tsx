import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createPageMetadata } from "../site-metadata";

import styles from "./thinking-outer-space.module.css";

export const metadata = createPageMetadata({
  title: "Thinking Outer Space",
  description:
    "Thinking Outer Space: Philosophy, Astroculture and the Histories of Planetarity, held at NYU Berlin, 19–21 July 2023.",
  path: "/thinking-outer-space",
});

const contentDirectory = join(process.cwd(), "content", "thinking-outer-space");

function readBlocks(filename: string) {
  const source = readFileSync(join(contentDirectory, filename), "utf8")
    .replaceAll("\u00a0", " ")
    .replaceAll("\u200b", "");
  const contentStart = source.indexOf("/");

  return source
    .slice(contentStart)
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);
}

type BiographyGroup = {
  entries: { biography: string; name: string }[];
  title: string;
};

function parseBiographyGroups(blocks: string[]): BiographyGroup[] {
  const groups: BiographyGroup[] = [];
  let currentGroup: BiographyGroup | undefined;

  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index];
    if (block.startsWith("/")) {
      currentGroup = { title: block.replace(/^\/\s*/, ""), entries: [] };
      groups.push(currentGroup);
      continue;
    }

    const biography = blocks[index + 1];
    if (currentGroup && biography) {
      currentGroup.entries.push({ name: block, biography });
      index += 1;
    }
  }

  return groups;
}

function parseAbstracts(blocks: string[]) {
  const entries: { abstract: string; name: string; title: string }[] = [];

  for (let index = 1; index < blocks.length; index += 3) {
    if (blocks[index] && blocks[index + 1] && blocks[index + 2]) {
      entries.push({
        name: blocks[index],
        title: blocks[index + 1],
        abstract: blocks[index + 2],
      });
    }
  }

  return entries;
}

function parseProgram(blocks: string[]) {
  const lines = blocks.flatMap((block) => block.split("\n").map((line) => line.trim())).filter(Boolean);
  const days: { date: string; items: string[] }[] = [];

  for (const line of lines) {
    if (line.startsWith("/")) continue;
    if (/^(Wednesday|Thursday|Friday),/.test(line)) {
      days.push({ date: line, items: [] });
    } else if (days.length) {
      days.at(-1)?.items.push(line);
    }
  }

  return days;
}

const synopsisBlocks = readBlocks("synopsis.txt");
const synopsisHeading = synopsisBlocks[0].split("\n");
const synopsisParagraphs = synopsisBlocks.slice(1);
const programDays = parseProgram(readBlocks("program.txt"));
const biographyGroups = parseBiographyGroups(readBlocks("participants.txt"));
const abstracts = parseAbstracts(readBlocks("abstracts.txt"));

const mediaLinks = new Map([
  ["Frankfurter Allgemeine Sonntagszeitung", "https://www.faz.net/aktuell/wissen/geist-soziales/wie-unser-blick-auf-die-erde-sich-veraendert-hat-19033729.html"],
  ["Der Tagesspiegel", "https://www.tagesspiegel.de/wissen/als-die-zukunft-noch-in-den-sternen-lag-die-geschichte-der-raumfahrt-10163992.html"],
  ["NASA History News & Notes", "https://www.space-talks.com/_files/ugd/28028e_8bb131a55dba4245aebf3775835228f7.pdf"],
  ["H-Soz-Kult", "https://www.space-talks.com/_files/ugd/28028e_6b649f6a6b384df3b762ba2279825d5f.pdf"],
  ["Radio Eins", "https://www.radioeins.de/programm/sendungen/die_profis/archivierte_sendungen/beitraege/der-weltraum-und-wir-.html"],
]);

function parseMedia(blocks: string[]) {
  const groups: { items: { href?: string; text: string }[]; title: string }[] = [];
  let currentGroup: (typeof groups)[number] | undefined;

  const lines = blocks.flatMap((block) => block.split("\n").map((line) => line.trim())).filter(Boolean);
  for (const line of lines) {
    if (line.startsWith("/")) continue;
    if (["Newspapers", "Conference Reports", "Radio"].includes(line)) {
      currentGroup = { title: line, items: [] };
      groups.push(currentGroup);
      continue;
    }
    if (!currentGroup) continue;

    const linkLabel = [...mediaLinks.keys()].find((label) => line.includes(label));
    currentGroup.items.push({ text: line, href: linkLabel ? mediaLinks.get(linkLabel) : undefined });
  }

  return groups;
}

const mediaGroups = parseMedia(readBlocks("media.txt"));
const sectionLinks = ["Synopsis", "Program", "Participants", "Abstracts", "Media", "PDFs"];
const breaks = new Set(["Coffee", "Lunch", "Conference buffet", "Beer garden", "Farewell drinks", "N.N."]);

export default function ThinkingOuterSpacePage() {
  return (
    <main className={styles.page} id="main-content" tabIndex={-1}>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <p className={styles.kicker}>Philosophy, Astroculture and the Histories of Planetarity</p>
          <h1>Thinking Outer Space</h1>
          <div className={styles.eventDetails}>
            <p>NYU Berlin</p>
            <p>19–21 July 2023</p>
          </div>
          <p className={styles.partners}>Arts &amp; Science · CEMS · GRI · Remarque · Shanghai</p>
        </div>
      </section>

      <nav className={styles.sectionNavigation} aria-label="Thinking Outer Space sections">
        <div className={styles.sectionNavigationInner}>
          {sectionLinks.map((section) => (
            <a href={`#${section.toLowerCase()}`} key={section}>{section}</a>
          ))}
        </div>
      </nav>

      <section className={styles.contentSection} id="synopsis">
        <div className={styles.inner}>
          <p className={styles.sectionLabel}>/ Synopsis</p>
          <h2>{synopsisHeading[1]}</h2>
          <p className={styles.subtitle}>{synopsisHeading[2]}</p>
          <div className={styles.prose}>
            {synopsisParagraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </div>
        </div>
      </section>

      <section className={styles.contentSection} id="program">
        <div className={styles.inner}>
          <p className={styles.sectionLabel}>/ Program</p>
          <h2>Three days at NYU Berlin</h2>
          <div className={styles.program}>
            {programDays.map((day) => (
              <section className={styles.programDay} key={day.date}>
                <h3>{day.date}</h3>
                <div className={styles.programItems}>
                  {day.items.map((item, index) => {
                    if (/^\d{1,2}:\d{2}–\d{1,2}:\d{2}$/.test(item)) {
                      return <p className={styles.programTime} key={`${item}-${index}`}>{item}</p>;
                    }
                    if (/^(Panel|Welcome and Introduction|Concluding Discussion)/.test(item)) {
                      return <h4 key={`${item}-${index}`}>{item}</h4>;
                    }
                    if (item.startsWith("Chair:")) {
                      return <p className={styles.chair} key={`${item}-${index}`}>{item}</p>;
                    }
                    if (breaks.has(item)) {
                      return <p className={styles.programBreak} key={`${item}-${index}`}>{item}</p>;
                    }
                    return <p className={styles.presentation} key={`${item}-${index}`}>{item}</p>;
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.contentSection} id="participants">
        <div className={styles.inner}>
          <p className={styles.sectionLabel}>/ Participants</p>
          <h2>Convenors and participants</h2>
          {biographyGroups.map((group) => (
            <section className={styles.entryGroup} key={group.title}>
              <h3>{group.title}</h3>
              <div className={styles.entryList}>
                {group.entries.map((entry) => (
                  <details className={styles.entry} key={entry.name}>
                    <summary><span>{entry.name}</span></summary>
                    <p>{entry.biography}</p>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>

      <section className={styles.contentSection} id="abstracts">
        <div className={styles.inner}>
          <p className={styles.sectionLabel}>/ Abstracts</p>
          <h2>Conference papers</h2>
          <div className={styles.entryList}>
            {abstracts.map((entry) => (
              <details className={styles.entry} key={entry.title}>
                <summary>
                  <span className={styles.abstractTitle}>{entry.title}</span>
                  <span className={styles.abstractAuthor}>{entry.name}</span>
                </summary>
                <p>{entry.abstract}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.contentSection} id="media">
        <div className={styles.inner}>
          <p className={styles.sectionLabel}>/ Media</p>
          <h2>Coverage and reports</h2>
          <div className={styles.mediaGrid}>
            {mediaGroups.map((group) => (
              <section key={group.title}>
                <h3>{group.title}</h3>
                <ul>
                  {group.items.map((item) => (
                    <li key={item.text}>
                      {item.href ? <a href={item.href} rel="noreferrer" target="_blank">{item.text}</a> : item.text}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>
      </section>

      <section className={`${styles.contentSection} ${styles.downloadSection}`} id="pdfs">
        <div className={styles.inner}>
          <p className={styles.sectionLabel}>/ PDFs</p>
          <h2>Conference documents</h2>
          <div className={styles.downloads}>
            <a href="/thinking-outer-space/program.pdf" download>Download program</a>
            <a href="/thinking-outer-space/poster.pdf" download>Download poster</a>
          </div>
        </div>
      </section>
    </main>
  );
}
