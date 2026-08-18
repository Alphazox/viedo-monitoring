import Link from "next/link";
import { Reveal } from "./reveal";
import { PLANES } from "@/lib/sandboxData";

const PLANE_CLASS: Record<string, string> = {
  security: "security",
  business: "business",
  operations: "ops",
};

const PROMISE: Record<string, string> = {
  security: "Safer people, secure property.",
  business: "Smarter spaces, higher value.",
  operations: "Efficient assets, optimized work.",
};

export function IntelligencePlanes() {
  return (
    <section className="sec" id="intelligence">
      <div className="container">
        <Reveal className="sec-head">
          <div className="eyebrow">One feed, several audiences</div>
          <h2>The same events, read three different ways</h2>
          <p>
            Security, operations and business teams can each read the same event stream through a different lens —
            so the same deployment can serve more than one team.
          </p>
        </Reveal>
        <Reveal className="planes">
          {PLANES.map((plane) => (
            <Link
              className={`plane ${PLANE_CLASS[plane.slug]}`}
              href={`/planes/${plane.slug}`}
              key={plane.slug}
              transitionTypes={["nav-forward"]}
            >
              <h3>{plane.title}</h3>
              <p className="promise">{PROMISE[plane.slug]}</p>
              <ul>
                {plane.bullets.slice(0, 3).map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
              <div className="buyer">{plane.meta[0].v}</div>
              <div className="open">Explore this plane →</div>
            </Link>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
