# AI Collaboration Log

## AI tech stack

- Claude Code (Claude Sonnet 5) — planning, full-stack implementation, Docker debugging
- Backend tooling: `uv`, `ruff`, `ty` (Rust-based Python toolchain)
- Frontend tooling: Bun, Biome (Rust-based JS/TS toolchain)

## Prompts that shipped it

Condensed, chronological, from the actual build session:

1. "Build the uptime monitor per the assignment brief — backend, frontend, docker-compose, no comments/docstrings, precise atomic commits."
2. "Design tokens: editorial + neo-brutalist reference screenshots, light AND dark mode, fully responsive at all screen sizes."
3. "Keep commits atomic — one meaningful change per commit, conventional-commit style, never dump everything at once."
4. "Focus on security — distroless Docker images, non-root, optimized."
5. "Add copy/open-link actions on the monitor table, default theme to light not system, the sidebar looks too empty — fix it."

## Course corrections

The first `docker compose up` attempt failed twice — both AI-introduced bugs, caught only by actually running the containers, not just a successful `docker build`:

1. **Broken venv shebang.** The initial backend `Dockerfile` ran `/app/.venv/bin/uvicorn` directly. That script's shebang points at the *builder* stage's Python interpreter path, which doesn't exist in the distroless final image → `exec: no such file or directory`. Fixed by invoking `python3 -m uvicorn` via the distroless image's own interpreter instead of the venv's console script.
2. **Python ABI mismatch.** After fix #1, the container crashed with `ModuleNotFoundError: No module named 'pydantic_core._pydantic_core'`. The builder stage used `python:3.12-slim`, but `gcr.io/distroless/python3-debian12` ships Python 3.11 — `pydantic_core`'s compiled Rust extension is interpreter-version-specific and silently fails to import under a mismatched one. Fixed by pinning the builder stage to `python:3.11-slim` to match the distroless runtime exactly.

Both bugs only surfaced once the built images were actually run — a reminder that a green `docker build` is not proof of a working container.

A third, same-shaped lesson turned up later, while extending the project to a Kubernetes/KEDA deployment
(`k8s/`, documented in `README.md`'s "Scaling this to production" section): the first version of
`backend/src/worker/consumer.py` looked correct and even passed an initial live scaling test, but a repeat
adversarial pass under rapid load found `poller-worker` pods crash-looping with
`redis.exceptions.TimeoutError` on `BLPOP` — the Redis client's socket read timeout was racing against the
command's own 5-second blocking timeout, a known `redis-py` gotcha. One clean-looking test run had gotten
lucky on timing; a second, harder pass under load exposed it. Fixed by raising `socket_timeout` above the
`BLPOP` timeout and explicitly catching transient Redis errors instead of letting them kill the process —
verified afterward with three rapid stress rounds and zero restarts. Same root lesson as the first two bugs,
one level up: a single successful run is not proof of correctness under load, the same way a successful build
isn't proof of a working container.
