import { Reveal } from "./reveal";

const OLD_ROWS = [
  { k: "Inputs", v: "Raw RTSP feeds, watched live" },
  { k: "Finding a clip", v: "Scrub the timeline by hand" },
  { k: "What's kept", v: "Only the clips someone remembered to export" },
  { k: "Identity", v: "A guess, or a name on a badge" },
  { k: "Offline", v: "Recording stops when the NVR does" },
  { k: "Reach", v: "One screen, one guard, one shift" },
];

const NEW_ROWS = [
  { k: "Inputs", v: "The same RTSP feeds — detected and tracked automatically" },
  { k: "Finding a clip", v: "Ask a plain-English question, get ranked clips back" },
  { k: "What's kept", v: "Every track logged at the moment it happens" },
  { k: "Identity", v: "Attributes with a confidence score — never asserted as a name" },
  { k: "Offline", v: "Keeps detecting and tracking on-site regardless of the network" },
  { k: "Reach", v: "Every site, every zone, one account" },
];

export function Compare() {
  return (
    <section className="sec sec-alt">
      <div className="container">
        <Reveal className="sec-head">
          <div className="eyebrow">The old ceiling</div>
          <h2>What a plain recording system stops short of</h2>
          <p>
            A camera that only records answers one question well — what happened, if you go looking for it. AegisVision AI
            is built to answer the next one: who, where, and how often.
          </p>
        </Reveal>
        <Reveal className="compare">
          <div className="compare-col old">
            <h4>Just a recorder</h4>
            {OLD_ROWS.map((r) => (
              <div className="compare-row" key={r.k}>
                <span className="k">{r.k}</span>
                <span className="v">{r.v}</span>
              </div>
            ))}
          </div>
          <div className="compare-col new">
            <h4>AegisVision AI</h4>
            {NEW_ROWS.map((r) => (
              <div className="compare-row" key={r.k}>
                <span className="k">{r.k}</span>
                <span className="v">{r.v}</span>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
