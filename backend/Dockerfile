FROM python:3.11-slim AS builder
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/
WORKDIR /app
COPY pyproject.toml .
RUN uv sync --no-dev --no-install-project --python 3.11
COPY src ./src
RUN uv sync --no-dev --python 3.11
RUN mkdir -p /data && chown -R 65532:65532 /data

FROM gcr.io/distroless/python3-debian12:nonroot
WORKDIR /app
COPY --from=builder --chown=nonroot:nonroot /app/.venv /app/.venv
COPY --from=builder --chown=nonroot:nonroot /app/src ./src
COPY --from=builder --chown=nonroot:nonroot /data /data
ENV PYTHONPATH="/app/.venv/lib/python3.11/site-packages"
ENV UPTIME_DB_PATH="/data/uptime.db"
EXPOSE 8000
ENTRYPOINT ["python3", "-m", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
