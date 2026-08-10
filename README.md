# AI Video Analytics Platform

Enterprise, multi-tenant AI video analytics platform: live RTSP/ONVIF camera ingestion,
AI-driven detection and tracking, event generation, alerting, recording, and reporting —
built as a set of independently deployable backend services behind a single API gateway.

This repository currently contains **Phase 1 (scaffolding)**, **Phase 2 (Authentication)**,
and **Phase 3 (Multi-Tenancy & Platform Foundation Hardening)** — see [Roadmap](#roadmap).

## Documentation

- [`docs/SRS.md`](docs/SRS.md) — full platform requirements (functional + non-functional), status-tagged per module.
- [`docs/HLD.md`](docs/HLD.md) — architecture: multi-tenancy model, AI plugin architecture, streaming/event/notification pipeline, deployment, roadmap.
- [`docs/LLD/phase-3-multi-tenancy-foundation.md`](docs/LLD/phase-3-multi-tenancy-foundation.md) — schema, tenant-isolation enforcement design, Fastify/NestJS 11 migration, migration runbook.

Each subsequent phase gets its own low-level design (LLD) — schema, API contracts, sequence
diagrams for that module specifically — reviewed before that phase's code is written.

## Architecture

```
video-analytics-platform/
├── backend/
│   ├── apps/
│   │   ├── api/            NestJS (Fastify) API gateway — HTTP, Swagger, health,
│   │   │                   auth, RBAC, multi-tenancy, org hierarchy CRUD
│   │   └── ai-service/     FastAPI inference service (skeleton — Phase 6 adds YOLO)
│   └── packages/
│       ├── config/         @video-analytics/config  – Zod-validated env loading
│       ├── logger/         @video-analytics/logger  – structured logging (pino)
│       ├── common/         @video-analytics/common  – exception filter, interceptors,
│       │                                               password hashing, permission
│       │                                               catalog, pagination helpers
│       └── database/       @video-analytics/database – Prisma schema, PrismaService,
│                                                        tenant-scoping Prisma extension
├── docker-compose.yml       postgres, redis, api, ai-service
└── .github/workflows/ci.yml lint + build gate
```

`backend/packages/*` are internal npm workspace packages, consumed by every NestJS
app in this monorepo (`api` today; `stream-service`, `event-engine`, and
`notification-service` are added in later phases and will reuse the same packages).
The AI service is a separate Python/FastAPI process — it never shares code with the
Node side, only HTTP/queue contracts.

## Prerequisites

- Node.js 20+ and npm 10+
- Python 3.11+
- Docker and Docker Compose (for running Postgres/Redis and containerized services)

## Getting started

```bash
# 1. Install Node dependencies (npm workspaces install every backend/* package)
npm install

# 2. Copy environment files
cp .env.example .env
cp backend/apps/api/.env.example backend/apps/api/.env
cp backend/apps/ai-service/.env.example backend/apps/ai-service/.env
cp backend/packages/database/.env.example backend/packages/database/.env

# 3. Start Postgres + Redis + both services
docker compose up --build

# 4. In a separate shell: apply migrations and seed the default org + RBAC data
npm run prisma:migrate:dev
npm run prisma:seed
```

> **Upgrading an existing database that already has Phase 2 data?** Do not run
> `prisma migrate dev` directly against the current schema — see the migration
> runbook in [`docs/LLD/phase-3-multi-tenancy-foundation.md` §6](docs/LLD/phase-3-multi-tenancy-foundation.md#6-migration--backfill-plan)
> for the additive-then-backfill-then-breaking sequence.

The API will be available at `http://localhost:3000`:
- Swagger docs: `http://localhost:3000/api/docs`
- Liveness: `GET /v1/health/live` (public)
- Readiness (checks Postgres + Redis): `GET /v1/health/ready` (public)

The AI service will be available at `http://localhost:8000`:
- OpenAPI docs: `http://localhost:8000/docs`
- Liveness: `GET /health/live`
- Readiness: `GET /health/ready`

### Running services outside Docker

```bash
# API (requires local Postgres/Redis, or `docker compose up postgres redis`)
npm run start:api:dev

# AI service
cd backend/apps/ai-service
python -m venv .venv && .venv\Scripts\activate   # or `source .venv/bin/activate` on Unix
pip install -r requirements-dev.txt
uvicorn app.main:app --reload
```

### Prisma

```bash
npm run prisma:generate              # regenerate the Prisma client after a schema change
npm run prisma:migrate:dev           # create and apply a migration (requires a running Postgres)
npm run prisma:seed                  # bootstrap the default org, permissions, SuperAdmin role, admin user
npm run prisma:backfill-default-org  # one-time: assign pre-Phase-3 users/roles to a default org (see LLD §6)
```

Seeding requires `ORG_NAME`/`ORG_SLUG`/`ADMIN_EMAIL`/`ADMIN_PASSWORD` in
`backend/packages/database/.env` (see `.env.example` there). It is idempotent — safe
to re-run.

## Authentication, RBAC & Multi-Tenancy

Every route requires a valid JWT access token by default; a route opts out with
`@Public()` (currently: `POST /v1/auth/login`, `POST /v1/auth/refresh`, and the
health-check endpoints). Authorization is permission-based: routes declare required
permission keys with `@RequirePermissions('users:create', ...)`, and `PermissionsGuard`
checks them against the permission list embedded in the caller's access token.

- **Access tokens** — signed JWT, 15 minutes by default (`JWT_ACCESS_EXPIRES_IN`),
  carrying `sub`, `organizationId`, `email`, `roles`, and a flattened `permissions`
  array so authorization *and* tenant-scoping checks never hit the database.
- **Refresh tokens** — opaque random tokens (not JWTs), stored as a SHA-256 hash in
  `refresh_tokens`. Every `/v1/auth/refresh` call rotates the token: the old one is
  revoked and a new one issued in the same token "family". If a *revoked* token is
  presented again, the entire family is revoked — that's theft/reuse detection.
- **Passwords** — hashed with `bcryptjs` (pure JS, no native bindings — avoids
  Alpine/Docker musl-libc prebuild issues), cost factor configurable via
  `BCRYPT_SALT_ROUNDS`.
- **RBAC** — `User` ⟷ `Role` ⟷ `Permission` (many-to-many via join tables), scoped
  per-`Organization`. The seed script creates a full permission catalog
  (`backend/packages/common/src/rbac/permissions.catalog.ts`) and a `SuperAdmin`
  role holding all of them.
- **Multi-tenancy** — every request is scoped to exactly one `Organization`.
  Isolation is enforced at the data-access layer, not just the API layer: a Prisma
  Client Extension (`TenantPrismaService`, see
  [`docs/LLD/phase-3-multi-tenancy-foundation.md` §4](docs/LLD/phase-3-multi-tenancy-foundation.md#4-tenant-isolation-enforcement))
  automatically scopes every query against `Site`/`Building`/`Floor`/`Zone`/`User`/`Role`
  to the caller's organization, reading tenant context from an `AsyncLocalStorage`
  established by a global interceptor right after the JWT is validated. A caller
  cannot forget the filter because there is no code path that skips it.
- **Rate limiting** — `@nestjs/throttler`, 100 req/min per client by default
  (`THROTTLE_LIMIT`/`THROTTLE_TTL_MS`), 5/min on `POST /v1/auth/login` specifically.

### Endpoints

| Method & path | Auth | Description |
|---|---|---|
| `POST /v1/auth/login` | Public | Returns access + refresh tokens |
| `POST /v1/auth/refresh` | Public | Rotates a refresh token, returns a new pair |
| `POST /v1/auth/logout` | Bearer | Revokes the given refresh token |
| `GET /v1/auth/me` | Bearer | Returns the decoded token payload |
| `GET/POST/PATCH/DELETE /v1/users` | Bearer + `users:*` | User CRUD (delete = deactivate), tenant-scoped |
| `GET/POST/PATCH/DELETE /v1/roles` | Bearer + `roles:*` | Role CRUD, `PATCH /v1/roles/:id/permissions` to reassign, tenant-scoped |
| `GET/PATCH /v1/organizations/me` | Bearer + `organizations:*` | Read/update the caller's own organization |
| `GET/POST/PATCH/DELETE /v1/sites` | Bearer + `sites:*` | Site CRUD, tenant-scoped |
| `GET/POST/PATCH/DELETE /v1/buildings` | Bearer + `buildings:*` | Building CRUD (`siteId` in body), tenant-scoped |
| `GET/POST/PATCH/DELETE /v1/floors` | Bearer + `floors:*` | Floor CRUD (`buildingId` in body), tenant-scoped |
| `GET/POST/PATCH/DELETE /v1/zones` | Bearer + `zones:*` | Zone CRUD (`floorId` in body), tenant-scoped |
| `GET/POST/PATCH/DELETE /v1/cameras` | Bearer + `cameras:*` | Camera CRUD (RTSP/ONVIF/USB/FILE), tenant-scoped; list filters by `zoneId`/`siteId`/`groupId`/`status`/`sourceType` |
| `POST /v1/cameras/test-connection` | Bearer + `cameras:test-connection` | Pre-save RTSP/ONVIF reachability check (ffprobe), no persistence |
| `POST /v1/cameras/:id/test-connection` | Bearer + `cameras:test-connection` | Re-checks a saved camera, updates its health fields |
| `POST /v1/cameras/discover` | Bearer + `cameras:discover` | ONVIF WS-Discovery sweep, returns candidates, no persistence |
| `GET/POST/PATCH/DELETE /v1/camera-groups` | Bearer + `camera-groups:*` | Camera group CRUD, tenant-scoped |
| `POST/DELETE /v1/camera-groups/:id/cameras/:cameraId` | Bearer + `camera-groups:update` | Add/remove a camera from a group |
| `GET /v1/audit-logs` | Bearer + `audit-logs:read` | Paginated, filterable audit trail, always scoped to the caller's own organization |

## Coding standards

Strict TypeScript, dependency injection, SOLID, domain-driven module boundaries,
class-validator DTO validation, structured logging, global exception handling,
Swagger-documented APIs, Docker support for every service, environment-based
configuration validated at boot.

## Roadmap

Superseded and expanded from the original 10-phase plan once the full platform
spec (`docs/SRS.md`/`docs/HLD.md`) was defined — see `HLD.md` §13 for the complete
mapping of every functional module to a phase.

| Phase | Scope | Status |
|-------|-------|--------|
| 1 | Project scaffolding, Docker Compose, Prisma, logging, Swagger, health checks | ✅ Done |
| 2 | Authentication (JWT, refresh tokens, RBAC, audit logs) | ✅ Done |
| 3 | Multi-Tenancy & Platform Foundation Hardening (Org/Site/Building/Floor/Zone, tenant isolation, NestJS 11 + Fastify migration, rate limiting) | ✅ Done |
| 4 | Camera Management Service | Implemented — needs `prisma migrate dev` + integration tests against a real Postgres/ffprobe locally |
| 5 | Streaming Service (RTSP/FFmpeg) | Not started |
| 6 | AI Inference Service (YOLO, pluggable detectors) | Not started |
| 7 | Tracking Service | Not started |
| 8 | Event Engine | Not started |
| 9 | Rules Engine | Not started |
| 10 | Notification Engine | Not started |
| 11 | Incident Management | Not started |
| 12 | Recording Engine | Not started |
| 13 | Reports & Analytics | Not started |
| 14 | Dashboard (real-time API/WebSocket surface) | Not started |
| 15 | AI Search | Not started |
| 16 | Frontend (Next.js) | Not started until 4–15 are complete and approved |
| 17 | Mobile (React Native) | Not started until Frontend is complete and approved |
| 18 | DevOps hardening (Kubernetes, Terraform, full CI/CD) | Layered in incrementally |
| 19 | Documentation completion (deployment guide, user guide, DR plan) | Alongside DevOps phase |
