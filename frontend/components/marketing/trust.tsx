import { Reveal } from "./reveal";

const ITEMS = [
  {
    glyph: "◐",
    title: "No facial recognition by default",
    body: "People are tracked by attributes — clothing, direction, movement — not by face. Recognition stays off unless you turn it on.",
  },
  {
    glyph: "∅",
    title: "Confidence, not certainty",
    body: "Every attribute and match carries a confidence score. The system flags a possible match — it never asserts an identity.",
  },
  {
    glyph: "§",
    title: "Your data, your infrastructure",
    body: "Self-hosted by default. Video and events live on your own servers unless you choose otherwise.",
  },
  {
    glyph: "✓",
    title: "Retention you control",
    body: "Decide how long video, events and incidents are kept, per organization — not a fixed default nobody reviews.",
  },
  {
    glyph: "▤",
    title: "Scoped and logged access",
    body: "Every user, role and action is tied to an organization and a site — nothing crosses between tenants by accident.",
  },
];

export function Trust() {
  return (
    <section className="sec sec-alt" id="trust">
      <div className="container">
        <Reveal className="sec-head">
          <div className="eyebrow">The moat</div>
          <h2>Privacy handled as architecture, not a policy page</h2>
          <p>Not a promise buried in a PDF — decisions built into how tracking and storage actually work.</p>
        </Reveal>
        <Reveal className="trust">
          {ITEMS.map((item) => (
            <div className="trust-item" key={item.title}>
              <div className="glyph">{item.glyph}</div>
              <h4>{item.title}</h4>
              <p>{item.body}</p>
            </div>
          ))}
        </Reveal>

        <Reveal className="certs">
          <div className="certs-label mono">
            We&apos;re early. These are the privacy defaults we build to — not compliance certifications we hold yet.
          </div>
        </Reveal>
      </div>
    </section>
  );
}
