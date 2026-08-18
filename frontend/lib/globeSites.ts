import { SECTORS } from "./sandboxData";

export type SiteStatus = "online" | "degraded" | "critical";

export interface GlobeSite {
  id: string;
  lat: number;
  lng: number;
  country: string;
  city: string;
  siteName: string;
  cameraId: string;
  sectorSlug: string;
  status: SiteStatus;
  detection: string;
}

// Mirrors the category taxonomy already used to filter the Sectors grid
// (components/marketing/sectors.tsx) — kept in sync by hand rather than
// imported, since that file doesn't export it.
export const SECTOR_CATEGORIES: Record<string, string[]> = {
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

export const GLOBE_SITES: GlobeSite[] = [
  {
    id: "hyd-off",
    lat: 17.385,
    lng: 78.4867,
    country: "India",
    city: "Hyderabad",
    siteName: "Financial District Campus",
    cameraId: "HYD-OFF-C12",
    sectorSlug: "commercial-offices",
    status: "online",
    detection: "After-hours movement flagged · Floor 5",
  },
  {
    id: "aus-wh",
    lat: 30.2672,
    lng: -97.7431,
    country: "USA",
    city: "Austin",
    siteName: "Southpoint Distribution Center",
    cameraId: "AUS-WH-C08",
    sectorSlug: "warehouse",
    status: "online",
    detection: "Dock schedule reconciled · Dock 6",
  },
  {
    id: "dxb-mall",
    lat: 25.2048,
    lng: 55.2708,
    country: "UAE",
    city: "Dubai",
    siteName: "Marina Promenade Mall",
    cameraId: "DXB-MALL-C21",
    sectorSlug: "shopping-malls",
    status: "degraded",
    detection: "Crowd density approaching threshold · Food court",
  },
  {
    id: "lon-hc",
    lat: 51.5074,
    lng: -0.1278,
    country: "UK",
    city: "London",
    siteName: "Riverside Care Campus",
    cameraId: "LON-HC-C143",
    sectorSlug: "healthcare",
    status: "critical",
    detection: "Fall detected · Corridor B",
  },
  {
    id: "sao-auto",
    lat: -23.5505,
    lng: -46.6333,
    country: "Brazil",
    city: "São Paulo",
    siteName: "Av. Paulista Dealership",
    cameraId: "SAO-AUTO-C05",
    sectorSlug: "automobile-dealerships",
    status: "online",
    detection: "Overnight lot intrusion posture · Row C",
  },
  {
    id: "sin-dc",
    lat: 1.3521,
    lng: 103.8198,
    country: "Singapore",
    city: "Singapore",
    siteName: "Jurong Data Campus",
    cameraId: "SIN-DC-C02",
    sectorSlug: "data-centers",
    status: "online",
    detection: "Rack-level access verified · Suite 3",
  },
  {
    id: "tor-gc",
    lat: 43.6532,
    lng: -79.3832,
    country: "Canada",
    city: "Toronto",
    siteName: "Lakeshore Community",
    cameraId: "TOR-GC-C09",
    sectorSlug: "gated-communities",
    status: "online",
    detection: "Tailgating check clear · Main gate",
  },
  {
    id: "syd-rtl",
    lat: -33.8688,
    lng: 151.2093,
    country: "Australia",
    city: "Sydney",
    siteName: "Harbour Street Store",
    cameraId: "SYD-RTL-C17",
    sectorSlug: "retail",
    status: "degraded",
    detection: "Queue length triggered staffing alert · Lane 3",
  },
  {
    id: "nbo-mfg",
    lat: -1.2921,
    lng: 36.8219,
    country: "Kenya",
    city: "Nairobi",
    siteName: "Industrial Area Plant",
    cameraId: "NBO-MFG-C31",
    sectorSlug: "manufacturing",
    status: "online",
    detection: "PPE compliance check passed · Zone B",
  },
  {
    id: "tyo-cre",
    lat: 35.6762,
    lng: 139.6503,
    country: "Japan",
    city: "Tokyo",
    siteName: "Shibuya Tower Residences",
    cameraId: "TYO-CRE-C04",
    sectorSlug: "commercial-real-estate",
    status: "online",
    detection: "Lobby tailgating check clear · Main entrance",
  },
];

export function siteSector(site: GlobeSite) {
  return SECTORS.find((s) => s.slug === site.sectorSlug);
}
