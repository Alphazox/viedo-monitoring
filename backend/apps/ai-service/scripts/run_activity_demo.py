"""Suspicious-activity demo: generates three contrasting scenarios (night +
loitering near an entrance, night walk-by with no loitering, daytime
loitering) and shows the heuristic only alerts when BOTH after-hours AND
loitering hold. Pure OpenCV/numpy — no torch needed, unlike the gait demos.

Same logic as `POST /activity/demo/run` (app/activity/demo.py) — this is the
CLI entry point; the API route is what the frontend's Gait Demo page calls.

    python -m scripts.run_activity_demo
"""

from pathlib import Path

from app.activity.demo import run_activity_demo


def main() -> None:
    app_dir = Path(__file__).resolve().parent.parent
    result = run_activity_demo(app_dir)

    zone = result["zone"]
    print(f"Entrance zone: ({zone['x1']}, {zone['y1']}) - ({zone['x2']}, {zone['y2']})\n")

    for scenario in result["scenarios"]:
        analysis = scenario["analysis"]
        print(f"- {scenario['description']} [{scenario['video']}]")
        print(
            f"    night={analysis['isNight']} (brightness={analysis['meanBrightness']}), "
            f"approached={analysis['approached']}, loitered={analysis['loitered']} "
            f"(dwell={analysis['dwellFrames']} frames, min_distance={analysis['minDistance']}px)"
        )
        if scenario["alert"]:
            alert = scenario["alert"]
            print(f"    ALERT [{alert['severity']}]: {alert['message']}")
        else:
            print("    No alert")
        print()


if __name__ == "__main__":
    main()
