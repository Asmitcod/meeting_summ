import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import get_settings
from routers.meetings import router as meetings_router

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# App factory
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Log startup/shutdown events."""
    logger.info("Meeting Summarizer API starting up.")
    yield
    logger.info("Meeting Summarizer API shutting down.")


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title="Meeting Summarizer API",
        description="Transcribe meeting audio and generate structured summaries.",
        version="1.0.0",
        lifespan=lifespan,
    )

    # CORS — allow the Vercel frontend (and localhost for dev)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Routers
    app.include_router(meetings_router)

    @app.get("/health", tags=["health"])
    def health_check():
        """Simple liveness probe — also used by frontend to wake Render."""
        return {"status": "ok"}

    return app


app = create_app()
