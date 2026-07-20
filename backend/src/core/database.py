import os
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

import aiosqlite

from src.core.settings import settings

SCHEMA = """
CREATE TABLE IF NOT EXISTS monitors (
    id TEXT PRIMARY KEY,
    url TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS checks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    monitor_id TEXT NOT NULL REFERENCES monitors(id) ON DELETE CASCADE,
    status_code INTEGER,
    response_time_ms REAL,
    is_up INTEGER NOT NULL,
    checked_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_checks_monitor_id ON checks(monitor_id, checked_at DESC);
"""


async def init_db() -> None:
    os.makedirs(os.path.dirname(settings.db_path), exist_ok=True)
    async with aiosqlite.connect(settings.db_path) as db:
        await db.executescript(SCHEMA)
        await db.commit()


@asynccontextmanager
async def get_db() -> AsyncIterator[aiosqlite.Connection]:
    db = await aiosqlite.connect(settings.db_path)
    db.row_factory = aiosqlite.Row
    try:
        yield db
    finally:
        await db.close()
