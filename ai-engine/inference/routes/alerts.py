from fastapi import APIRouter, Depends

from inference.security import get_current_claims
from inference.state import alert_log

router = APIRouter(prefix="/alerts", tags=["alerts"], dependencies=[Depends(get_current_claims)])


@router.get("")
async def list_alerts() -> dict:
    """Unified alert history across every detector in this service (gait
    watch, suspicious activity). See events/alerts.py for why notifications
    are simulated rather than real."""
    items = alert_log.list_alerts()
    return {"items": items, "total": len(items)}
