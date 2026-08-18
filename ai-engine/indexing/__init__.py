"""Gait gallery persistence and cosine-similarity search — a JSON+.npz
file-backed stand-in for a real vector index/store, same trade-off as the
old ai-service made deliberately (docs note: no database dependency this
round, see events/alerts.py for the identical pattern applied to alerts).
"""
