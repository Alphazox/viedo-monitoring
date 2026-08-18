import { Reveal } from "./reveal";

const PROBLEMS = [
  {
    title: "Alert fatigue kills trust",
    body: "One bad week of false alarms and staff stop believing the system. Most platforms tune for recall and let humans absorb the noise.",
    icon: (
      <svg viewBox="0 0 40 40" fill="none">
        <path d="M20 6l14 24H6L20 6z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M20 17v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="20" cy="29" r="1.4" fill="currentColor" />
      </svg>
    ),
  },
  {
    title: "The archive is dead storage",
    body: "Only the footage that tripped an alert is ever reviewed. The other 99.9% is thrown away the moment something is asked that nobody thought to alert on.",
    icon: (
      <svg viewBox="0 0 40 40" fill="none">
        <rect x="6" y="9" width="28" height="19" rx="2" stroke="currentColor" strokeWidth="2" />
        <path d="M14 33h12M20 28v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M12 22l5-6 4 4 7-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "Cloud-dependent goes dark exactly when it matters",
    body: "Internet drops, and so does detection. A camera-only, cloud-first stack degrades right when the outage itself might be the incident.",
    icon: (
      <svg viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="14" stroke="currentColor" strokeWidth="2" />
        <path d="M20 12v8l6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M6 6l28 28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "One vendor, one budget, one ceiling",
    body: "A closed, security-only stack answers one question for one buyer. The same cameras could be reporting to three departments instead of one.",
    icon: (
      <svg viewBox="0 0 40 40" fill="none">
        <rect x="7" y="7" width="26" height="26" rx="4" stroke="currentColor" strokeWidth="2" />
        <path d="M15 20h10M20 15v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
];

export function ProblemCards() {
  return (
    <section className="sec" id="breakdown">
      <div className="container">
        <Reveal className="sec-head">
          <div className="eyebrow">Where legacy systems break down</div>
          <h2>Four ways a detection-only platform fails you</h2>
          <p>Not hypothetical gaps — the specific failure modes that show up the first time something actually happens.</p>
        </Reveal>
        <Reveal className="problems">
          {PROBLEMS.map((p) => (
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
  );
}
