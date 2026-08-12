import { aiServiceRequest } from './aiServiceClient';

export interface AnnotateResult {
  video: string;
  framesProcessed: number;
  tracksFound: number;
  maxDetectionsInFrame: number;
}

export const detectionApi = {
  annotate: (video: File) => {
    const form = new FormData();
    form.append('video', video);
    return aiServiceRequest<AnnotateResult>('/detection/annotate', { method: 'POST', body: form });
  },
};
