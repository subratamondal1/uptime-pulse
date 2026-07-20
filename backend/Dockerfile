FROM python:3.12-slim AS builder
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/
WORKDIR /app
COPY pyproject.toml .
RUN uv sync --no-dev --no-install-project
COPY src ./src
RUN uv sync --no-dev

FROM python:3.12-slim
WORKDIR /app
RUN useradd -m appuser
COPY --from=builder /app/.venv /app/.venv
COPY --from=builder /app/src ./src
ENV PATH="/app/.venv/bin:$PATH"
ENV UPTIME_DB_PATH="/data/uptime.db"
RUN mkdir -p /data && chown appuser:appuser /data
USER appuser
EXPOSE 8000
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
