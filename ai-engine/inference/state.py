"""Process-wide singletons, constructed eagerly at import time (same pattern
as the old ai-service's alerts_store.py / gait routes' module-level
_service): the YOLO weights download and gait-model init happen once at
startup, not on the first request, and every route module shares one
instance rather than each constructing its own over the same files (which
would silently clobber each other's writes — see events/alerts.py).
"""

from pathlib import Path

from embeddings.service import GaitRecognitionService
from events.alerts import AlertLog
from indexing.gallery import GaitGallery
from inference.config import get_settings

settings = get_settings()
data_dir = Path(settings.demo_data_dir)

alert_log = AlertLog(data_dir / "alerts.json", cooldown_seconds=settings.intrusion_cooldown_seconds)

gait_service = GaitRecognitionService(data_dir / "gait" / "model" / "gait_embedding_net.pt")
gait_gallery = GaitGallery(data_dir / "gait" / "gallery")
