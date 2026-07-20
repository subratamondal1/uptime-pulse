from pydantic import BaseModel, HttpUrl


class MonitorCreate(BaseModel):
    url: HttpUrl


class CheckOut(BaseModel):
    id: int
    status_code: int | None
    response_time_ms: float | None
    is_up: bool
    checked_at: str


class MonitorOut(BaseModel):
    id: str
    url: str
    created_at: str
    latest_check: CheckOut | None = None
