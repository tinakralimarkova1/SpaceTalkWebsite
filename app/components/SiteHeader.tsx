"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export function SiteHeader() {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const moreButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function closeOnOutsidePointer(event: PointerEvent) {
      if (!moreMenuRef.current?.contains(event.target as Node)) setIsMoreOpen(false);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape" || !isMoreOpen) return;
      setIsMoreOpen(false);
      moreButtonRef.current?.focus();
    }

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isMoreOpen]);

  const closeMoreMenu = () => setIsMoreOpen(false);

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
      <nav className="desktop-navigation" aria-label="Primary navigation">
        <Link href="/#about">Home</Link>
        <Link href="/about">About</Link>
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
      <nav className="mobile-navigation" aria-label="Primary navigation">
        <Link href="/#about">Home</Link>
        <Link href="/about">About</Link>
        <Link aria-label="Fall 2026" href="/#schedule">Fall 26</Link>
        <Link href="/#contact">Contact</Link>
        <div className="mobile-more" ref={moreMenuRef}>
          <button
            aria-controls="mobile-more-menu"
            aria-expanded={isMoreOpen}
            className="mobile-more-button"
            onClick={() => setIsMoreOpen((open) => !open)}
            ref={moreButtonRef}
            type="button"
          >
            More <span aria-hidden="true" className="mobile-more-chevron">▾</span>
          </button>
          <div className="mobile-more-menu" hidden={!isMoreOpen} id="mobile-more-menu">
            <Link href="/archive" onClick={closeMoreMenu}>Archive</Link>
            <Link href="/posters" onClick={closeMoreMenu}>Posters</Link>
            <Link href="/thinking-outer-space" onClick={closeMoreMenu}>Thinking Outer Space</Link>
          </div>
        </div>
      </nav>
    </header>
  );
}
