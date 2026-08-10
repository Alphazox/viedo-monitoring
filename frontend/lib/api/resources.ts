import { api, uploadFile, withAccessToken } from './client';
import type {
  AuditLog,
  Building,
  Camera,
  CameraGroup,
  CameraSourceType,
  CameraStatus,
  ConnectionCheckResult,
  DiscoveredDevice,
  Floor,
  JwtPayload,
  Organization,
  Paginated,
  PermissionDefinition,
  Recording,
  RecordingMode,
  Role,
  Site,
  StreamStatus,
  TokenResponse,
  UserAccount,
  Zone,
} from './types';

export const authApi = {
  login: (email: string, password: string) => api.post<TokenResponse>('/auth/login', { email, password }),
  refresh: (refreshToken: string) => api.post<TokenResponse>('/auth/refresh', { refreshToken }),
  logout: (refreshToken: string) => api.post<void>('/auth/logout', { refreshToken }),
  me: () => api.get<JwtPayload>('/auth/me'),
};

export interface CreateCameraInput {
  name: string;
  sourceType?: CameraSourceType;
  zoneId?: string;
  rtspUrl?: string;
  rtspUsername?: string;
  rtspPassword?: string;
  usbDevicePath?: string;
  fileSourceUri?: string;
  recordingMode?: RecordingMode;
  retentionDaysOverride?: number;
}

export type UpdateCameraInput = Omit<Partial<CreateCameraInput>, 'zoneId'> & {
  zoneId?: string | null;
  isActive?: boolean;
};

export interface ListCamerasParams {
  page?: number;
  limit?: number;
  zoneId?: string;
  siteId?: string;
  groupId?: string;
  status?: CameraStatus;
  sourceType?: CameraSourceType;
}

export const camerasApi = {
  list: (params: ListCamerasParams = {}) => api.get<Paginated<Camera>>('/cameras', { ...params }),
  get: (id: string) => api.get<Camera>(`/cameras/${id}`),
  create: (input: CreateCameraInput) => api.post<Camera>('/cameras', input),
  update: (id: string, input: UpdateCameraInput) => api.patch<Camera>(`/cameras/${id}`, input),
  remove: (id: string) => api.delete<void>(`/cameras/${id}`),
  testConnectionPreSave: (input: { rtspUrl: string; rtspUsername?: string; rtspPassword?: string }) =>
    api.post<ConnectionCheckResult>('/cameras/test-connection', input),
  testConnectionSaved: (id: string) => api.post<Camera>(`/cameras/${id}/test-connection`),
  discover: () => api.post<DiscoveredDevice[]>('/cameras/discover'),
};

export interface ListRecordingsParams {
  page?: number;
  limit?: number;
  cameraId?: string;
}

export const recordingsApi = {
  list: (params: ListRecordingsParams = {}) => api.get<Paginated<Recording>>('/recordings', { ...params }),
  get: (id: string) => api.get<Recording>(`/recordings/${id}`),
  remove: (id: string) => api.delete<void>(`/recordings/${id}`),
  upload: (
    file: File,
    opts: { title?: string; cameraId?: string } = {},
    onProgress?: (percent: number) => void,
  ) => uploadFile<Recording>('/recordings', file, opts, onProgress),
  streamUrl: (id: string) => withAccessToken(`/recordings/${id}/stream`),
};

export const liveStreamApi = {
  start: (cameraId: string) => api.post<StreamStatus>(`/cameras/${cameraId}/stream/start`),
  stop: (cameraId: string) => api.post<void>(`/cameras/${cameraId}/stream/stop`),
  status: (cameraId: string) => api.get<StreamStatus>(`/cameras/${cameraId}/stream/status`),
  playlistUrl: (cameraId: string) => withAccessToken(`/cameras/${cameraId}/stream/index.m3u8`),
};

export const cameraGroupsApi = {
  list: () => api.get<CameraGroup[]>('/camera-groups'),
  get: (id: string) => api.get<CameraGroup>(`/camera-groups/${id}`),
  create: (input: { name: string; description?: string }) => api.post<CameraGroup>('/camera-groups', input),
  update: (id: string, input: { name?: string; description?: string }) =>
    api.patch<CameraGroup>(`/camera-groups/${id}`, input),
  remove: (id: string) => api.delete<void>(`/camera-groups/${id}`),
  addCamera: (groupId: string, cameraId: string) =>
    api.post<void>(`/camera-groups/${groupId}/cameras/${cameraId}`),
  removeCamera: (groupId: string, cameraId: string) =>
    api.delete<void>(`/camera-groups/${groupId}/cameras/${cameraId}`),
};

export const sitesApi = {
  list: () => api.get<Site[]>('/sites'),
  create: (input: { name: string; timezone?: string; address?: string }) => api.post<Site>('/sites', input),
  update: (id: string, input: { name?: string; timezone?: string; address?: string }) =>
    api.patch<Site>(`/sites/${id}`, input),
  remove: (id: string) => api.delete<void>(`/sites/${id}`),
};

export const buildingsApi = {
  list: () => api.get<Building[]>('/buildings'),
  create: (input: { siteId: string; name: string }) => api.post<Building>('/buildings', input),
  update: (id: string, input: { name?: string }) => api.patch<Building>(`/buildings/${id}`, input),
  remove: (id: string) => api.delete<void>(`/buildings/${id}`),
};

export const floorsApi = {
  list: () => api.get<Floor[]>('/floors'),
  create: (input: { buildingId: string; name: string; level?: number }) => api.post<Floor>('/floors', input),
  update: (id: string, input: { name?: string; level?: number }) => api.patch<Floor>(`/floors/${id}`, input),
  remove: (id: string) => api.delete<void>(`/floors/${id}`),
};

export const zonesApi = {
  list: () => api.get<Zone[]>('/zones'),
  create: (input: { floorId: string; name: string }) => api.post<Zone>('/zones', input),
  update: (id: string, input: { name?: string }) => api.patch<Zone>(`/zones/${id}`, input),
  remove: (id: string) => api.delete<void>(`/zones/${id}`),
};

export const usersApi = {
  list: (params: { page?: number; limit?: number } = {}) =>
    api.get<Paginated<UserAccount>>('/users', { ...params }),
  get: (id: string) => api.get<UserAccount>(`/users/${id}`),
  create: (input: { email: string; password: string; firstName: string; lastName: string; roleIds?: string[] }) =>
    api.post<UserAccount>('/users', input),
  update: (id: string, input: { firstName?: string; lastName?: string; roleIds?: string[] }) =>
    api.patch<UserAccount>(`/users/${id}`, input),
  deactivate: (id: string) => api.delete<void>(`/users/${id}`),
};

export const rolesApi = {
  list: () => api.get<Role[]>('/roles'),
  get: (id: string) => api.get<Role>(`/roles/${id}`),
  create: (input: { name: string; description?: string; permissionKeys?: string[] }) =>
    api.post<Role>('/roles', input),
  update: (id: string, input: { name?: string; description?: string }) => api.patch<Role>(`/roles/${id}`, input),
  assignPermissions: (id: string, permissionKeys: string[]) =>
    api.patch<Role>(`/roles/${id}/permissions`, { permissionKeys }),
  remove: (id: string) => api.delete<void>(`/roles/${id}`),
};

export const permissionsApi = {
  list: () => api.get<PermissionDefinition[]>('/permissions'),
};

export const organizationsApi = {
  getMine: () => api.get<Organization>('/organizations/me'),
  updateMine: (input: { name?: string }) => api.patch<Organization>('/organizations/me', input),
};

export const auditLogsApi = {
  list: (params: { page?: number; limit?: number; action?: string; resource?: string } = {}) =>
    api.get<Paginated<AuditLog>>('/audit-logs', { ...params }),
};
