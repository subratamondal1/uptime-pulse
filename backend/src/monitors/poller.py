import asyncio
import time
from datetime import UTC, datetime

import httpx

from src.core.database import get_db
from src.core.logger import logger
from src.core.settings import settings


async def ping_once(client: httpx.AsyncClient, url: str) -> tuple[int | None, float | None, bool]:
    start = time.perf_counter()
    try:
        response = await client.get(
            url, timeout=settings.ping_timeout_seconds, follow_redirects=True
        )
        elapsed_ms = (time.perf_counter() - start) * 1000
        return response.status_code, round(elapsed_ms, 2), response.status_code < 400
    except httpx.HTTPError:
        elapsed_ms = (time.perf_counter() - start) * 1000
        return None, round(elapsed_ms, 2), False


async def poll_all_monitors() -> None:
    async with get_db() as db:
        cursor = await db.execute("SELECT id, url FROM monitors")
        monitors = await cursor.fetchall()

    if not monitors:
        return

    async with httpx.AsyncClient() as client:
        results = await asyncio.gather(*[ping_once(client, m["url"]) for m in monitors])

    checked_at = datetime.now(UTC).isoformat()
    async with get_db() as db:
        for monitor, (status_code, response_time_ms, is_up) in zip(monitors, results, strict=True):
            await db.execute(
                "INSERT INTO checks (monitor_id, status_code, response_time_ms, is_up, checked_at) "
                "VALUES (?, ?, ?, ?, ?)",
                (monitor["id"], status_code, response_time_ms, int(is_up), checked_at),
            )
            logger.info(
                "monitor_checked", monitor_id=monitor["id"], is_up=is_up, status_code=status_code
            )
        await db.commit()


async def poller_loop() -> None:
    while True:
        try:
            await poll_all_monitors()
        except Exception as exc:
            logger.error("poller_loop_error", error=str(exc))
        await asyncio.sleep(settings.poll_interval_seconds)
