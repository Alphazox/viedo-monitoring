"use client";

import { useEffect, useRef } from "react";

export function HeroGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const glow = ref.current;
    const hero = glow?.closest(".hero") as HTMLElement | null;
    if (!glow || !hero) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    function onMove(e: MouseEvent) {
      if (!hero || !glow) return;
      const r = hero.getBoundingClientRect();
      glow.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
      glow.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
    }
    hero.addEventListener("mousemove", onMove);
    return () => hero.removeEventListener("mousemove", onMove);
  }, []);

  return <div className="hero-cursor-glow" ref={ref} aria-hidden="true" />;
}
