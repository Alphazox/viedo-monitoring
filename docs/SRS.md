# Software Requirements Specification (SRS)

**Product:** AI Video Analytics Platform
**Class:** Enterprise CCTV/IP camera video analytics platform (Vidisky AI / Milestone XProtect / BriefCam / Avigilon / Genetec class)
**Document status:** Draft v1 — covers the full platform vision. Individual modules are implemented across phases; see [Status] tags per requirement and the Roadmap in `HLD.md`.

---

## 1. Introduction

### 1.1 Purpose

This document specifies the functional and non-functional requirements for a multi-tenant SaaS-capable AI video analytics platform. It is software-only: no camera or edge hardware is developed. The platform must work against customer-owned RTSP/ONVIF CCTV cameras, USB/webcams, and uploaded video files.

### 1.2 Scope

The platform ingests live video, runs pluggable AI detection/tracking models, generates events against configurable rules, raises multi-channel alerts, manages incidents end to end, retains recordings under configurable policy, and reports on all of the above — for organizations ranging from a single site with 10 cameras to multi-region enterprises with 10,000+ cameras. A REST/WebSocket API is the system of record; web (Next.js) and mobile (React Native) clients, built after the backend is complete, consume it.

### 1.3 Definitions

| Term | Meaning |
|---|---|
| Tenant / Organization | A customer account; the top-level isolation boundary. |
| Site | A physical location owned by an Organization (e.g. a campus). |
| Zone | A logical area within a Building/Floor a rule or detector can target (e.g. "Loading Dock"). |
| Event | A discrete AI/system observation (e.g. `person.entered_zone`). |
| Incident | A human-managed case, optionally built from one or more Events. |
| Detector | A pluggable AI model implementing the platform's detection contract. |
| RBAC | Role-Based Access Control. |
| NLP Search | Natural-language query over indexed detection metadata ("find people wearing red shirts yesterday"). |

### 1.4 References

Comparable products: Vidisky AI, Milestone XProtect, BriefCam, Avigilon Unity, Genetec Security Center. Standards referenced: OWASP ASVS, OWASP Top 10, ONVIF Profile S/T (camera interoperability, ready-for, not implemented against real devices yet).

---

## 2. Overall Description

### 2.1 Product perspective

New product, greenfield backend, built incrementally. Current implementation state (as of this document):

- **Done:** project scaffolding (monorepo, Docker Compose, CI), Authentication & RBAC (JWT access + rotating opaque refresh tokens, permission-based guards, audit logging) — single-tenant.
- **Next (gating):** multi-tenancy retrofit + Fastify migration (foundation hardening, no new customer-facing features).
- **Not started:** every other module below.

### 2.2 User classes

| Class | Description |
|---|---|
| Platform Owner | Operates the SaaS across all tenants (support, billing-adjacent, not implemented yet). |
| Organization Admin | Full control within one tenant: users, roles, sites, cameras, rules. |
| Operator | Day-to-day monitoring: dashboard, live alerts, incident handling. |
| Viewer | Read-only: dashboards, reports, recorded footage per their permission grant. |
| Integration / Service Account | Machine-to-machine API key access (webhooks, external systems). |

### 2.3 Operating environment

Docker Compose for development; Kubernetes-ready for production (any of AWS/Azure/GCP or on-prem). Cloud-agnostic storage via an S3-compatible interface (MinIO in dev, S3/Azure Blob/GCS in production).

### 2.4 Constraints

- Software only — no hardware/firmware development, no bundled camera devices.
- Must operate against **customer-owned** cameras (RTSP, ONVIF Profile S/T where available, USB/webcam, or uploaded file) — no dependency on a specific camera vendor.
- AI models must be swappable without platform code changes (plugin architecture, not hardcoded model calls).
- Multi-tenant data isolation is a hard requirement, not an optimization.

### 2.5 Assumptions

- Customers provide network reachability to their own RTSP streams (VPN/on-prem gateway is a deployment concern, not a platform feature at this stage).
- GPU inference capacity is provisioned per deployment; the AI service must support CPU fallback for low-camera-count/dev deployments.

---

## 3. Functional Requirements

Each requirement has an ID, a one-line statement, and a status tag: `[Done]`, `[Next]` (the immediately upcoming LLD/phase), or `[Planned]` (scoped, not yet scheduled to a specific phase).

### 3.1 Authentication & Access (FR-AUTH)

| ID | Requirement | Status |
|---|---|---|
| FR-AUTH-01 | Users authenticate with email + password via `POST /auth/login`, receiving a short-lived JWT access token and a rotating opaque refresh token. | Done |
| FR-AUTH-02 | Refresh tokens rotate on use; reuse of a revoked token revokes its entire token family (theft detection). | Done |
| FR-AUTH-03 | `POST /auth/logout` revokes the presented refresh token. | Done |
| FR-AUTH-04 | Every route requires a valid access token by default; routes opt out explicitly (`@Public()`). | Done |
| FR-AUTH-05 | Authorization is permission-based RBAC: roles bundle permission keys; a guard checks the caller's token-embedded permissions against each route's declared requirement. | Done |
| FR-AUTH-06 | All authentication events (login success/failure, refresh, logout, token reuse detection) are written to an immutable audit log. | Done |
| FR-AUTH-07 | Forgot-password flow: request reset (email with time-limited token), reset with token. | Planned |
| FR-AUTH-08 | MFA-ready: TOTP enrollment and challenge step in the login flow, gated by an org-level policy flag. | Planned |
| FR-AUTH-09 | OAuth2/OIDC login (Google Workspace, Microsoft Entra ID) as an alternative to password login, per-organization configurable. | Planned |
| FR-AUTH-10 | API keys for service accounts (machine-to-machine), scoped to a subset of permissions, revocable, never expire silently without rotation reminders. | Planned |

### 3.2 Organization & Multi-Tenancy (FR-ORG)

| ID | Requirement | Status |
|---|---|---|
| FR-ORG-01 | The platform supports multiple Organizations (tenants); every tenant-owned record is scoped to exactly one Organization. | Next |
| FR-ORG-02 | An Organization contains Sites; a Site contains Buildings; a Building contains Floors; a Floor contains Zones. Cameras are assigned to a Zone (or left unassigned pending setup). | Next |
| FR-ORG-03 | Users and Roles are scoped to an Organization; a user's access token embeds their Organization ID and cannot be used to read/write another Organization's data under any circumstance. | Next |
| FR-ORG-04 | Cross-tenant data leakage must be prevented at the data-access layer (not solely the API layer), so a bug in one endpoint cannot expose another tenant's rows. | Next |
| FR-ORG-05 | A Platform Owner role can operate across tenants for support purposes, with every cross-tenant access explicitly audit-logged. | Planned |

### 3.3 Camera Management (FR-CAM)

| ID | Requirement | Status |
|---|---|---|
| FR-CAM-01 | Add/edit/delete a camera with connection details (RTSP URL, credentials, or ONVIF discovery result). | Planned (Phase after foundation hardening) |
| FR-CAM-02 | Validate an RTSP URL is reachable and returns a decodable stream before saving. | Planned |
| FR-CAM-03 | Support USB/webcam sources and one-off uploaded video files as first-class camera-equivalent sources for testing/offline analysis. | Planned |
| FR-CAM-04 | ONVIF Profile S/T discovery and PTZ-capability metadata capture, where the device supports it. | Planned |
| FR-CAM-05 | Group cameras (arbitrary tags/groups, independent of the Site/Building/Floor/Zone hierarchy) for bulk rule/report targeting. | Planned |
| FR-CAM-06 | Camera health status (online/offline/degraded, last frame timestamp, stream error count) visible per camera and aggregable per site. | Planned |
| FR-CAM-07 | Per-camera recording configuration (continuous / event-only / off, retention override). | Planned |

### 3.4 Live Streaming (FR-STREAM)

| ID | Requirement | Status |
|---|---|---|
| FR-STREAM-01 | Ingest RTSP streams via FFmpeg, extracting frames at a configurable rate for AI processing. | Planned |
| FR-STREAM-02 | Automatic reconnection with backoff on stream failure; failure of one camera must not affect others. | Planned |
| FR-STREAM-03 | Serve a low-latency preview to clients (WebRTC-ready; HLS as a fallback for scale/compatibility). | Planned |
| FR-STREAM-04 | GStreamer-ready pipeline abstraction — FFmpeg is the initial implementation, not a hard dependency baked into calling code. | Planned |
| FR-STREAM-05 | Stream health metrics (fps, dropped frames, bitrate) exposed per camera. | Planned |

### 3.5 AI Engine (FR-AI)

| ID | Requirement | Status |
|---|---|---|
| FR-AI-01 | AI detection is invoked through a stable platform-defined contract (input: frame + camera/zone context; output: normalized detections with class, confidence, bounding box). Detector implementations are swappable without changing any caller. | Planned |
| FR-AI-02 | Ship with Person, Vehicle, and Animal detectors (Ultralytics YOLO backed) at launch. | Planned |
| FR-AI-03 | The plugin architecture must support adding, without platform changes: Face Recognition, License Plate Recognition, PPE Detection, Fire/Smoke Detection, Fall Detection, Fight Detection, Weapon Detection, Crowd Detection, Abandoned Object, Tailgating, Intrusion, Line Crossing, Loitering, Parking Violations, Speed Estimation. | Planned |
| FR-AI-04 | A model registry tracks installed detectors, their version, and which are enabled per Organization/Zone. | Planned |
| FR-AI-05 | Inference runs on GPU where available with CPU fallback; batch inference across multiple camera streams sharing a model instance. | Planned |
| FR-AI-06 | ONNX Runtime execution path (in addition to native PyTorch) for portability and inference-speed options; TensorRT-ready for NVIDIA deployments. | Planned |

### 3.6 Tracking (FR-TRACK)

| ID | Requirement | Status |
|---|---|---|
| FR-TRACK-01 | Assign a stable track ID to a detected object across frames within a camera stream. | Planned |
| FR-TRACK-02 | Tracking algorithm is swappable behind a common interface: ByteTrack (default), DeepSORT, OC-SORT. | Planned |
| FR-TRACK-03 | Entry/exit counting per zone derived from track transitions across a zone boundary. | Planned |

### 3.7 Event Engine (FR-EVT)

| ID | Requirement | Status |
|---|---|---|
| FR-EVT-01 | Every meaningful detector/tracker output is normalized into a typed Event (e.g. `person.entered_zone`, `vehicle.detected`, `fire.detected`) and persisted. | Planned |
| FR-EVT-02 | Events carry camera, zone, timestamp, confidence, and a reference to the source detection/clip. | Planned |
| FR-EVT-03 | Events are queryable by type, camera, zone, time range, and (where applicable) tracked object ID. | Planned |

### 3.8 Rules Engine (FR-RULE)

| ID | Requirement | Status |
|---|---|---|
| FR-RULE-01 | Organization Admins define rules as conditions over Events (event type, zone, time window, detection attributes) combined with AND/OR logic. | Planned |
| FR-RULE-02 | A rule's actions may include: generate an Alert at a given severity, call a webhook, trigger an audio warning, and/or fan out to the Notification Engine. | Planned |
| FR-RULE-03 | Rules are evaluated in near-real-time as Events arrive (target: <2s from event ingestion to rule evaluation for critical-severity paths). | Planned |
| FR-RULE-04 | Rules are versioned; edits do not retroactively alter historical Alert records. | Planned |

### 3.9 Notification Engine (FR-NOTIF)

| ID | Requirement | Status |
|---|---|---|
| FR-NOTIF-01 | Deliver notifications via Email, SMS, WhatsApp, Push (mobile), Slack, Microsoft Teams, and generic Webhook. | Planned |
| FR-NOTIF-02 | Each channel is a pluggable adapter behind a common `NotificationChannel` interface; adding a channel does not require touching the Rules Engine. | Planned |
| FR-NOTIF-03 | Per-Organization channel configuration (credentials/webhook URLs) and per-user notification preferences. | Planned |
| FR-NOTIF-04 | Delivery attempts are logged with success/failure and retried with backoff on transient failure. | Planned |

### 3.10 Incident Management (FR-INC)

| ID | Requirement | Status |
|---|---|---|
| FR-INC-01 | An Incident aggregates one or more Events/Alerts with a timeline, evidence (clips, snapshots), notes, status, and assignment. | Planned |
| FR-INC-02 | Incident status workflow: Open → Acknowledged → Investigating → Escalated / Resolved → Closed, with audit trail of transitions. | Planned |
| FR-INC-03 | Evidence attached to an incident is immutable once attached (append-only), to preserve chain of custody. | Planned |

### 3.11 Recording Engine (FR-REC)

| ID | Requirement | Status |
|---|---|---|
| FR-REC-01 | Continuous recording (configurable per camera) and event-triggered clip recording (pre/post-roll around an Event). | Planned |
| FR-REC-02 | Snapshot storage on detection, linked to the originating Event. | Planned |
| FR-REC-03 | Retention policy per camera/Organization (time-based and/or storage-quota-based), with automatic expiry. | Planned |
| FR-REC-04 | Storage is abstracted behind an S3-compatible interface (MinIO in dev, S3/Blob/GCS in production) — no code depends on a specific provider. | Planned |

### 3.12 Reports (FR-RPT)

| ID | Requirement | Status |
|---|---|---|
| FR-RPT-01 | Daily/weekly/monthly/yearly rollups of events, incidents, and camera uptime, exportable (CSV/PDF). | Planned |
| FR-RPT-02 | People/vehicle counting and occupancy reports per zone/site over a selected time range. | Planned |
| FR-RPT-03 | Heat maps of detection density per zone. | Planned |
| FR-RPT-04 | Camera health report (uptime %, stream error rate) per site. | Planned |

### 3.13 Dashboard (FR-DASH)

| ID | Requirement | Status |
|---|---|---|
| FR-DASH-01 | Real-time live alert feed via WebSocket. | Planned |
| FR-DASH-02 | Summary statistics and charts (events by type, active incidents by severity, camera health at a glance). | Planned |
| FR-DASH-03 | System health panel (queue depth, AI worker capacity, stream error rate) for Organization Admins. | Planned |

### 3.14 AI Search (FR-SEARCH)

| ID | Requirement | Status |
|---|---|---|
| FR-SEARCH-01 | Natural-language query over indexed detection attributes (e.g. "white cars", "person carrying a backpack", "everyone who entered Gate 3 between 10pm and midnight"). | Planned |
| FR-SEARCH-02 | Search results return matching clips/snapshots with camera, zone, and timestamp, ranked by relevance/confidence. | Planned |
| FR-SEARCH-03 | Search scope is always tenant-isolated; a query can never surface another Organization's footage. | Planned |

### 3.15 API (FR-API)

| ID | Requirement | Status |
|---|---|---|
| FR-API-01 | REST API, OpenAPI/Swagger-documented, versioned via URI (`/v1/...`). | Done (versioning + Swagger); expands per module |
| FR-API-02 | Rate limiting per API key/user to protect against abuse. | Next-adjacent (add during foundation hardening) |
| FR-API-03 | WebSocket gateway for real-time alert/dashboard push. | Planned |
| FR-API-04 | API keys for service-account, machine-to-machine access, scoped by permission. | Planned |

### 3.16 Security (FR-SEC)

| ID | Requirement | Status |
|---|---|---|
| FR-SEC-01 | RBAC enforced on every route by default (fail-closed: unknown routes require auth unless explicitly public). | Done |
| FR-SEC-02 | Immutable audit log for authentication and administrative actions. | Done (auth actions); expands as new modules ship |
| FR-SEC-03 | Tenant isolation enforced at the data-access layer. | Next |
| FR-SEC-04 | All traffic over TLS; secrets never committed to source (env-based now, secrets-manager-ready later). | Ongoing / Planned (secrets manager) |
| FR-SEC-05 | Input validation on every external input (DTO-level `class-validator`, already the platform convention). | Done (as a convention); enforced per new module |
| FR-SEC-06 | OWASP Top 10 mitigations reviewed per module before release (injection, broken auth, sensitive data exposure, etc.). | Ongoing |

---

## 4. Non-Functional Requirements

### 4.1 Performance & Scale

The platform must support four deployment tiers on the same codebase, differing only in infrastructure sizing:

| Tier | Cameras | Expected topology |
|---|---|---|
| Small | 10 | Single-node Docker Compose viable (as built today); 1 AI worker, CPU inference acceptable. |
| Medium | 100 | Kubernetes cluster, small GPU worker pool, horizontal API replicas, Redis/Postgres managed services. |
| Large | 1,000 | Autoscaling GPU worker pool sized to sustained frame throughput, queue backpressure (BullMQ) to shed load gracefully, Postgres read replicas for reporting queries. |
| Enterprise | 10,000 | Tenant/region-partitioned deployment, dedicated GPU clusters, potential per-large-tenant dedicated stack, multi-region storage. |

Target latencies: API CRUD p95 < 300ms. Critical-severity detection-to-notification end-to-end < 2s (excludes network/RTSP transport variance).

### 4.2 Availability

Control-plane API target: 99.9% monthly availability. A single camera's stream failure must be isolated — it must not degrade the API, other cameras' streams, or the AI pipeline for other tenants.

### 4.3 Security

OWASP ASVS-aligned. Encryption in transit (TLS 1.2+) everywhere. Encryption at rest for stored clips/snapshots (S3/MinIO server-side encryption). Least-privilege RBAC. Audit logs are append-only (no update/delete surface).

### 4.4 Privacy & Compliance Readiness

Biometric-adjacent features (Face Recognition, License Plate Recognition) must be **opt-in per Organization** and flagged distinctly in audit logs, in anticipation of jurisdiction-specific biometric consent laws (e.g. US state biometric privacy statutes). Deployment must support region-pinned storage to accommodate EU data-residency expectations and Middle East customer requirements. This document does not assert legal compliance — it specifies the technical capabilities (consent flags, region pinning, data export/erasure hooks) a compliance program would need.

### 4.5 Scalability & Extensibility

New AI detectors, tracking algorithms, notification channels, and storage backends must be addable via their respective plugin interfaces without modifying the platform's core request/event pipeline.

### 4.6 Observability

Structured JSON logging with correlation IDs (in place via `nestjs-pino`). Health checks per service (in place). Metrics and distributed tracing are Planned (Prometheus/OpenTelemetry-ready).

### 4.7 Maintainability

Strict TypeScript, SOLID, dependency injection, domain-driven module boundaries, unit + integration test coverage per module, environment-based configuration validated at boot (all conventions already established in Phases 1–2 and carried forward).

### 4.8 Disaster Recovery

Postgres point-in-time recovery, S3-compatible storage versioning/replication, infrastructure-as-code (Terraform-ready) for environment reproducibility. Detailed DR runbook is a Planned deliverable alongside the DevOps phase.

---

## 5. External Interface Requirements

- **REST API** — OpenAPI/Swagger-documented, versioned, rate-limited, JWT + API-key auth.
- **WebSocket** — real-time alert/dashboard push.
- **Webhooks (outbound)** — rule-triggered, and general-purpose for external system integration.
- **Notification integrations** — Email (SMTP/provider), SMS, WhatsApp Business API, Slack, Microsoft Teams.
- **Storage** — S3-compatible object storage interface (MinIO dev / S3 or equivalent in production).
- **Camera interface** — RTSP, ONVIF Profile S/T (ready-for), USB/webcam, file upload.

---

## 6. Assumptions & Dependencies

- Customer network connectivity to their cameras is out of this platform's control; the platform must degrade gracefully (per-camera health status) rather than fail globally when a camera is unreachable.
- GPU availability is a deployment-time decision per environment; the platform must remain functional (at reduced throughput) on CPU-only inference for small deployments and development.
- Frontend (Next.js) and Mobile (React Native) are out of scope until every backend module above is implemented and approved, per the stated development methodology.
