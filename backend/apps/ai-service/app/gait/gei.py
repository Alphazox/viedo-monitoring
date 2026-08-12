import cv2
import numpy as np

GEI_HEIGHT = 128
GEI_WIDTH = 64


def _normalize_silhouette(mask: np.ndarray) -> np.ndarray | None:
    """Crops to the subject's bounding box, rescales to a fixed height, and
    centers it in a fixed-width canvas — the standard GEI alignment step so
    frame-to-frame position/scale jitter doesn't leak into the representation.
    """
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return None
    x, y, w, h = cv2.boundingRect(max(contours, key=cv2.contourArea))
    if h == 0 or w == 0:
        return None

    cropped = mask[y : y + h, x : x + w]
    scale = GEI_HEIGHT / h
    resized_w = max(1, int(w * scale))
    resized = cv2.resize(cropped, (resized_w, GEI_HEIGHT), interpolation=cv2.INTER_NEAREST)

    canvas = np.zeros((GEI_HEIGHT, GEI_WIDTH), dtype=np.float32)
    rw = min(GEI_WIDTH, resized_w)
    dst_off = (GEI_WIDTH - rw) // 2
    src_off = (resized_w - rw) // 2
    canvas[:, dst_off : dst_off + rw] = resized[:, src_off : src_off + rw]
    return canvas / 255.0


def build_gei(silhouettes: list[np.ndarray]) -> np.ndarray:
    """Builds a Gait Energy Image: the per-pixel average of aligned
    silhouettes over the clip (Han & Bhanu, 2006) — a single image summarizing
    a full walking cycle's shape and motion extent.
    """
    normalized = [n for s in silhouettes if (n := _normalize_silhouette(s)) is not None]
    if not normalized:
        raise ValueError("No valid silhouettes to build a Gait Energy Image from")
    return np.stack(normalized, axis=0).mean(axis=0).astype(np.float32)
