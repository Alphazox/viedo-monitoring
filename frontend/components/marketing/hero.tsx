import Link from "next/link";
import { SiteGraphCanvas } from "./site-graph-canvas";
import { HeroGlow } from "./hero-glow";

export function Hero() {
  return (
    <section className="hero">
      <video
        className="hero-bg-video"
        src="/media/videos/control-room-cctv-38779095.mp4"
        autoPlay
        muted
        loop
        playsInline
        aria-hidden="true"
      />
      <div className="hero-bg-scrim" aria-hidden="true" />
      <HeroGlow />
      <div className="hero-hud" aria-hidden="true">
        <span className="hero-hud-corner tl" />
        <span className="hero-hud-corner tr" />
        <span className="hero-hud-corner bl" />
        <span className="hero-hud-corner br" />
        <span className="hero-hud-tag mono">AI vision engine · live</span>
      </div>
      <div className="container hero-grid">
        <div>
          <div className="eyebrow">AI video intelligence, self-hosted</div>
          <h1>
            Your cameras,
            <br />
            finally paying
            <br />
            attention. <em>Ask them.</em>
          </h1>
          <p className="hero-lede">
            AegisVision AI watches every camera on your site in real time, tracks who and what moves through it, and
            turns raw footage into an archive you can question in plain English — running on your own
            infrastructure, over the cameras you already have.
          </p>
          <p className="hero-position">
            &quot;Most systems record video. AegisVision AI understands it.&quot;{" "}
            <span>— the line every feature on this page has to earn</span>
          </p>
          <div className="hero-ctas">
            <Link className="btn btn-primary" href="#investigate">
              See how investigation works
            </Link>
            <Link className="btn btn-ghost" href="#platform">
              How it&apos;s built
            </Link>
          </div>
          <div className="hero-bg-caption" aria-hidden="true">
            Reference footage — multi-feed monitoring wall, playing live behind this page
          </div>
        </div>
        <div className="hero-visual">
          <div className="hv-label">Live scene graph</div>
          <div className="hv-tag">Tracks resolving in real time</div>
          <SiteGraphCanvas />
        </div>
      </div>
    </section>
  );
}
