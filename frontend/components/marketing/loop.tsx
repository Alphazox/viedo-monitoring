import { Reveal } from "./reveal";

const STEPS = [
  {
    glyph: "◎",
    title: "See",
    body: "Every connected camera feeds into one continuous view of your site — detecting and tracking every person who moves through frame, in real time.",
  },
  {
    glyph: "≡",
    title: "Describe",
    body: "Each track is described, not just boxed — clothing, direction, the zone it's in — and checked against what's expected there, so a routine pass-through never becomes noise.",
  },
  {
    glyph: "▶",
    title: "Act",
    body: "A verified event raises an alert with the clip attached — and every track, flagged or not, is filed into a searchable record instead of disappearing.",
  },
] as const;

export function Loop() {
  return (
    <section className="sec sec-alt" id="loop">
      <div className="container">
        <Reveal className="sec-head">
          <div className="eyebrow">How it works</div>
          <h2>One loop, run continuously — not three products bolted together</h2>
          <p>Every camera runs the same cycle, all the time: watch everything, describe what matters, act on what&apos;s verified.</p>
        </Reveal>
        <Reveal className="loop">
          {STEPS.map((s, i) => (
            <div className="loop-step" key={s.title}>
              <div className="loop-top">
                <div className="loop-glyph">{s.glyph}</div>
                <div className="loop-index mono">{String(i + 1).padStart(2, "0")}</div>
              </div>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
