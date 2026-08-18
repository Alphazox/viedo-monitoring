import type { CSSProperties } from "react";
import Image from "next/image";
import type { IndustryCapability } from "@/lib/sandboxData";

export function CapabilityCard({ cap, accent }: { cap: IndustryCapability; accent: string }) {
  const hit = cap.hit ?? null;

  return (
    <div className="scenario" style={{ "--accent": `var(--${accent})` } as CSSProperties}>
      <div className="scenario-media">
        <Image src={cap.photo} alt={cap.alt} fill sizes="(max-width: 900px) 100vw, 33vw" style={{ objectFit: "cover" }} />
        <div className="detect-frame" aria-hidden="true">
          <span className="df-corner tl" />
          <span className="df-corner tr" />
          <span className="df-corner bl" />
          <span className="df-corner br" />
          {hit ? (
            <>
              <span className="df-status df-status-scan">Scanning</span>
              <span className="df-status df-status-lock">Target confirmed</span>
              <span
                className="df-box"
                style={{ top: hit.box.top, left: hit.box.left, width: hit.box.width, height: hit.box.height }}
              >
                <span className="df-box-label mono">{hit.label}</span>
              </span>
            </>
          ) : (
            <span className="df-status df-status-idle">Scanning · no activity</span>
          )}
        </div>
        <div className="detect-scan" aria-hidden="true" />
        {cap.credit && <span className="ph-credit">{cap.credit}</span>}
      </div>
      <div className="scenario-body">
        <span className="scenario-tag mono">REFERENCE PHOTO</span>
        <h4>{cap.title}</h4>
        <p>{cap.body}</p>
      </div>
    </div>
  );
}
