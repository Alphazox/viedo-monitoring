import logging
from dataclasses import dataclass
from pathlib import Path

import numpy as np
from ultralytics import YOLO

logger = logging.getLogger(__name__)

# COCO class id for 'person' — the only class detect() cares about.
# detect_objects() below is unfiltered and reports whatever COCO class YOLO finds.
COCO_PERSON_CLASS_ID = 0
DEFAULT_CONFIDENCE = 0.4


@dataclass
class Detection:
    bbox: tuple[int, int, int, int]  # x1, y1, x2, y2, pixel coords
    confidence: float
    class_name: str = "person"


class PersonDetector:
    """Wraps a pretrained YOLOv8 model (COCO weights), filtered to the
    'person' class. Weights (~6MB, yolov8n.pt by default) are downloaded by
    ultralytics on first use and cached under `weights_dir`.
    """

    def __init__(
        self, weights_dir: Path, model_name: str = "yolov8n.pt", confidence: float = DEFAULT_CONFIDENCE
    ) -> None:
        weights_dir.mkdir(parents=True, exist_ok=True)
        weights_path = weights_dir / model_name
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

    def detect_objects(self, frame: np.ndarray) -> list[Detection]:
        """Like detect(), but unfiltered — reports every COCO class YOLO
        finds (person, car, bag, chair, ...), not just people. Used by the
        object-detection demo/upload endpoints, which are meant to show
        whatever's actually in frame rather than only people.

        Passes classes=None explicitly (not just omitting the kwarg):
        ultralytics caches a predictor on the model and only overrides args
        actually passed on each predict() call, so omitting `classes` here
        would silently keep a `classes=[0]` filter left over from a prior
        detect() call on this same shared model instance (gait/fall/activity
        all call detect() first) — every "detect all objects" call would
        then quietly stay person-only for the rest of the process lifetime.
        """
        results = self._model.predict(frame, conf=self._confidence, classes=None, verbose=False)
        names = results[0].names
        detections = []
        for box in results[0].boxes:
            x1, y1, x2, y2 = (int(v) for v in box.xyxy[0].tolist())
            class_name = names.get(int(box.cls[0]), "object")
            detections.append(
                Detection(bbox=(x1, y1, x2, y2), confidence=float(box.conf[0]), class_name=class_name)
            )
        return detections
