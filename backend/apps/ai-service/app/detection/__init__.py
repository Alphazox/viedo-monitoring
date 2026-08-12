"""Person detection + tracking, integrated into ai-service (not a separate
service), feeding both app/gait/ and app/activity/.

Real pretrained models, not synthetic: YOLOv8 (COCO-pretrained, detects the
'person' class) for per-frame detection, and DeepSORT (deep-sort-realtime)
for re-identifying the same person across frames within a clip. This is a
demo-scale instance of the platform's target PersonDetector/TrackerPlugin
architecture (docs/HLD.md §5) — an in-process pipeline, not the registry-
driven, per-Organization/Zone-configurable plugin system described there
(Postgres-backed enable/disable, Model Registry, GPU batching scheduler).
docs/SRS.md FR-TRACK-01/02 stay `Planned` for that reason even though this
demo exists, the same convention already used for FR-AI-07 vs. app/gait/.

Scope note: YOLOv8's COCO weights were trained on real photographs. This
repo's own self-generated synthetic demo clips
(scripts/make_demo_gait_videos.py, scripts/make_activity_scenarios.py) draw
crude stick-figures on flat backgrounds via cv2.line/cv2.circle — they do not
look like people to a real detector, so track_people() returns [] for them
by design. app/gait/service.py and app/activity/motion.py fall back to the
previous whole-frame background-subtraction heuristic whenever that happens,
so this repo's own one-click demo buttons keep working; real footage of real
people goes through actual detection + tracking instead.
"""
