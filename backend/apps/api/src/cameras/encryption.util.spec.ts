import { decrypt, encrypt } from '@video-analytics/common';

const KEY = Buffer.alloc(32, 7).toString('base64');
const OTHER_KEY = Buffer.alloc(32, 9).toString('base64');

describe('encryption.util (camera credential storage)', () => {
  it('round-trips plaintext through encrypt/decrypt', () => {
    const ciphertext = encrypt('super-secret-password', KEY);
    expect(ciphertext).not.toContain('super-secret-password');
    expect(decrypt(ciphertext, KEY)).toBe('super-secret-password');
  });

  it('produces a different ciphertext on every call (random IV)', () => {
    const first = encrypt('same-password', KEY);
    const second = encrypt('same-password', KEY);
    expect(first).not.toBe(second);
  });

  it('throws when the ciphertext has been tampered with', () => {
    const ciphertext = encrypt('super-secret-password', KEY);
    const tamperedBytes = Buffer.from(ciphertext, 'base64');
    tamperedBytes[tamperedBytes.length - 1] ^= 0xff;
    const tampered = tamperedBytes.toString('base64');
    expect(() => decrypt(tampered, KEY)).toThrow();
  });

  it('throws when decrypting with the wrong key', () => {
    const ciphertext = encrypt('super-secret-password', KEY);
    expect(() => decrypt(ciphertext, OTHER_KEY)).toThrow();
  });

  it('rejects a key that does not decode to 32 bytes', () => {
    const shortKey = Buffer.alloc(16).toString('base64');
    expect(() => encrypt('x', shortKey)).toThrow();
  });
});
