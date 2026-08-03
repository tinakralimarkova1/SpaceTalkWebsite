"use client";

import { useEffect } from "react";

export function ParallaxBackground() {
  useEffect(() => {
    let frame = 0;

    const updateBackground = () => {
      document.documentElement.style.setProperty(
        "--parallax-y",
        `${window.scrollY * -0.08}px`,
      );
      frame = 0;
    };

    const onScroll = () => {
      if (!frame) {
        frame = window.requestAnimationFrame(updateBackground);
      }
    };

    updateBackground();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, []);

  return <div className="site-background" aria-hidden="true" />;
}
