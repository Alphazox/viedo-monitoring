# fall

Bbox-geometry fall detection (no pose model) — see `detector.py`. Tracks each
person's bounding-box aspect ratio and flags a fall when it collapses from a
standing baseline within a short window. Exposed via `/fall/analyze` (upload
your own clip) and `/fall/demo/run` (runs against a locally-supplied sample
at `DEMO_DATA_DIR/samples/fall-demo.mp4` — not bundled in the image or repo).
