<div align="center">

# Epifi Uptime Monitor

Lightweight uptime monitor. FastAPI backend pings registered URLs on an interval, stores status/response-time/timestamp in SQLite; Next.js frontend shows live status.

**Backend**

![Python](https://img.shields.io/badge/Python-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-07405E?logo=sqlite&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?logo=redis&logoColor=white)
![uv](https://img.shields.io/badge/uv-DE5FE9?logo=uv&logoColor=white)
![Pytest](https://img.shields.io/badge/Pytest-0A9EDC?logo=pytest&logoColor=white)

**Frontend**

![Next.js](https://img.shields.io/badge/Next.js-black?logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=white)
![Bun](https://img.shields.io/badge/Bun-000000?logo=bun&logoColor=white)
![Biome](https://img.shields.io/badge/Biome-60A5FA?logo=biome&logoColor=white)

**Infra**

![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)
![Kubernetes](https://img.shields.io/badge/Kubernetes-326CE5?logo=kubernetes&logoColor=white)
![Helm](https://img.shields.io/badge/Helm-0F1689?logo=helm&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?logo=githubactions&logoColor=white)

</div>

![Dashboard screenshot](docs/assets/dashboard-screenshot.png)

## Architecture

```mermaid
flowchart LR
    User["User opens dashboard"] --> UI["Next.js UI renders monitor list"]
    UI -->|POST /monitors| API["FastAPI backend"]
    API -->|INSERT monitor| DB[("SQLite: monitors + checks")]
    API -->|immediate ping| Ping["httpx GET target URL"]
    Ping -->|INSERT check| DB
    Poller["Async poller loop, every 60s"] -->|SELECT all monitors| DB
    Poller --> Ping
    UI -->|GET /monitors, poll 10s| API
    API -->|SELECT latest check| DB
    API -->|JSON response| UI
    UI --> User
    classDef brutYellow fill:#FFD93D,stroke:#000,stroke-width:4px,color:#000,font-weight:bold
    classDef brutBlue fill:#4D96FF,stroke:#000,stroke-width:4px,color:#000,font-weight:bold
    classDef brutGreen fill:#6BCB77,stroke:#000,stroke-width:4px,color:#000,font-weight:bold
    classDef brutRed fill:#FF6B6B,stroke:#000,stroke-width:4px,color:#000,font-weight:bold
    class User,UI brutBlue
    class API,Ping brutYellow
    class Poller brutGreen
    class DB brutRed
```

## Quickstart

```bash
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend: http://localhost:8000

## Testing up/down detection

1. Open http://localhost:3000
2. Add monitor `https://example.com` — shows **UP** within a few seconds
3. Add monitor `https://this-domain-does-not-exist-abc123.invalid` — shows **DOWN**
4. Status refreshes automatically every 10s on the dashboard; backend re-pings every 60s

## Stack

**Backend**
- FastAPI, Python 3.11
- SQLite via `aiosqlite` (right-sized for this scale — see `career`/architecture notes on when this would change)
- `httpx` for outbound pings, `redis` for the queue-based worker path
- Pydantic Settings, structlog (colored console in dev, JSON in prod)
- `uv` (dependency management), `ruff` (lint/format), `ty` (type checking), `pytest` (tests)

**Frontend**
- Next.js 16 (App Router, Turbopack), Bun
- Tailwind CSS 4, shadcn/ui (Radix primitives), next-themes (light/dark)
- Biome (lint/format), `tsc` (type checking)

**Infra**
- Both Docker images: distroless, non-root, multi-stage builds
- `docker-compose.yml` for local orchestration
- `k8s/` — Kubernetes + KEDA autoscaling (bonus layer, see "Scaling this to production" below)

**DevOps**
- `lefthook` pre-commit hook — ruff format/lint + ty (backend), Biome + tsc (frontend), scoped to staged files only
- `lefthook` pre-push hook — runs the full `make ci` gate (lint + typecheck + `pytest` + frontend build) before any push is allowed
- GitHub Actions (`.github/workflows/ci.yml`) — same gate, enforced on every push/PR, both stacks as separate jobs
- `make ci` runs the identical gate locally, on demand

## Deployment sketch

See [`infra/deployment-sketch.md`](infra/deployment-sketch.md).

## AI collaboration log

See [`AI_LOG.md`](AI_LOG.md).

---

## Scaling this to production: Kubernetes + KEDA (`k8s/`)

The MVP above satisfies the brief as scoped. This section documents how the same codebase extends to a
real, autoscaled deployment — a separate, additive path (`k8s/`) alongside `docker-compose.yml`, not a
replacement for it.

### Why the poller needs a different shape at scale

A single in-process `asyncio` loop (`backend/src/monitors/poller.py`) works for a few dozen URLs. Past that,
the check workload needs to be a horizontally scaled fleet, decoupled from the API process. `k8s/` adds:

- `backend/src/worker/scheduler.py` — enqueues due checks onto a Redis list (`due-checks`), run as a
  Kubernetes `CronJob` every minute
- `backend/src/worker/consumer.py` — pops jobs from that list, pings the target, writes the result; this is
  the component KEDA scales
- The original in-process poller is disabled in this mode via `UPTIME_ENABLE_INPROCESS_POLLER=false`, so the
  two paths never double-ping the same monitor

### Architecture

```mermaid
flowchart TB
    Scheduler["CronJob: enqueues due checks
    every minute"] --> Queue[("Redis: due-checks list")]
    KEDA["KEDA ScaledObject:
    watches list length"] -->|scale 0..20| Workers["poller-worker Deployment"]
    Queue --> Workers
    Workers -->|httpx GET| Target["Monitored URL"]
    Workers -->|write result| DB[("SQLite, shared volume")]
    API["backend-api Deployment"] --> DB
    classDef brutYellow fill:#FFD93D,stroke:#000,stroke-width:4px,color:#000,font-weight:bold
    classDef brutBlue fill:#4D96FF,stroke:#000,stroke-width:4px,color:#000,font-weight:bold
    classDef brutGreen fill:#6BCB77,stroke:#000,stroke-width:4px,color:#000,font-weight:bold
    classDef brutRed fill:#FF6B6B,stroke:#000,stroke-width:4px,color:#000,font-weight:bold
    class Scheduler brutYellow
    class Queue brutBlue
    class KEDA,Workers brutGreen
    class Target,DB,API brutRed
```

### Running it locally

```bash
kind create cluster --config k8s/kind-config.yaml
helm install keda kedacore/keda --namespace keda --create-namespace
docker build -t epifi-uptime-monitor-backend:latest ./backend
kind load docker-image epifi-uptime-monitor-backend:latest --name uptime-platform
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/redis.yaml -f k8s/backend-api.yaml -f k8s/worker-deployment.yaml -f k8s/scheduler-cronjob.yaml -f k8s/keda-scaledobject.yaml
```

Or simply `make k8s-up` — same steps, wrapped with automatic retry on transient network failures.

Watch it scale, live:

```bash
kubectl get scaledobject,hpa -n uptime-platform
kubectl get pods -n uptime-platform -w
```

### Measured, on this machine (MacBook Pro, M1 Max, 32GB, 10-core)

Not a simulation — captured from an actual run against this exact deployment, 15 monitors registered, Colima
VM sized at 8 vCPU / 16GiB:

| Event | Observed |
|---|---|
| `poller-worker` at rest | 0 replicas (KEDA `minReplicaCount: 0`) |
| Queue filled (15 jobs enqueued by the CronJob) | KEDA scaled 0→3 pods within ~10s |
| Queue drained (15 jobs → 0) | ~20-25s across 3 pods, external-target-latency-bound |
| Idle after drain | scaled back to 0 after the 30s `cooldownPeriod` |
| Next scheduler tick (new jobs enqueued) | scaled back up within ~10s — the cycle repeats correctly |

Local CPU-bound pod ceiling on this machine's Colima allocation (50m CPU request per worker pod, 7 usable
vCPU after system reserve): **~140 pods** — the `ScaledObject`'s `maxReplicaCount: 20` here is a deliberately
conservative local demo value, not that ceiling.

**One real bug this surfaced**: an initial clean run of the above cycle happened to not trigger it, but a
repeat adversarial pass under rapid, back-to-back enqueue load found `poller-worker` pods crash-looping on a
Redis `BLPOP` client-timeout race (see `AI_LOG.md`'s third course-correction). Fixed and re-verified — three
rapid stress rounds afterward, **zero restarts**.

**What this does and doesn't prove**: it proves the scaling *mechanism* — KEDA reacting to real queue depth,
0→N→0, correctly and repeatably. It does not prove cloud-scale throughput, multi-AZ failure isolation, or
node-level autoscaling (Karpenter) — a single-node local cluster has no equivalent for any of those, and the
network path (this machine's own connection) is not representative of a cloud egress path either. The
honest claim is exactly what was measured, nothing more.
