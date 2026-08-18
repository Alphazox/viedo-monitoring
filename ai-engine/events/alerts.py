import json
import logging
from datetime import UTC, datetime
from pathlib import Path
from typing import Literal
from uuid import uuid4

from atomic_write import atomic_write_text

logger = logging.getLogger(__name__)

# Contract fixed by the dashboard frontend this service is built against —
# do not rename these fields or values (see ai-engine/README.md). New types
# may be added (e.g. "fall_detected") as long as the frontend's AlertType
# union in lib/api/aiEngineClient.ts is updated to match.
AlertType = Literal["person_detected", "loitering", "watchlist_match", "intrusion", "fall_detected"]
AlertSeverity = Literal["info", "warning", "critical"]


class AlertLog:
    """Shared alert history for every detector in this service (gait watch,
    suspicious activity). Every alert serializes to exactly:
    {id, type, severity, message, camera_label, created_at}.
    """

    def __init__(self, storage_path: Path, cooldown_seconds: float = 0.0) -> None:
        self._storage_path = storage_path
        self._storage_path.parent.mkdir(parents=True, exist_ok=True)
        # Suppresses re-firing the same (type, camera_label) alert while a
        # condition (e.g. a subject still loitering) keeps being detected on
        # every automated /pipeline/ingest-clip poll -- see
        # INTRUSION_COOLDOWN_SECONDS in inference/config.py. 0 disables it.
        self._cooldown_seconds = cooldown_seconds
        self._alerts: list[dict] = []
        self._load()

    def _load(self) -> None:
        if self._storage_path.exists():
            self._alerts = json.loads(self._storage_path.read_text())

    def _save(self) -> None:
        atomic_write_text(self._storage_path, json.dumps(self._alerts, indent=2))

    def _within_cooldown(self, type: AlertType, camera_label: str | None) -> bool:
        if self._cooldown_seconds <= 0:
            return False
        now = datetime.now(UTC)
        for existing in reversed(self._alerts):
            if existing["type"] != type or existing["camera_label"] != camera_label:
                continue
            age = (now - datetime.fromisoformat(existing["created_at"])).total_seconds()
            return age < self._cooldown_seconds
        return False

    def record(
        self,
        type: AlertType,
        severity: AlertSeverity,
        message: str,
        camera_label: str | None = None,
    ) -> dict | None:
        if self._within_cooldown(type, camera_label):
            return None
        alert = {
            "id": uuid4().hex,
            "type": type,
            "severity": severity,
            "message": message,
            "camera_label": camera_label,
            "created_at": datetime.now(UTC).isoformat(),
        }
        self._alerts.append(alert)
        self._save()
        logger.warning(
            "[SIMULATED NOTIFICATION] %s (type=%s, severity=%s) — would dispatch via a configured "
            "channel (Email/SMS/Slack/Webhook not implemented)",
            message,
            type,
            severity,
        )
        return alert

    def list_alerts(self) -> list[dict]:
        return list(self._alerts)
