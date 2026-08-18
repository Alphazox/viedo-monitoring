import { Reveal } from "./reveal";

const BETS = [
  {
    title: "Built for the cameras you already have",
    body: "Works over standard RTSP — no proprietary hardware, no rip-and-replace. Point it at the cameras that are already on your walls and it starts watching.",
  },
  {
    title: "People are described, not identified",
    body: "Every track carries attributes — clothing colour, direction, whether they're carrying something — each with a confidence score. No face is stored or matched by default.",
  },
  {
    title: "The archive is searchable, not just recorded",
    body: "Every track is logged the moment it happens, so a plain-English question can search the full history — not only the clips that happened to trip an alert.",
  },
  {
    title: "Sites and zones, organised the way buildings actually work",
    body: "Multiple sites, each with their own zones and cameras, under one account — so one deployment can cover more than a single room.",
  },
  {
    title: "Self-hosted by default",
    body: "Runs on your own infrastructure. Your video doesn't have to leave the building to be useful.",
  },
];

export function FiveBets() {
  return (
    <section className="sec" id="platform">
      <div className="container">
        <Reveal className="sec-head">
          <div className="eyebrow">Read this in 60 seconds</div>
          <h2>Five decisions that shape everything else</h2>
          <p>
            Most CCTV software is a good recorder with a fixed ceiling: camera-only, closed, useless once the alert
            is dismissed. AegisVision AI is built around a different set of defaults, on purpose.
          </p>
        </Reveal>
        <Reveal className="bets">
          {BETS.map((b, i) => (
            <div className="bet" key={b.title}>
              <div className="n">{String(i + 1).padStart(2, "0")}</div>
              <h3>{b.title}</h3>
              <p>{b.body}</p>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
