export const BRAND_NAME = 'Vantage AI';

export const NAV_LINKS = [
  { href: '/platform', label: 'Platform' },
  { href: '/industries', label: 'Industries' },
  { href: '/contact', label: 'Contact' },
];

export const CONTACT_EMAIL = 'hello@vantage-ai.example';

export const HERO_HIGHLIGHTS = [
  'Real-time person & motion detection',
  'Cross-camera gait re-identification',
  'Role-based access & full audit trail',
];

export const WORKFLOW_STEPS = [
  {
    step: '01',
    icon: 'eye',
    title: 'Detect',
    description:
      'Every frame from every connected camera is scanned continuously for people and motion — no manual monitoring required.',
  },
  {
    step: '02',
    icon: 'loop',
    title: 'Identify & track',
    description:
      'Gait recognition re-identifies the same individual as they move between camera views, even when their face is never clearly visible.',
  },
  {
    step: '03',
    icon: 'bolt',
    title: 'Alert',
    description:
      'Configurable rules flag suspicious activity and raise alerts, ready to be routed to email, SMS, Slack, or a webhook your team already uses.',
  },
  {
    step: '04',
    icon: 'play',
    title: 'Review',
    description:
      'Every event is tied to its recording and written to an organization-wide audit log, so incidents are easy to investigate after the fact.',
  },
] as const;

export const FEATURES = [
  {
    icon: 'user',
    title: 'Person detection & tracking',
    description:
      'A detection and tracking pipeline follows people across the frame in real time, forming the foundation for every alert and report.',
  },
  {
    icon: 'loop',
    title: 'Gait-based re-identification',
    description:
      'Recognize the same person across multiple cameras by the way they walk — a differentiator that works even in low light or from behind.',
  },
  {
    icon: 'activity',
    title: 'Activity & anomaly detection',
    description:
      'Rule-based motion and behavior analysis surfaces unusual activity so your team can focus on what matters.',
  },
  {
    icon: 'map',
    title: 'Multi-location camera management',
    description:
      'Organize cameras into groups and locations, and manage every site from a single console.',
  },
  {
    icon: 'play',
    title: 'Recordings & instant playback',
    description:
      'Every camera feed is recorded and searchable, with a built-in player for fast incident review.',
  },
  {
    icon: 'shield',
    title: 'Role-based access & audit trail',
    description:
      'Fine-grained roles and permissions control who can see and do what, with every action logged for compliance.',
  },
] as const;

export const INDUSTRIES = [
  {
    name: 'Retail & multi-location chains',
    description:
      'Monitor entrances, registers, and stockrooms across every store from one console, with alerts the moment something looks off.',
  },
  {
    name: 'Warehousing & logistics',
    description:
      'Track activity around loading docks and high-value storage areas without adding headcount to your security team.',
  },
  {
    name: 'Corporate campuses',
    description: 'Keep entrances, parking, and shared spaces covered across multiple buildings and sites.',
  },
  {
    name: 'Education',
    description: 'Support campus safety teams with real-time visibility across entrances, hallways, and grounds.',
  },
  {
    name: 'Multi-family residential',
    description: 'Give property teams a single view of lobbies, garages, and common areas across every building.',
  },
  {
    name: 'Manufacturing',
    description: 'Watch restricted areas and equipment zones for unauthorized access or unsafe activity.',
  },
] as const;
