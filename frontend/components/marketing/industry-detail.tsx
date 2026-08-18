import type { CSSProperties } from "react";
import Link from "next/link";
import type { SectorItem } from "@/lib/sandboxData";
import { SECTORS } from "@/lib/sandboxData";
import { SectorPhoto } from "./sector-photo";
import { CapabilityCard } from "./capability-card";
import { Reveal } from "./reveal";

export function IndustryDetail({ sector }: { sector: SectorItem }) {
  const siblings = SECTORS.filter((s) => s.slug !== sector.slug);

  return (
    <>
      <section className="ind-hero">
        <SectorPhoto slug={sector.slug} index={0} priority />
        <div className="ind-hero-scrim" />
        <div className="ind-hero-inner">
          <div className="container">
            <Link href="/sectors" className="sandbox-back" transitionTypes={["nav-back"]}>
              ← Back to sectors
            </Link>
            <div className="ind-hero-grid">
              <div>
                <div className="sandbox-eyebrow" style={{ color: `var(--${sector.accent})` }}>
                  Sector pack · {sector.code}
                </div>
                <h1>{sector.title}.</h1>
                <p className="ind-hero-lede">{sector.heroLede}</p>
                <div className="hero-ctas">
                  <Link className="btn btn-primary" href="/#cta" transitionTypes={["nav-back"]}>
                    Request a demo
                  </Link>
                  <Link className="btn btn-ghost" href="/platform" transitionTypes={["nav-back"]}>
                    How it&apos;s built
                  </Link>
                </div>
              </div>
              <div className="ind-callout">
                <div className="ind-callout-status">
                  <span>Status: {sector.calloutStatus}</span>
                  <span className="ok">✓</span>
                </div>
                <div className="ind-callout-body">
                  <strong>{sector.calloutTitle}</strong>
                </div>
                <div className="ind-callout-sub">{sector.calloutSub}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="container">
          <Reveal className="sec-head">
            <div className="eyebrow">Where traditional security falls short</div>
            <h2>Four problems specific to {sector.title.toLowerCase()}</h2>
            <p>Most security systems tell you what happened after the fact. AegisVision AI closes the loop in real time.</p>
          </Reveal>
          <Reveal className="ind-problems">
            {sector.problems.map((p, i) => (
              <div className="ind-problem" key={p.title}>
                <SectorPhoto slug={sector.slug} index={i} />
                <div className="ind-problem-body">
                  <span className="ind-problem-tag">{p.tag}</span>
                  <h4>{p.title}</h4>
                  <p>{p.body}</p>
                </div>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      <section className="sec sec-alt">
        <div className="container">
          <Reveal className="sec-head">
            <div className="eyebrow">What AegisVision AI does</div>
            <h2>From detection to documented outcome</h2>
          </Reveal>
          <Reveal>
            <div className="ind-steps">
              {sector.steps.map((step, i) => (
                <div className="ind-step" key={step.title}>
                  <div>
                    <div className="ind-step-num mono">STEP {String(i + 1).padStart(2, "0")}</div>
                    <h3>{step.title}</h3>
                    <p>{step.body}</p>
                  </div>
                  <div className="ind-step-media">
                    <SectorPhoto slug={sector.slug} index={i + 1} />
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <div className="ind-gallery">
        <SectorPhoto slug={sector.slug} index={0} />
        <SectorPhoto slug={sector.slug} index={1} />
        <SectorPhoto slug={sector.slug} index={2} />
        <SectorPhoto slug={sector.slug} index={3} />
      </div>

      <section className="ind-cta">
        <SectorPhoto slug={sector.slug} index={2} />
        <div className="ind-cta-scrim" />
        <div className="container ind-cta-inner">
          <div className="eyebrow" style={{ justifyContent: "center" }}>
            Protect your sites with AegisVision AI
          </div>
          <h2>{sector.summary}</h2>
          <p>Point AegisVision AI at a week of your existing footage and see what it would have caught.</p>
          <div className="cta-actions" style={{ justifyContent: "center" }}>
            <Link className="btn btn-primary" href="/#cta" transitionTypes={["nav-back"]}>
              Request a demo
            </Link>
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="container">
          <Reveal className="sec-head">
            <div className="eyebrow">Built for the pack</div>
            <h2>What&apos;s inside the {sector.code} pack</h2>
          </Reveal>
          {sector.capabilities && sector.capabilities.length > 0 ? (
            <>
              <Reveal className="scenarios">
                {sector.capabilities.map((cap) => (
                  <CapabilityCard cap={cap} accent={sector.accent} key={cap.title} />
                ))}
              </Reveal>
              <div className="sandbox-side sandbox-side-full">
                {sector.integrations && sector.integrations.length > 0 && (
                  <>
                    <h4>Integrations</h4>
                    <div className="sandbox-integrations">
                      {sector.integrations.map((i) => (
                        <span key={i}>{i}</span>
                      ))}
                    </div>
                  </>
                )}
                <h4>More sector packs</h4>
                <div className="sandbox-siblings">
                  {siblings.slice(0, 5).map((s) => (
                    <Link
                      href={`/industries/${s.slug}`}
                      key={s.slug}
                      style={{ "--accent": `var(--${s.accent})` } as CSSProperties}
                      transitionTypes={["nav-forward"]}
                    >
                      {s.title} <span>→</span>
                    </Link>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="sandbox-body">
              <div>
                <ul>
                  {sector.bullets.map((b) => (
                    <li key={b} style={{ "--accent": `var(--${sector.accent})` } as CSSProperties}>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="sandbox-side">
                {sector.integrations && sector.integrations.length > 0 && (
                  <>
                    <h4>Integrations</h4>
                    <div className="sandbox-integrations">
                      {sector.integrations.map((i) => (
                        <span key={i}>{i}</span>
                      ))}
                    </div>
                  </>
                )}
                <h4>More sector packs</h4>
                <div className="sandbox-siblings">
                  {siblings.slice(0, 5).map((s) => (
                    <Link
                      href={`/industries/${s.slug}`}
                      key={s.slug}
                      style={{ "--accent": `var(--${s.accent})` } as CSSProperties}
                      transitionTypes={["nav-forward"]}
                    >
                      {s.title} <span>→</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
