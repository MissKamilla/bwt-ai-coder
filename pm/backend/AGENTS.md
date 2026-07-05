# Backend

This directory contains the FastAPI app for the Project Management MVP. It owns
auth, SQLite persistence, AI calls, and serving the exported Next.js frontend.

## Stack

- Python 3.12
- FastAPI
- SQLite via the standard `sqlite3` module
- `uv` for dependency management
- OpenRouter for AI calls, using `openai/gpt-oss-120b:free`
- Pytest for backend tests

## Layout

```
main.py          FastAPI routes, auth gate middleware, static frontend serving
auth.py          hardcoded MVP login/session helpers
db.py            SQLite schema, seed data, board validation, load/apply helpers
ai.py            OpenRouter calls, Kanban prompt, board patch application
static/          built Next.js export served at /
tests/
  client.py      local ASGI test client used instead of FastAPI TestClient
  seed.py        expected demo board fixture
  test_auth.py   login/logout/static access tests
  test_board.py  /api/board tests
  test_db.py     SQLite round-trip tests
  test_ai.py     AI endpoint and patch tests
```

## How to Run

From `backend/`:

- `UV_CACHE_DIR=/tmp/uv-cache uv run --frozen pytest -q`

From the project root, `scripts/test.sh` runs backend tests inside the Docker
container and then performs an HTTP smoke test.

## Conventions

- Keep the MVP auth hardcoded to `user` / `password`.
- Keep database access simple and explicit; no ORM.
- `db.apply_board` persists a full validated board snapshot.
- AI calls must read `OPENROUTER_API_KEY` from the environment.
- Do not log raw AI responses; they may contain user board data.
- Prefer async FastAPI route handlers and dependencies in this project. The
  current locked dependency set has shown hangs when tests exercise sync
  handlers through threadpool-backed clients.
- Backend tests use `tests.client.TestClient`, not `fastapi.testclient.TestClient`.
