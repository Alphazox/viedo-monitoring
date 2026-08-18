import { Reveal } from "./reveal";

const PRINCIPLES = [
  {
    title: "Fuse everything at the edge",
    body: "One camera, alone, is guessing. We fuse video with thermal, radar, audio and access control on-site, so a decision is made from more than a pixel pattern — and it still works when the internet doesn't.",
    icon: (
      <svg viewBox="0 0 40 40" fill="none">
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
        <circle cx="28" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
        <circle cx="20" cy="28" r="4" stroke="currentColor" strokeWidth="2" />
        <path d="M15 14l3 10M25 14l-3 10M16 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Index everything at ingest",
    body: "A rule catches what someone thought to write down. It misses everything else. We describe and index every track the moment it's recorded, so the archive can answer a question nobody asked when the video was captured.",
    icon: (
      <svg viewBox="0 0 40 40" fill="none">
        <rect x="7" y="7" width="26" height="26" rx="3" stroke="currentColor" strokeWidth="2" />
        <path d="M13 16h14M13 21h14M13 26h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Keep a human at every irreversible step",
    body: "The system can watch, reason and recommend at machine speed. Unlocking a door, dispatching a guard or naming a person stays a decision a named human makes and signs — never something the AI does on its own.",
    icon: (
      <svg viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="13" r="6" stroke="currentColor" strokeWidth="2" />
        <path d="M8 33c1.5-8 6-11 12-11s10.5 3 12 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Instrument every claim we make about it",
    body: "A number we can't defend is marketing, not engineering. Everything we publish is labeled PROVEN, VALIDATED, TARGET or ROADMAP — and we say which, every time, including on this page.",
    icon: (
      <svg viewBox="0 0 40 40" fill="none">
        <path d="M8 30V16M20 30V10M32 30v-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M5 30h30" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
];

const LABELS = [
  { tag: "PROVEN", desc: "Measured on representative customer data.", accent: "teal" },
  { tag: "VALIDATED", desc: "Demonstrated in a controlled pilot.", accent: "amber" },
  { tag: "TARGET", desc: "An engineering objective we're building toward.", accent: "violet" },
  { tag: "ROADMAP", desc: "Planned, not built — and never presented as achieved.", accent: "crimson" },
] as const;

export function AboutStory() {
  return (
    <>
      <section className="sec">
        <div className="container">
          <Reveal className="sec-head">
            <div className="eyebrow">Why we started here</div>
            <h2>Cameras see everything and remember almost none of it usefully</h2>
            <p>
              There are roughly a billion cameras installed worldwide, and almost all of them exist for one moment:
              someone watching the tape after something already went wrong. The other 99.9% of what they recorded is
              thrown away, because most platforms are built to answer one question — did something trip a rule right
              now — and stop there.
            </p>
          </Reveal>
          <Reveal>
            <p style={{ color: "var(--text-dim)", fontSize: "15.5px", maxWidth: "72ch", marginTop: -20 }}>
              That ceiling shows up as alert fatigue when the tuning favors recall over trust, as a dead archive when
              the footage that matters was never flagged, as an outage exactly when the incident needs the system
              most, and as one department&apos;s budget carrying cameras that could be reporting to three. None of
              these are hypothetical — they&apos;re the specific failure modes that show up the first time something
              actually happens. We built KESTREL to move past that ceiling on purpose, not to compete for a better
              seat below it.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="sec sec-alt">
        <div className="container">
          <Reveal className="sec-head">
            <div className="eyebrow">How we tackle it</div>
            <h2>Four principles every feature has to survive</h2>
            <p>Not a mission statement — the actual constraints we design against before a feature ships.</p>
          </Reveal>
          <Reveal className="problems">
            {PRINCIPLES.map((p) => (
              <div className="problem" key={p.title}>
                <div className="p-icon" aria-hidden="true">
                  {p.icon}
                </div>
                <h4>{p.title}</h4>
                <p>{p.body}</p>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      <section className="sec">
        <div className="container">
          <Reveal className="sec-head">
            <div className="eyebrow">How we hold ourselves to it</div>
            <h2>We label our own claims before you have to ask</h2>
            <p>
              The same four labels appear everywhere on this site — the stat band on the homepage, the pilot quotes,
              this page. It&apos;s a small discipline, but it&apos;s the one that decides whether a number here means
              anything.
            </p>
          </Reveal>
          <Reveal className="certs-row">
            {LABELS.map((l) => (
              <span className="cert-badge" key={l.tag}>
                <em style={{ color: `var(--${l.accent})`, background: `color-mix(in srgb, var(--${l.accent}) 14%, transparent)` }}>
                  {l.tag}
                </em>
                {l.desc}
              </span>
            ))}
          </Reveal>
        </div>
      </section>
    </>
  );
}
