"""Gait embedding pipeline: silhouette extraction (MOG2 background
subtraction) -> Gait Energy Image (GEI) -> small CNN embedding.

The embedding CNN (model.py) is architecturally real but intentionally
untrained (fixed seed, random init) — good enough to prove the pipeline is
fully wired end-to-end (same GEI in -> same embedding out, cosine similarity
behaves sanely), not to prove real-world gait-recognition accuracy. Training
a real gait model is out of scope for this round.
"""
