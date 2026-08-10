import * as bcrypt from 'bcryptjs';

const DEFAULT_SALT_ROUNDS = 12;

export async function hashPassword(
  plain: string,
  saltRounds = DEFAULT_SALT_ROUNDS,
): Promise<string> {
  return bcrypt.hash(plain, saltRounds);
}

export async function verifyPassword(hash: string, plain: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
