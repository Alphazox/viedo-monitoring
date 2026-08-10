// Placeholder data only — there is no Event Engine or AI inference pipeline
// yet (Phases 6–9). This exists purely so the dashboard layout for that
// future data is visible now; nothing here is read from or written to a
// real backend.
export interface MockDetection {
  id: string;
  label: string;
  confidence: number;
  cameraName: string;
  minutesAgo: number;
}

export const MOCK_DETECTIONS: MockDetection[] = [
  { id: '1', label: 'Person', confidence: 0.94, cameraName: 'Front Entrance', minutesAgo: 2 },
  { id: '2', label: 'Vehicle', confidence: 0.88, cameraName: 'Parking Lot A', minutesAgo: 6 },
  { id: '3', label: 'Person', confidence: 0.91, cameraName: 'Loading Dock', minutesAgo: 14 },
  { id: '4', label: 'Package', confidence: 0.76, cameraName: 'Front Entrance', minutesAgo: 22 },
];
