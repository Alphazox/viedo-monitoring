from events.alerts import AlertLog
from events.motion import mean_frame_brightness, track_centroids
from zones import Zone

# Mean grayscale value (0-255) below which a clip is treated as "after
# hours" — a heuristic threshold tuned against this demo's synthetic clips
# (background_level=15 for "night", 140 for "day" — see
# inference/demo_videos.py), not calibrated against real footage.
NIGHT_BRIGHTNESS_THRESHOLD = 60.0

# Above this dwell-frame count, treat the alert as critical rather than warning.
CRITICAL_DWELL_FRAMES = 40


def evaluate_premises_approach(
    video_path: str,
    zone: Zone,
    proximity_radius: float = 40.0,
    min_loiter_frames: int = 10,
) -> dict:
    """Flags a clip as suspicious only if it's dark (proxy for after-hours)
    AND the tracked subject spent a sustained number of frames close to the
    monitored zone (proxy for loitering rather than passing through) —
    neither signal alone is treated as suspicious.

    `min_loiter_frames` is a frame count, not
    LOITERING_THRESHOLD_SECONDS-derived — see inference/config.py's comment
    on why the second-based env var isn't wired through to this heuristic
    yet (the synthetic demo clips are only a few seconds long).
    """
    brightness = mean_frame_brightness(video_path)
    is_night = brightness < NIGHT_BRIGHTNESS_THRESHOLD

    trajectory = track_centroids(video_path)
    distances = [zone.distance_to(x, y) for x, y in trajectory.centroids]
    dwell_frames = sum(1 for d in distances if d <= proximity_radius)
    min_distance = min(distances) if distances else float("inf")
    approached = min_distance <= proximity_radius
    loitered = dwell_frames >= min_loiter_frames
    suspicious = is_night and approached and loitered

    summary = (
        f"Suspicious activity: after-hours (mean brightness {brightness:.1f}) and "
        f"{dwell_frames} frames dwelling near '{zone.name}' (min distance {min_distance:.1f}px)"
        if suspicious
        else f"No suspicious activity — is_night={is_night}, approached={approached}, loitered={loitered}"
    )

    return {
        "suspicious": suspicious,
        "is_night": is_night,
        "loiter_frames": dwell_frames,
        "summary": summary,
        # Extra diagnostic fields, not required by the API contract but
        # useful for debugging/inspection.
        "mean_brightness": round(brightness, 1),
        "approached": approached,
        "loitered": loitered,
        "min_distance": round(min_distance, 1) if distances else None,
        "zone": zone.as_dict(),
    }


def evaluate_and_alert(
    video_path: str,
    alert_log: AlertLog,
    zone: Zone,
    camera_label: str | None = None,
) -> dict:
    result = evaluate_premises_approach(video_path, zone)

    alert = None
    if result["suspicious"]:
        severity = "critical" if result["loiter_frames"] >= CRITICAL_DWELL_FRAMES else "warning"
        alert = alert_log.record(
            type="loitering",
            severity=severity,
            message=result["summary"],
            camera_label=camera_label,
        )

    return {"analysis": result, "alert": alert}
