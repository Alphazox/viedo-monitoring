from app.activity.rules import EntranceZone, evaluate_premises_approach
from app.alerts import AlertLog

# Matches the entrance target used by scripts/make_activity_scenarios.py's
# approach-and-loiter clips; a real deployment would configure this per
# camera/zone (docs/HLD.md §4.2) rather than hardcoding it.
DEFAULT_ZONE = EntranceZone(x1=220, y1=80, x2=300, y2=190)

# Above this dwell-frame count, treat the alert as critical rather than warning.
CRITICAL_DWELL_FRAMES = 40


def evaluate_and_alert(
    video_path: str,
    alert_log: AlertLog,
    zone: EntranceZone = DEFAULT_ZONE,
    label: str = "Unidentified person",
) -> dict:
    result = evaluate_premises_approach(video_path, zone)

    alert = None
    if result["suspicious"]:
        severity = "critical" if result["dwellFrames"] >= CRITICAL_DWELL_FRAMES else "warning"
        message = (
            f"{label} lingered near the entrance after hours for {result['dwellFrames']} frames "
            f"(mean brightness {result['meanBrightness']}, min distance {result['minDistance']}px)"
        )
        alert = alert_log.record(
            kind="suspicious_activity",
            label=label,
            severity=severity,
            message=message,
            metadata=result,
        )

    return {"analysis": result, "alert": alert}
