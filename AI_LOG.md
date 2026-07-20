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
