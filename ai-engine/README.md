# ai-engine

Standalone FastAPI microservice: the real computer-vision pipeline (YOLOv8
person detection, DeepSORT tracking, gait recognition via Gait Energy Images
+ a small CNN, and a suspicious-activity rule) ported from the prior
`video-analytics-platform` project's `backend/apps/ai-service`.

Runs independently on port 8001. Nothing outside `ai-engine/` depends on it
yet — no other part of this repo has been changed to call it.

## Layout

- `detection/` — YOLOv8 person detector (COCO 'person' class only).
- `tracking/` — DeepSORT wrapper (multi-object tracking within a clip).
- `embeddings/` — silhouette extraction, Gait Energy Image construction, and
  the (untrained, seeded) gait embedding CNN.
- `indexing/` — gait gallery persistence (JSON+.npz) and cosine-similarity
  search.
- `zones/` — configurable rectangular zone concept (e.g. an entrance).
- `events/` — activity rules (after-hours + loitering heuristic) and the
  shared JSON-file-backed alert log.
- `inference/` — pipeline orchestration (`pipeline.py`'s `track_people`),
  the demo-video generator, annotate/visualize helpers, and the FastAPI app
  itself (`inference/main.py`, `inference/routes/`).
- `fall/` — bbox-geometry fall detection (aspect-ratio collapse heuristic,
  no pose model).
- `attributes/`, `search/` — future work, out of scope this round (see each
  directory's README).

## Running natively

```bash
cd ai-engine
python -m venv .venv
.venv/Scripts/activate        # Windows; `source .venv/bin/activate` on Linux/macOS
pip install -r requirements.txt
copy .env.example .env        # or `cp` on Linux/macOS
uvicorn inference.main:app --app-dir . --port 8001
```

Note: on this Windows machine, `torch` failed to import natively
(`PermissionError` loading `torch_cpu.dll`) — this is a documented,
pre-existing issue with the old project on this machine too, not something
introduced by this port. See the Docker instructions below, which is how
this service was actually verified end-to-end.

## Running in Docker (verified path on this machine)

```bash
docker build -t ai-engine ai-engine/
docker run --rm -p 8001:8001 --name ai-engine ai-engine
curl http://localhost:8001/health/live
curl -X POST http://localhost:8001/gait/demo/run
curl -X POST http://localhost:8001/activity/demo/run
```

## docker-compose integration (not wired up by this change)

If/when this service is added to the root `docker-compose.yml`, it should
be a service named `ai-engine`, built from `ai-engine/Dockerfile`, exposing
port `8001`, with `ALLOWED_ORIGINS` pointed at the dashboard origin.

## API contract

This is a frozen contract — a dashboard frontend is already coded against
these exact field names. All alert-shaped JSON (the `/alerts` list and any
`alert` embedded in another response) serializes as:

```json
{
  "id": "<string, unique>",
  "type": "person_detected | loitering | watchlist_match | intrusion | fall_detected",
  "severity": "info | warning | critical",
  "message": "<human-readable string>",
  "camera_label": "<string or null>",
  "created_at": "<ISO-8601 UTC timestamp string>"
}
```

Routes:

- `GET /health/live`, `GET /health/ready`
- `GET /alerts` -> `{"items": [Alert, ...], "total": <int>}`
- `POST /detection/annotate` (multipart `video`) -> `{"video": "<url>", "frames_processed": int, "tracks_found": int, "max_detections_in_frame": int}`
- `POST /detection/demo/run` -> same shape as `/detection/annotate`, run against a locally-supplied sample at `DEMO_DATA_DIR/samples/object-detection-demo.mp4` (404 if missing — not bundled)
- `POST /fall/analyze` (multipart `video`) -> `{"fell": bool, "event": {"track_id","frame_index","timestamp_seconds","aspect_before","aspect_after","confidence"}|null, "threshold": float, "alert": Alert|null, "video_url": "<url>"|null, "frames_processed": int, "frames_sampled": int, "tracks_found": int}`
- `POST /fall/demo/run` -> same shape as `/fall/analyze`, run against a locally-supplied sample at `DEMO_DATA_DIR/samples/fall-demo.mp4` (404 if missing — not bundled)
- `POST /gait/enroll` (multipart `label`, `watchlisted`, `video`) -> `{"subject_id": str, "label": str, "watchlisted": bool}`
- `POST /gait/identify` (multipart `video`, `top_k`) -> `{"matches": [{"subject_id", "label", "similarity", "watchlisted"}, ...]}`
- `GET /gait/gallery` -> `{"subjects": [{"subject_id", "label", "watchlisted"}, ...]}`
- `POST /gait/watch` (multipart `video`) -> `{"match": {...}|null, "alert": Alert|null}`
- `POST /gait/demo/run` -> `{"steps": [...], "alert": Alert|null, "match": {...}|null}` (self-sufficient — generates its own clip)
- `POST /gait/demo/seed-gallery` -> `{"subjects": [...]}` (same shape as `/gait/gallery`)
- `POST /activity/analyze` (multipart `video`) -> `{"analysis": {"suspicious", "is_night", "loiter_frames", "summary", ...}, "alert": Alert|null}`
- `POST /activity/demo/run` -> `{"zone": {...}, "scenarios": [...]}` (self-sufficient)
- `POST /gait/visualize` (multipart `video`) -> `{"video": "<url>", ...}` — diagnostic endpoint outside the original frozen contract, called by the dashboard's "Analyze walking style (gait)" upload button (`frontend/lib/api/aiEngineClient.ts`'s `gaitVisualize`). Needs a real detectable person; synthetic demo clips won't produce a track.
- `POST /pipeline/ingest-clip` (multipart `video`, `camera_id`, `camera_label`; requires `X-Service-Key`, not a user token) -> `{"camera_id": str, "activity_alert": Alert|null, "fall_alert": Alert|null, "fall_stats": {...}|null}` — video-engine's automated per-camera ingestion entry point (see docstring in `inference/routes/pipeline.py`), not called by the browser. video-engine discards the response body today, but the shape is tracked here the same as every other route so a future change to it doesn't go unnoticed.

Every response type above was hand-checked against the contract in the task
brief; the only additions are extra, non-conflicting fields (e.g. `analysis`
carries `mean_brightness`/`approached`/`loitered`/`min_distance`/`zone` in
addition to the four required fields) and the two routes noted above that
sit outside the original frontend contract.

Generated/annotated videos are served back under `/demo-videos/<file>.mp4`
(a static mount over `DEMO_DATA_DIR/demo-videos`) — the `"video"` field in
responses is that URL path, ready to hand to a `<video src=...>` tag once
this service's base URL is known to the frontend.
