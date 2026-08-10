import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { TenantContext } from '@video-analytics/database';
import type { FastifyRequest } from 'fastify';
import { Observable } from 'rxjs';
import type { JwtPayload } from '../auth/types/jwt-payload.type';

/**
 * Establishes the AsyncLocalStorage tenant context for the duration of a
 * request, so TenantPrismaService can scope every query without the
 * organizationId being threaded through every method call manually.
 *
 * Runs as a global interceptor (after guards, per Nest's enhancer order),
 * so JwtAuthGuard has already populated request.user by the time this runs.
 * @Public() routes (health, login, refresh) have no request.user — that's
 * expected, not an error; they simply run without tenant context.
 */
@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<FastifyRequest & { user?: JwtPayload }>();
    const organizationId = request.user?.organizationId;

    if (!organizationId) {
      return next.handle();
    }

    return new Observable((subscriber) => {
      TenantContext.run(organizationId, () => {
        next.handle().subscribe(subscriber);
      });
    });
  }
}
