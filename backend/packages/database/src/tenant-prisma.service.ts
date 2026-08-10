import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { TenantContext } from './tenant-context';
import { TENANT_SCOPED_MODELS } from './tenant-scoped-models';

/**
 * Tenant-scoped Prisma client. Every query against a model listed in
 * TENANT_SCOPED_MODELS is automatically filtered/stamped with the current
 * request's organizationId (read from TenantContext) — a caller cannot
 * forget the filter because there is no code path that skips it.
 *
 * findUnique/findUniqueOrThrow stay findUnique/findUniqueOrThrow — the
 * operation itself isn't switched (the `query()` callback always re-invokes
 * the same operation it intercepted). What changes is the `where` object
 * passed to it: the client's TypeScript types only allow findUnique's
 * `where` to contain unique-constraint fields, but the query engine applies
 * every field present in `where` as an AND-combined filter regardless of
 * uniqueness, so merging organizationId in here still works at the
 * database level even though constructing this call directly through the
 * typed client API wouldn't compile.
 *
 * create/createMany/upsert always overwrite any client-supplied
 * organizationId with the trusted context value — a caller can never target
 * another tenant even if a stray field made it into a request body.
 */
@Injectable()
export class TenantPrismaService {
  readonly client;

  constructor(prisma: PrismaService) {
    this.client = prisma.$extends({
      name: 'tenant-scope',
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }) {
            if (!model || !(TENANT_SCOPED_MODELS as readonly string[]).includes(model)) {
              return query(args);
            }

            const organizationId = TenantContext.requireOrganizationId();
            const scopedArgs = args as Record<string, unknown>;

            switch (operation) {
              case 'findUnique':
              case 'findUniqueOrThrow':
                scopedArgs.where = { ...(scopedArgs.where as object), organizationId };
                break;
              case 'create':
                scopedArgs.data = { ...(scopedArgs.data as object), organizationId };
                break;
              case 'createMany':
                scopedArgs.data = Array.isArray(scopedArgs.data)
                  ? scopedArgs.data.map((row: Record<string, unknown>) => ({
                      ...row,
                      organizationId,
                    }))
                  : { ...(scopedArgs.data as object), organizationId };
                break;
              case 'upsert':
                scopedArgs.where = { ...(scopedArgs.where as object), organizationId };
                scopedArgs.create = { ...(scopedArgs.create as object), organizationId };
                break;
              default:
                scopedArgs.where = { ...((scopedArgs.where as object) ?? {}), organizationId };
            }

            return query(scopedArgs);
          },
        },
      },
    });
  }
}
