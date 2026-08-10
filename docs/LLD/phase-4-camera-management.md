# LLD — Phase 4: Camera Management

**Satisfies:** FR-CAM-01 to FR-CAM-07 (`SRS.md` §3.3).
**Precondition:** Phase 3 (Multi-Tenancy & Platform Foundation Hardening) merged — this phase builds on `TenantPrismaService`, `TENANT_SCOPED_MODELS`, and the Zone hierarchy exactly as they landed there.
**Out of scope for this phase:** actual RTSP frame ingestion/decoding pipeline (Phase 5, Streaming Service — this phase only proves a stream is *reachable and decodable*, it never pulls frames continuously), AI processing of any kind (Phase 6+), recording/storage of clips (Phase 12 — this phase only stores the *configuration intent*), object storage integration for uploaded video files (no S3/MinIO exists in this repo yet per `HLD.md` §8 — deferred until a phase actually needs it), PTZ *control* (this phase captures PTZ *capability metadata* only, issuing move/zoom commands is deferred to whichever phase first needs it, likely Dashboard).

---

## 1. Build order and why

1. **Schema** — `Camera`, `CameraGroup`, `CameraGroupMembership`, plus the three new enums. Additive only (no existing table touched except `Zone`/`Organization` gaining a back-relation, which is a no-op at the DB level).
2. **Credential encryption util** (`packages/common/src/crypto/encryption.util.ts`) and its env var — built and unit-tested before anything stores a secret with it, same reasoning as Phase 2 building `password.util.ts` before `AuthService` needed it.
3. **`TENANT_SCOPED_MODELS`** gains `Camera` and `CameraGroup` (the comment already left in that file in Phase 3 says exactly this). `CameraGroupMembership` is deliberately **not** added — same reasoning as `UserRole`/`RolePermission`: it's a join table reached only through an already-scoped `Camera` or `CameraGroup` query, never queried standalone.
4. **`CameraConnectionCheckService`** (ffprobe wrapper) — built and tested in isolation (it's a `child_process` boundary, the highest-risk piece of this phase) before the `CamerasService` that calls it.
5. **Cameras module** — CRUD + `test-connection`, wired to `TenantPrismaService` and `CameraConnectionCheckService` from the start, same shape as every module Phase 3 built.
6. **Camera Groups module** — CRUD + membership add/remove endpoints.
7. **ONVIF discovery** — `OnvifDiscoveryService` + `POST /v1/cameras/discover`, built last because it's the item most likely to hit an environment-specific snag (see §5's risk flag) and I don't want it blocking the other six items if it does.
8. **Health polling** — `@nestjs/schedule` cron job, added once the connection-check service and Camera model both exist, since it's just those two wired to a timer.
9. **Permission catalog** — new keys added, seed script picks them up automatically (it iterates `PERMISSION_DEFINITIONS`, no seed-script code change needed — verified against `backend/packages/database` seed source before writing this).
10. **Verification** — build/lint/unit tests here; DB- and ffprobe-dependent integration tests on your machine, same sandbox constraint noted in every prior phase's LLD.

This is also the order I'll implement in, once approved.

---

## 2. Schema design

```prisma
enum CameraSourceType {
  RTSP
  ONVIF
  USB
  FILE
}

enum CameraStatus {
  UNKNOWN   // never checked
  ONLINE
  OFFLINE
  DEGRADED  // reserved — not produced by this phase, see §6
}

enum RecordingMode {
  CONTINUOUS
  EVENT_ONLY
  OFF
}

model Camera {
  id                    String            @id @default(uuid())
  organizationId        String
  zoneId                String?
  name                  String
  sourceType            CameraSourceType  @default(RTSP)

  // RTSP / ONVIF connection — credentials are never stored inline in rtspUrl,
  // see §3.
  rtspUrl               String?
  rtspUsername          String?
  rtspPasswordEnc       String?

  // USB / uploaded-file sources — see "Out of scope" above for FILE.
  usbDevicePath         String?
  fileSourceUri         String?

  // ONVIF discovery result (FR-CAM-04)
  onvifDeviceInfo       Json?             // { manufacturer, model, firmwareVersion, endpoint }
  ptzCapable            Boolean           @default(false)

  // Health (FR-CAM-06)
  status                CameraStatus      @default(UNKNOWN)
  lastCheckedAt         DateTime?
  lastFrameAt           DateTime?         // set by Phase 5 once real ingestion exists; unused here
  streamErrorCount      Int               @default(0)
  lastError             String?

  // Recording configuration intent (FR-CAM-07) — enforced by Phase 12
  recordingMode         RecordingMode     @default(EVENT_ONLY)
  retentionDaysOverride Int?

  isActive              Boolean           @default(true)
  createdAt             DateTime          @default(now())
  updatedAt             DateTime          @updatedAt

  organization Organization            @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  zone         Zone?                   @relation(fields: [zoneId], references: [id], onDelete: SetNull)
  groups       CameraGroupMembership[]

  @@index([organizationId])
  @@index([zoneId])
  @@index([status])
  @@map("cameras")
}

model CameraGroup {
  id             String   @id @default(uuid())
  organizationId String
  name           String
  description    String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  organization Organization            @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  members      CameraGroupMembership[]

  @@unique([organizationId, name])
  @@index([organizationId])
  @@map("camera_groups")
}

model CameraGroupMembership {
  cameraId String
  groupId  String
  addedAt  DateTime @default(now())

  camera Camera      @relation(fields: [cameraId], references: [id], onDelete: Cascade)
  group  CameraGroup @relation(fields: [groupId], references: [id], onDelete: Cascade)

  @@id([cameraId, groupId])
  @@map("camera_group_memberships")
}
```

**Changes to existing models:** `Zone` gains `cameras Camera[]` (back-relation only). `Organization` gains `cameras Camera[]` and `cameraGroups CameraGroup[]` (back-relation only). Neither is a schema-breaking change — pure additive migration, same category as Phase 3's `Organization`/nullable-FK step.

`zoneId` is nullable, `onDelete: SetNull` — mirrors `SRS.md` FR-ORG-02 ("Cameras are assigned to a Zone, or left unassigned pending setup") and means deleting a Zone unassigns its cameras rather than deleting them.

---

## 3. Credential handling

RTSP credentials need to be **reversible** (Phase 5's stream-service has to actually connect with them), unlike user passwords, so `bcryptjs` (one-way) doesn't apply here — this needs symmetric encryption, a new primitive.

- **`packages/common/src/crypto/encryption.util.ts`** — `encrypt(plain, keyBase64)` / `decrypt(ciphertext, keyBase64)` using Node's built-in `crypto`, AES-256-GCM. Output format: `base64(iv[12] + authTag[16] + ciphertext)`, one self-contained string per encrypted field, no separate columns for iv/tag.
- **New env var** `CAMERA_CREDENTIALS_ENCRYPTION_KEY` — 32-byte key, base64-encoded, added to `apiEnvSchema` with a `.refine()` checking the decoded length is exactly 32 bytes (fail fast at boot, not on first camera save).
- **Input parsing:** a client may paste a URL with embedded credentials (`rtsp://user:pass@host:554/stream`) or supply `rtspUrl` (bare) plus `rtspUsername`/`rtspPassword` separately. `CamerasService.create`/`update` always parses the incoming URL first; if userinfo is present it's extracted and stripped before anything is persisted, so the plaintext `rtspUrl` column **never** contains a credential, even transiently, even if a caller sends one. The password half is encrypted immediately with the util above; the plaintext password is never written to a variable that outlives the request handler (no logging, no audit-log metadata field carries it — audit coverage for this module is addressed in §9).
- **Response shape:** `CameraResponseDto`/`toPublicCamera` mapper (same pattern as `toPublicUser`) omits `rtspPasswordEnc` entirely and exposes `hasCredentials: boolean` instead. `rtspUsername` is returned as-is (not secret on its own).
- **Who decrypts:** only `CameraConnectionCheckService`, at the moment it needs to build the real connection URL to hand to `ffprobe` — decrypted value lives in a local variable for the duration of one `execFile` call and is never logged (see §4's injection note — this is also why it must never reach a shell string).

---

## 4. Connection validation (FR-CAM-02)

Phase 5 doesn't exist yet, so there is no long-running ingestion process to ask "is this camera reachable." This phase implements a **bounded, synchronous point-in-time check** — good enough to satisfy FR-CAM-02 and to seed FR-CAM-06's health status — and Phase 5 supersedes it with real, continuous frame telemetry rather than polling.

- **`CameraConnectionCheckService.check(target)`** shells out to `ffprobe` (bundled with FFmpeg) via `child_process.execFile` — **`execFile` with an argv array, never `exec` with an interpolated string** — the RTSP URL is user-supplied input and string-interpolating it into a shell command would be a command-injection vector.
  ```
  ffprobe -v error -rtsp_transport tcp -timeout 5000000
          -i <url-with-credentials-injected-in-memory>
          -show_entries stream=codec_type -of json
  ```
  Bounded twice: `-timeout` (ffprobe-side, microseconds) as the soft bound, plus `execFile`'s own `timeout`/`killSignal` option (~8s) as a hard kill in case ffprobe itself hangs past its own flag — defense in depth, not redundant.
- Success = exit code 0 and at least one `"codec_type": "video"` entry in the parsed JSON. Anything else (non-zero exit, timeout, no video stream) is a failure with a captured `lastError` string (stderr, truncated).
- **Decision — soft-validate, not hard-gate:** `create()`/`update()` run this check and persist its result (`status`, `lastCheckedAt`, `lastError`) but do **not** reject the write on a failed check. Rationale: cameras are routinely registered before they're physically racked/powered, and hard-gating would make onboarding order-dependent for no real safety benefit — FR-CAM-02 is read here as "the platform must be able to tell you the stream doesn't work," not "the platform must refuse to remember a camera that doesn't work yet." A malformed `rtspUrl` (fails `class-validator`/URL parsing, sourceType mismatch, etc.) *is* still a hard 400 — only *reachability* failures are soft. Flagging this explicitly since it's a product call, not a purely technical one — happy to flip it to hard-gate if you'd rather.
- **`POST /v1/cameras/test-connection`** — same check, pre-save (no `id`, body = candidate connection details), for a "Test Connection" button in whatever UI eventually calls this API, without needing to create-then-maybe-delete a camera row.
- **`POST /v1/cameras/:id/test-connection`** — re-runs the check against a saved camera and updates its `status`/`lastCheckedAt`/`lastError`/`streamErrorCount` (increments on failure, resets to 0 on success).
- Only applies to `sourceType` `RTSP`/`ONVIF` (both are RTSP URLs at the transport level once ONVIF's media profile is resolved — see §5). `USB`/`FILE` cameras skip this check (no network stream to probe from the API container) and stay `UNKNOWN` until Phase 5.

---

## 5. ONVIF discovery (FR-CAM-04)

- New dependency: `onvif` (npm) for WS-Discovery (multicast probe) and the device-management/media SOAP calls needed to read manufacturer/model/firmware and PTZ capability.
- **`POST /v1/cameras/discover`** — triggers a bounded (~5s) WS-Discovery sweep on the API host's network, returns a list of candidate devices (address, manufacturer/model if the probe response includes it) **without persisting anything** — the caller then `POST /v1/cameras` with `sourceType: ONVIF` and the chosen device's address to actually add it, at which point the service opens a device-management connection to pull full capability/profile info (including the RTSP stream URI for that device's media profile, which is what `rtspUrl` gets populated with for an ONVIF camera) and PTZ service presence (→ `ptzCapable`).
- **Verification risk flag (resolve during implementation, not assumed here):** WS-Discovery relies on UDP multicast, which is unreliable across a Docker bridge network by default — the `api` container may not see multicast traffic from cameras on the host's LAN under `docker-compose.yml`'s current bridge network config. This needs to be proven against a real or simulated ONVIF device during implementation; if multicast doesn't traverse cleanly, the fallback is host networking for this specific call path, or dropping automatic discovery to a manual "enter IP:port, I'll query it directly via unicast device-management SOAP" flow as the day-one path (capability capture still works either way — only the "scan my network for cameras" convenience is at risk).

---

## 6. Camera health (FR-CAM-06) — interim design

There's no live ingestion process yet to report `lastFrameAt`/errors from, so this phase uses **scheduled polling** as a stand-in, explicitly temporary:

- `@nestjs/schedule` (new dependency) drives a cron job — every 2 minutes, re-run `CameraConnectionCheckService.check` against every `isActive` camera with `sourceType` `RTSP`/`ONVIF`, across all organizations (this job runs outside any request's `TenantContext`, so it uses the unscoped `PrismaService` directly, the same escape hatch Phase 3 documented for cross-cutting background work).
- Concurrency-capped (max 5 concurrent `ffprobe` processes) so a large camera count doesn't fork-bomb the API container — this is the first thing to move to a proper worker queue (BullMQ, Phase 5's territory) once camera counts justify it; 2-minute polling of, say, a few hundred cameras from a single process is a deliberately cheap stopgap, not the target architecture in `HLD.md` §6.
- `status` only ever becomes `ONLINE`/`OFFLINE`/`UNKNOWN` from this phase's code. `DEGRADED` is defined in the enum now (so Phase 5 doesn't need a migration to add it) but nothing produces it yet — that requires real frame-rate/drop telemetry, which only exists once Phase 5's ingestion pipeline is live.
- Aggregation per site (SRS: "aggregable per site") is a `GET /v1/cameras?siteId=...` query plus client-side/DTO-level rollup, not a new endpoint — camera → zone → floor → building → site is already a walkable chain.

---

## 7. New API surface

| Method & path | Auth | Description |
|---|---|---|
| `POST /v1/cameras` | Bearer + `cameras:create` | Create a camera; runs connection check (soft, §4) if RTSP/ONVIF |
| `GET /v1/cameras` | Bearer + `cameras:read` | Paginated list; filters: `zoneId`, `siteId`, `groupId`, `status`, `sourceType` |
| `GET /v1/cameras/:id` | Bearer + `cameras:read` | Single camera |
| `PATCH /v1/cameras/:id` | Bearer + `cameras:update` | Update; re-runs connection check if connection fields changed |
| `DELETE /v1/cameras/:id` | Bearer + `cameras:delete` | Hard delete |
| `POST /v1/cameras/test-connection` | Bearer + `cameras:test-connection` | Pre-save connectivity check, no persistence |
| `POST /v1/cameras/:id/test-connection` | Bearer + `cameras:test-connection` | Re-check a saved camera, updates its health fields |
| `POST /v1/cameras/discover` | Bearer + `cameras:discover` | ONVIF WS-Discovery sweep, returns candidates, no persistence |
| `GET/POST/PATCH/DELETE /v1/camera-groups` | Bearer + `camera-groups:*` | Group CRUD, tenant-scoped |
| `POST /v1/camera-groups/:id/cameras/:cameraId` | Bearer + `camera-groups:update` | Add a camera to a group |
| `DELETE /v1/camera-groups/:id/cameras/:cameraId` | Bearer + `camera-groups:update` | Remove a camera from a group |

New permission keys (added to `PERMISSIONS`/`PERMISSION_DEFINITIONS`, `SuperAdmin` picks them up automatically via the existing seed logic): `cameras:create`, `cameras:read`, `cameras:update`, `cameras:delete`, `cameras:test-connection`, `cameras:discover`, `camera-groups:create`, `camera-groups:read`, `camera-groups:update`, `camera-groups:delete`.

`CamerasService.create`/`update` validate `zoneId` (when provided) resolves to a Zone within the caller's tenant before writing — same `findUnique` + `NotFoundException` pattern `ZonesService.create` already uses for `floorId`.

---

## 8. Infra / dependency changes

- `backend/apps/api/Dockerfile` needs `ffmpeg` installed (provides `ffprobe`) — not currently in the image (verified: today's Dockerfile only installs Node deps). Flagged here so it isn't a surprise at container-build time.
- New npm dependencies in `backend/apps/api`: `onvif`, `@nestjs/schedule`.
- No new services in `docker-compose.yml` — everything in this phase runs inside the existing `api` container.

---

## 9. Testing strategy

- **Unit** — `encryption.util.ts` round-trip (encrypt→decrypt equality, tampered ciphertext throws). URL-credential-parsing logic (embedded `user:pass@` extracted and stripped correctly; bare URLs pass through unchanged). `CameraConnectionCheckService` with `child_process` mocked — verify `execFile` is called with an argv array (never a template string) and that a decrypted password never appears in anything passed to a logger.
- **Unit** — `CamerasService`: zoneId validated against tenant scope; soft-validate behavior (write succeeds even when the mocked connection check fails, health fields still get set).
- **Integration (your machine — same sandbox constraint as every prior phase)** — real `ffprobe` against a known-good public test RTSP stream and a deliberately-unreachable one, confirming both branches of §4. Cross-tenant isolation on `Camera`/`CameraGroup` (Org A's token 404s on Org B's camera by ID, never appears in Org B's list) — this is the same regression shape Phase 3 required for Site/Building/Floor/Zone, extended to the two new tenant-scoped models.
- **Manual smoke, once deployed** — `POST /v1/cameras/discover` against a real or emulated ONVIF device (resolves §5's risk flag one way or the other), `ffprobe` actually present and runnable inside the built Docker image.

---

## 10. What I will *not* do in this phase

- No actual continuous frame ingestion — `ffprobe` here is a one-shot reachability probe, not a stream reader (Phase 5).
- No object storage wiring for uploaded video files (`FILE` source type is modeled, not functional — no upload endpoint, no storage backend exists in this repo yet).
- No PTZ control (move/zoom/preset commands) — capability metadata only.
- No enforcement of `recordingMode`/`retentionDaysOverride` — configuration is stored, nothing acts on it yet (Phase 12).
- No move to a job queue for health polling — a capped in-process cron is the stopgap; BullMQ-based polling is Phase 5's territory once it exists anyway.
- No audit-log entries for camera CRUD — `AuditService` today is only wired into `AuthService`; Site/Building/Floor/Zone/User/Role CRUD don't call it either, so adding it just for Camera would be inconsistent scope-creep rather than closing a real gap. Worth a dedicated pass across *all* CRUD modules later, not smuggled into this one.

---

Ready to implement in the order in §1, pending your go-ahead. The one item above I'd genuinely like your call on before I start is the soft-validate-vs-hard-gate decision in §4 — everything else I'm treating as a normal implementation-level call, flagged for visibility rather than blocking on it.
