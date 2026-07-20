FROM python:3.12-slim AS builder
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/
WORKDIR /app
COPY pyproject.toml .
RUN uv sync --no-dev --no-install-project
COPY src ./src
RUN uv sync --no-dev
RUN mkdir -p /data && chown -R 65532:65532 /data

FROM gcr.io/distroless/python3-debian12:nonroot
WORKDIR /app
COPY --from=builder --chown=nonroot:nonroot /app/.venv /app/.venv
COPY --from=builder --chown=nonroot:nonroot /app/src ./src
COPY --from=builder --chown=nonroot:nonroot /data /data
ENV PATH="/app/.venv/bin:$PATH"
ENV UPTIME_DB_PATH="/data/uptime.db"
EXPOSE 8000
ENTRYPOINT ["/app/.venv/bin/uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
