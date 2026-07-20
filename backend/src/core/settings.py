from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="UPTIME_")

    db_path: str = "./data/uptime.db"
    poll_interval_seconds: int = 60
    ping_timeout_seconds: float = 5.0
    cors_origins: list[str] = ["http://localhost:3000"]
    redis_url: str = "redis://localhost:6379/0"
    queue_key: str = "due-checks"
    enable_inprocess_poller: bool = True
    environment: str = "development"

    @property
    def is_production(self) -> bool:
        return self.environment == "production"


settings = Settings()
