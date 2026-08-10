import { extractRtspCredentials, injectRtspCredentials } from './rtsp-url.util';

describe('extractRtspCredentials', () => {
  it('extracts and strips embedded userinfo', () => {
    const result = extractRtspCredentials('rtsp://admin:secret@192.168.1.50:554/stream1');
    expect(result.username).toBe('admin');
    expect(result.password).toBe('secret');
    expect(result.url).toBe('rtsp://192.168.1.50:554/stream1');
  });

  it('passes bare URLs through unchanged with no credentials', () => {
    const result = extractRtspCredentials('rtsp://192.168.1.50:554/stream1');
    expect(result.username).toBeUndefined();
    expect(result.password).toBeUndefined();
    expect(result.url).toBe('rtsp://192.168.1.50:554/stream1');
  });

  it('decodes percent-encoded special characters in credentials', () => {
    const result = extractRtspCredentials('rtsp://user:p%40ss%3Aw0rd@host/stream');
    expect(result.username).toBe('user');
    expect(result.password).toBe('p@ss:w0rd');
    expect(result.url).toBe('rtsp://host/stream');
  });

  it('throws on a malformed URL', () => {
    expect(() => extractRtspCredentials('not a url')).toThrow();
  });
});

describe('injectRtspCredentials', () => {
  it('returns the URL unchanged when no credentials are given', () => {
    expect(injectRtspCredentials('rtsp://host/stream')).toBe('rtsp://host/stream');
  });

  it('injects username and password into a bare URL', () => {
    const url = injectRtspCredentials('rtsp://host:554/stream', 'admin', 'secret');
    expect(url).toContain('admin:secret@host:554');
  });
});
