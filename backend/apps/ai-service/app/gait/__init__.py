"""Gait recognition demo, integrated into ai-service (not a separate service).

Pipeline: video -> per-frame silhouettes (OpenCV background subtraction) ->
Gait Energy Image (GEI, the standard hand-engineered gait representation) ->
PyTorch CNN embedding -> cosine-similarity match against an enrolled gallery.

Scope note: the CNN (`model.GaitEmbeddingNet`) ships with fixed, randomly
initialized weights, not weights trained on a real gait dataset (e.g.
CASIA-B) — none is available in this environment. This demonstrates the full
architecture end-to-end (extraction, representation, embedding, matching)
faithfully to how a trained system would be wired, but it is not a
production-accurate recognizer. Training on labeled gait data is the next
step before this could identify real people reliably.
"""
