import type { Camera } from '@video-analytics/database';

export type PublicCamera = Omit<Camera, 'rtspPasswordEnc'> & { hasCredentials: boolean };

export function toPublicCamera(camera: Camera): PublicCamera {
  const { rtspPasswordEnc, ...rest } = camera;
  return { ...rest, hasCredentials: Boolean(rtspPasswordEnc) };
}
