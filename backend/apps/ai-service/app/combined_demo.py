"""One clip, both detectors: generates a single synthetic video of a person
approaching and loitering at a restricted entrance after hours, then runs it
through the suspicious-activity zone heuristic (app/activity/) AND gait
re-identification against the current gallery (app/gait/) — the two
subsystems aren't separate pipelines, just two independent views over the
same tracked subject and the same footage.
"""

from pathlib import Path

from app.activity.service import DEFAULT_ZONE, evaluate_and_alert
from app.alerts_store import alert_log
from app.api.routes.gait import _gallery as gait_gallery
from app.api.routes.gait import _service as gait_service
from app.core.config import get_settings
from app.gait.watch import evaluate_watch
from scripts.make_activity_scenarios import NIGHT_BACKGROUND, generate_approach_and_loiter


def run_combined_demo(app_dir: Path) -> dict:
    videos_dir = app_dir / "data" / "demo_videos"
    videos_dir.mkdir(parents=True, exist_ok=True)

    clip = videos_dir / "combined_intruder.mp4"
    generate_approach_and_loiter(clip, background_level=NIGHT_BACKGROUND)

    activity_outcome = evaluate_and_alert(str(clip), alert_log, DEFAULT_ZONE, "Intruder")

    embedding = gait_service.embed_video(str(clip))
    settings = get_settings()
    gait_outcome = evaluate_watch(embedding, gait_gallery, alert_log, settings.gait_alert_threshold)

    return {
        "video": clip.name,
        "activity": activity_outcome,
        "gait": gait_outcome,
    }
