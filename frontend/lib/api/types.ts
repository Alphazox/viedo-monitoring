export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface JwtPayload {
  sub: string;
  organizationId: string;
  email: string;
  roles: string[];
  permissions: string[];
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserAccount {
  id: string;
  organizationId: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  roles: { id: string; name: string }[];
}

export interface PermissionDefinition {
  key: string;
  description: string;
}

export interface Role {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
  permissions: { permission: { id: string; key: string; description: string | null } }[];
}

export interface Site {
  id: string;
  organizationId: string;
  name: string;
  timezone: string;
  address: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Building {
  id: string;
  organizationId: string;
  siteId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Floor {
  id: string;
  organizationId: string;
  buildingId: string;
  name: string;
  level: number;
  createdAt: string;
  updatedAt: string;
}

export interface Zone {
  id: string;
  organizationId: string;
  floorId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export type CameraSourceType = 'RTSP' | 'ONVIF' | 'USB' | 'FILE';
export type CameraStatus = 'UNKNOWN' | 'ONLINE' | 'OFFLINE' | 'DEGRADED';
export type RecordingMode = 'CONTINUOUS' | 'EVENT_ONLY' | 'OFF';

export interface Camera {
  id: string;
  organizationId: string;
  zoneId: string | null;
  name: string;
  sourceType: CameraSourceType;
  rtspUrl: string | null;
  rtspUsername: string | null;
  hasCredentials: boolean;
  usbDevicePath: string | null;
  fileSourceUri: string | null;
  onvifDeviceInfo: Record<string, unknown> | null;
  ptzCapable: boolean;
  status: CameraStatus;
  lastCheckedAt: string | null;
  lastFrameAt: string | null;
  streamErrorCount: number;
  lastError: string | null;
  recordingMode: RecordingMode;
  retentionDaysOverride: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CameraGroup {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ConnectionCheckResult {
  success: boolean;
  error?: string;
}

export interface DiscoveredDevice {
  address: string;
  manufacturer?: string;
  model?: string;
}

export interface Recording {
  id: string;
  organizationId: string;
  cameraId: string | null;
  uploadedByUserId: string | null;
  title: string;
  originalFilename: string;
  storedFilename: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
}

export type StreamStatusValue = 'starting' | 'ready' | 'error' | 'stopped';

export interface StreamStatus {
  status: StreamStatusValue;
  error?: string;
}

export interface AuditLog {
  id: string;
  organizationId: string | null;
  actorId: string | null;
  action: string;
  resource: string;
  resourceId: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}
