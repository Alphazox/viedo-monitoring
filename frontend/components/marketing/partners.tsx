import { Reveal } from "./reveal";

const QUOTES = [
  {
    quote:
      "We stopped chasing motion alerts in the first week. Now it only pings us when something's actually happening at the dock.",
    role: "Operations Manager",
    context: "cold-storage & logistics site",
  },
  {
    quote:
      "I can ask it to show me every time a fire door got propped open and get six months of answers in ten seconds. That used to be a two-day export request to the property manager.",
    role: "Facilities Director",
    context: "K-12 campus",
  },
  {
    quote:
      "What actually sold our board wasn't the alerts — it was that every clip we hand to insurance now comes with a hash we can defend in a deposition.",
    role: "Risk & Safety Lead",
    context: "multi-site retail portfolio",
  },
] as const;

const SITE_TYPES = [
  "K-12 campus",
  "Cold-storage & logistics",
  "Multi-site retail portfolio",
  "Regional healthcare network",
  "Multifamily residential",
  "Auto dealership group",
] as const;

export function Partners() {
  return (
    <section className="sec" id="partners">
      <div className="container">
        <Reveal className="sec-head">
          <div className="eyebrow">Early access, not a highlight reel</div>
          <h2>What pilot sites are telling us — before we call it proven</h2>
          <p>
            These are illustrative, composited from recurring pilot feedback — not yet named, published case
            studies. Same rule as the stat band up top: nothing gets called PROVEN here until it&apos;s measured on
            customer data, with a name attached.
          </p>
        </Reveal>

        <Reveal className="partner-quotes">
          {QUOTES.map((q) => (
            <div className="partner-quote" key={q.role + q.context}>
              <span className="partner-badge mono">SAMPLE QUOTE</span>
              <p className="pq-text">&ldquo;{q.quote}&rdquo;</p>
              <div className="pq-attr">
                <strong>{q.role}</strong>
                <span>{q.context}</span>
              </div>
            </div>
          ))}
        </Reveal>

        <Reveal className="certs">
          <div className="certs-label mono">Site types already in early access</div>
          <div className="certs-row">
            {SITE_TYPES.map((s) => (
              <span className="cert-badge" key={s}>
                {s}
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
