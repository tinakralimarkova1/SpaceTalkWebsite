import Link from "next/link";
import Image from "next/image";

export function SiteHeader() {
  return (
    <header className="site-header">
      <a className="nyu-link" href="https://as.nyu.edu">
        <Image
          src="/nyu-arts-and-science.svg"
          alt="NYU Arts & Science"
          width={299}
          height={30}
          priority
        />
      </a>
      <nav aria-label="Primary navigation">
        <Link href="/#schedule">Fall 2026</Link>
        <Link href="/archive">Archive</Link>
        <Link href="/posters">Posters</Link>
        <Link href="/#contact">Contact</Link>
      </nav>
    </header>
  );
}
