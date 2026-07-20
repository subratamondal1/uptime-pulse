import uuid
from datetime import UTC, datetime

import httpx
from fastapi import APIRouter, HTTPException

from src.core.database import get_db
from src.monitors.models import CheckOut, MonitorCreate, MonitorOut
from src.monitors.poller import ping_once

router = APIRouter(prefix="/monitors", tags=["monitors"])


@router.post("", response_model=MonitorOut, status_code=201)
async def create_monitor(payload: MonitorCreate) -> MonitorOut:
    monitor_id = str(uuid.uuid4())
    url = str(payload.url)
    created_at = datetime.now(UTC).isoformat()

    async with get_db() as db:
        try:
            await db.execute(
                "INSERT INTO monitors (id, url, created_at) VALUES (?, ?, ?)",
                (monitor_id, url, created_at),
            )
            await db.commit()
        except Exception as exc:
            raise HTTPException(status_code=409, detail="url already monitored") from exc

    async with httpx.AsyncClient() as client:
        status_code, response_time_ms, is_up = await ping_once(client, url)

    checked_at = datetime.now(UTC).isoformat()
    async with get_db() as db:
        await db.execute(
            "INSERT INTO checks (monitor_id, status_code, response_time_ms, is_up, checked_at) "
            "VALUES (?, ?, ?, ?, ?)",
            (monitor_id, status_code, response_time_ms, int(is_up), checked_at),
        )
        await db.commit()

    return MonitorOut(
        id=monitor_id,
        url=url,
        created_at=created_at,
        latest_check=CheckOut(
            id=0,
            status_code=status_code,
            response_time_ms=response_time_ms,
            is_up=is_up,
            checked_at=checked_at,
        ),
    )


@router.get("", response_model=list[MonitorOut])
async def list_monitors() -> list[MonitorOut]:
    async with get_db() as db:
        cursor = await db.execute(
            "SELECT id, url, created_at FROM monitors ORDER BY created_at DESC"
        )
        monitors = await cursor.fetchall()

        result: list[MonitorOut] = []
        for m in monitors:
            check_cursor = await db.execute(
                "SELECT id, status_code, response_time_ms, is_up, checked_at FROM checks "
                "WHERE monitor_id = ? ORDER BY checked_at DESC LIMIT 1",
                (m["id"],),
            )
            latest = await check_cursor.fetchone()
            result.append(
                MonitorOut(
                    id=m["id"],
                    url=m["url"],
                    created_at=m["created_at"],
                    latest_check=CheckOut(
                        id=latest["id"],
                        status_code=latest["status_code"],
                        response_time_ms=latest["response_time_ms"],
                        is_up=bool(latest["is_up"]),
                        checked_at=latest["checked_at"],
                    )
                    if latest
                    else None,
                )
            )
    return result


@router.get("/{monitor_id}/checks", response_model=list[CheckOut])
async def list_checks(monitor_id: str, limit: int = 50) -> list[CheckOut]:
    async with get_db() as db:
        cursor = await db.execute(
            "SELECT id, status_code, response_time_ms, is_up, checked_at FROM checks "
            "WHERE monitor_id = ? ORDER BY checked_at DESC LIMIT ?",
            (monitor_id, limit),
        )
        rows = await cursor.fetchall()
        if not rows:
            monitor_cursor = await db.execute("SELECT id FROM monitors WHERE id = ?", (monitor_id,))
            if not await monitor_cursor.fetchone():
                raise HTTPException(status_code=404, detail="monitor not found")

    return [
        CheckOut(
            id=r["id"],
            status_code=r["status_code"],
            response_time_ms=r["response_time_ms"],
            is_up=bool(r["is_up"]),
            checked_at=r["checked_at"],
        )
        for r in rows
    ]


@router.delete("/{monitor_id}", status_code=204)
async def delete_monitor(monitor_id: str) -> None:
    async with get_db() as db:
        cursor = await db.execute("DELETE FROM monitors WHERE id = ?", (monitor_id,))
        await db.commit()
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="monitor not found")
