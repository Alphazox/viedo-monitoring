"""Activity rules + shared alert log.

A simplified stand-in for the platform's future Event -> Rules -> Alert ->
Notification pipeline — alerts are appended to a JSON-file-backed log and a
notification is only *simulated* (logged), no real channel (Email/SMS/Slack/
Webhook) is wired up. No database dependency this round.
"""
