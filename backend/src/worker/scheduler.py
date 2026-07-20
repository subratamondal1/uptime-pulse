import asyncio

import redis.asyncio as redis

from src.core.database import get_db
from src.core.logger import configure_logging, logger
from src.core.settings import settings


async def enqueue_due_checks() -> int:
    client = redis.from_url(settings.redis_url)
    async with get_db() as db:
        cursor = await db.execute("SELECT id FROM monitors")
        monitors = list(await cursor.fetchall())

    if monitors:
        await client.rpush(settings.queue_key, *[m["id"] for m in monitors])

    await client.aclose()
    return len(monitors)


async def main() -> None:
    configure_logging()
    count = await enqueue_due_checks()
    logger.info("scheduler_run_complete", enqueued=count)


if __name__ == "__main__":
    asyncio.run(main())
