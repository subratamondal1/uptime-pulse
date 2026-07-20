from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="UPTIME_")

    db_path: str = "./data/uptime.db"
    poll_interval_seconds: int = 60
    ping_timeout_seconds: float = 5.0
    cors_origins: list[str] = ["http://localhost:3000"]


settings = Settings()
