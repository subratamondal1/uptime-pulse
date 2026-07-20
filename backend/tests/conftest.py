import os
import tempfile

_fd, _db_path = tempfile.mkstemp(suffix=".db")
os.close(_fd)
os.environ["UPTIME_DB_PATH"] = _db_path
os.environ["UPTIME_ENABLE_INPROCESS_POLLER"] = "false"
os.environ["UPTIME_ENVIRONMENT"] = "development"

from collections.abc import AsyncIterator  # noqa: E402

import httpx  # noqa: E402
import pytest  # noqa: E402
from httpx import ASGITransport  # noqa: E402

from src.core.database import init_db  # noqa: E402
from src.main import app  # noqa: E402


@pytest.fixture(autouse=True)
async def _init_database() -> None:
    await init_db()


@pytest.fixture
async def client() -> AsyncIterator[httpx.AsyncClient]:
    transport = ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
