from pathlib import Path

from app.alerts_store import alert_log
from app.gait.gallery import GaitGallery
from app.gait.service import GaitRecognitionService
from app.gait.watch import evaluate_watch
from scripts.make_demo_gait_videos import generate, split_video

DEFAULT_ALERT_THRESHOLD = 0.85


def run_alert_demo(app_dir: Path, threshold: float = DEFAULT_ALERT_THRESHOLD) -> dict:
    """Runs the single-video enroll -> watch -> alert demo end-to-end and
    returns a structured trace of each stage. Shared by scripts/run_alert_demo.py
    (CLI) and POST /gait/demo/run (API) so both paths exercise identical logic.
    """
    videos_dir = app_dir / "data" / "demo_videos"
    videos_dir.mkdir(parents=True, exist_ok=True)

    full_clip = videos_dir / "full_walk.mp4"
    enroll_clip = videos_dir / "full_walk_part1_enroll.mp4"
    watch_clip = videos_dir / "full_walk_part2_watch.mp4"

    generate(full_clip, stride=28, bounce=6, limb_len=55, duration_s=6)
    split_video(full_clip, enroll_clip, watch_clip)

    data_dir = app_dir / "data" / "gait_alert_demo_run"
    service = GaitRecognitionService(data_dir / "model" / "gait_embedding_net.pt")
    gallery = GaitGallery(data_dir / "gallery")

    enroll_embedding = service.embed_video(str(enroll_clip))
    subject_label = "Unauthorized Visitor (Watchlisted)"
    gallery.enroll("visitor-1", subject_label, enroll_embedding, watchlisted=True)

    watch_embedding = service.embed_video(str(watch_clip))
    result = evaluate_watch(watch_embedding, gallery, alert_log, threshold)

    return {
        "steps": [
            {"step": "generate", "detail": f"Generated {full_clip.name}, a 6s synthetic walking clip"},
            {
                "step": "split",
                "detail": f"Split into {enroll_clip.name} (enroll half) and {watch_clip.name} (watch half)",
            },
            {"step": "enroll", "detail": f"Enrolled '{subject_label}' from the first half"},
            {"step": "watch", "detail": "Ran the second half through the watch pipeline"},
        ],
        "match": result["match"],
        "alert": result["alert"],
        "threshold": threshold,
    }
