import { aiServiceRequest, type Alert } from './aiServiceClient';
import type { GaitWatchResult } from './gaitClient';

export interface ActivityAnalysis {
  isNight: boolean;
  meanBrightness: number;
  approached: boolean;
  loitered: boolean;
  dwellFrames: number;
  minDistance: number | null;
  suspicious: boolean;
}

export interface ActivityResult {
  analysis: ActivityAnalysis;
  alert: Alert | null;
}

export interface ActivityScenarioResult extends ActivityResult {
  description: string;
  video: string;
}

export interface ActivityZone {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface ActivityDemoResult {
  zone: ActivityZone;
  scenarios: ActivityScenarioResult[];
}

export interface CombinedDemoResult {
  video: string;
  activity: ActivityResult;
  gait: GaitWatchResult;
}

export const activityApi = {
  analyze: (video: File) => {
    const form = new FormData();
    form.append('video', video);
    return aiServiceRequest<ActivityResult>('/activity/analyze', { method: 'POST', body: form });
  },
  runDemo: () => aiServiceRequest<ActivityDemoResult>('/activity/demo/run', { method: 'POST' }),
  runCombinedDemo: () =>
    aiServiceRequest<CombinedDemoResult>('/activity/demo/run-combined', { method: 'POST' }),
};
