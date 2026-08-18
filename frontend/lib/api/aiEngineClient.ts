import { getAccessToken } from "./client";

const AI_ENGINE_BASE_URL = process.env.NEXT_PUBLIC_AI_ENGINE_URL ?? "http://localhost:8001";

export class AiEngineError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export type AlertType = "person_detected" | "loitering" | "watchlist_match" | "intrusion" | "fall_detected";
export type AlertSeverity = "info" | "warning" | "critical";

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  camera_label: string | null;
  created_at: string;
}

export interface AlertListResponse {
  items: Alert[];
  total: number;
}

export interface GalleryEntry {
  subject_id: string;
  label: string;
  watchlisted: boolean;
}

export interface DetectionResult {
  video: string;
  frames_processed: number;
  tracks_found: number;
  max_detections_in_frame: number;
}

export interface GaitMatch {
  subject_id: string;
  label: string;
  similarity: number;
  watchlisted: boolean;
}

export interface ActivityResult {
  suspicious: boolean;
  is_night: boolean;
  loiter_frames: number;
  summary: string;
}

export interface GaitDemoStep {
  step: string;
  detail: string;
  video_url: string;
}

export interface GaitDemoResult {
  steps: GaitDemoStep[];
  match: GaitMatch | null;
  alert: Alert | null;
  threshold: number;
}

export interface ActivityScenario {
  description: string;
  video: string;
  video_url: string;
  camera_label: string;
  analysis: ActivityResult;
  alert: Alert | null;
}

export interface ActivityDemoResult {
  zone: { name: string; x1: number; y1: number; x2: number; y2: number };
  scenarios: ActivityScenario[];
}

export interface GaitVisualizeResult {
  video: string;
  frames_processed: number;
  gei_captured: boolean;
  silhouette_frames_used: number;
}

export interface FallEvent {
  track_id: string;
  frame_index: number;
  timestamp_seconds: number;
  aspect_before: number;
  aspect_after: number;
  confidence: number;
}

export interface FallResult {
  fell: boolean;
  event: FallEvent | null;
  threshold: number;
  alert: Alert | null;
  video_url: string | null;
  frames_processed: number;
  frames_sampled: number;
  tracks_found: number;
}

export function aiEngineVideoUrl(path: string): string {
  return `${AI_ENGINE_BASE_URL}${path}`;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  // ai-engine validates the same access token the backend issues (see
  // ai-engine/inference/security.py) — no separate ai-engine login.
  const accessToken = getAccessToken();
  const headers = new Headers(options.headers);
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  let res: Response;
  try {
    res = await fetch(`${AI_ENGINE_BASE_URL}${path}`, { ...options, headers });
  } catch {
    throw new AiEngineError(0, "AI engine is unreachable");
  }

  if (res.status === 401) {
    throw new AiEngineError(401, "Session expired");
  }

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    // no body
  }

  if (!res.ok) {
    const message =
      body && typeof body === "object" && "detail" in body
        ? String((body as { detail: unknown }).detail)
        : `AI engine request failed (${res.status})`;
    throw new AiEngineError(res.status, message);
  }

  return body as T;
}

export const aiEngineClient = {
  alerts: () => request<AlertListResponse>("/alerts"),
  gallery: () => request<{ subjects: GalleryEntry[] }>("/gait/gallery"),

  detectAnnotate: (file: File) => {
    const form = new FormData();
    form.append("video", file);
    return request<DetectionResult>("/detection/annotate", { method: "POST", body: form });
  },
  gaitIdentify: (file: File, topK = 3) => {
    const form = new FormData();
    form.append("video", file);
    form.append("top_k", String(topK));
    return request<{ matches: GaitMatch[] }>("/gait/identify", { method: "POST", body: form });
  },
  gaitVisualize: (file: File) => {
    const form = new FormData();
    form.append("video", file);
    return request<GaitVisualizeResult>("/gait/visualize", { method: "POST", body: form });
  },
  activityAnalyze: (file: File) => {
    const form = new FormData();
    form.append("video", file);
    return request<{ analysis: ActivityResult; alert: Alert | null }>("/activity/analyze", {
      method: "POST",
      body: form,
    });
  },
  fallAnalyze: (file: File) => {
    const form = new FormData();
    form.append("video", file);
    return request<FallResult>("/fall/analyze", { method: "POST", body: form });
  },

  runGaitDemo: () => request<GaitDemoResult>("/gait/demo/run", { method: "POST" }),
  seedGaitGallery: () => request<{ subjects: (GalleryEntry & { video_url: string })[] }>("/gait/demo/seed-gallery", { method: "POST" }),
  runActivityDemo: () => request<ActivityDemoResult>("/activity/demo/run", { method: "POST" }),
  runFallDemo: () => request<FallResult>("/fall/demo/run", { method: "POST" }),
  runDetectionDemo: () => request<DetectionResult>("/detection/demo/run", { method: "POST" }),
};
