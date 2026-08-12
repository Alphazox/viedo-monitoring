"""Enrolls several synthetic 'known suspect' profiles as watchlisted gait
subjects, so the gallery demo doesn't start with just one entry.

Same logic as `POST /gait/demo/seed-gallery` (app/gait/seed.py).

    docker compose run --rm ai-service python -m scripts.seed_gait_gallery
"""

from pathlib import Path

from app.gait.gallery import GaitGallery
from app.gait.seed import seed_gallery
from app.gait.service import GaitRecognitionService


def main() -> None:
    app_dir = Path(__file__).resolve().parent.parent
    data_dir = app_dir / "data" / "gait"
    service = GaitRecognitionService(data_dir / "model" / "gait_embedding_net.pt")
    gallery = GaitGallery(data_dir / "gallery")

    enrolled = seed_gallery(app_dir, service, gallery)
    for entry in enrolled:
        print(f"Enrolled {entry['label']} ({entry['subjectId']})")


if __name__ == "__main__":
    main()
