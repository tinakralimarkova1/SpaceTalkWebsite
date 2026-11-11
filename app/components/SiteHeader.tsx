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
        <Link href="/#about">Home</Link>
        <Link aria-label="Fall 2026" href="/#schedule">
          <span className="nav-label-desktop">Fall 2026</span>
          <span className="nav-label-mobile">Fall 26</span>
        </Link>
        <Link href="/archive">Archive</Link>
        <Link href="/posters">Posters</Link>
        <Link aria-label="Thinking Outer Space" href="/thinking-outer-space">
          <span className="nav-label-desktop">Thinking Outer Space</span>
          <span className="nav-label-mobile">Thinking</span>
        </Link>
        <Link href="/#contact">Contact</Link>
      </nav>
    </header>
  );
}
