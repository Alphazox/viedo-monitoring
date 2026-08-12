"""Single-video, end-to-end demo: one synthetic walking clip is split in
half — the first half is enrolled as a watchlisted subject, the second half
is fed through the watch pipeline as if it were a live camera feed. Shows
the full chain: video -> silhouettes -> GEI -> CNN embedding -> match ->
alert -> simulated notification.

Same logic as `POST /gait/demo/run` (app/gait/demo.py) — this is the CLI
entry point; the API route is what the frontend's Gait Demo page calls.

Run inside the ai-service Docker container (torch doesn't load locally on
this Windows machine right now, see the earlier PermissionError note):

    docker compose run --rm ai-service python -m scripts.run_alert_demo
"""

from pathlib import Path

from app.gait.demo import run_alert_demo


def main() -> None:
    app_dir = Path(__file__).resolve().parent.parent
    trace = run_alert_demo(app_dir)

    for step in trace["steps"]:
        print(f"- {step['detail']}")

    match = trace["match"]
    if match:
        print(f"\nBest match: {match['label']} — similarity {match['similarity']:.1%}")
    else:
        print("\nNo match found")

    if trace["alert"]:
        alert = trace["alert"]
        print(f"ALERT TRIGGERED [{alert['severity']}]: {alert['message']}")
        print("(notification simulated — no real Email/SMS/Slack/Webhook integration; see docs/HLD.md §7)")
    else:
        print(f"No alert — similarity below threshold ({trace['threshold']:.0%}) or subject not watchlisted")


if __name__ == "__main__":
    main()
