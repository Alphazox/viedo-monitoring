import logging
from dataclasses import dataclass
from pathlib import Path

import numpy as np
from ultralytics import YOLO

logger = logging.getLogger(__name__)

# COCO class id for 'person' — the only class this demo cares about.
COCO_PERSON_CLASS_ID = 0
DEFAULT_CONFIDENCE = 0.4


@dataclass
class Detection:
    bbox: tuple[int, int, int, int]  # x1, y1, x2, y2, pixel coords
    confidence: float


class PersonDetector:
    """Wraps a pretrained YOLOv8 model (COCO weights), filtered to the
    'person' class. Weights (~6MB, yolov8n.pt) are downloaded by ultralytics
    on first use and cached under `weights_dir` — same lazy-download-once
    pattern as GaitRecognitionService's weights file.
    """

    def __init__(self, weights_dir: Path, confidence: float = DEFAULT_CONFIDENCE) -> None:
        weights_dir.mkdir(parents=True, exist_ok=True)
        weights_path = weights_dir / "yolov8n.pt"
        self._model = YOLO(str(weights_path))
        self._confidence = confidence
        logger.info("Loaded YOLOv8 person detector from %s", weights_path)

    def detect(self, frame: np.ndarray) -> list[Detection]:
        results = self._model.predict(
            frame, classes=[COCO_PERSON_CLASS_ID], conf=self._confidence, verbose=False
        )
        detections = []
        for box in results[0].boxes:
            x1, y1, x2, y2 = (int(v) for v in box.xyxy[0].tolist())
            detections.append(Detection(bbox=(x1, y1, x2, y2), confidence=float(box.conf[0])))
        return detections
