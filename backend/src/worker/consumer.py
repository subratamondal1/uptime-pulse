import asyncio
from datetime import UTC, datetime

import httpx
import redis.asyncio as redis

from src.core.database import get_db
from src.core.logger import configure_logging, logger
from src.core.settings import settings
from src.monitors.poller import ping_once


async def process_one(client: redis.Redis, http_client: httpx.AsyncClient, monitor_id: str) -> None:
    async with get_db() as db:
        cursor = await db.execute("SELECT url FROM monitors WHERE id = ?", (monitor_id,))
        row = await cursor.fetchone()
    if row is None:
        return

    status_code, response_time_ms, is_up = await ping_once(http_client, row["url"])
    checked_at = datetime.now(UTC).isoformat()

    async with get_db() as db:
        await db.execute(
            "INSERT INTO checks (monitor_id, status_code, response_time_ms, is_up, checked_at) "
            "VALUES (?, ?, ?, ?, ?)",
            (monitor_id, status_code, response_time_ms, int(is_up), checked_at),
        )
        await db.commit()

    logger.info("check_processed", monitor_id=monitor_id, is_up=is_up, status_code=status_code)


async def main() -> None:
    configure_logging()
    client = redis.from_url(settings.redis_url)
    async with httpx.AsyncClient() as http_client:
        while True:
            result = await client.blpop([settings.queue_key], timeout=5)
            if result is None:
                continue
            _, raw_id = result
            monitor_id = raw_id.decode() if isinstance(raw_id, bytes) else raw_id
            await process_one(client, http_client, monitor_id)


if __name__ == "__main__":
    asyncio.run(main())
