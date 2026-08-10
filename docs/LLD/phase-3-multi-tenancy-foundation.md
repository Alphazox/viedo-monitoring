# LLD — Phase 3: Multi-Tenancy & Platform Foundation Hardening

**Satisfies:** FR-ORG-01 to FR-ORG-04 (`SRS.md`), the Multi-Tenancy Model (`HLD.md` §4), and the Fastify/rate-limiting items from `HLD.md` §14's decisions log.
**Precondition:** `HLD.md` approved.
**Out of scope for this phase:** Camera model (Phase 4 attaches `Camera.zoneId`), Platform Owner cross-tenant tooling (FR-ORG-05, deferred), Organization self-service signup (Organization is bootstrapped by the seed script only, for now).

**Addendum (discovered during implementation of §2):** `@nestjs/platform-fastify@10.x`'s Fastify v4 dependency chain turned out to carry an unpatched critical CVE (`@fastify/middie` path/auth bypass) plus two high-severity ones (`find-my-way` DoS, `fast-uri` path traversal) with no same-major fix available — only Fastify v5 (`@nestjs/platform-fastify@11.x`) resolves them, which requires `@nestjs/core`/`@nestjs/common` v11 across the whole monorepo. Confirmed with you before proceeding; this LLD's version numbers below reflect NestJS 11, not 10 as originally sketched in `HLD.md`. Two more issues surfaced and were fixed during implementation: `find-my-way` stays exact-pinned to the vulnerable version even inside `@nestjs/platform-fastify@11.1.28` (fixed via a root `npm overrides` entry forcing `^9.7.0`), and `@nestjs/swagger`'s nested `js-yaml` had its own unrelated DoS CVE (fixed via a scoped override to `^5.2.3`, scoped specifically to avoid forcing that version on unrelated consumers like ESLint's own dependency tree). Final state: `npm audit` reports 0 vulnerabilities.

---

## 1. Build order and why

Two large, orthogonal changes are bundled into this phase (per your decisions: multi-tenancy now, Fastify now). They are **sequenced, not parallelized**, so that if something breaks, it's obvious which change broke it:

1. **Fastify migration** on today's code, alone. Verify build/lint/existing tests before touching schema.
2. **Rate limiting** (`@nestjs/throttler`) — small, also global-guard-registration-order-sensitive, natural to do right after the adapter swap.
3. **Additive schema migration** — new `Organization` table + nullable `organizationId` on `User`/`Role`. Non-breaking; nothing enforces it yet.
4. **Tenant context + Prisma extension** (`TenantContext`, `TenantPrismaService`) — new code, not wired into any request path yet.
5. **Wire enforcement** — `TenantContextInterceptor` registered globally, JWT gains `organizationId`, login's by-email lookup switched to the explicit unscoped path.
6. **Backfill + breaking migration** — script assigns every existing `User`/`Role` to a default Organization, then `organizationId` becomes `NOT NULL` and `Role.name`'s uniqueness becomes per-organization. Done last, once everything upstream is proven.
7. **New modules** — Organization (read/update self), Site, Building, Floor, Zone CRUD, built on `TenantPrismaService` from the start.
8. **Seed script** becomes organization-aware.
9. **AuditLog** gains `organizationId`, controller filters to caller's org.
10. **Verification** — build/lint/unit tests here; DB-dependent integration tests on your machine (same constraint as Phases 1–2 — no Postgres/Docker in this sandbox).

This is also the order I'll implement in, once approved.

---

## 2. Fastify migration

### 2.1 Package changes (`backend/apps/api/package.json`)

| Remove | Add |
|---|---|
| `@nestjs/platform-express` | `@nestjs/platform-fastify` |
| `helmet` | `@fastify/helmet` |
| `@types/express` | `fastify` (for `FastifyRequest`/`FastifyReply` types — pulled in transitively by `@nestjs/platform-fastify`, but pinned explicitly as a dev dependency for direct type imports) |
| `@nestjs/throttler` *(new, not a swap)* | — |

### 2.2 Files touched and exact change

- **`src/main.ts`** — `NestFactory.create(AppModule)` → `NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter())`. `app.use(helmet())` → `await app.register(fastifyHelmet)`. Everything else (`enableCors`, `enableVersioning`, `useGlobalPipes`, `useGlobalFilters`, `useGlobalInterceptors`, `enableShutdownHooks`, Swagger setup) is Nest's adapter-agnostic API and should be unchanged — **flagged for implementation-time verification** (see §2.4).
- **`packages/common/src/filters/http-exception.filter.ts`** — `import type { Request, Response } from 'express'` → `import type { FastifyRequest, FastifyReply } from 'fastify'`. `response.status(status).json(body)` → `response.status(status).send(body)` (Fastify's reply has `.status()` as an alias for `.code()`, but **no `.json()` method** — `.send()` auto-serializes objects; this is a real, not cosmetic, code change).
- **`src/auth/utils/request-context.ts`** — `Request` from `express` → `FastifyRequest` from `fastify`. `req.ip` and `req.headers['user-agent']` are available on both, no logic change.
- **`src/auth/guards/permissions.guard.ts`**, **`src/auth/decorators/current-user.decorator.ts`**, **`src/auth/auth.controller.ts`** (`@Req() req: Request`) — same `Request` → `FastifyRequest` swap.
- **`backend/apps/api/Dockerfile`** — no change; still a plain Node process.

### 2.3 What does *not* change

`ValidationPipe`, `AllExceptionsFilter`'s exception-catching logic (only its response-sending call), `TransformInterceptor`, Terminus health indicators, `nestjs-pino`'s module wiring, Passport/JWT strategy registration, and every service/controller that doesn't touch the raw request/response object directly. The overwhelming majority of Phase 1–2 code is adapter-agnostic by construction (that's what Nest's DI/decorator model buys you) — the list above is the complete set of files that touch Express-specific types.

### 2.4 Verification risk flags (resolve during implementation, not assumed here)

I can build/lint/test the TypeScript in this sandbox but cannot run a live HTTP server against real network sockets to smoke-test these — so the following are **design decisions I'm confident in, paired with a specific check to run once you have a real environment**, not asserted-working claims:

| Item | Design decision | Verification step |
|---|---|---|
| Swagger UI under Fastify | `@nestjs/swagger`'s `SwaggerModule.setup()` documents Fastify support; may require `@fastify/static` for asset serving depending on the installed `@nestjs/swagger` version. | Hit `/api/docs` after the swap; if assets 404, add `@fastify/static` per Nest's Fastify+Swagger docs for the installed version. |
| Passport/JWT under Fastify | `@nestjs/passport`'s `AuthGuard` integrates via Nest's execution-context abstraction, not raw Express middleware — documented as Fastify-compatible in modern Nest/Passport versions. | Run the existing login smoke test (`POST /v1/auth/login`) first, before building anything else in this phase, since a break here blocks everything downstream. |
| `nestjs-pino` under Fastify | Documented as Fastify-compatible (binds to the adapter's underlying HTTP server). | Confirm request logs still emit with correlation info after the swap; fall back to Fastify's native `pino`-based logger (`fastify.log`) only if `nestjs-pino` proves incompatible with the installed version combination. |

This table is why the Fastify swap is step 1, done and verified in isolation, before anything else in this phase touches the codebase.

### 2.5 Rate limiting (bundled into this step)

Add `@nestjs/throttler`. `ThrottlerModule.forRootAsync` reading `THROTTLE_TTL_MS` (default 60000) and `THROTTLE_LIMIT` (default 100) from config. `ThrottlerGuard` registered as `APP_GUARD` — **first** in registration order (ahead of `JwtAuthGuard`/`PermissionsGuard`, currently registered inside `AuthModule`), so unauthenticated requests are throttled before spending time on auth. This means moving guard registration into `AppModule` (or a new small module imported first) rather than leaving them where `AuthModule` puts them today, since Nest applies global guards in registration order. `POST /v1/auth/login` gets a stricter override via `@Throttle({ default: { limit: 5, ttl: 60000 } })` to blunt credential-stuffing — this closes a gap I explicitly deferred in Phase 2.

---

## 3. Schema design

### 3.1 New models

```prisma
model Organization {
  id        String   @id @default(uuid())
  name      String
  slug      String   @unique
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  sites Site[]
  users User[]
  roles Role[]

  @@map("organizations")
}

model Site {
  id             String   @id @default(uuid())
  organizationId String
  name           String
  timezone       String   @default("UTC")
  address        String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  buildings    Building[]

  @@index([organizationId])
  @@map("sites")
}

model Building {
  id             String   @id @default(uuid())
  organizationId String
  siteId         String
  name           String
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  site   Site    @relation(fields: [siteId], references: [id], onDelete: Cascade)
  floors Floor[]

  @@index([organizationId])
  @@index([siteId])
  @@map("buildings")
}

model Floor {
  id             String   @id @default(uuid())
  organizationId String
  buildingId     String
  name           String
  level          Int      @default(0)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  building Building @relation(fields: [buildingId], references: [id], onDelete: Cascade)
  zones    Zone[]

  @@index([organizationId])
  @@index([buildingId])
  @@map("floors")
}

model Zone {
  id             String   @id @default(uuid())
  organizationId String
  floorId        String
  name           String
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  floor Floor @relation(fields: [floorId], references: [id], onDelete: Cascade)

  @@index([organizationId])
  @@index([floorId])
  @@map("zones")
}
```

**`organizationId` is denormalized onto every level** (`Building`/`Floor`/`Zone` each carry it directly, not just their immediate parent), exactly as `HLD.md` §4.2 specifies for `Camera` — so the generic tenant-scoping extension (§4 below) can filter any of these models by a single indexed column without a join, and so a direct `zone.findUnique({ where: { id } })` can still be safely tenant-checked. It's set server-side from the parent's `organizationId` at creation time — **never** accepted from the client, even implicitly.

### 3.2 Changes to existing models

- **`User`** gains `organizationId String` (nullable → backfilled → `NOT NULL`, see §6), relation to `Organization`. `email` **stays globally unique** — see §3.3 for why.
- **`Role`** gains `organizationId String` (same nullable→required path). Uniqueness on `name` changes from `@unique` (global) to `@@unique([organizationId, name])` (every org can have its own "Manager" role).
- **`Permission`** — **unchanged**. Permissions are the platform-defined capability catalog, not tenant data; only *role→permission assignment* is tenant-scoped (via `Role`).
- **`RefreshToken`**, **`UserRole`**, **`RolePermission`** — **unchanged, no `organizationId` added**. These are never listed/filtered by tenant directly; they're always reached via a `User` or `Role` that's already tenant-scoped (`RefreshToken` is looked up point-wise by its unique `tokenHash`, never enumerated per-tenant). Adding a redundant column here would be unused surface area.
- **`AuditLog`** gains `organizationId String?` (nullable — some actions, like a failed login for an email that matches no account, have no organization to attach to). See §7.

### 3.3 Decision: globally-unique email vs. per-organization email

Considered per-organization-unique email (allows the same email to belong to multiple tenants, common for contractors working across client orgs) but **rejected for now**: it requires an organization-selection step before login (subdomain-based or an explicit picker), which is a real UX/API surface change to the already-shipped `POST /v1/auth/login` contract. Global uniqueness keeps login exactly as it is today (email + password, no org selection) and is the correct default for the vast majority of B2B platforms at this stage. Revisit only if a specific customer requires shared-identity-across-tenants.

---

## 4. Tenant isolation enforcement

Four layers, per `HLD.md` §4.3. This section makes each one concrete.

### 4.1 `TenantContext` — `packages/database/src/tenant-context.ts`

```ts
import { AsyncLocalStorage } from 'node:async_hooks';

interface TenantStore {
  organizationId: string;
}

const storage = new AsyncLocalStorage<TenantStore>();

export const TenantContext = {
  run<T>(organizationId: string, fn: () => T): T {
    return storage.run({ organizationId }, fn);
  },
  getOrganizationId(): string | undefined {
    return storage.getStore()?.organizationId;
  },
  requireOrganizationId(): string {
    const organizationId = storage.getStore()?.organizationId;
    if (!organizationId) {
      throw new Error('Tenant context is not set for this operation');
    }
    return organizationId;
  },
};
```

Plain Node `AsyncLocalStorage` — no NestJS dependency, so it works identically inside the Prisma extension (which runs inside Prisma Client's internals, outside Nest's DI container) and inside Nest request handling. Lives in `packages/database` (not `apps/api`) because the Prisma extension that reads it also lives there.

### 4.2 Tenant-scoped models list — `packages/database/src/tenant-scoped-models.ts`

```ts
export const TENANT_SCOPED_MODELS = ['Site', 'Building', 'Floor', 'Zone', 'User', 'Role'] as const;
```

An explicit, exported array — Phase 4 adds `'Camera'` to this one line when the `Camera` model ships, and the extension automatically covers it. No other code changes needed to onboard a new tenant-scoped model.

### 4.3 `TenantPrismaService` — the enforcement point

**Design decision:** rather than making `PrismaService` itself tenant-aware, add a second injectable — `TenantPrismaService` — built once via `PrismaService.$extends(...)`. Every feature service that owns tenant data (`UsersService`, `RolesService`, the new `SitesService`/`BuildingsService`/`FloorsService`/`ZonesService`) injects `TenantPrismaService` instead of `PrismaService`. The raw `PrismaService` stays injectable directly for the narrow, explicit cases that must legitimately bypass tenant scoping (§4.4).

```ts
// packages/database/src/tenant-prisma.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { TENANT_SCOPED_MODELS } from './tenant-scoped-models';
import { TenantContext } from './tenant-context';

@Injectable()
export class TenantPrismaService {
  readonly client: ReturnType<PrismaService['$extends']>;

  constructor(prisma: PrismaService) {
    this.client = prisma.$extends({
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }) {
            if (!model || !(TENANT_SCOPED_MODELS as readonly string[]).includes(model)) {
              return query(args);
            }

            const organizationId = TenantContext.requireOrganizationId();

            switch (operation) {
              case 'findUnique':
              case 'findUniqueOrThrow':
                // Prisma's documented row-level-isolation recipe: findUnique's
                // `where` type can't carry an extra filter, so redirect to
                // findFirst, which can.
                return query({ ...args, where: { ...args.where, organizationId } });
              case 'create':
                args.data = { ...args.data, organizationId };
                break;
              case 'createMany':
                args.data = Array.isArray(args.data)
                  ? args.data.map((row: Record<string, unknown>) => ({ ...row, organizationId }))
                  : args.data;
                break;
              case 'upsert':
                args.where = { ...args.where, organizationId };
                args.create = { ...args.create, organizationId };
                break;
              default:
                args.where = { ...(args.where ?? {}), organizationId };
            }

            return query(args);
          },
        },
      },
    });
  }
}
```

**Implementation risk flag:** the exact `$allOperations` call signature (argument shape, how to redirect `findUnique` to `findFirst` semantics within the same hook) needs validation against the installed Prisma version (`5.22.0`, confirmed from the Phase 2 `prisma generate` run) when this is actually written — Prisma's client-extension API is precise about this and the snippet above is the documented pattern, not yet compiled/tested against real types. Treat it as the reference design, verify types on first build.

`create`/`createMany`/`upsert` **overwrite** any client-supplied `organizationId` in `data`/`create` with the trusted context value — a caller can never set another tenant's ID even if they somehow put one in the request body (defense in depth on top of the DTOs, which won't expose an `organizationId` field to set in the first place).

**Refinement discovered during implementation:** Prisma's generated types require `organizationId` in a `create()` call's `data` object now that it's a `NOT NULL` column — but TypeScript can't see that the extension will inject it at runtime, so omitting it fails to compile, not just fails a lint rule. Rather than casting past this, `UsersService.create()` and `RolesService.create()` call `TenantContext.requireOrganizationId()` directly and pass it explicitly alongside letting the extension do the same. This is genuinely better than the original design: it's a second, independently type-checked guarantee on top of the runtime one, not a workaround. Same reasoning applies to `Role`'s composite-unique lookup (`organizationId_name`) — Prisma generates a natural typed accessor for a compound unique constraint, so `RolesService.create()`'s duplicate-name check uses that directly instead of relying on the extension's findUnique-argument-merging behavior. Phase 4's `Camera` model should follow the same pattern: explicit `TenantContext.requireOrganizationId()` in `create()` calls and compound-unique lookups where they exist, with the extension as the backstop, not the only line of defense.

### 4.4 The unscoped escape hatch — used in four places today, not one

Login needs to look up a `User` **by email**, before any tenant context exists (that lookup is precisely how the org is discovered). Because email stays globally unique (§3.3), this lookup can only ever match zero or one row system-wide — it cannot leak a *list* of another tenant's data, which is what tenant isolation actually protects against. `UsersService.findByEmailWithRoles` therefore injects the **raw** `PrismaService` directly, not `TenantPrismaService`.

Two more call sites turned out to need the same treatment, discovered while wiring `AuthService`: `POST /v1/auth/refresh` is also `@Public()` (the client presents an opaque refresh token, not a JWT), so `TenantContextInterceptor` never runs for it either — meaning `UsersService.findByIdWithRoles` (called mid-refresh) and `UsersService.markLoggedIn` (called mid-login, right after `findByEmailWithRoles` succeeds) both hit the same "no tenant context on this request" problem `findByEmailWithRoles` was designed around. Both are safe unscoped for the same class of reason: the `id` they operate on is never client-supplied — it comes from `RefreshToken.userId` (server-side, already tied to one authenticated user by the token rotation logic) or from the just-validated login lookup, never from request input a caller controls. All three methods are documented inline with why, so each reads as a deliberate, audited exception rather than a missed filter. `UsersService.create()`'s duplicate-email check is a fourth, different case — see the refinement note in §4.3: it's unscoped not because tenant context is missing, but because the uniqueness constraint it's checking (`email`) is itself global, not per-tenant. The seed script (`prisma/seed.ts`) also uses a raw, unextended `PrismaClient` — unaffected by any of this, since it never goes through NestJS DI.

### 4.5 `TenantContextInterceptor` — wiring context into every request

Nest's enhancer order is: Guards (all, registration order) → Interceptors (all, registration order) → Handler. `JwtAuthGuard` runs as a guard and populates `request.user` (including the new `organizationId` claim) before any interceptor runs — so a **global interceptor** is the correct place to establish the `AsyncLocalStorage` context spanning the handler and everything it calls, including `TenantPrismaService` queries.

```ts
// apps/api/src/tenancy/tenant-context.interceptor.ts
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { TenantContext } from '@video-analytics/database';
import type { FastifyRequest } from 'fastify';
import type { JwtPayload } from '../auth/types/jwt-payload.type';

@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<FastifyRequest & { user?: JwtPayload }>();
    const organizationId = request.user?.organizationId;

    if (!organizationId) {
      // @Public() routes (health, login, refresh) have no authenticated user
      // and therefore no tenant context — that's expected, not an error.
      return next.handle();
    }

    return new Observable((subscriber) => {
      TenantContext.run(organizationId, () => {
        next.handle().subscribe(subscriber);
      });
    });
  }
}
```

Registered as `APP_INTERCEPTOR` in a new small `TenancyModule`, imported by `AppModule` after `AuthModule`. This **replaces** the separate `TenantScopeGuard` sketched in `HLD.md` §4.3 — an interceptor is the right primitive here because it needs to *wrap* execution (establish context for the query's duration), which a guard (a yes/no gate) can't do. Worth calling out as a refinement the LLD level of detail surfaced.

### 4.6 JWT payload change

```ts
// apps/api/src/auth/types/jwt-payload.type.ts
export interface JwtPayload {
  sub: string;
  organizationId: string;
  email: string;
  roles: string[];
  permissions: string[];
}
```

`AuthService.signAccessToken` adds `organizationId: user.organizationId`. No other change to the token-issuance flow — refresh-token rotation, theft detection, and audit logging on login/refresh/logout are unaffected by this addition.

---

## 5. New API surface

All new endpoints use `TenantPrismaService`, so `organizationId` is never read from the request — it's implicit from the caller's token via `TenantContext`, exactly like every other tenant-scoped query.

| Method & path | Permission | Notes |
|---|---|---|
| `GET /v1/organizations/me` | `organizations:read` | Returns the caller's own organization. No list-all/create/delete endpoint yet — org creation is seed-script/bootstrap only this phase (FR-ORG-05-adjacent tooling is deferred). |
| `PATCH /v1/organizations/me` | `organizations:update` | Update name only, this phase. |
| `POST/GET/GET :id/PATCH/DELETE /v1/sites` | `sites:*` | Standard CRUD, same shape as `UsersController`/`RolesController`. |
| `POST/GET/GET :id/PATCH/DELETE /v1/buildings` | `buildings:*` | `siteId` required in the create body; service verifies the referenced site belongs to the caller's org (it always will, since `TenantPrismaService` already scoped the site lookup — a cross-tenant `siteId` simply won't be found, surfacing as 404, not a silent cross-tenant write). |
| `POST/GET/GET :id/PATCH/DELETE /v1/floors` | `floors:*` | Same pattern, `buildingId` in body. |
| `POST/GET/GET :id/PATCH/DELETE /v1/zones` | `zones:*` | Same pattern, `floorId` in body. |

New permission keys added to `PERMISSION_DEFINITIONS` (`packages/common/src/rbac/permissions.catalog.ts`): `organizations:read`, `organizations:update`, and full CRUD sets for `sites`, `buildings`, `floors`, `zones` (18 new keys total). The seed script's SuperAdmin role grant is already dynamic (`allPermissions.map(...)`) — it needs zero code changes to pick these up.

Route nesting stays flat (`/v1/buildings` with `siteId` in the body, not `/v1/sites/:id/buildings`) — consistent with the existing `Users`/`Roles` pattern, simpler, and nested-resource routes can be layered on later if wanted without a breaking change.

---

## 6. Migration & backfill plan

**What's actually in `schema.prisma` right now:** the target, post-backfill state — `organizationId` is `NOT NULL` on `User`/`Role`, and `Role` uniqueness is `@@unique([organizationId, name])`. I can't generate real migration files without a live Postgres connection (same sandbox limitation as Phases 1–2), so I couldn't produce genuine "Migration A" / "Migration B" SQL files to hand you. What I *can* and did provide: the backfill script (`packages/database/prisma/backfill-default-org.ts`), and the runbook below covering both cases.

**If this is a fresh/empty database** (never had Phase 2 data applied): just run `npm run prisma:migrate:dev` once against the current schema — nothing to backfill, done.

**If this database already has Phase 2 data** (real users/roles from before this phase), do **not** run `prisma migrate dev` directly against the current schema — Postgres will reject adding `NOT NULL organizationId` while existing rows have no value for it. Instead:

1. Temporarily edit `schema.prisma`: make `User.organizationId` / `Role.organizationId` nullable (`String?`) again, and revert `Role`'s uniqueness to plain `@unique` on `name`. (i.e., the state described in this LLD's earlier draft, before §6 was written.)
2. `npm run prisma:migrate:dev --name add_organization_nullable` — additive, non-breaking.
3. `npm run prisma:backfill-default-org` — creates a default Organization (`DEFAULT_ORG_NAME`/`DEFAULT_ORG_SLUG` env vars, sensible fallbacks if unset) and assigns every existing `User`/`Role` row to it.
4. Restore `schema.prisma` to its current (this repo's actual) state — `NOT NULL` + composite unique.
5. `npm run prisma:migrate:dev --name enforce_organization_required` — now safe, since every row has a value.

This mirrors exactly how the seed script already bootstraps a SuperAdmin — the backfill script is the same idea applied to a fresh Organization instead of a fresh user.

**Seed script:** `prisma/seed.ts` now creates/upserts the bootstrap `Organization` first (`ORG_NAME`/`ORG_SLUG` env vars, same pattern as `ADMIN_EMAIL`/`ADMIN_PASSWORD`), then creates the `SuperAdmin` role and admin user scoped to it. Idempotent, same as before.

---

## 7. Audit log tenant scoping

`AuditLog.organizationId` is **explicitly passed by each call site**, not inferred implicitly from `TenantContext` inside `AuditService` — deliberate, for two reasons: (1) `AuthService`'s `login_failed` audit entry needs the org of the account that was looked up, which happens *before* any tenant context exists (authentication hasn't succeeded yet) — `AuthService` already has `user?.organizationId` in hand from the lookup and passes it directly; (2) explicit is more testable than implicit ambient state leaking into a logging call. `AuditLogController.findAll` now **always** filters `where: { organizationId: caller.organizationId }` in addition to existing filters — cross-org visibility (Platform Owner support tooling) is FR-ORG-05, explicitly deferred.

---

## 8. Testing strategy

- **Unit** — `TenantContext` ALS round-trip (set inside `run()`, unset outside it). `TenantPrismaService`'s extension: verify `create` injects `organizationId`, verify a query attempted with no context throws, verify a client-supplied `organizationId` in `data` is overwritten not respected.
- **Unit** — existing `HealthController` spec must still pass unchanged post-Fastify-migration (it doesn't touch `Request`/`Response` types directly, so it shouldn't need edits — a green run confirms that).
- **Integration (requires a real Postgres — your machine, not this sandbox)** — two Organizations, two Users, one Site each: assert Org A's token gets 404 (not data) on Org B's `Site`/`Building`/`Floor`/`Zone`/`User`/`Role` by ID, and that Org B's rows never appear in Org A's list endpoints. This is the regression test that actually proves FR-ORG-04 — it's the most important test in this phase and should be written even though it can't run here.
- **Manual smoke, once deployed** — `POST /v1/auth/login` end-to-end under Fastify (highest-risk item per §2.4), `GET /api/docs` renders.

---

## 9. What I will *not* do in this phase

- No Organization self-service signup/creation API (bootstrap via seed script only).
- No Platform Owner cross-tenant tooling (FR-ORG-05).
- No changes to `Permission`, `RefreshToken`, `UserRole`, `RolePermission` schemas.
- No Camera model (Phase 4).

---

Ready to implement in the order in §1, pending your go-ahead.
