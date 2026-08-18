import type { CSSProperties } from "react";
import Link from "next/link";
import type { SandboxItem } from "@/lib/sandboxData";

interface SandboxDetailProps {
  item: SandboxItem;
  categoryLabel: string;
  backHref: string;
  siblings: { slug: string; title: string }[];
  hrefFor: (slug: string) => string;
}

export function SandboxDetail({ item, categoryLabel, backHref, siblings, hrefFor }: SandboxDetailProps) {
  return (
    <section className="sandbox">
      <div className="container">
        <Link href={backHref} className="sandbox-back" transitionTypes={["nav-back"]}>
          ← Back to KESTREL
        </Link>
        <div className="sandbox-head">
          <div>
            <div className="sandbox-eyebrow" style={{ color: `var(--${item.accent})` }}>
              {categoryLabel}
              {item.tagline ? ` · ${item.tagline}` : ""}
            </div>
            <h2>{item.title}</h2>
            <p className="sandbox-summary">{item.summary}</p>
          </div>
          <div className="camframe" style={{ "--accent": `var(--${item.accent})` } as CSSProperties}>
            <div className="cf-glow" />
            <div className="cf-scan" />
            <div className="cf-corner tl" />
            <div className="cf-corner tr" />
            <div className="cf-corner bl" />
            <div className="cf-corner br" />
            <div className="cf-rec">REC</div>
            <div className="cf-time mono">CAM {item.code} · SITE GRAPH</div>
            <div className="cf-glyph">{item.code.slice(0, 3)}</div>
          </div>
        </div>

        <div className="sandbox-meta">
          {item.meta.map((m) => (
            <div className="m" key={m.k}>
              {m.k}: <b>{m.v}</b>
            </div>
          ))}
        </div>

        <div className="sandbox-body">
          <div>
            <ul>
              {item.bullets.map((b) => (
                <li key={b} style={{ "--accent": `var(--${item.accent})` } as CSSProperties}>
                  {b}
                </li>
              ))}
            </ul>
          </div>
          <div className="sandbox-side">
            {item.integrations && item.integrations.length > 0 && (
              <>
                <h4>Integrations</h4>
                <div className="sandbox-integrations">
                  {item.integrations.map((i) => (
                    <span key={i}>{i}</span>
                  ))}
                </div>
              </>
            )}
            <h4>More in this category</h4>
            <div className="sandbox-siblings">
              {siblings.map((s) => (
                <Link href={hrefFor(s.slug)} key={s.slug} transitionTypes={["nav-forward"]}>
                  {s.title} <span>→</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
