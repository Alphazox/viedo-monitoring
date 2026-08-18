import { Reveal } from "./reveal";

export function NetworkReach() {
  return (
    <section className="sec sec-alt" id="network">
      <div className="container">
        <div className="cc-grid">
          <Reveal>
            <div className="eyebrow">One camera, one loop</div>
            <h2 style={{ fontSize: "clamp(24px,3vw,32px)", marginTop: 14 }}>
              Detected on the edge. Reviewed by a person.
            </h2>
            <p style={{ color: "var(--text-dim)", fontSize: "15.5px", marginTop: 16 }}>
              The camera flags a track, not a verdict. Every observation is checked against site policy before it
              ever reaches a screen — and identity is always a conclusion a named person draws, never something the
              system asserts on its own.
            </p>
            <ul className="cc-points">
              <li>
                <span className="dot-amber" />
                Detection happens on the node itself — no round trip to the cloud before the loop closes.
              </li>
              <li>
                <span className="dot-teal" />
                A flagged track becomes a review chip, not an announcement — a person still makes the call.
              </li>
              <li>
                <span className="dot-crimson" />
                Every chip carries its source frames, so the reviewer sees exactly what the system saw.
              </li>
            </ul>
          </Reveal>

          <Reveal className="hero-visual network-visual">
            <div className="hv-label">On site → under review</div>
            <div className="hv-tag">Real photos, not our footage</div>
            <div className="network-photos">
              <img className="np-lead" src="/media/photos/control-room-person-30576172.jpg" alt="A person reviewing monitors in a dimly lit control room" loading="lazy" />
              <img src="/media/photos/cam-brick-5213883.jpg" alt="Surveillance camera mounted on a brick building" loading="lazy" />
              <img src="/media/photos/cam-dome-urban-37591158.jpg" alt="Modern dome security camera on an urban building" loading="lazy" />
              <img src="/media/photos/cam-street-37591157.jpg" alt="CCTV camera overlooking an urban street" loading="lazy" />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
