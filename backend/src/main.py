import asyncio
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.core.database import init_db
from src.core.logger import configure_logging
from src.core.settings import settings
from src.monitors.poller import poller_loop
from src.monitors.router import router as monitors_router


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    configure_logging()
    await init_db()
    task = asyncio.create_task(poller_loop()) if settings.enable_inprocess_poller else None
    yield
    if task is not None:
        task.cancel()


app = FastAPI(title="Epifi Uptime Monitor", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(monitors_router)


@app.get("/healthz")
async def healthz() -> dict[str, str]:
    return {"status": "ok"}
