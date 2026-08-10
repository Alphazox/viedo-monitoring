import { z } from 'zod';
import { baseEnvSchema } from '@video-analytics/config';

export const apiEnvSchema = baseEnvSchema.extend({
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  CORS_ORIGIN: z.string().default('*'),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN_DAYS: z.coerce.number().int().positive().default(7),
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(4).max(15).default(12),
  THROTTLE_TTL_MS: z.coerce.number().int().positive().default(60000),
  THROTTLE_LIMIT: z.coerce.number().int().positive().default(100),
  CAMERA_CREDENTIALS_ENCRYPTION_KEY: z
    .string()
    .refine((value) => Buffer.from(value, 'base64').length === 32, {
      message: 'CAMERA_CREDENTIALS_ENCRYPTION_KEY must be a base64-encoded 32-byte key',
    }),
  CAMERA_HEALTH_POLL_CONCURRENCY: z.coerce.number().int().positive().default(5),
  STORAGE_DIR: z.string().default('./storage'),
  FFMPEG_PATH: z.string().default('ffmpeg'),
  FFPROBE_PATH: z.string().default('ffprobe'),
  MAX_UPLOAD_SIZE_MB: z.coerce.number().int().positive().default(500),
  LIVE_STREAM_MAX_DURATION_MS: z.coerce.number().int().positive().default(1_800_000),
});

export type ApiEnv = z.infer<typeof apiEnvSchema>;
