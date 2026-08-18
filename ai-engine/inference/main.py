import logging

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from inference.config import get_settings
from inference.logging_config import configure_logging
from inference.routes.activity import router as activity_router
from inference.routes.alerts import router as alerts_router
from inference.routes.detection import router as detection_router
from inference.routes.fall import router as fall_router
from inference.routes.gait import router as gait_router
from inference.routes.health import router as health_router
from inference.routes.pipeline import router as pipeline_router
from inference.state import data_dir

configure_logging()
logger = logging.getLogger(__name__)


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title=settings.app_name,
        version="0.1.0",
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health_router)
    app.include_router(gait_router)
    app.include_router(activity_router)
    app.include_router(alerts_router)
    app.include_router(detection_router)
    app.include_router(fall_router)
    app.include_router(pipeline_router)

    # Demo endpoints (gait /demo/run, /demo/seed-gallery, activity /demo/run)
    # and /detection/annotate, /gait/visualize generate synthetic/annotated
    # clips into DEMO_DATA_DIR/demo-videos and keep them around — serve them
    # so a frontend can play back what was actually analyzed, not just the
    # numbers. Routes return paths like "demo-videos/<file>.mp4" that
    # resolve directly under this mount.
    demo_videos_dir = data_dir / "demo-videos"
    demo_videos_dir.mkdir(parents=True, exist_ok=True)
    app.mount("/demo-videos", StaticFiles(directory=demo_videos_dir), name="demo-videos")

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.exception("Unhandled exception on %s", request.url.path)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "Internal server error"},
        )

    return app


app = create_app()

if __name__ == "__main__":
    import uvicorn

    settings = get_settings()
    uvicorn.run("inference.main:app", host="0.0.0.0", port=settings.port, reload=not settings.is_production)
