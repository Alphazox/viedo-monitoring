import { aiServiceRequest, type Alert } from './aiServiceClient';

export interface GaitMatch {
  subjectId: string;
  label: string;
  similarity: number;
  watchlisted: boolean;
}

export interface GaitSubject {
  subjectId: string;
  label: string;
  watchlisted: boolean;
}

export interface GaitWatchResult {
  match: GaitMatch | null;
  alert: Alert | null;
}

export interface GaitDemoStep {
  step: string;
  detail: string;
}

export interface GaitDemoResult {
  steps: GaitDemoStep[];
  match: GaitMatch | null;
  alert: Alert | null;
  threshold: number;
}

export interface GaitVisualizeResult {
  video: string;
  framesProcessed: number;
  geiCaptured: boolean;
}

export const gaitApi = {
  enroll: (label: string, watchlisted: boolean, video: File) => {
    const form = new FormData();
    form.append('label', label);
    form.append('watchlisted', String(watchlisted));
    form.append('video', video);
    return aiServiceRequest<{ subjectId: string; label: string; watchlisted: boolean }>('/gait/enroll', {
      method: 'POST',
      body: form,
    });
  },
  watch: (video: File) => {
    const form = new FormData();
    form.append('video', video);
    return aiServiceRequest<GaitWatchResult>('/gait/watch', { method: 'POST', body: form });
  },
  gallery: () => aiServiceRequest<{ subjects: GaitSubject[] }>('/gait/gallery'),
  runDemo: () => aiServiceRequest<GaitDemoResult>('/gait/demo/run', { method: 'POST' }),
  seedGallery: () => aiServiceRequest<{ enrolled: { subjectId: string; label: string }[] }>('/gait/demo/seed-gallery', {
    method: 'POST',
  }),
  visualize: (video: File) => {
    const form = new FormData();
    form.append('video', video);
    return aiServiceRequest<GaitVisualizeResult>('/gait/visualize', { method: 'POST', body: form });
  },
};
