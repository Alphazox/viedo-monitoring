# AegisVision AI

A video monitoring platform: RTSP camera ingestion and live streaming, YOLO/DeepSORT-based person
detection and tracking, gait-based re-identification, activity/loitering and fall heuristics, and a
Next.js operator dashboard.

## Architecture

| Service | Path | Role | Port |
|---|---|---|---|
| `backend` | `backend/` | FastAPI + Postgres. Auth, orgs/users/sites/cameras, the source of truth for camera config. | 8000 |
| `ai-engine` | `ai-engine/` | FastAPI. YOLOv8 + DeepSORT detection/tracking, gait re-id, activity/fall heuristics, alerts. | 8001 |
| `video-engine` | `video-engine/` | FastAPI. RTSP ingestion, live HLS streaming, snapshots/clips, periodically forwards buffered clips to ai-engine for analysis. | 8002 |
| `frontend` | `frontend/` | Next.js operator dashboard. | 3000 |
| `postgres` | — | Backend's database (pgvector image, for future embedding search). | 5432 |
| `redis` | — | Reserved for backend background jobs (not yet wired up to a worker). | 6379 |

**Auth model**: the backend issues a JWT on login. `ai-engine` and `video-engine` validate the same
token (shared `JWT_SECRET`) rather than running separate logins — see `ai-engine/inference/security.py`.
Service-to-service calls (`video-engine` → `backend`/`ai-engine`) use a separate shared
`SERVICE_API_KEY` via an `X-Service-Key` header, since there's no logged-in user on that path.

**Video pipeline**: `video-engine` connects to each enabled camera's `stream_url` (or loops a local demo
clip if a camera has none set, so the whole pipeline works without real camera hardware), publishes a
live HLS stream the frontend plays with `hls.js`, writes periodic snapshots/clips, and forwards short
clips to `ai-engine`'s `POST /pipeline/ingest-clip` for automated analysis — the resulting alerts land in
the same feed manual uploads produce.

## Local development

Requires Docker and Docker Compose.

```bash
cp .env.example .env
# Edit .env: at minimum change JWT_SECRET, SERVICE_API_KEY, POSTGRES_PASSWORD, REDIS_PASSWORD,
# and SEED_ADMIN_PASSWORD away from their placeholder values.

docker compose up --build
```

This starts all five services, runs backend migrations, and seeds a demo organization/admin user/site
with a few demo cameras (see `scripts/seed.py`). Once it's up:

- Dashboard: http://localhost:3000
- Backend API docs: http://localhost:8000/docs
- ai-engine API docs: http://localhost:8001/docs
- Log in with the seeded admin (`SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD` from `.env`).

Demo cameras have no `stream_url` set, so `video-engine` loops
`storage/uploads/sample-walking-realistic.mp4` for them — add a real RTSP camera from the Cameras page
to ingest an actual feed.

## Environment variables

See `.env.example` (root, read by `backend` and `ai-engine` via docker-compose) for the full list, with
inline comments on what each controls. `ai-engine/.env.example` and `frontend`'s
`NEXT_PUBLIC_*` variables are documented separately for running those services standalone, outside
docker-compose.

## Tests

```bash
# Backend and ai-engine/video-engine need their dev dependencies installed (requirements-dev.txt) and,
# for the backend, a reachable Postgres (TEST_DATABASE_URL, defaults to localhost:5432/aegisvision_test).
cd backend && pytest
cd ai-engine && pytest
cd video-engine && pytest

cd frontend && npm test
```

CI (`.github/workflows/ci.yml`) runs lint + tests for all three Python services and lint + test + build
for the frontend on every push/PR to `main`.
