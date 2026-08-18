import logging
from pathlib import Path

import numpy as np
import torch

from embeddings.gei import build_gei
from embeddings.model import GaitEmbeddingNet
from embeddings.silhouette import extract_silhouettes, read_video_frames
from inference.pipeline import track_people

logger = logging.getLogger(__name__)

# Fixed seed so a fresh deployment (no saved weights yet) is reproducible run
# to run — see embeddings/__init__.py for what this untrained model does and
# doesn't prove.
INIT_SEED = 1337


class GaitRecognitionService:
    def __init__(self, weights_path: Path) -> None:
        if weights_path.exists():
            model = GaitEmbeddingNet()
            model.load_state_dict(torch.load(weights_path, map_location="cpu"))
            logger.info("Loaded gait embedding weights from %s", weights_path)
        else:
            torch.manual_seed(INIT_SEED)
            model = GaitEmbeddingNet()
            weights_path.parent.mkdir(parents=True, exist_ok=True)
            torch.save(model.state_dict(), weights_path)
            logger.info("Initialized new gait embedding weights at %s (seed=%d)", weights_path, INIT_SEED)

        model.eval()
        self._model = model

    def embed_video(self, video_path: str) -> np.ndarray:
        # Real YOLO+DeepSORT detection/tracking first (detection/, tracking/);
        # falls back to the legacy whole-frame background-subtraction
        # heuristic only if no person was detected — e.g. this repo's own
        # synthetic demo clips, which don't look like people to a real
        # detector (see detection/__init__.py).
        tracks = track_people(video_path)
        frames = tracks[0].roi_crops() if tracks else read_video_frames(video_path)

        silhouettes = extract_silhouettes(frames)
        gei = build_gei(silhouettes)
        tensor = torch.from_numpy(gei).unsqueeze(0).unsqueeze(0)  # (1, 1, H, W)
        with torch.no_grad():
            embedding = self._model(tensor)
        return embedding.squeeze(0).numpy()
