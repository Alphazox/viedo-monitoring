from pathlib import Path

from app.alerts import AlertLog
from app.core.config import get_settings

_settings = get_settings()

# One shared instance — gait and activity routes both import this rather than
# constructing their own AlertLog pointed at the same file. Two separate
# instances over one file would each hold a stale in-memory copy and clobber
# the other's writes on the next record() (each save() rewrites the whole file
# from its own _alerts list).
alert_log = AlertLog(Path(_settings.demo_data_dir) / "alerts.json")
