"""Sends a periodically-buffered clip to ai-engine's automated ingestion
endpoint (POST /pipeline/ingest-clip). Synchronous httpx call — the camera
worker that calls this runs in a plain thread, not an asyncio loop."""
from __future__ import annotations

import logging
from pathlib import Path

import httpx

logger = logging.getLogger(__name__)


def forward_clip(
    ai_engine_url: str,
    service_api_key: str,
    camera_id: str,
    camera_label: str,
    clip_path: Path,
    timeout: float = 30.0,
) -> dict | None:
    try:
        with clip_path.open("rb") as f:
            res = httpx.post(
                f"{ai_engine_url}/pipeline/ingest-clip",
                headers={"X-Service-Key": service_api_key},
                data={"camera_id": camera_id, "camera_label": camera_label},
                files={"video": (clip_path.name, f, "video/mp4")},
                timeout=timeout,
            )
    except httpx.HTTPError as exc:
        logger.warning("Failed to forward clip for camera %s: %s", camera_id, exc)
        return None

    if res.status_code != 200:
        logger.warning("ai-engine rejected clip for camera %s: %s %s", camera_id, res.status_code, res.text)
        return None
    return res.json()
