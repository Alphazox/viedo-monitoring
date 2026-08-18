export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface MeResponse {
  id: string;
  email: string;
  full_name: string;
  role: "ADMIN" | "SECURITY_OPERATOR" | "VIEWER";
  organization_id: string;
  organization_name: string;
}

export type CameraStatus = "ONLINE" | "OFFLINE" | "ERROR" | "NO_FRAME" | "LOW_FPS" | "PROCESSING";

export interface Camera {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  site_id: string;
  stream_type: "UPLOAD" | "RTSP";
  status: CameraStatus;
  enabled: boolean;
  fps: number | null;
  last_seen_at: string | null;
  created_at: string;
}

export interface CameraListResponse {
  items: Camera[];
  total: number;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: "ADMIN" | "SECURITY_OPERATOR" | "VIEWER";
  is_active: boolean;
  created_at: string;
}

export interface UserListResponse {
  items: User[];
  total: number;
}
