import type { CSSProperties } from "react";
import type { Accent } from "@/lib/sandboxData";

interface PageBannerProps {
  type: "photo";
  src: string;
  alt?: string;
  tag: string;
  caption: string;
  accent?: Accent;
}

export function PageBanner({ src, alt, tag, caption, accent = "amber" }: PageBannerProps) {
  return (
    <div className="container">
      <div className="page-banner" style={{ "--accent": `var(--${accent})` } as CSSProperties}>
        <img src={src} alt={alt ?? ""} loading="lazy" />
        <div className="pb-scrim" aria-hidden="true" />
        <div className="pb-tag">{tag}</div>
        <div className="pb-caption mono">{caption}</div>
      </div>
    </div>
  );
}
