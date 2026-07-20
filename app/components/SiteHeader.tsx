import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="nyu-link" href="/" aria-label="NYU Space Talks home">
        NYU
      </Link>
      <nav aria-label="Primary navigation">
        <Link href="/#schedule">Fall 2026</Link>
        <Link href="/archive">Archive</Link>
        <Link href="/#contact">Contact</Link>
      </nav>
    </header>
  );
}
