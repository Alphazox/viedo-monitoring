export type Accent = "amber" | "crimson" | "teal" | "violet" | "blue" | "pink";

export interface MetaPair {
  k: string;
  v: string;
}

export interface SandboxItem {
  slug: string;
  title: string;
  code: string;
  accent: Accent;
  tagline?: string;
  summary: string;
  bullets: string[];
  meta: MetaPair[];
  integrations?: string[];
}

export interface IndustryProblem {
  tag: string;
  title: string;
  body: string;
}

export interface IndustryStep {
  title: string;
  body: string;
}

export interface CapabilityHit {
  label: string;
  box: { top: string; left: string; width: string; height: string };
}

export interface IndustryCapability {
  title: string;
  body: string;
  photo: string;
  credit: string;
  alt: string;
  hit?: CapabilityHit;
}

export interface SectorItem extends SandboxItem {
  heroLede: string;
  calloutStatus: string;
  calloutTitle: string;
  calloutSub: string;
  problems: IndustryProblem[];
  steps: IndustryStep[];
  capabilities?: IndustryCapability[];
}

export const SECTORS: SectorItem[] = [
  {
    slug: "commercial-real-estate",
    title: "Commercial real estate & multifamily",
    code: "CRE",
    accent: "crimson",
    heroLede:
      "Built for property teams who manage risk across every building, without adding headcount.",
    calloutStatus: "AI DETECTED",
    calloutTitle: "Tailgating detected",
    calloutSub: "Building A · Main entrance",
    summary:
      "Lobby tailgating, package theft, garage break-ins and amenity misuse — covered without turning a residential building into a surveillance state.",
    bullets: [
      "Lobby and mailroom tailgating detection with resident-badge correlation",
      "Package theft alerts tied to delivery-window schedules",
      "Parking-garage vehicle break-in detection and plate-based visitor logging",
      "Homeless encampment early warning with a dignity-first response protocol",
      "Elevator entrapment detection and leak/flood sensing",
    ],
    integrations: ["Brivo", "Openpath", "Yardi", "RealPage"],
    meta: [
      { k: "Pack ID", v: "CRE" },
      { k: "Capabilities", v: "5 shipped" },
    ],
    problems: [
      {
        tag: "Membership fraud",
        title: "Tailgating goes uncaught",
        body: "Someone follows a resident through the lobby door and nobody notices until a package goes missing or a unit is broken into.",
      },
      {
        tag: "Blind spot",
        title: "Package theft has no witness",
        body: "Porch and mailroom theft happens in the ten seconds nobody's watching the monitor, and traditional CCTV only proves it happened after the fact.",
      },
      {
        tag: "After hours",
        title: "Garage break-ins go unreported for days",
        body: "Vehicle break-ins in the parking structure are usually discovered by the resident, not the system, long after the individual is gone.",
      },
      {
        tag: "Liability",
        title: "Elevator entrapment waits on a phone call",
        body: "A resident stuck in an elevator has to trigger the alarm themselves. If they can't, minutes turn into an incident.",
      },
    ],
    steps: [
      {
        title: "Every camera becomes a monitored sensor",
        body: "AegisVision AI watches every lobby, garage and amenity camera around the clock. The moment tailgating, an unrecognized vehicle or an unattended package is detected, a verified alert fires in seconds.",
      },
      {
        title: "A human confirms before anything escalates",
        body: "Ambiguous detections are held for verification, not auto-dispatched. Your team decides whether to notify staff, contact the resident or escalate to security dispatch.",
      },
      {
        title: "Every incident is documented automatically",
        body: "Each event is time-stamped, clipped and delivered to your dashboard, so a dispute with a resident or an insurer starts with evidence, not a memory.",
      },
    ],
  },
  {
    slug: "manufacturing",
    title: "Manufacturing",
    code: "MFG",
    accent: "amber",
    heroLede:
      "Built for plant managers who need the floor watched on every shift, not just when someone's walking it.",
    calloutStatus: "AI DETECTED",
    calloutTitle: "PPE non-compliance",
    calloutSub: "Line 3 · Zone B",
    summary:
      "PPE compliance, machine-guard bypass and forklift-pedestrian near-misses, correlated straight back to the line that caused them.",
    bullets: [
      "PPE compliance (hard hat, vest, eye protection) by zone and shift",
      "Machine-guard bypass and lockout/tagout verification",
      "Forklift-pedestrian proximity alerts and near-miss counting",
      "Line-stoppage attribution and hazardous-zone entry logging",
      "Spill detection with automatic work-order creation",
    ],
    integrations: ["Ignition SCADA", "SAP PM"],
    meta: [
      { k: "Pack ID", v: "MFG" },
      { k: "Capabilities", v: "5 shipped" },
    ],
    problems: [
      {
        tag: "Near-miss",
        title: "Forklift-pedestrian close calls go uncounted",
        body: "Without continuous monitoring, near-misses on the floor are only noticed after someone gets hurt.",
      },
      {
        tag: "Compliance",
        title: "PPE gaps are caught by spot-checks, if at all",
        body: "A supervisor walking the floor twice a shift catches a fraction of missing hard hats and vests.",
      },
      {
        tag: "Downtime",
        title: "Line stoppages are attributed after the fact",
        body: "By the time someone reviews why the line stopped, the cause is guesswork pieced together from memory.",
      },
      {
        tag: "Access",
        title: "Machine-guard bypass is invisible until it fails",
        body: "A guard wired open to speed up changeover looks fine until the day it doesn't.",
      },
    ],
    steps: [
      {
        title: "Continuous floor monitoring, not spot-checks",
        body: "Every camera watches for PPE compliance, guard bypass and forklift-pedestrian proximity in real time, on every shift, not just when a supervisor is walking by.",
      },
      {
        title: "Verified alerts reach the right person",
        body: "A near-miss or bypass event is confirmed and routed to floor supervision immediately, with the clip attached, not buried in an end-of-shift report.",
      },
      {
        title: "Every stoppage gets a documented cause",
        body: "Line-stoppage attribution and hazardous-zone entry are logged automatically, so root-cause review starts with footage instead of guesswork.",
      },
    ],
  },
  {
    slug: "education",
    title: "Education, K-12 & higher ed",
    code: "EDU",
    accent: "teal",
    heroLede:
      "Built for campus safety teams who need a threat caught in seconds, without turning students into a database.",
    calloutStatus: "AI DETECTED",
    calloutTitle: "Door held open",
    calloutSub: "East wing · Door 14",
    summary:
      "Weapon detection and lockdown workflow with hard privacy rails: no facial recognition on students, no biometrics, ever.",
    bullets: [
      "Weapon detection and unauthorized-adult-on-campus alerts",
      "Fight detection and door-propped monitoring",
      "One-tap lockdown initiation with automatic first-responder camera sharing",
      "Bus-loop safety and vape detection via sensor fusion",
      "Bathrooms and locker areas physically excluded from the site graph",
    ],
    integrations: ["FERPA-aligned retention"],
    meta: [
      { k: "Pack ID", v: "EDU" },
      { k: "Biometrics", v: "Disabled by policy" },
    ],
    problems: [
      {
        tag: "Response time",
        title: "A weapon on campus needs seconds, not minutes",
        body: "Manual monitoring can't watch every entrance and hallway at once when every second counts.",
      },
      {
        tag: "Access control",
        title: "Unauthorized adults get in through propped doors",
        body: "A door held open for convenience is the same door an unauthorized visitor walks through unnoticed.",
      },
      {
        tag: "Privacy",
        title: "Most security vendors default to facial recognition",
        body: "Schools need protection that doesn't turn students into a biometric database — most platforms don't offer that choice.",
      },
      {
        tag: "Fragmented",
        title: "Fights and lockdowns rely on someone dialing in",
        body: "Without automatic detection, a hallway fight is only escalated once a staff member physically sees it.",
      },
    ],
    steps: [
      {
        title: "Detection built for a campus, not a warehouse",
        body: "Weapon detection, door-propped alerts and fight detection run continuously, tuned for school hours, passing periods and after-hours use.",
      },
      {
        title: "Lockdown in one tap, first responders included",
        body: "A confirmed threat can trigger a one-tap lockdown with automatic camera sharing to first responders, cutting the time between detection and response.",
      },
      {
        title: "Hard privacy rails, enforced structurally",
        body: "No facial recognition on students, no biometrics, and bathrooms or locker areas are physically excluded from the system — not a policy promise, a technical one.",
      },
    ],
  },
  {
    slug: "retail",
    title: "Multi-location retail",
    code: "RTL",
    accent: "violet",
    heroLede:
      "Built for loss prevention teams managing shrink across every store, not just the one with a manager on the floor.",
    calloutStatus: "AI DETECTED",
    calloutTitle: "Cart push-out flagged",
    calloutSub: "Store 12 · Exit 2",
    summary:
      "Organized retail crime crew recognition and self-checkout shrink, behavioral rather than biometric.",
    bullets: [
      "ORC crew recognition across stores, behavioral not biometric",
      "Cart push-out and self-checkout shrink detection",
      "Queue-length staffing triggers and planogram compliance",
      "Robbery panic workflow with automatic escalation",
      "Sweethearting and till-manipulation detection",
    ],
    integrations: ["NCR/Toshiba POS", "Zebra"],
    meta: [
      { k: "Pack ID", v: "RTL" },
      { k: "Capabilities", v: "5 shipped" },
    ],
    problems: [
      {
        tag: "Shrink",
        title: "Cart push-outs are a rounding error until they aren't",
        body: "Individually small, cart push-out and self-checkout shrink add up to a real percentage of revenue nobody's tracking in real time.",
      },
      {
        tag: "Organized crime",
        title: "ORC crews rotate stores faster than staff can recognize them",
        body: "The same crew hits three locations before anyone connects the pattern.",
      },
      {
        tag: "Staffing",
        title: "Queues build before anyone's told to open a lane",
        body: "By the time a manager notices the line, the customers who left already have.",
      },
      {
        tag: "Response",
        title: "A robbery in progress needs a workflow, not a phone tree",
        body: "Panic situations lose critical seconds when the escalation path isn't pre-defined.",
      },
    ],
    steps: [
      {
        title: "Behavioral recognition across every store",
        body: "ORC crew recognition works behaviorally, not biometrically, spotting the pattern across locations instead of one register at a time.",
      },
      {
        title: "Verified alerts before shrink becomes a write-off",
        body: "Cart push-out, till manipulation and sweethearting are flagged and confirmed in the moment, not discovered during a monthly inventory count.",
      },
      {
        title: "Queue and panic workflows that already know what to do",
        body: "Queue-length triggers staffing recommendations automatically; a robbery panic workflow follows a pre-built escalation path the moment it's confirmed.",
      },
    ],
  },
  {
    slug: "warehouse",
    title: "Warehouse & distribution",
    code: "WHS",
    accent: "blue",
    heroLede:
      "Built for operations teams who need the yard and the dock reconciled in real time, not at month-end.",
    calloutStatus: "AI DETECTED",
    calloutTitle: "Trailer detention started",
    calloutSub: "Dock 6 · 41 min",
    summary:
      "Dock scheduling reality checks and trailer-detention billing evidence — turning yard chaos into a defensible invoice line.",
    bullets: [
      "Dock scheduling reality check against booked appointment windows",
      "Trailer detention billing evidence, timestamped and exportable",
      "Pick-path congestion and staging-overflow detection",
      "Theft at the trash compactor — the classic loss point",
      "Yard truck tracking via ALPR",
    ],
    integrations: ["Manhattan", "Blue Yonder", "Körber WMS"],
    meta: [
      { k: "Pack ID", v: "WHS" },
      { k: "Capabilities", v: "5 shipped" },
    ],
    problems: [
      {
        tag: "Billing",
        title: "Trailer detention is a dispute, not a data point",
        body: "Without timestamped evidence, detention billing turns into a negotiation instead of an invoice.",
      },
      {
        tag: "Scheduling",
        title: "Dock appointments and reality drift apart",
        body: "The schedule says one thing; the yard says another, and nobody's reconciling them in real time.",
      },
      {
        tag: "Shrink",
        title: "The trash compactor is where inventory goes missing",
        body: "It's the classic warehouse loss point, and it's rarely covered by a camera anyone's actually watching.",
      },
      {
        tag: "Flow",
        title: "Staging overflow is discovered by walking into it",
        body: "Congestion in the pick path is usually reported after it's already slowed the shift down.",
      },
    ],
    steps: [
      {
        title: "The yard becomes measurable",
        body: "Every trailer arrival, dock assignment and departure is timestamped automatically, reconciled against the booked appointment window.",
      },
      {
        title: "Detention evidence that holds up in a billing dispute",
        body: "Detention hours are backed by exportable, timestamped clips — not an estimate from someone's memory of the shift.",
      },
      {
        title: "Congestion and shrink flagged as they happen",
        body: "Staging overflow, pick-path congestion and compactor activity are monitored continuously, with alerts reaching supervision before they cost a shift.",
      },
    ],
  },
  {
    slug: "healthcare",
    title: "Healthcare & senior living",
    code: "HC",
    accent: "pink",
    heroLede:
      "Built for care teams stretched thin, where a fall or a wandering patient can't wait for someone to walk by.",
    calloutStatus: "AI DETECTED",
    calloutTitle: "Fall detected",
    calloutSub: "Corridor B · Room 214",
    summary:
      "Patient elopement, fall detection and workplace-violence response — the fastest-growing security spend line in the sector.",
    bullets: [
      "Patient elopement and bed-exit prediction",
      "Fall detection in rooms and corridors",
      "Workplace-violence-against-staff detection and response workflow",
      "Infant abduction and medication-room access control",
      "Privacy-preserving skeleton-only mode for patient rooms",
    ],
    integrations: ["HIPAA BAA", "Epic (HL7)"],
    meta: [
      { k: "Pack ID", v: "HC" },
      { k: "Mode", v: "Skeleton-only available" },
    ],
    capabilities: [
      {
        title: "Fall detection",
        body: "Detect falls in corridors, rooms, and common areas, then send a timestamped alert for faster response.",
        photo: "/media/photos/sector-healthcare.jpg",
        alt: "Empty hospital corridor with handrails, monitored for falls",
        credit: "Gnangarra, CC BY 2.5 AU, via Wikimedia Commons",
      },
      {
        title: "Elopement & exit alerts",
        body: "Flag at-risk patients moving toward exits or restricted areas, and predict a bed-exit before it becomes a search.",
        photo: "/media/photos/sector-healthcare-2.jpg",
        alt: "Patient walking alone down a hospital corridor toward exit doors",
        credit: "YipshaiukOWL, CC BY-SA 4.0, via Wikimedia Commons",
        hit: { label: "PERSON · 0.93", box: { top: "60%", left: "39%", width: "6%", height: "18%" } },
      },
      {
        title: "Staff safety alerts",
        body: "Detect aggressive behavior, distress, or high-risk incidents near wards, entrances, and emergency areas.",
        photo: "/media/photos/sector-healthcare-cap-staff-safety.jpg",
        alt: "Hospital emergency department entrance with an ambulance and staff",
        credit: "Rwendland, CC BY-SA 3.0, via Wikimedia Commons",
        hit: { label: "PERSON · 0.89", box: { top: "58%", left: "53%", width: "5%", height: "13%" } },
      },
      {
        title: "Restricted-room access",
        body: "Log access to medication carts, records areas, NICU zones, and other sensitive spaces.",
        photo: "/media/photos/sector-healthcare-cap-restricted-access.jpg",
        alt: "Locked hospital medication cart in a corridor",
        credit: "BrokenSphere, CC BY-SA 3.0, via Wikimedia Commons",
      },
      {
        title: "Privacy-preserving monitoring",
        body: "Patient rooms can run in a skeleton-only mode — enough to detect a fall, not enough to record a person.",
        photo: "/media/photos/sector-healthcare-cap-privacy.jpg",
        alt: "Empty modern hospital patient room",
        credit: "Arousta, CC BY-SA 4.0, via Wikimedia Commons",
      },
    ],
    problems: [
      {
        tag: "Safety",
        title: "A fall in a corridor can go unnoticed for minutes",
        body: "In a facility with limited staff, a fall is only caught when someone happens to walk by.",
      },
      {
        tag: "Elopement",
        title: "A wandering patient has a head start",
        body: "By the time staff notice someone's missing, they could already be off the unit.",
      },
      {
        tag: "Workplace violence",
        title: "Incidents against staff are the fastest-growing risk in the sector",
        body: "Without continuous monitoring, de-escalation starts late and documentation starts even later.",
      },
      {
        tag: "Privacy",
        title: "Patient rooms need protection without surveillance",
        body: "Most camera systems weren't built with a mode that respects a patient room as a patient room.",
      },
    ],
    steps: [
      {
        title: "Fall and bed-exit detection, tuned for care settings",
        body: "Corridors and rooms are monitored for falls and bed-exit prediction, with alerts reaching the nearest staff member directly.",
      },
      {
        title: "Elopement alerts before the head start becomes a search",
        body: "Unit exits and elevators are watched continuously, so a wandering patient triggers an alert at the door, not twenty minutes later.",
      },
      {
        title: "Skeleton-only mode where privacy matters most",
        body: "Patient rooms can run in a privacy-preserving skeleton-only mode — enough to detect a fall, not enough to record a person.",
      },
    ],
  },
  {
    slug: "data-centers",
    title: "Data centers & critical infrastructure",
    code: "DC",
    accent: "crimson",
    heroLede:
      "Built for facilities teams who need every rack access verified, not just badged.",
    calloutStatus: "AI DETECTED",
    calloutTitle: "Unverified rack access",
    calloutSub: "Suite 3 · Rack 22",
    summary:
      "Mantrap tailgating and rack-level access verification, with NERC CIP evidence packs ready to hand to an auditor.",
    bullets: [
      "Mantrap tailgating and rack-level access verification",
      "Thermal anomaly detection on equipment",
      "Cable-theft perimeter monitoring",
      "Contractor escort compliance tracking",
      "NERC CIP evidence packs generated automatically",
    ],
    integrations: ["NERC CIP export"],
    meta: [
      { k: "Pack ID", v: "DC" },
      { k: "Capabilities", v: "5 shipped" },
    ],
    problems: [
      {
        tag: "Access",
        title: "Tailgating through a mantrap defeats the mantrap",
        body: "A badge system is only as strong as whether someone actually stops the second person behind them.",
      },
      {
        tag: "Audit",
        title: "Rack-level access is hard to prove after the fact",
        body: "Knowing who badged into the room isn't the same as knowing who touched which rack.",
      },
      {
        tag: "Escort compliance",
        title: "Contractor escort rules are easy to relax under pressure",
        body: "The exception becomes the norm exactly when nobody's checking.",
      },
      {
        tag: "Compliance",
        title: "NERC CIP evidence gets assembled manually, under deadline",
        body: "Audit season turns into a scramble to reconstruct access history from disconnected logs.",
      },
    ],
    steps: [
      {
        title: "Mantrap and rack-level verification, continuously",
        body: "Tailgating at the mantrap and unverified rack access are detected and confirmed as they happen, not reconstructed afterward.",
      },
      {
        title: "Contractor escort compliance, enforced not assumed",
        body: "Escort requirements are monitored automatically, flagging the moment a contractor is unaccompanied in a restricted zone.",
      },
      {
        title: "Audit packages ready before the audit starts",
        body: "NERC CIP evidence packs are generated continuously, so compliance season starts with a report instead of a reconstruction project.",
      },
    ],
  },
  {
    slug: "gated-communities",
    title: "Gated & master-planned communities",
    code: "GC",
    accent: "amber",
    heroLede:
      "Built for community managers automating the gate without losing the residents' trust.",
    calloutStatus: "AI DETECTED",
    calloutTitle: "Tailgating at boom barrier",
    calloutSub: "Main gate · Lane 1",
    summary:
      "Visitor and contractor gate automation via ALPR with resident whitelists — unstaffed, and largely unserved by the incumbents.",
    bullets: [
      "ALPR gate automation with resident whitelists",
      "Tailgating detection at boom barriers",
      "Perimeter wall breach and amenity access enforcement",
      "Speeding detection on internal roads",
      "Resident mobile app for guest passes",
    ],
    integrations: ["Community management platforms", "Intercom", "Barrier controllers"],
    meta: [
      { k: "Pack ID", v: "GC" },
      { k: "Capabilities", v: "5 shipped" },
    ],
    problems: [
      {
        tag: "Access",
        title: "Visitor gate codes get shared and never expire",
        body: "A code given out once tends to outlive the visit it was meant for.",
      },
      {
        tag: "Tailgating",
        title: "Boom barriers stop one car, not two",
        body: "The vehicle behind the authorized one rarely gets stopped.",
      },
      {
        tag: "Perimeter",
        title: "A wall breach is discovered by a resident, not the system",
        body: "Perimeter monitoring without detection is just a wall with a camera pointed at it.",
      },
      {
        tag: "Safety",
        title: "Speeding on internal roads has no real enforcement",
        body: "Without measurement, a speed limit on a private road is just a suggestion.",
      },
    ],
    steps: [
      {
        title: "Gate automation that expires on its own",
        body: "ALPR-based resident whitelists and guest passes replace shared codes, with automatic expiry built in.",
      },
      {
        title: "Tailgating and breach detection at every entry point",
        body: "Boom barriers and perimeter walls are monitored continuously, catching the second vehicle and the climbed fence alike.",
      },
      {
        title: "A resident app that closes the loop",
        body: "Guest passes, visitor logs and speeding alerts reach the resident and the gatehouse directly, not just an incident report nobody reads.",
      },
    ],
  },
  {
    slug: "automobile-dealerships",
    title: "Automobile dealerships",
    code: "AUTO",
    accent: "blue",
    heroLede:
      "Built for dealer principals who need the lot watched at 2am and the showroom measured at 2pm — off the same cameras.",
    calloutStatus: "AI DETECTED",
    calloutTitle: "Catalytic converter theft posture",
    calloutSub: "Back lot · Row C",
    summary:
      "Overnight lot intrusion and catalytic-converter theft on one side, showroom-to-sale conversion on the other — the same camera earns its keep twice.",
    bullets: [
      "Night lot intrusion and catalytic-converter-theft posture detection, alerted before the cut finishes",
      "Test-drive departure and return logging, tied to the assigned salesperson and vehicle",
      "Showroom funnel: walk-in → vehicle interaction → sales interaction → test drive → sale, with conversion by rep",
      "Lot inventory reconciliation via ALPR, catching what's missing before the morning count",
      "Service-bay cycle time and customer wait-time tracking",
    ],
    integrations: ["Dealertrack DMS", "CDK Global", "vAuto", "Salesforce"],
    meta: [
      { k: "Pack ID", v: "AUTO" },
      { k: "Capabilities", v: "5 shipped" },
    ],
    problems: [
      {
        tag: "Theft",
        title: "Catalytic converters disappear in under two minutes",
        body: "A lot with fifty vehicles and one night guard can't watch every row at once, and the cut is over before anyone's dispatched.",
      },
      {
        tag: "Inventory",
        title: "Missing units are found at the morning walk",
        body: "A vehicle gone overnight is usually discovered during the physical count, hours after it left the lot.",
      },
      {
        tag: "Attribution",
        title: "Test drives leave the lot with no departure record",
        body: "Without a logged departure and return, a disputed mileage or a late return has no evidence behind it.",
      },
      {
        tag: "Blind spot",
        title: "Showroom traffic is tracked by memory, not measurement",
        body: "Sales managers estimate walk-ins and conversion from a sign-in sheet nobody fills out consistently.",
      },
    ],
    steps: [
      {
        title: "The lot is watched continuously, not walked periodically",
        body: "Perimeter, row-by-row lot cameras and ALPR run around the clock, flagging intrusion and theft posture the moment they start, not after the vehicle is already gone.",
      },
      {
        title: "Every test drive gets a timestamped departure and return",
        body: "Vehicle and driver are logged automatically at the gate, so a late return or a mileage dispute starts with a record instead of a memory.",
      },
      {
        title: "The showroom funnel becomes a real number",
        body: "Walk-ins, vehicle interactions and test drives are counted automatically and joined to the DMS, so conversion by rep is measured, not estimated.",
      },
    ],
  },
  {
    slug: "shopping-malls",
    title: "Shopping malls & mixed-use",
    code: "MALL",
    accent: "pink",
    heroLede:
      "Built for mall operators who need one camera network to run security, lease negotiations and crowd safety at once.",
    calloutStatus: "AI DETECTED",
    calloutTitle: "Crowd density approaching threshold",
    calloutSub: "Food court · Level 2",
    summary:
      "Footfall, per-tenant traffic and crowd-surge detection off the same cameras — the flagship case for running all three intelligence planes on one feed.",
    bullets: [
      "Crowd density and surge prediction at food courts, escalators and event spaces",
      "Per-tenant footfall and dwell reporting the landlord can sell back to tenants or use in lease renewals",
      "Parking-garage occupancy and guidance, with a live count at every entrance",
      "Child-separation alerts and escalator/travelator incident detection",
      "After-hours perimeter and back-of-house security, with cleaning-cadence verification",
    ],
    integrations: ["Mall management platforms", "Parking guidance systems", "Digital signage", "Tenant portals"],
    meta: [
      { k: "Pack ID", v: "MALL" },
      { k: "Planes", v: "Security + Business + Ops" },
    ],
    problems: [
      {
        tag: "Crowd safety",
        title: "A surge at the food court is noticed after it's already dangerous",
        body: "Without continuous density monitoring, a holiday-weekend crowd crush is caught by a guard's radio call, not a system.",
      },
      {
        tag: "Leasing",
        title: "Tenant footfall numbers come from the tenant, not the mall",
        body: "Landlords negotiating rent or renewal terms are working from traffic estimates tenants have every incentive to understate.",
      },
      {
        tag: "Family safety",
        title: "A separated child costs precious minutes to even notice",
        body: "Most malls rely on a parent reaching a desk before anyone starts looking, instead of the cameras already covering the concourse.",
      },
      {
        tag: "Parking",
        title: "Garage occupancy is a guess until someone circles for ten minutes",
        body: "Without live counts at each entrance, guidance signage shows yesterday's numbers or nothing at all.",
      },
    ],
    steps: [
      {
        title: "Concourse and food-court density are measured continuously",
        body: "Crowd density and surge prediction run across every high-traffic zone, flagging a building crowd before it becomes a safety incident.",
      },
      {
        title: "Every tenant gets a real, independently measured footfall number",
        body: "Per-tenant traffic and dwell are counted automatically off the mall's own cameras, giving the landlord a lease-negotiation number neither side has to take on faith.",
      },
      {
        title: "Security, leasing and operations read the same dashboard",
        body: "The same event stream feeds crowd safety alerts, tenant reporting and parking guidance — three budgets, one camera network.",
      },
    ],
  },
  {
    slug: "commercial-offices",
    title: "Commercial offices",
    code: "OFF",
    accent: "teal",
    heroLede:
      "Built for facility managers who need to know who's in the building after 7pm, without watching every badge swipe by hand.",
    calloutStatus: "AI DETECTED",
    calloutTitle: "After-hours movement — Floor 5",
    calloutSub: "Server room corridor · 10:24 PM",
    summary:
      "Employee occupancy, meeting-room utilization and after-hours access in one view — distinct from a lobby-only CRE deployment or a residential gate.",
    bullets: [
      "Employee and visitor occupancy by floor, correlated with badge-in records",
      "Meeting-room utilization, flagging booked-but-empty rooms and chronic overbooking",
      "Lobby and elevator traffic patterns, with visitor check-in tied to host notification",
      "After-hours and restricted-access movement, verified against shift and access-level schedules",
      "Emergency-event detection with automatic floor-by-floor headcount for evacuation accountability",
    ],
    integrations: ["HID / Lenel access control", "Okta", "Robin / Envoy visitor management", "Outlook / Google Calendar"],
    meta: [
      { k: "Pack ID", v: "OFF" },
      { k: "Capabilities", v: "5 shipped" },
    ],
    problems: [
      {
        tag: "Utilization",
        title: "Meeting rooms show booked, but sit empty",
        body: "Facilities teams size real-estate decisions off calendar data that doesn't reflect who actually showed up.",
      },
      {
        tag: "After hours",
        title: "A badge swipe doesn't confirm who's actually in the building",
        body: "Access logs show a credential was used, not whether the person left, propped a door, or let someone else in behind them.",
      },
      {
        tag: "Visitor management",
        title: "Lobby traffic is guessed from a sign-in tablet",
        body: "A front desk log undercounts visitors the moment the tablet is skipped or the receptionist steps away.",
      },
      {
        tag: "Emergency",
        title: "Evacuation headcounts are taken by clipboard",
        body: "In a real emergency, confirming every floor is clear depends on a warden physically counting people in a parking lot.",
      },
    ],
    steps: [
      {
        title: "Occupancy is measured floor by floor, in real time",
        body: "Employee and visitor counts are tracked continuously and reconciled against badge-in data, turning a guess into a number facilities can plan against.",
      },
      {
        title: "After-hours and restricted-zone movement is verified, not assumed",
        body: "A badge swipe outside normal hours or in a restricted area is checked against the person's actual schedule and access level before it's treated as routine.",
      },
      {
        title: "An emergency gets an automatic headcount, not a clipboard",
        body: "Floor-by-floor presence is available the instant an alarm triggers, so evacuation accountability doesn't depend on a warden's tally.",
      },
    ],
  },
];

export const AGENTS: SandboxItem[] = [
  {
    slug: "sentinel",
    title: "Sentinel",
    code: "SNT",
    accent: "crimson",
    tagline: "Agent 01 · Always on",
    summary:
      "The always-on watcher at the edge. Cheap, fast and deliberately dumb — its only job is to notice.",
    bullets: [
      "Watches the scene graph for rule matches and statistical anomalies",
      "Runs entirely at the edge, with zero cloud dependency",
      "Fires a candidate event — never a final verdict",
      "Designed to be cheap enough to run continuously on every camera",
    ],
    meta: [
      { k: "Runs at", v: "Edge" },
      { k: "Output", v: "Candidate event" },
    ],
  },
  {
    slug: "analyst",
    title: "Analyst",
    code: "ANL",
    accent: "amber",
    tagline: "Agent 02 · The false-alarm killer",
    summary:
      "Receives the candidate plus context — pre-roll, adjacent cameras, radar, door state, schedule, weather — and reasons about whether it matters.",
    bullets: [
      "Is this a person or a plastic bag? Is this employee badged in? Is this loitering or a smoker on break?",
      "Assigns a confidence score and a threat class",
      "Writes a one-paragraph rationale a human can audit",
      "Target: 98% of candidate events resolved without human attention",
    ],
    meta: [
      { k: "Resolves", v: "~98% alone" },
      { k: "Output", v: "Confidence + rationale" },
    ],
  },
  {
    slug: "responder",
    title: "Responder",
    code: "RSP",
    accent: "teal",
    tagline: "Agent 03 · The escalation ladder",
    summary:
      "Owns the response, bounded by a customer-authored policy — autonomy is a dial the customer sets per zone, per time window.",
    bullets: [
      "Chooses: log only → notify staff → talk-down → analyst takeover → guard dispatch → law enforcement",
      "Every irreversible action requires a human confirm or a pre-signed standing authorization",
      "Unlocking a door or calling 911 is never fully autonomous",
      "Escalation policy is authored and owned by the customer",
    ],
    meta: [
      { k: "Autonomy", v: "Policy-bounded" },
      { k: "Irreversible acts", v: "Human-confirmed" },
    ],
  },
  {
    slug: "compliance",
    title: "Compliance",
    code: "CMP",
    accent: "violet",
    tagline: "Agent 04 · The jurisdiction check",
    summary: "Checks every action against jurisdiction before it happens, not after.",
    bullets: [
      "Is audio recording legal in this state?",
      "Is this camera in a locker room? Hard-blocked, no exceptions",
      "Is this a student, triggering FERPA handling?",
      "Does this evidence request need a legal hold?",
    ],
    meta: [
      { k: "Checks", v: "Before action" },
      { k: "Hard blocks", v: "Enforced in code" },
    ],
  },
  {
    slug: "ops",
    title: "Ops",
    code: "OPS",
    accent: "blue",
    tagline: "Agent 05 · The revenue agent",
    summary: "Runs continuously on the same feeds, turning security cameras into an operations dashboard.",
    bullets: [
      "Produces throughput, dwell, queue, safety and compliance metrics",
      "Sends a weekly narrative in plain English, not a dashboard nobody opens",
      "\"Dock 3 idle 41 minutes per shift, up 12% — trailer arrivals cluster 6:50–7:10am.\"",
      "The reason three budgets can fund one deployment",
    ],
    meta: [
      { k: "Cadence", v: "Weekly narrative" },
      { k: "Output", v: "Dollar-quantified" },
    ],
  },
  {
    slug: "learning",
    title: "Learning",
    code: "LRN",
    accent: "pink",
    tagline: "Agent 06 · Gets smarter, per site",
    summary: "Every human correction becomes a labeled example. Nothing is thrown away.",
    bullets: [
      "\"False alarm — that's our cleaning crew\" becomes training data overnight",
      "Per-site adapters retrain nightly",
      "Fleet-wide patterns learned via federated aggregation — one customer's footage never trains on another's raw data",
      "Drift detection auto-flags cameras whose accuracy is degrading",
    ],
    meta: [
      { k: "Retrains", v: "Nightly, per site" },
      { k: "Fleet learning", v: "Federated" },
    ],
  },
];

export const PLANES: SandboxItem[] = [
  {
    slug: "security",
    title: "Security Intelligence",
    code: "SEC",
    accent: "crimson",
    tagline: "Plane 1 of 3",
    summary:
      "Safer people, secure property — the full detection library with verification, escalation and signed evidence.",
    bullets: [
      "Perimeter: fence climb, breach, tailgating, loitering with intent scoring",
      "Weapons: brandishing, concealed-draw motion, hostile posture",
      "Person: fall detection, medical distress, fight/aggression, crowd surge",
      "Watchlists done responsibly — opt-in, human-approved, appearance-based by default",
    ],
    meta: [
      { k: "Buyer", v: "Head of security · risk · facilities" },
      { k: "Measured in", v: "Incidents prevented, response time, loss avoided" },
    ],
  },
  {
    slug: "business",
    title: "Business Intelligence",
    code: "BIZ",
    accent: "amber",
    tagline: "Plane 2 of 3",
    summary: "Smarter spaces, higher value — the plane most of this category doesn't sell at all.",
    bullets: [
      "Footfall & dwell: entries, uniques vs. repeats, hour-by-hour curves",
      "Zone performance: heatmaps, cold zones, aisle penetration",
      "Tenant analytics a landlord can sell back to tenants",
      "Conversion insights joined to POS for a true conversion rate",
      "Anonymous by construction — counts and paths, never identities",
    ],
    meta: [
      { k: "Buyer", v: "Landlord · marketing · retail ops" },
      { k: "Measured in", v: "Footfall, conversion, rent/sqft, retention" },
    ],
  },
  {
    slug: "operations",
    title: "Operations Intelligence",
    code: "OPS",
    accent: "teal",
    tagline: "Plane 3 of 3",
    summary:
      "Efficient assets, optimized work — every module reports a dollar figure, which is why the CFO sees this as an ROI line.",
    bullets: [
      "Flow: occupancy, dwell, path heatmaps, queue length and wait time",
      "Throughput: dock turn time, trailer detention, forklift utilization",
      "Safety: PPE compliance, forklift-pedestrian proximity, near-miss counting",
      "Asset: equipment location and utilization, cart and pallet-jack tracking",
    ],
    meta: [
      { k: "Buyer", v: "COO · plant manager · logistics · EHS" },
      { k: "Measured in", v: "Throughput, utilization, detention, incident rate" },
    ],
  },
];

export const TIERS: SandboxItem[] = [
  {
    slug: "watch",
    title: "Watch",
    code: "WCH",
    accent: "teal",
    tagline: "Tier 1 of 5 · $19 / camera / mo",
    summary: "Edge analytics and core detections — the customer's own staff responds.",
    bullets: [
      "Edge analytics and the core detection library",
      "Mobile alerts with a 6-second looping clip",
      "30-day event retention",
      "Camera health monitoring",
    ],
    meta: [
      { k: "Price", v: "$19 / camera / mo" },
      { k: "Response", v: "Customer's own staff" },
    ],
  },
  {
    slug: "verify",
    title: "Verify",
    code: "VFY",
    accent: "blue",
    tagline: "Tier 2 of 5 · $39 / camera / mo",
    summary: "Adds AI verification, so a human only ever sees the events that actually matter.",
    bullets: [
      "Everything in Watch, plus AI Analyst verification",
      "AegisVision AI Copilot natural-language search",
      "Automated voice talk-down",
      "Integrations and 90-day retention",
    ],
    meta: [
      { k: "Price", v: "$39 / camera / mo" },
      { k: "Adds", v: "AI verification + Copilot" },
    ],
  },
  {
    slug: "investigate",
    title: "Investigate",
    code: "INV",
    accent: "amber",
    tagline: "Tier 3 of 5 · $12/seat + $9/camera/mo",
    summary:
      "The full investigation platform — often sold to loss prevention, HR, legal or claims without a security purchase at all.",
    bullets: [
      "Index-at-ingest across the full archive",
      "Retroactive detection (Retro-Scan) over past footage",
      "Generative, grounded incident narration",
      "Case files, audit trail and signed evidence export",
    ],
    meta: [
      { k: "Price", v: "$12/seat + $9/camera/mo" },
      { k: "Sold to", v: "LP, HR, legal, claims" },
    ],
  },
  {
    slug: "respond",
    title: "Respond",
    code: "RSD",
    accent: "crimson",
    tagline: "Tier 4 of 5 · $79 / camera / mo",
    summary: "24/7 human analyst mesh with SLA-backed response, for sites that want a fully closed loop.",
    bullets: [
      "Everything in Verify, plus 24/7 analyst mesh",
      "Guard and law-enforcement dispatch",
      "Signed evidence packages, insurance-ready",
      "SLA-backed response times",
    ],
    meta: [
      { k: "Price", v: "$79 / camera / mo" },
      { k: "Coverage", v: "24/7 human mesh" },
    ],
  },
  {
    slug: "operate",
    title: "Operate",
    code: "OPT",
    accent: "violet",
    tagline: "Tier 5 of 5 · +$25 / camera / mo",
    summary: "Stacks on top of any tier — the same cameras that catch a break-in start paying for themselves.",
    bullets: [
      "Any operations intelligence module (throughput, safety, asset, flow)",
      "Weekly narrative reports from the Ops agent",
      "Dollar-quantified findings, not just dashboards",
      "No new hardware — same cameras, new budget line",
    ],
    meta: [
      { k: "Price", v: "+$25 / camera / mo" },
      { k: "Stacks on", v: "Any tier" },
    ],
  },
];

export function findSector(slug: string) {
  return SECTORS.find((s) => s.slug === slug);
}
export function findAgent(slug: string) {
  return AGENTS.find((a) => a.slug === slug);
}
export function findPlane(slug: string) {
  return PLANES.find((p) => p.slug === slug);
}
export function findTier(slug: string) {
  return TIERS.find((t) => t.slug === slug);
}
