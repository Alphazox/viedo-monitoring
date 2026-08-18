import { Reveal } from "./reveal";
import { StatCounter } from "./stat-counter";

const STATS = [
  { value: 500, prefix: "<", suffix: "ms", label: "From a detected person to a logged, searchable track", tag: "target" },
  { value: 100, prefix: "", suffix: "%", label: "Self-hosted — your footage never has to leave your infrastructure", tag: "target" },
  { value: 0, prefix: "", suffix: "", label: "Faces stored for recognition by default — attributes only", tag: "target" },
  { value: 2, prefix: "<", suffix: "s", label: "For a plain-English question to return matching clips", tag: "target" },
  { value: 24, prefix: "", suffix: "/7", label: "Continuous tracking across every connected camera", tag: "target" },
] as const;

export function StatsBand() {
  return (
    <section className="stats">
      <Reveal className="container stats-row">
        {STATS.map((s) => (
          <div className="stat" key={s.label}>
            <StatCounter value={s.value} prefix={s.prefix} suffix={s.suffix} />
            <div className="stat-label">
              {s.label}
              <span className={`stat-tag ${s.tag}`}>{s.tag}</span>
            </div>
          </div>
        ))}
      </Reveal>
      <div className="container">
        <p className="stats-note">
          We&apos;re early. Numbers tagged <strong>target</strong> are engineering objectives we&apos;re building
          toward, not measured results — nothing here is presented as achieved until it&apos;s proven on real
          deployments.
        </p>
      </div>
    </section>
  );
}
