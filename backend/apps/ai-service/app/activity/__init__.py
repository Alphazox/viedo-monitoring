"""Suspicious-activity heuristic, integrated into ai-service (not a separate
service) alongside app/gait/.

This is NOT trained action/crime recognition — no such model or dataset
(e.g. UCF-Crime) is available in this environment. It combines two
individually-legitimate classical-CV signals, neither of which alone proves
anything:

  - approximate time-of-day from mean frame brightness (a proxy for "after
    hours", since demo clips carry no real capture timestamp to check
    against business hours)
  - proximity + dwell time near a defined entrance zone (a proxy for
    "loitering" vs. someone just walking past)

Only flagging when *both* hold is a deliberate choice to avoid the obvious
false-positive failure mode of either signal alone (e.g. "dark video" or
"person stood still" is not by itself suspicious). This is an illustrative
rule-based heuristic, not a robbery/violence detector.
"""
