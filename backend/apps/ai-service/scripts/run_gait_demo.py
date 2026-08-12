"""No-server demo: synthesizes gait videos, enrolls one subject, then
identifies two more clips against the gallery.

Run inside the ai-service Docker container (or anywhere torch imports
successfully — it currently doesn't on this Windows dev machine, see the
PermissionError loading torch_cpu.dll):

    docker compose run --rm ai-service python -m scripts.run_gait_demo
"""

from pathlib import Path

from app.gait.gallery import GaitGallery
from app.gait.service import GaitRecognitionService
from scripts.make_demo_gait_videos import generate_demo_set


def main() -> None:
    app_dir = Path(__file__).resolve().parent.parent
    videos = generate_demo_set(app_dir / "data" / "demo_videos")

    data_dir = app_dir / "data" / "gait_demo_run"
    service = GaitRecognitionService(data_dir / "model" / "gait_embedding_net.pt")
    gallery = GaitGallery(data_dir / "gallery")

    alice_embedding = service.embed_video(str(videos["subject_a_walk1"]))
    gallery.enroll("alice", "Alice", alice_embedding)
    print("Enrolled Alice from subject_a_walk1.mp4")

    for description, key in [
        ("Alice, second clip (same synthetic gait params)", "subject_a_walk2"),
        ("Subject B (different stride/bounce)", "subject_b_walk1"),
    ]:
        embedding = service.embed_video(str(videos[key]))
        matches = gallery.identify(embedding, top_k=1)
        best = matches[0] if matches else None
        print(f"{description}: best match = {best}")


if __name__ == "__main__":
    main()
