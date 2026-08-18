import { Reveal } from "./reveal";
import { CommandCenterCanvas } from "./command-center-canvas";

export function CommandCenter() {
  return (
    <section className="sec" id="commandcenter">
      <div className="container">
        <div className="cc-grid">
          <Reveal>
            <div className="eyebrow">Not a wall of thumbnails</div>
            <h2 style={{ fontSize: "clamp(24px,3vw,32px)", marginTop: 14 }}>The Command Center is map-first.</h2>
            <p style={{ color: "var(--text-dim)", fontSize: "15.5px", marginTop: 16 }}>
              The floorplan is the primary object. Cameras are lenses onto it, not the interface itself — live
              tracks move across the plan as soft light traces that fade over ten seconds.
            </p>
            <ul className="cc-points">
              <li>
                <span className="dot-crimson" />
                The right rail is ranked by risk, not chronology — the event that matters is always at the top.
              </li>
              <li>
                <span className="dot-amber" />
                One incident opens as a stitched narrative with a scrub bar spanning every involved camera.
              </li>
              <li>
                <span className="dot-teal" />
                Only two animations exist on the whole screen. In a room watched for eight hours, restraint is a
                safety feature.
              </li>
            </ul>
          </Reveal>

          <Reveal
            className="cc-window"
          >
            <div
              role="img"
              aria-label="Command Center preview: a site floorplan with live tracked movement on the left, and a risk-ranked event feed on the right"
            >
              <div className="cc-titlebar">
                <div className="cc-dots">
                  <span />
                  <span />
                  <span />
                </div>
                <div className="cc-url mono">aegisvision.ai/sites/north-campus</div>
              </div>
              <div className="cc-body">
                <div className="cc-rail">
                  <div className="cc-rail-item active">▦</div>
                  <div className="cc-rail-item">▤</div>
                  <div className="cc-rail-item">◎</div>
                  <div className="cc-rail-item">▥</div>
                  <div className="cc-rail-item">⚙</div>
                </div>
                <div className="cc-map">
                  <CommandCenterCanvas />
                  <div className="cc-map-label mono">NORTH CAMPUS · FLOOR 1</div>
                </div>
                <div className="cc-feed">
                  <div className="cc-feed-head mono">RISK-RANKED · LIVE</div>
                  <div className="cc-event sev-crimson">
                    <div className="cc-event-top">
                      <span>Perimeter breach</span>
                      <b>94</b>
                    </div>
                    <div className="cc-event-sub">Lot B · Cam 14 · 00:41s ago</div>
                  </div>
                  <div className="cc-event sev-amber">
                    <div className="cc-event-top">
                      <span>Tailgating, Gate 2</span>
                      <b>71</b>
                    </div>
                    <div className="cc-event-sub">North Gate · Cam 07 · 2m ago</div>
                  </div>
                  <div className="cc-event sev-amber">
                    <div className="cc-event-top">
                      <span>PPE missing, Line 3</span>
                      <b>58</b>
                    </div>
                    <div className="cc-event-sub">Floor 2 · Cam 22 · 4m ago</div>
                  </div>
                  <div className="cc-event sev-teal">
                    <div className="cc-event-top">
                      <span>Dock 6 idle 41min</span>
                      <b>22</b>
                    </div>
                    <div className="cc-event-sub">Yard · Cam 03 · 11m ago</div>
                  </div>
                </div>
              </div>
              <div className="cc-status mono">42 cameras online · 3 offline · tracking live</div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
