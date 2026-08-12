import json
from pathlib import Path

import numpy as np


class GaitGallery:
    """Enrolled-subject store: subject_id -> (label, embedding). Persisted to
    disk as JSON (metadata) + npz (embeddings) so enrollments survive a
    restart. In-memory dict is the demo's stand-in for a real vector store.
    """

    def __init__(self, storage_dir: Path) -> None:
        self._storage_dir = storage_dir
        self._storage_dir.mkdir(parents=True, exist_ok=True)
        self._index_path = self._storage_dir / "gallery.json"
        self._embeddings_path = self._storage_dir / "embeddings.npz"
        self._entries: dict[str, dict] = {}
        self._embeddings: dict[str, np.ndarray] = {}
        self._load()

    def _load(self) -> None:
        if self._index_path.exists():
            self._entries = json.loads(self._index_path.read_text())
        if self._embeddings_path.exists():
            data = np.load(self._embeddings_path)
            self._embeddings = {key: data[key] for key in data.files}

    def _save(self) -> None:
        self._index_path.write_text(json.dumps(self._entries, indent=2))
        np.savez(self._embeddings_path, **self._embeddings)

    def enroll(self, subject_id: str, label: str, embedding: np.ndarray, watchlisted: bool = False) -> None:
        self._entries[subject_id] = {"label": label, "watchlisted": watchlisted}
        self._embeddings[subject_id] = embedding
        self._save()

    def identify(self, embedding: np.ndarray, top_k: int = 3) -> list[dict]:
        if not self._embeddings:
            return []
        # Embeddings are L2-normalized, so the dot product is cosine similarity.
        scored = [
            (subject_id, float(np.dot(embedding, enrolled)))
            for subject_id, enrolled in self._embeddings.items()
        ]
        scored.sort(key=lambda item: item[1], reverse=True)
        return [
            {
                "subjectId": sid,
                "label": self._entries[sid]["label"],
                "similarity": score,
                "watchlisted": self._entries[sid].get("watchlisted", False),
            }
            for sid, score in scored[:top_k]
        ]

    def list_subjects(self) -> list[dict]:
        return [
            {"subjectId": sid, "label": entry["label"], "watchlisted": entry.get("watchlisted", False)}
            for sid, entry in self._entries.items()
        ]
