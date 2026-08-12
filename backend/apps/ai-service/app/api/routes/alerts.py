from fastapi import APIRouter

from app.alerts_store import alert_log

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.get("")
async def list_alerts() -> dict:
    """Unified alert history across every detector demo (gait watch,
    suspicious activity) — see app/alerts.py for why notifications are
    simulated rather than real."""
    return {"alerts": alert_log.list_alerts()}
