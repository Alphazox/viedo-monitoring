"use client";

import { useEffect, useState } from "react";

const QUERIES = [
  "Find the person wearing a red shirt who entered the north gate between 9 and 11 AM.",
  "Show me all instances where someone appeared to fall.",
  "What happened at the reception desk between 8:15 and 8:30?",
  "Everyone who entered Gate 2 between 7 and 10 PM wearing dark clothing.",
];

export function CopilotDemo() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const id = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % QUERIES.length);
        setVisible(true);
      }, 260);
    }, 4200);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="copilot" role="group" aria-label="AegisVision AI Copilot search example">
      <div className="copilot-bar">
        <div className="mic">●</div>
        <div className="copilot-q mono" style={{ opacity: visible ? 1 : 0 }}>
          {QUERIES[index]}
        </div>
      </div>
      <div className="copilot-chips">
        <span className="chip">
          <b>entity</b> person
        </span>
        <span className="chip">
          <b>upper garment</b> red
        </span>
        <span className="chip">
          <b>zone</b> north gate
        </span>
        <span className="chip">
          <b>direction</b> entering
        </span>
        <span className="chip">
          <b>window</b> 09:00–11:00
        </span>
      </div>
      <div className="copilot-results">
        <div className="result">
          <div className="thumb" />
          <div className="meta">
            <div className="title">Cam 07 · North Gate — 09:14:02.3</div>
            <div className="reason">Garment colour and gait signature match; entry direction confirmed by turnstile.</div>
          </div>
          <div className="conf">94%</div>
        </div>
        <div className="result">
          <div className="thumb" />
          <div className="meta">
            <div className="title">Cam 08 · North Gate — 10:47:51.0</div>
            <div className="reason">Match on garment and build; badge read absent, flagged for follow-up.</div>
          </div>
          <div className="conf">88%</div>
        </div>
        <div className="result">
          <div className="thumb" />
          <div className="meta">
            <div className="title">Cam 07 · North Gate — 09:52:18.6</div>
            <div className="reason">Rejected candidate shown for audit: garment scored orange, not red.</div>
          </div>
          <div className="conf" style={{ color: "var(--text-faint)" }}>
            31%
          </div>
        </div>
      </div>
      <div className="copilot-foot">
        <span>3 matches · 214 candidates narrowed</span>
        <span>3.9s</span>
      </div>
    </div>
  );
}
