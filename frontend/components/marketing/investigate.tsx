import { Reveal } from "./reveal";
import { CopilotDemo } from "./copilot-demo";

export function Investigate() {
  return (
    <section className="sec" id="investigate">
      <div className="container">
        <div className="invest-grid">
          <Reveal className="invest-copy">
            <div className="eyebrow">The centre of gravity</div>
            <h2 style={{ fontSize: "clamp(24px,3vw,32px)", marginTop: 14 }}>
              Not a CCTV app.
              <br />
              An investigation platform.
            </h2>
            <p className="quote">
              &quot;What I envision is an investigative platform rather than an app detecting and providing
              feeds.&quot;
            </p>
            <p>
              A detection product optimizes for the first few seconds after motion. But most of the value in
              recorded video shows up days later — when a claim is filed, a pattern is noticed, or someone asks for
              proof. At that moment, an un-indexed archive is just hours of tape nobody has time to scrub through.
            </p>
            <p>
              <strong style={{ color: "var(--text)" }}>The archive is the product.</strong> Every track is described
              and indexed the moment it&apos;s recorded, so the system can answer questions nobody thought to ask
              when the video was captured.
            </p>
            <ul className="invest-steps">
              <li>
                <span className="num mono">01</span>
                <span>
                  <strong style={{ color: "var(--text)" }}>Understand</strong> — a plain-English question is turned
                  into a structured query — zone, direction, colour, time window — that you can see and edit before
                  it runs.
                </span>
              </li>
              <li>
                <span className="num mono">02</span>
                <span>
                  <strong style={{ color: "var(--text)" }}>Retrieve</strong> — filters plus similarity search narrow
                  the full archive down to a short list of candidates.
                </span>
              </li>
              <li>
                <span className="num mono">03</span>
                <span>
                  <strong style={{ color: "var(--text)" }}>Verify</strong> — each candidate is re-checked and given a
                  confidence score before it&apos;s shown to you.
                </span>
              </li>
              <li>
                <span className="num mono">04</span>
                <span>
                  <strong style={{ color: "var(--text)" }}>Present</strong> — ranked clips with the reasoning
                  attached, one click to trace, expand or save as a standing alert.
                </span>
              </li>
            </ul>
          </Reveal>

          <Reveal>
            <CopilotDemo />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
