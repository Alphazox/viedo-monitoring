import numpy as np

from app.alerts import AlertLog
from app.gait.gallery import GaitGallery

CRITICAL_SIMILARITY = 0.95


def evaluate_watch(
    embedding: np.ndarray, gallery: GaitGallery, alert_log: AlertLog, threshold: float
) -> dict:
    """Runs one gait embedding against the gallery and raises an alert if the
    best match is a watchlisted subject scoring at or above `threshold`.
    This is the simplified analog of the platform's future Rules Engine
    evaluating a Detection against configured conditions (docs/HLD.md §7) —
    here the only "rule" is the watchlist flag + a fixed similarity cutoff.
    """
    matches = gallery.identify(embedding, top_k=1)
    best = matches[0] if matches else None

    alert = None
    if best and best["watchlisted"] and best["similarity"] >= threshold:
        severity = "critical" if best["similarity"] >= CRITICAL_SIMILARITY else "warning"
        alert = alert_log.record(
            kind="gait_watch",
            label=best["label"],
            severity=severity,
            message=f"Watchlisted subject '{best['label']}' matched with {best['similarity']:.1%} gait similarity",
            metadata={"subjectId": best["subjectId"], "similarity": best["similarity"]},
        )

    return {"match": best, "alert": alert}
