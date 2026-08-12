from dataclasses import dataclass

from app.activity.motion import mean_frame_brightness, track_centroids

# Mean grayscale value (0-255) below which a clip is treated as "after
# hours" — a heuristic threshold tuned against this demo's synthetic clips
# (background_level=15 for "night", 140 for "day" — see
# scripts/make_activity_scenarios.py), not calibrated against real footage.
NIGHT_BRIGHTNESS_THRESHOLD = 60.0


@dataclass
class EntranceZone:
    """A rectangular region in frame pixel coordinates representing a
    monitored entrance/premises boundary — the demo's stand-in for the
    platform's real Zone entity (docs/HLD.md §4.2), which isn't wired up
    to this standalone ai-service."""

    x1: int
    y1: int
    x2: int
    y2: int

    def distance_to(self, x: int, y: int) -> float:
        cx = min(max(x, self.x1), self.x2)
        cy = min(max(y, self.y1), self.y2)
        return ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5


def evaluate_premises_approach(
    video_path: str,
    zone: EntranceZone,
    proximity_radius: float = 40.0,
    min_loiter_frames: int = 10,
) -> dict:
    """Flags a clip as suspicious only if it's dark (proxy for after-hours)
    AND the tracked subject spent a sustained number of frames close to the
    entrance zone (proxy for loitering rather than passing through) —
    neither signal alone is treated as suspicious.
    """
    brightness = mean_frame_brightness(video_path)
    is_night = brightness < NIGHT_BRIGHTNESS_THRESHOLD

    trajectory = track_centroids(video_path)
    distances = [zone.distance_to(x, y) for x, y in trajectory.centroids]
    dwell_frames = sum(1 for d in distances if d <= proximity_radius)
    min_distance = min(distances) if distances else float("inf")
    approached = min_distance <= proximity_radius
    loitered = dwell_frames >= min_loiter_frames

    return {
        "isNight": is_night,
        "meanBrightness": round(brightness, 1),
        "approached": approached,
        "loitered": loitered,
        "dwellFrames": dwell_frames,
        "minDistance": round(min_distance, 1) if distances else None,
        "suspicious": is_night and approached and loitered,
    }
