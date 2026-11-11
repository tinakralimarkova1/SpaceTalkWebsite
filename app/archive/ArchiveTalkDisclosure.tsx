"use client";

import { useEffect, useRef, type MouseEvent, type ReactNode } from "react";

type ArchiveTalkDisclosureProps = {
  children: ReactNode;
  summary: ReactNode;
};

const animationOptions: KeyframeAnimationOptions = {
  duration: 420,
  easing: "cubic-bezier(0.22, 1, 0.36, 1)",
};

export function ArchiveTalkDisclosure({ children, summary }: ArchiveTalkDisclosureProps) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const summaryRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<Animation | null>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => () => {
    animationRef.current?.cancel();
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
  }, []);

  function finish(open: boolean) {
    const details = detailsRef.current;
    if (!details) return;

    details.open = open;
    details.style.height = "";
    details.style.overflow = "";
    animationRef.current = null;
  }

  function animate(open: boolean) {
    const details = detailsRef.current;
    const summaryElement = summaryRef.current;
    const content = contentRef.current;
    if (!details || !summaryElement || !content) return;

    animationRef.current?.cancel();
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finish(open);
      return;
    }

    const startHeight = `${details.offsetHeight}px`;
    details.style.height = startHeight;
    details.style.overflow = "hidden";

    if (open) details.open = true;

    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null;
      const endHeight = `${open ? summaryElement.offsetHeight + content.offsetHeight : summaryElement.offsetHeight}px`;
      const animation = details.animate(
        { height: [startHeight, endHeight] },
        animationOptions,
      );
      animationRef.current = animation;
      animation.onfinish = () => finish(open);
      animation.oncancel = () => {
        if (animationRef.current === animation) animationRef.current = null;
      };
    });
  }

  function handleSummaryClick(event: MouseEvent<HTMLElement>) {
    event.preventDefault();
    animate(!detailsRef.current?.open);
  }

  return (
    <details className="archive-talk" ref={detailsRef}>
      <summary className="archive-talk-summary" onClick={handleSummaryClick} ref={summaryRef}>
        {summary}
      </summary>
      <div ref={contentRef}>{children}</div>
    </details>
  );
}
