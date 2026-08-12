import json
import logging
from datetime import UTC, datetime
from pathlib import Path
from uuid import uuid4

logger = logging.getLogger(__name__)


class AlertLog:
    """Shared alert history for every detector demo in this service (gait
    watch, suspicious-activity) — a simplified stand-in for the platform's
    future Event -> Rules -> Alert -> Notification pipeline (docs/HLD.md
    §7), which isn't built yet. Alerts are appended here and a notification
    is only *simulated* (logged) — no real channel (Email/SMS/Slack/Webhook)
    is wired up.
    """

    def __init__(self, storage_path: Path) -> None:
        self._storage_path = storage_path
        self._storage_path.parent.mkdir(parents=True, exist_ok=True)
        self._alerts: list[dict] = []
        self._load()

    def _load(self) -> None:
        if self._storage_path.exists():
            self._alerts = json.loads(self._storage_path.read_text())

    def _save(self) -> None:
        self._storage_path.write_text(json.dumps(self._alerts, indent=2))

    def record(self, kind: str, label: str, severity: str, message: str, metadata: dict | None = None) -> dict:
        alert = {
            "id": uuid4().hex,
            "timestamp": datetime.now(UTC).isoformat(),
            "kind": kind,
            "label": label,
            "severity": severity,
            "message": message,
            "metadata": metadata or {},
        }
        self._alerts.append(alert)
        self._save()
        logger.warning(
            "[SIMULATED NOTIFICATION] %s (kind=%s, severity=%s) — would dispatch via a configured channel "
            "(Email/SMS/Slack/Webhook not implemented; see docs/HLD.md §7)",
            message,
            kind,
            severity,
        )
        return alert

    def list_alerts(self) -> list[dict]:
        return list(self._alerts)
