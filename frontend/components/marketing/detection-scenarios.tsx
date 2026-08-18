import type { CSSProperties } from "react";
import { Reveal } from "./reveal";
import { ScenarioMedia, type TrackPoint } from "./scenario-media";

// Waypoints sampled from the actual footage (ffmpeg frame extraction), in
// seconds of real video time. The box is positioned by reading the video
// element's currentTime each frame and interpolating between these — see
// scenario-media.tsx — instead of running on an independent CSS timeline
// that can drift out of sync with when the video actually plays.
const FALL_TRACK: TrackPoint[] = [
  { t: 0, top: 15, left: 50, width: 10, height: 20, on: 0 },
  { t: 2.3, top: 15, left: 50, width: 10, height: 20, on: 0 },
  { t: 2.6, top: 14, left: 50, width: 14, height: 35, on: 1 },
  { t: 3.2, top: 10, left: 55, width: 24, height: 75, on: 1 },
  { t: 4.2, top: 8, left: 58, width: 32, height: 80, on: 1 },
  { t: 5.0, top: 0, left: 62, width: 26, height: 55, on: 1 },
  { t: 6.2, top: 4, left: 18, width: 46, height: 62, on: 1 },
  { t: 7.0, top: 20, left: 28, width: 65, height: 55, on: 1 },
  { t: 7.7, top: 20, left: 28, width: 65, height: 55, on: 0 },
  { t: 10.28, top: 15, left: 50, width: 10, height: 20, on: 0 },
];

const BREACH_TRACK: TrackPoint[] = [
  { t: 0, top: 45, left: 17, width: 9, height: 30, on: 0 },
  { t: 1.5, top: 45, left: 17, width: 9, height: 30, on: 0 },
  { t: 1.8, top: 44, left: 17, width: 9, height: 31, on: 1 },
  { t: 3.0, top: 42, left: 19, width: 10, height: 33, on: 1 },
  { t: 6.0, top: 34, left: 33, width: 15, height: 45, on: 1 },
  { t: 9.0, top: 24, left: 60, width: 22, height: 62, on: 1 },
  { t: 10.5, top: 20, left: 70, width: 26, height: 68, on: 1 },
  { t: 11.0, top: 20, left: 70, width: 26, height: 68, on: 0 },
  { t: 11.64, top: 45, left: 17, width: 9, height: 30, on: 0 },
];

const SCENARIOS = [
  {
    title: "Fall detection",
    body: "A slip, trip or collapse flagged in under a second — even when nobody's watching a monitor at the time.",
    tag: "SIMULATED DETECTION",
    accent: "amber",
    src: "/media/videos/detect-fall-2791953.mp4",
    label: "PERSON · 0.97",
    box: { top: "12%", left: "52%", width: "32%", height: "78%" },
    duration: 10.28,
    trackClass: "scenario-fall",
    track: FALL_TRACK,
  },
  {
    title: "Breach & intrusion",
    body: "Forced entry or a perimeter breach, matched against expected access patterns before a door finishes opening.",
    tag: "SIMULATED DETECTION",
    accent: "crimson",
    src: "/media/videos/breach-intrusion-11349329.mp4",
    label: "INTRUSION · 0.90",
    box: { top: "42%", left: "15%", width: "10%", height: "35%" },
    duration: 11.64,
    trackClass: "scenario-breach",
    track: BREACH_TRACK,
  },
  {
    title: "Theft & concealment",
    body: "Concealment and till-area behavior patterns surfaced for human review — a pattern flagged, never a face accused.",
    tag: "SIMULATED DETECTION",
    accent: "violet",
    src: "/media/videos/theft-shoplift-8308009.mp4",
    label: "CONCEALMENT · 0.91",
    box: { top: "22%", left: "48%", width: "38%", height: "62%" },
    duration: 18.92,
  },
  {
    title: "Loitering & unauthorized presence",
    body: "A person lingering where the schedule says nobody should be, cross-checked against badge and shift data.",
    tag: "SIMULATED DETECTION",
    accent: "teal",
    src: "/media/videos/loitering-34539187.mp4",
    label: "PERSON · 0.94",
    box: { top: "34%", left: "5%", width: "24%", height: "44%" },
    duration: 13.47,
  },
  {
    title: "Vandalism in progress",
    body: "Property damage caught as it happens — not discovered the next morning on a walkthrough.",
    tag: "SIMULATED DETECTION",
    accent: "blue",
    src: "/media/videos/vandalism-graffiti-5621707.mp4",
    label: "VANDALISM · 0.91",
    box: { top: "33%", left: "48%", width: "14%", height: "30%" },
    duration: 5.13,
  },
] as const;

export function DetectionScenarios() {
  return (
    <section className="sec" id="scenarios">
      <div className="container">
        <Reveal className="sec-head">
          <div className="eyebrow">What it&apos;s actually looking for</div>
          <h2>Five scenarios, out of the patterns it&apos;s built to flag</h2>
          <p>
            Reference footage standing in for what each detection pattern covers. Where a clip is tagged
            <strong> SIMULATED DETECTION</strong>, it&apos;s illustrative stock footage — not a live capture from a
            running AegisVision AI install.
          </p>
        </Reveal>
        <Reveal className="scenarios">
          {SCENARIOS.map((s) => (
            <div className="scenario" key={s.title} style={{ "--accent": `var(--${s.accent})` } as CSSProperties}>
              {"src" in s && (
                <ScenarioMedia
                  src={s.src}
                  label={s.label}
                  box={s.box}
                  cycleDuration={s.duration}
                  trackClass={"trackClass" in s ? s.trackClass : undefined}
                  track={"track" in s ? s.track : undefined}
                />
              )}
              <div className="scenario-body">
                <span className="scenario-tag mono">{s.tag}</span>
                <h4>{s.title}</h4>
                <p>{s.body}</p>
              </div>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
