import type { CSSProperties } from "react";
import Image from "next/image";

interface SectorPhotoInfo {
  src: string;
  alt: string;
  credit: string;
}

interface DetectBox {
  top: string;
  left: string;
  width: string;
  height: string;
}

interface DetectHit {
  label: string;
  accent: string;
  box: DetectBox;
}

/** Real, sector-relevant photographs — several per sector so a page doesn't
 * repeat one image across every hero/problem/step/gallery/CTA slot. Sourced
 * from Wikimedia Commons under CC BY / CC BY-SA / CC0 / public domain —
 * credited via the small tag rendered on each instance. */
const SECTOR_PHOTOS: Record<string, SectorPhotoInfo[]> = {
  "commercial-real-estate": [
    {
      src: "/media/photos/sector-commercial-real-estate.jpg",
      alt: "Lift lobby interior of a residential apartment building",
      credit: "Ng pakrae SZE, CC BY-SA 4.0, via Wikimedia Commons",
    },
    {
      src: "/media/photos/sector-commercial-real-estate-2.jpg",
      alt: "Exterior of a residential apartment building",
      credit: "Lasse Keskinen, CC BY-SA 4.0, via Wikimedia Commons",
    },
    {
      src: "/media/photos/sector-commercial-real-estate-3.jpg",
      alt: "Interior of an empty parking garage",
      credit: "Tadeusz Hare, CC BY-SA 4.0, via Wikimedia Commons",
    },
  ],
  manufacturing: [
    {
      src: "/media/photos/sector-manufacturing-2.jpg",
      alt: "Warehouse pallet racking aisle with forklift operators and staff in hi-vis vests",
      credit: "Nick Saltmarsh, CC BY 2.0, via Wikimedia Commons",
    },
    {
      src: "/media/photos/sector-manufacturing.jpg",
      alt: "Workers assembling a car body on an automotive assembly line",
      credit: "Taneli Rajala, CC BY-SA 3.0, via Wikimedia Commons",
    },
  ],
  education: [
    {
      src: "/media/photos/sector-education.jpg",
      alt: "A person walking down a school hallway",
      credit: "ChadPerez49, CC BY-SA 4.0, via Wikimedia Commons",
    },
    {
      src: "/media/photos/sector-education-2.jpg",
      alt: "Students walking with backpacks along a fenced school campus",
      credit: "Nipponeselover, CC BY-SA 3.0, via Wikimedia Commons",
    },
  ],
  retail: [
    {
      src: "/media/photos/sector-retail.jpg",
      alt: "A shopper pushing a cart down a store aisle",
      credit: "Shixart1985, CC BY 2.0, via Wikimedia Commons",
    },
    {
      src: "/media/photos/sector-retail-2.jpg",
      alt: "Checkout counter area inside a retail store",
      credit: "Tessa Bury, CC BY 4.0, via Wikimedia Commons",
    },
  ],
  warehouse: [
    {
      src: "/media/photos/sector-warehouse.jpg",
      alt: "Aerial view of a warehouse floor with staff and forklifts",
      credit: "Axisadman, CC BY-SA 3.0, via Wikimedia Commons",
    },
    {
      src: "/media/photos/sector-warehouse-2.jpg",
      alt: "Forklift operator and dock worker loading a shipping container at a warehouse dock",
      credit: "Goterrestrial, CC BY 4.0, via Wikimedia Commons",
    },
  ],
  healthcare: [
    {
      src: "/media/photos/sector-healthcare-2.jpg",
      alt: "Hospital corridor with a person walking",
      credit: "YipshaiukOWL, CC BY-SA 4.0, via Wikimedia Commons",
    },
    {
      src: "/media/photos/sector-healthcare.jpg",
      alt: "An empty interior corridor of a hospital",
      credit: "Gnangarra, CC BY 2.5 AU, via Wikimedia Commons",
    },
  ],
  "data-centers": [
    {
      src: "/media/photos/sector-data-centers.jpg",
      alt: "Technician crouched with a laptop working on a server rack in a data center",
      credit: "Derrick Coetzee, public domain, via Wikimedia Commons",
    },
    {
      src: "/media/photos/sector-data-centers-2.jpg",
      alt: "Network cabling in a data center rack",
      credit: "CC BY-SA 3.0, via Wikimedia Commons",
    },
  ],
  "gated-communities": [
    {
      src: "/media/photos/sector-gated-communities-2.jpg",
      alt: "Gated entrance of a residential community with cars parked inside",
      credit: "Mr Ignavy, CC BY-SA 2.0, via Wikimedia Commons",
    },
    {
      src: "/media/photos/sector-gated-communities.jpg",
      alt: "Street between residential buildings in a gated community",
      credit: "Wikitarisch, CC BY-SA 4.0, via Wikimedia Commons",
    },
  ],
  "automobile-dealerships": [
    {
      src: "/media/photos/sector-automobile-dealerships.jpg",
      alt: "Car dealership lot with a vehicle and customers",
      credit: "M J Roscoe, CC BY-SA 2.0, via Wikimedia Commons",
    },
    {
      src: "/media/photos/sector-automobile-dealerships-2.jpg",
      alt: "Vehicles parked outside a car dealership showroom",
      credit: "G. Edward Johnson, CC BY 4.0, via Wikimedia Commons",
    },
  ],
  "shopping-malls": [
    {
      src: "/media/photos/sector-shopping-malls.jpg",
      alt: "Crowd of shoppers in a mall atrium",
      credit: "Chew, CC BY 4.0, via Wikimedia Commons",
    },
    {
      src: "/media/photos/sector-shopping-malls-2.jpg",
      alt: "Crowded food court inside a shopping mall",
      credit: "Rowanswiki, CC0, via Wikimedia Commons",
    },
  ],
  "commercial-offices": [
    {
      src: "/media/photos/sector-commercial-offices.jpg",
      alt: "A person working at a desk in an open-plan office",
      credit: "Finn Bjørklid, CC BY 4.0, via Wikimedia Commons",
    },
    {
      src: "/media/photos/sector-commercial-offices-2.jpg",
      alt: "A person working at a desk in a coworking office space",
      credit: "Pixel.la Free Stock Photos, CC0, via Wikimedia Commons",
    },
  ],
};

/**
 * Detection HUD per photo — index-aligned with SECTOR_PHOTOS[slug], verified
 * by hand against what's actually in each frame. `null` means the photo has
 * no person/vehicle/object worth locking onto (an empty corridor, an empty
 * garage, a rack of idle cabling): the overlay keeps scanning and never
 * fakes a "confirmed" catch over nothing. Never guess a box without looking
 * at the photo first — that's exactly how this went wrong the first time.
 */
const SECTOR_DETECT: Record<string, (DetectHit | null)[]> = {
  "commercial-real-estate": [
    { label: "PERSON · 0.93", accent: "crimson", box: { top: "28%", left: "3%", width: "13%", height: "42%" } },
    null,
    null,
  ],
  manufacturing: [
    { label: "FORKLIFT · 0.87", accent: "amber", box: { top: "55%", left: "78%", width: "9%", height: "15%" } },
    { label: "PERSON · 0.90", accent: "amber", box: { top: "50%", left: "63%", width: "12%", height: "30%" } },
  ],
  education: [
    { label: "PERSON · 0.88", accent: "teal", box: { top: "44%", left: "37%", width: "5%", height: "13%" } },
    { label: "PERSON · 0.92", accent: "teal", box: { top: "52%", left: "50%", width: "8%", height: "28%" } },
  ],
  retail: [
    { label: "PERSON · 0.91", accent: "violet", box: { top: "22%", left: "45%", width: "18%", height: "73%" } },
    null,
  ],
  warehouse: [
    { label: "PERSON · 0.85", accent: "blue", box: { top: "63%", left: "17%", width: "4%", height: "13%" } },
    { label: "FORKLIFT · 0.91", accent: "blue", box: { top: "57%", left: "63%", width: "14%", height: "16%" } },
  ],
  healthcare: [
    { label: "PERSON · 0.94", accent: "pink", box: { top: "52%", left: "40%", width: "4%", height: "20%" } },
    null,
  ],
  "data-centers": [
    { label: "PERSON · 0.93", accent: "crimson", box: { top: "8%", left: "22%", width: "38%", height: "78%" } },
    null,
  ],
  "gated-communities": [
    { label: "VEHICLE · 0.88", accent: "amber", box: { top: "52%", left: "31%", width: "12%", height: "9%" } },
    null,
  ],
  "automobile-dealerships": [
    { label: "VEHICLE · 0.90", accent: "blue", box: { top: "47%", left: "48%", width: "33%", height: "35%" } },
    { label: "VEHICLE · 0.84", accent: "blue", box: { top: "64%", left: "23%", width: "10%", height: "14%" } },
  ],
  "shopping-malls": [
    { label: "CROWD · 0.85", accent: "pink", box: { top: "64%", left: "42%", width: "28%", height: "20%" } },
    { label: "CROWD · 0.82", accent: "pink", box: { top: "60%", left: "62%", width: "26%", height: "34%" } },
  ],
  "commercial-offices": [
    { label: "PERSON · 0.94", accent: "teal", box: { top: "39%", left: "8%", width: "15%", height: "58%" } },
    { label: "PERSON · 0.96", accent: "teal", box: { top: "2%", left: "45%", width: "38%", height: "90%" } },
  ],
};

const FALLBACK: SectorPhotoInfo = {
  src: "/media/photos/control-room-person-30576172.jpg",
  alt: "A person reviewing monitors in a dimly lit control room",
  credit: "",
};

function resolveIndex(len: number, index: number) {
  if (len === 0) return 0;
  return ((index % len) + len) % len;
}

export function sectorPhoto(slug: string, index = 0): SectorPhotoInfo {
  const list = SECTOR_PHOTOS[slug];
  if (!list || list.length === 0) return FALLBACK;
  return list[resolveIndex(list.length, index)];
}

export function SectorPhoto({
  slug,
  index = 0,
  className,
  priority,
  detect = true,
}: {
  slug: string;
  index?: number;
  className?: string;
  priority?: boolean;
  /** Overlay the same scan HUD used on the homepage's detection-scenario
   * clips. Set false to suppress it entirely for a plain reference photo. */
  detect?: boolean;
}) {
  const photos = SECTOR_PHOTOS[slug];
  const photoIndex = resolveIndex(photos?.length ?? 0, index);
  const photo = photos ? photos[photoIndex] : FALLBACK;
  const hit = detect ? (SECTOR_DETECT[slug]?.[photoIndex] ?? null) : null;
  const accent = hit?.accent ?? "amber";

  return (
    <div
      className={`ph${className ? ` ${className}` : ""}`}
      style={detect ? ({ "--accent": `var(--${accent})`, "--detect-delay": `${(index % 5) * 0.35}s` } as CSSProperties) : undefined}
    >
      <Image
        src={photo.src}
        alt={photo.alt}
        fill
        sizes="(max-width: 900px) 100vw, 50vw"
        style={{ objectFit: "cover" }}
        priority={priority}
      />
      {detect && (
        <>
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
        </>
      )}
      {photo.credit && <span className="ph-credit">{photo.credit}</span>}
    </div>
  );
}
