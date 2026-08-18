"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Reveal } from "./reveal";
import { SECTORS } from "@/lib/sandboxData";

const CATS: Record<string, string[]> = {
  "commercial-real-estate": ["security", "business"],
  manufacturing: ["operations", "regulated"],
  education: ["security", "regulated"],
  retail: ["security", "business"],
  warehouse: ["operations"],
  healthcare: ["regulated", "operations"],
  "data-centers": ["security", "regulated"],
  "gated-communities": ["security", "business"],
  "automobile-dealerships": ["security", "business"],
  "shopping-malls": ["security", "business"],
  "commercial-offices": ["security", "business"],
};

const FILTERS = [
  { key: "all", label: "All 11" },
  { key: "security", label: "Security-led" },
  { key: "business", label: "Business-facing" },
  { key: "operations", label: "Operations" },
  { key: "regulated", label: "Regulated" },
];

export function Sectors() {
  const [filter, setFilter] = useState("all");

  const visible = useMemo(() => {
    if (filter === "all") return SECTORS;
    return SECTORS.filter((s) => CATS[s.slug]?.includes(filter));
  }, [filter]);

  return (
    <section className="sec" id="sectors">
      <div className="container">
        <Reveal className="sec-head">
          <div className="eyebrow">Where it fits</div>
          <h2>Any site with cameras and something worth watching</h2>
          <p>From a single retail floor to a multi-building campus — same core system, configured for how the space is actually used.</p>
        </Reveal>

        <Reveal className="sector-filters">
          <div role="group" aria-label="Filter sector packs" style={{ display: "contents" }}>
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                className={`sf-btn${filter === f.key ? " active" : ""}`}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </Reveal>

        <Reveal className="sectors">
          <div style={{ display: "contents" }}>
            {SECTORS.map((s) => (
              <Link
                className={`sector${visible.includes(s) ? "" : " is-hidden"}`}
                href={`/industries/${s.slug}`}
                key={s.slug}
                transitionTypes={["nav-forward"]}
              >
                <h4>{s.title}</h4>
                <p>{s.bullets.slice(0, 3).join(", ")}</p>
              </Link>
            ))}
            <div className="sector-more">
              + 8 more packs
              <br />
              banking · construction · ports · hospitality · utilities · gas &amp; oil
            </div>
          </div>
        </Reveal>
        {visible.length === 0 && (
          <p className="sector-empty">
            No packs shown in this filter&apos;s featured set yet — all 19 are covered in the full sector list.
          </p>
        )}
      </div>
    </section>
  );
}
