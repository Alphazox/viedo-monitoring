import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;

/**
 * Symmetric, reversible encryption for secrets that must be decrypted again
 * later by the platform itself (e.g. RTSP passwords a streaming service has
 * to connect with) — unlike user passwords, which are one-way hashed.
 *
 * Output format: base64(iv[12] + authTag[16] + ciphertext), one
 * self-contained string per encrypted field.
 */
export function encrypt(plain: string, keyBase64: string): string {
  const key = decodeKey(keyBase64);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, ciphertext]).toString('base64');
}

export function decrypt(payload: string, keyBase64: string): string {
  const key = decodeKey(keyBase64);
  const buffer = Buffer.from(payload, 'base64');
  const iv = buffer.subarray(0, IV_LENGTH);
  const authTag = buffer.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = buffer.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}

function decodeKey(keyBase64: string): Buffer {
  const key = Buffer.from(keyBase64, 'base64');
  if (key.length !== KEY_LENGTH) {
    throw new Error(`Encryption key must decode to ${KEY_LENGTH} bytes, got ${key.length}`);
  }
  return key;
}
