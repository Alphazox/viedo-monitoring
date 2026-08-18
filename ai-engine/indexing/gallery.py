import json
import os
from pathlib import Path

import numpy as np

from atomic_write import atomic_write_text


class GaitGallery:
    """Enrolled-subject store: subject_id -> (label, embedding). Persisted to
    disk as JSON (metadata) + npz (embeddings) so enrollments survive a
    restart. In-memory dict is the demo's stand-in for a real vector store.

    Field names below (subject_id, watchlisted, similarity) are snake_case
    because they're serialized directly into API responses that a frontend
    is coded against — see ai-engine/README.md's API contract section.
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
        atomic_write_text(self._index_path, json.dumps(self._entries, indent=2))
        # np.savez only appends ".npz" when the given name doesn't already
        # end with it, so naming the temp file with that extension up front
        # means it's written to exactly this path, ready to os.replace().
        tmp_embeddings_path = self._embeddings_path.parent / f".{self._embeddings_path.name}.tmp.npz"
        np.savez(tmp_embeddings_path, **self._embeddings)
        os.replace(tmp_embeddings_path, self._embeddings_path)

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
                "subject_id": sid,
                "label": self._entries[sid]["label"],
                "similarity": score,
                "watchlisted": self._entries[sid].get("watchlisted", False),
            }
            for sid, score in scored[:top_k]
        ]

    def list_subjects(self) -> list[dict]:
        return [
            {"subject_id": sid, "label": entry["label"], "watchlisted": entry.get("watchlisted", False)}
            for sid, entry in self._entries.items()
        ]
