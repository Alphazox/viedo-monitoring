"""Visualizes what GaitRecognitionService.embed_video actually does to a
clip — until this existed, the pipeline (YOLO+DeepSORT track -> MOG2
background subtraction -> contour cleanup -> Gait Energy Image -> CNN
embedding) only ever produced a numeric vector, no visible proof of any
intermediate step. This draws all three OpenCV stages live, every frame:

  1. the raw MOG2 foreground mask (noisy — shadows, edges, motion blur)
  2. the cleaned silhouette (largest contour above an area threshold)
  3. the Gait Energy Image building up as a running average of (2), which
     IS the actual signature fed to the embedding model — not computed
     separately for display, this is the literal accumulator build_gei
     would produce, just rendered on every frame instead of only at the end
"""

from pathlib import Path

import cv2
import numpy as np

from app.detection.pipeline import Track
from app.gait.gei import _normalize_silhouette
from app.gait.silhouette import MIN_SILHOUETTE_AREA
from scripts.make_demo_gait_videos import _transcode_to_h264

PANEL_SIZE = 96
PANEL_GAP = 8
PANEL_MARGIN = 12
GEI_HOLD_SECONDS = 2.5


def _mog2_stages(crops: list[np.ndarray]) -> list[tuple[np.ndarray, np.ndarray]]:
    """Runs the same two-pass MOG2 extraction as silhouette.extract_silhouettes
    (learn background, then extract with learning frozen), but returns both
    the raw per-frame foreground mask AND the cleaned silhouette for every
    frame — extract_silhouettes only returns the latter, and drops frames
    outright rather than returning a blank, which would break this file's
    frame-for-frame alignment with track.frames/track.bboxes.
    """
    bg_subtractor = cv2.createBackgroundSubtractorMOG2(history=len(crops), varThreshold=25, detectShadows=False)
    for crop in crops:
        bg_subtractor.apply(crop, learningRate=0.05)

    stages = []
    for crop in crops:
        raw = bg_subtractor.apply(crop, learningRate=0)
        blurred = cv2.medianBlur(raw, 5)
        contours, _ = cv2.findContours(blurred, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        clean = np.zeros_like(blurred)
        if contours:
            largest = max(contours, key=cv2.contourArea)
            if cv2.contourArea(largest) >= MIN_SILHOUETTE_AREA:
                cv2.drawContours(clean, [largest], -1, 255, thickness=cv2.FILLED)
        stages.append((raw, clean))
    return stages


def _overlay_mask_on_crop(crop: np.ndarray, mask: np.ndarray) -> np.ndarray:
    """A binary mask alone (0/255 dots on black) is unreadable at panel size
    when the silhouette is thin — this tints the actual dimmed crop green
    wherever the mask fired instead, so even a faint contour reads clearly
    against the real image it came from."""
    gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
    dimmed_bgr = cv2.cvtColor((gray.astype(np.float32) * 0.45).astype(np.uint8), cv2.COLOR_GRAY2BGR)
    green = np.zeros_like(dimmed_bgr)
    green[:, :, 1] = 255
    alpha = (mask.astype(np.float32) / 255.0)[..., None]
    return (dimmed_bgr * (1 - alpha) + green * alpha).astype(np.uint8)


def _panel(image_bgr: np.ndarray, index: int) -> tuple[np.ndarray, int, int]:
    """One inset panel (already BGR), stacked top-to-bottom by `index`."""
    panel = cv2.resize(image_bgr, (PANEL_SIZE, PANEL_SIZE), interpolation=cv2.INTER_NEAREST)
    x = PANEL_MARGIN
    y = PANEL_MARGIN + index * (PANEL_SIZE + PANEL_GAP + 20)
    return panel, x, y


def _draw_panel(out: np.ndarray, image_bgr: np.ndarray, label: str, index: int) -> None:
    panel, x, y = _panel(image_bgr, index)
    out[y : y + PANEL_SIZE, x : x + PANEL_SIZE] = panel
    cv2.rectangle(out, (x, y), (x + PANEL_SIZE, y + PANEL_SIZE), (0, 255, 0), 1)
    cv2.putText(out, label, (x, y + PANEL_SIZE + 16), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 255, 0), 1, cv2.LINE_AA)


def _draw_overlay(
    frame: np.ndarray,
    bbox: tuple[int, int, int, int],
    crop: np.ndarray,
    raw_mask: np.ndarray,
    clean_mask: np.ndarray,
    running_gei: np.ndarray | None,
) -> np.ndarray:
    x1, y1, x2, y2 = bbox
    out = frame.copy()
    cv2.rectangle(out, (x1, y1), (x2, y2), (0, 255, 0), 2)
    cv2.putText(out, "YOLO+DeepSORT track", (x1, max(y1 - 8, 16)), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 255, 0), 2, cv2.LINE_AA)

    raw_bgr = cv2.cvtColor(raw_mask, cv2.COLOR_GRAY2BGR)
    _draw_panel(out, raw_bgr, "1. MOG2 raw mask", 0)
    _draw_panel(out, _overlay_mask_on_crop(crop, clean_mask), "2. contour cleanup", 1)
    gei_display = (np.clip(running_gei, 0, 1) * 255).astype(np.uint8) if running_gei is not None else np.zeros(
        (128, 64), dtype=np.uint8
    )
    _draw_panel(out, cv2.cvtColor(gei_display, cv2.COLOR_GRAY2BGR), "3. GEI (running avg)", 2)
    return out


def _gei_card(gei: np.ndarray, width: int, height: int) -> np.ndarray:
    card = np.zeros((height, width, 3), dtype=np.uint8)
    gei_u8 = (np.clip(gei, 0, 1) * 255).astype(np.uint8)
    gei_h, gei_w = gei_u8.shape
    scale = min(height * 0.65 / gei_h, width * 0.5 / gei_w)
    disp_w, disp_h = max(1, int(gei_w * scale)), max(1, int(gei_h * scale))
    gei_resized = cv2.resize(gei_u8, (disp_w, disp_h), interpolation=cv2.INTER_NEAREST)
    gei_bgr = cv2.cvtColor(gei_resized, cv2.COLOR_GRAY2BGR)

    ox, oy = (width - disp_w) // 2, (height - disp_h) // 2 - 20
    card[oy : oy + disp_h, ox : ox + disp_w] = gei_bgr
    cv2.rectangle(card, (ox, oy), (ox + disp_w, oy + disp_h), (0, 255, 0), 2)
    cv2.putText(
        # cv2.putText's Hershey fonts only render ASCII — an em dash here
        # silently becomes "???" instead of erroring.
        card, "Gait Energy Image - the extracted signature", (max(ox - 40, 16), oy + disp_h + 36),
        cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 1, cv2.LINE_AA,
    )
    return card


def visualize_gait_extraction(track: Track, output_path: Path, fps: float = 24.0) -> dict:
    crops = track.roi_crops()
    stages = _mog2_stages(crops)

    height, width = track.frames[0].shape[:2]
    output_path.parent.mkdir(parents=True, exist_ok=True)
    writer = cv2.VideoWriter(str(output_path), cv2.VideoWriter_fourcc(*"mp4v"), fps, (width, height))

    # Running mean of normalized silhouettes — this incremental accumulator
    # IS a Gait Energy Image in progress (build_gei just does the same mean
    # in one shot over the final set); rendering it live shows the GEI isn't
    # a black box, it's literally "the average shape so far."
    running_sum: np.ndarray | None = None
    running_count = 0

    for frame, bbox, crop, (raw_mask, clean_mask) in zip(track.frames, track.bboxes, crops, stages):
        normalized = _normalize_silhouette(clean_mask)
        if normalized is not None:
            running_sum = normalized if running_sum is None else running_sum + normalized
            running_count += 1
        running_gei = (running_sum / running_count) if running_count else None

        writer.write(_draw_overlay(frame, bbox, crop, raw_mask, clean_mask, running_gei))

    gei_captured = running_count > 0
    if gei_captured:
        final_gei = running_sum / running_count
        card = _gei_card(final_gei, width, height)
        for _ in range(int(fps * GEI_HOLD_SECONDS)):
            writer.write(card)

    writer.release()
    _transcode_to_h264(output_path)

    return {"framesProcessed": len(track.frames), "geiCaptured": gei_captured, "silhouetteFramesUsed": running_count}
