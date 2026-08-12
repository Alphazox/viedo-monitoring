from pathlib import Path

from app.gait.gallery import GaitGallery
from app.gait.service import GaitRecognitionService
from scripts.make_demo_gait_videos import generate

# Varied gait parameters so each seeded profile has a genuinely distinct GEI
# (stride length, vertical bounce, limb length) — not just relabeled copies
# of the same walk. No real suspect data exists to seed with — see
# app/gait/__init__.py for what this demo proves and doesn't.
SUSPECT_PROFILES = [
    {"label": "Suspect #1 (Auto-seeded)", "stride": 30, "bounce": 4, "limb_len": 58},
    {"label": "Suspect #2 (Auto-seeded)", "stride": 12, "bounce": 16, "limb_len": 38},
    {"label": "Suspect #3 (Auto-seeded)", "stride": 22, "bounce": 10, "limb_len": 48},
    {"label": "Suspect #4 (Auto-seeded)", "stride": 34, "bounce": 3, "limb_len": 62},
    {"label": "Suspect #5 (Auto-seeded)", "stride": 18, "bounce": 8, "limb_len": 44},
]


def seed_gallery(app_dir: Path, service: GaitRecognitionService, gallery: GaitGallery) -> list[dict]:
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
    videos_dir = app_dir / "data" / "demo_videos" / "seed_suspects"
    videos_dir.mkdir(parents=True, exist_ok=True)

    enrolled = []
    for i, profile in enumerate(SUSPECT_PROFILES):
        clip_path = videos_dir / f"suspect_{i + 1}.mp4"
        generate(clip_path, stride=profile["stride"], bounce=profile["bounce"], limb_len=profile["limb_len"])
        embedding = service.embed_video(str(clip_path))
        subject_id = f"seed-suspect-{i + 1}"
        gallery.enroll(subject_id, profile["label"], embedding, watchlisted=True)
        enrolled.append({"subjectId": subject_id, "label": profile["label"]})

    return enrolled
