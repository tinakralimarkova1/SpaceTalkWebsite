"use client";

import { useEffect } from "react";

export function ParallaxBackground() {
  useEffect(() => {
    let frame = 0;
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");

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

    const applyMotionPreference = () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
      if (motionPreference.matches) {
        document.documentElement.style.removeProperty("--parallax-y");
      } else {
        updateBackground();
        window.addEventListener("scroll", onScroll, { passive: true });
      }
    };

    applyMotionPreference();
    motionPreference.addEventListener("change", applyMotionPreference);

    return () => {
      window.removeEventListener("scroll", onScroll);
      motionPreference.removeEventListener("change", applyMotionPreference);
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
      document.documentElement.style.removeProperty("--parallax-y");
    };
  }, []);

  return <div className="site-background" aria-hidden="true" />;
}
