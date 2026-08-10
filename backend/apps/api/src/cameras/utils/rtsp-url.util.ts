/**
 * A client may paste a URL with embedded credentials
 * (rtsp://user:pass@host:554/stream) or supply a bare rtspUrl plus
 * rtspUsername/rtspPassword separately. This always runs first on the way
 * in, so the plaintext rtspUrl column never contains a credential, even
 * transiently, even if a caller sends one embedded.
 */
export interface ExtractedRtspCredentials {
  url: string;
  username?: string;
  password?: string;
}

export function extractRtspCredentials(rawUrl: string): ExtractedRtspCredentials {
  const parsed = new URL(rawUrl);
  const username = parsed.username ? decodeURIComponent(parsed.username) : undefined;
  const password = parsed.password ? decodeURIComponent(parsed.password) : undefined;
  parsed.username = '';
  parsed.password = '';
  return { url: parsed.toString(), username, password };
}

/** Reinjects credentials into a bare URL, in memory only, for one connection attempt. */
export function injectRtspCredentials(url: string, username?: string, password?: string): string {
  if (!username && !password) {
    return url;
  }
  const parsed = new URL(url);
  if (username) {
    parsed.username = username;
  }
  if (password) {
    parsed.password = password;
  }
  return parsed.toString();
}
