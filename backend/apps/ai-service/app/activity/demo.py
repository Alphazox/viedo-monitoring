from pathlib import Path

from app.activity.service import DEFAULT_ZONE, evaluate_and_alert
from app.alerts_store import alert_log
from scripts.make_activity_scenarios import (
    DAY_BACKGROUND,
    NIGHT_BACKGROUND,
    generate_approach_and_loiter,
    generate_walk_past,
)


def run_activity_demo(app_dir: Path) -> dict:
    """Generates three contrasting scenarios and evaluates each against the
    suspicious-activity heuristic, showing that BOTH after-hours AND
    loitering are required to trigger — neither alone does. Shared by
    scripts/run_activity_demo.py (CLI) and POST /activity/demo/run (API).
    """
    videos_dir = app_dir / "data" / "demo_videos"
    videos_dir.mkdir(parents=True, exist_ok=True)

    suspicious_clip = videos_dir / "activity_night_loiter.mp4"
    generate_approach_and_loiter(suspicious_clip, background_level=NIGHT_BACKGROUND)

    night_walkby_clip = videos_dir / "activity_night_walkby.mp4"
    generate_walk_past(night_walkby_clip, background_level=NIGHT_BACKGROUND)

    day_loiter_clip = videos_dir / "activity_day_loiter.mp4"
    generate_approach_and_loiter(day_loiter_clip, background_level=DAY_BACKGROUND)

    scenarios = [
        ("Night + loitering near entrance — expected: ALERT", suspicious_clip, "Suspected loiterer"),
        ("Night, just walking past (no loitering) — expected: no alert", night_walkby_clip, "Passerby"),
        ("Daytime loitering near entrance — expected: no alert", day_loiter_clip, "Daytime visitor"),
    ]

    results = []
    for description, clip_path, label in scenarios:
        outcome = evaluate_and_alert(str(clip_path), alert_log, DEFAULT_ZONE, label)
        results.append({"description": description, "video": clip_path.name, **outcome})

    return {
        "zone": {"x1": DEFAULT_ZONE.x1, "y1": DEFAULT_ZONE.y1, "x2": DEFAULT_ZONE.x2, "y2": DEFAULT_ZONE.y2},
        "scenarios": results,
    }
