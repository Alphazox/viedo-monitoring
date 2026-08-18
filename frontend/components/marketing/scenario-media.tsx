"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";

export type TrackPoint = {
  t: number;
  top: number;
  left: number;
  width: number;
  height: number;
  on: number;
};

function sampleTrack(track: readonly TrackPoint[], t: number) {
  const first = track[0];
  const last = track[track.length - 1];
  if (t <= first.t) return first;
  if (t >= last.t) return last;
  for (let i = 0; i < track.length - 1; i++) {
    const a = track[i];
    const b = track[i + 1];
    if (t >= a.t && t <= b.t) {
      const f = (t - a.t) / (b.t - a.t);
      return {
        top: a.top + (b.top - a.top) * f,
        left: a.left + (b.left - a.left) * f,
        width: a.width + (b.width - a.width) * f,
        height: a.height + (b.height - a.height) * f,
        on: a.on + (b.on - a.on) * f,
      };
    }
  }
  return last;
}

export function ScenarioMedia({
  src,
  label,
  box,
  track,
  cycleDuration,
  trackClass,
}: {
  src: string;
  label: string;
  box: { top: string; left: string; width: string; height: string };
  track?: readonly TrackPoint[];
  cycleDuration: number;
  trackClass?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const boxRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!track) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf: number;
    // Reads the video's own currentTime every frame rather than running a
    // separate CSS animation on its own clock — a CSS animation starts at
    // paint time, which can drift ahead of when the video actually begins
    // playing (autoplay/buffering latency), making the box lead the person.
    function tick() {
      const video = videoRef.current;
      const el = boxRef.current;
      if (video && el) {
        const { top, left, width, height, on } = sampleTrack(track!, video.currentTime);
        el.style.top = `${top}%`;
        el.style.left = `${left}%`;
        el.style.width = `${width}%`;
        el.style.height = `${height}%`;
        el.style.opacity = String(on);
        el.style.boxShadow =
          on > 0.5
            ? "0 0 0 1.5px var(--accent, var(--amber)), 0 0 22px -4px var(--accent, var(--amber))"
            : "none";
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [track]);

  return (
    <div
      className={`scenario-media ${trackClass ?? ""}`}
      style={{ "--cycle-duration": `${cycleDuration}s` } as CSSProperties}
    >
      <video ref={videoRef} src={src} autoPlay muted loop playsInline />
      <div className="detect-frame" aria-hidden="true">
        <span className="df-corner tl" />
        <span className="df-corner tr" />
        <span className="df-corner bl" />
        <span className="df-corner br" />
        <span className="df-status df-status-scan">Scanning</span>
        <span className="df-status df-status-lock">Person detected</span>
        <span
          ref={boxRef}
          className="df-box"
          style={{ top: box.top, left: box.left, width: box.width, height: box.height } as CSSProperties}
        >
          <span className="df-box-label mono">{label}</span>
        </span>
      </div>
      <div className="detect-scan" aria-hidden="true" />
    </div>
  );
}
