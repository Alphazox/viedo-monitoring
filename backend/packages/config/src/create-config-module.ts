import { ConfigModule } from '@nestjs/config';
import type { ZodSchema } from 'zod';

/**
 * Builds a global NestJS ConfigModule that validates process.env against the
 * given Zod schema at bootstrap time. Each app composes its own schema by
 * extending `baseEnvSchema`, so validation failures surface before the app
 * starts listening rather than as obscure runtime errors.
 */
export function createConfigModule(schema: ZodSchema) {
  return ConfigModule.forRoot({
    isGlobal: true,
    envFilePath: ['.env.local', '.env'],
    validate: (config: Record<string, unknown>) => {
      const parsed = schema.safeParse(config);
      if (!parsed.success) {
        const formatted = parsed.error.issues
          .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
          .join('; ');
        throw new Error(`Environment validation failed: ${formatted}`);
      }
      return parsed.data;
    },
  });
}
