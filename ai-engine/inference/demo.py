"""Orchestrates the self-sufficient demo endpoints: each generates its own
synthetic clip(s) on the fly (into DEMO_DATA_DIR/demo-videos), so none of
them require a separate manual script run first.
"""

from pathlib import Path

from embeddings.service import GaitRecognitionService
from events.activity_rules import evaluate_and_alert
from events.alerts import AlertLog
from events.watch import evaluate_watch
from indexing.gallery import GaitGallery
from inference.demo_videos import (
    DAY_BACKGROUND,
    NIGHT_BACKGROUND,
    SUSPECT_PROFILES,
    generate,
    generate_approach_and_loiter,
    generate_walk_past,
    split_video,
)
from zones import DEFAULT_ENTRANCE_ZONE

DEFAULT_ALERT_THRESHOLD = 0.85


def demo_videos_dir(data_dir: Path) -> Path:
    return data_dir / "demo-videos"


def run_gait_alert_demo(
    data_dir: Path,
    service: GaitRecognitionService,
    gallery: GaitGallery,
    alert_log: AlertLog,
    threshold: float = DEFAULT_ALERT_THRESHOLD,
) -> dict:
    """Runs the single-video enroll -> watch -> alert demo end-to-end and
    returns a structured trace of each stage."""
    videos_dir = demo_videos_dir(data_dir)
    videos_dir.mkdir(parents=True, exist_ok=True)

    full_clip = videos_dir / "full_walk.mp4"
    enroll_clip = videos_dir / "full_walk_part1_enroll.mp4"
    watch_clip = videos_dir / "full_walk_part2_watch.mp4"

    generate(full_clip, stride=28, bounce=6, limb_len=55, duration_s=6)
    split_video(full_clip, enroll_clip, watch_clip)

    enroll_embedding = service.embed_video(str(enroll_clip))
    subject_label = "Unauthorized Visitor (Watchlisted)"
    gallery.enroll("visitor-1", subject_label, enroll_embedding, watchlisted=True)

    watch_embedding = service.embed_video(str(watch_clip))
    result = evaluate_watch(watch_embedding, gallery, alert_log, threshold)

    return {
        "steps": [
            {
                "step": "generate",
                "detail": f"Generated {full_clip.name}, a 6s synthetic walking clip",
                "video_url": f"/demo-videos/{full_clip.name}",
            },
            {
                "step": "split",
                "detail": f"Split into {enroll_clip.name} (enroll half) and {watch_clip.name} (watch half)",
                "video_url": f"/demo-videos/{enroll_clip.name}",
            },
            {
                "step": "enroll",
                "detail": f"Enrolled '{subject_label}' from the first half",
                "video_url": f"/demo-videos/{enroll_clip.name}",
            },
            {
                "step": "watch",
                "detail": "Ran the second half through the watch pipeline",
                "video_url": f"/demo-videos/{watch_clip.name}",
            },
        ],
        "match": result["match"],
        "alert": result["alert"],
        "threshold": threshold,
    }


def seed_gallery(data_dir: Path, service: GaitRecognitionService, gallery: GaitGallery) -> list[dict]:
    """Enrolls several synthetic 'known suspect' profiles as watchlisted
    subjects into the real, persistent gallery (the same one /gait/enroll
    and /gait/watch use) so it doesn't start with just one entry.

    `service`/`gallery` must be the caller's live instances rather than ones
    constructed fresh here — GaitGallery keeps its enrolled entries in
    memory and only persists to disk as a side effect, so a second,
    independently-constructed instance pointed at the same directory would
    write to disk correctly but leave the process's actual in-memory
    gallery (the one /gait/watch and /gait/gallery read from) unaware any
    seeding happened.
    """
    videos_dir = demo_videos_dir(data_dir) / "seed_suspects"
    videos_dir.mkdir(parents=True, exist_ok=True)

    enrolled = []
    for i, profile in enumerate(SUSPECT_PROFILES):
        clip_path = videos_dir / f"suspect_{i + 1}.mp4"
        generate(clip_path, stride=profile["stride"], bounce=profile["bounce"], limb_len=profile["limb_len"])
        embedding = service.embed_video(str(clip_path))
        subject_id = f"seed-suspect-{i + 1}"
        gallery.enroll(subject_id, profile["label"], embedding, watchlisted=True)
        enrolled.append(
            {
                "subject_id": subject_id,
                "label": profile["label"],
                "watchlisted": True,
                "video_url": f"/demo-videos/seed_suspects/{clip_path.name}",
            }
        )

    return enrolled


def run_activity_demo(data_dir: Path, alert_log: AlertLog) -> dict:
    """Generates three contrasting scenarios and evaluates each against the
    suspicious-activity heuristic, showing that BOTH after-hours AND
    loitering are required to trigger — neither alone does.
    """
    videos_dir = demo_videos_dir(data_dir)
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
        outcome = evaluate_and_alert(str(clip_path), alert_log, DEFAULT_ENTRANCE_ZONE, label)
        results.append(
            {
                "description": description,
                "video": clip_path.name,
                "video_url": f"/demo-videos/{clip_path.name}",
                "camera_label": label,
                **outcome,
            }
        )

    return {"zone": DEFAULT_ENTRANCE_ZONE.as_dict(), "scenarios": results}
