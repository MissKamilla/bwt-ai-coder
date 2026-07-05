# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A Project Management MVP web app: hardcoded `user` / `password` login, single Kanban board per user, drag-and-drop cards with AI sidebar chat that can create / edit / move cards. Next.js frontend is exported as static files and served by the FastAPI backend, all in one Docker container. SQLite local DB; OpenRouter (`openai/gpt-oss-120b:free`) for AI. See `AGENTS.md` (root) for full business requirements and color palette; see `docs/PLAN.md` for the 10-part build sequence and `docs/DATABASE.md` for the schema and Kanban JSON shape.

## Common commands

Run from the **project root**:

- `bash scripts/start.sh` — build and start the Docker container (`docker compose up -d --build`); app on `http://localhost:8000`.
- `bash scripts/stop.sh` — `docker compose down`.
- `bash scripts/test.sh` — ensure container is running, run `pytest -v` inside it, then a real-HTTP smoke test for the auth + Kanban flow. This is the canonical "does it work?" command.

Run from `backend/` (host, no Docker):

- `UV_CACHE_DIR=/tmp/uv-cache uv run --frozen pytest -q` — backend unit tests. Set `PM_DB_PATH` to a per-test `tmp_path` to isolate the SQLite file (see `backend/tests/test_db.py`).

Run from `frontend/`:

- `npm run dev` — Next.js dev server.
- `npm run build` — static export to `frontend/out/` (the Dockerfile copies this into the image as `backend/static/`).
- `npm run lint` — ESLint.
- `npm run test` — Vitest unit suite (runs once, no watch).
- `npm run test:unit:watch` — Vitest watch mode.
- `npm run test:e2e` — Playwright e2e (`playwright.config.ts`). The full Playwright browser needs host system libs (`libnspr4`, `libnss3`, etc.).

## Architecture (big picture)

### Runtime topology

One container, one process (`uvicorn main:app` on port 8000). The frontend is statically exported at image build time and served as plain files by FastAPI. Browser → FastAPI → (a) static file from `backend/static/`, or (b) JSON API. There is no separate dev server in production.

### Request flow

1. `backend/main.py` adds a pure-ASGI `AuthGateMiddleware` (defined at the bottom of `main.py`). For `GET` requests to paths that aren't `/login`, `/api/hello`, `/_next/`, or `/favicon*`, it pulls the `pm_session` cookie from raw scope bytes (no parsing library) and 303-redirects to `/login` if missing. POST/PATCH are not gated at this layer — protected endpoints enforce auth themselves via `Depends(require_user)`.
2. Auth: `backend/auth.py` — hardcoded `SESSION_USER="user"`, `SESSION_PASSWORD="password"`. Cookie is signed with `itsdangerous.TimestampSigner` (12h expiry). `require_user` is a FastAPI dependency that 303-redirects on bad/missing session.
3. Static: `serve_static` (last catch-all route) reads from `backend/static/` with path-traversal protection (`target.is_relative_to(root)`). Falls back to `404.html` if the file is missing. Open routes are listed in `ALWAYS_OPEN_EXACT` / `ALWAYS_OPEN_PREFIXES`.

### Persistence layer (`backend/db.py`)

- No ORM. Raw `sqlite3`, schema inlined in `_SCHEMA_SQL`, tables: `users`, `boards`, `columns`, `cards`, `schema_version`. All FKs use `ON DELETE CASCADE`.
- `init_db(path)` is idempotent — safe to call on every request (also `@lru_cache`'d via `_ensure_db` in `main.py`).
- `load_board(user_id)` returns the `BoardData` JSON shape documented in `docs/DATABASE.md`: `{"columns": [{"id", "title", "cardIds": [...]}], "cards": {"<id>": {"id", "title", "details"}}}`.
- `apply_board(user_id, board)` validates the full snapshot, then writes it in a transaction (deletes + inserts in dependency order). Returns the persisted board.
- `db_path()` honors `PM_DB_PATH` env var (used by tests for isolation).
- Demo seed is in `backend/tests/seed.py` — 5 columns, 8 cards.

### API endpoints (all in `backend/main.py`)

- `GET /api/hello` — open.
- `GET /api/board` / `PATCH /api/board` — authed; returns/accepts `BoardData`.
- `POST /login` (form-encoded `username` + `password`) — sets `pm_session` cookie, 303 to `/`.
- `POST /logout` — clears cookie, 303 to `/login`.
- `POST /api/ai/chat` — Part 8, simple round-trip chat.
- `POST /api/ai/board-chat` — Part 9, the Kanban-aware endpoint: takes `{user_message, history}`, builds a prompt with board-as-JSON + history + user message, calls OpenRouter with `BOARD_PATCH_SCHEMA` (Structured Outputs), parses the response, applies the `board_patch` server-side, persists via `db.apply_board`, returns `{reply, board}`.

### AI layer (`backend/ai.py`)

- `_openrouter_chat` is the low-level call; `call_ai` (Part 8) and `process_message` (Part 9) are built on it. Reads `OPENROUTER_API_KEY` from env.
- `BOARD_PATCH_SCHEMA` is intentionally loose on the inner `board_patch` (the per-op rules are enforced by `apply_board_patch` server-side, which keeps the free model more reliable).
- `process_message` has a graceful-fallback path: try structured parse → if patch applies, persist; else retry once with a strict reminder; else surface the raw reply as plain text with the board untouched. The free model sometimes returns prose; this keeps the UI resilient.
- `apply_board_patch` is pure (`board + patch -> board`), raises `ValueError` on structural inconsistencies; `_try_parse_and_apply` swallows malformed patches so the caller doesn't have to.

### Frontend (`frontend/src/`)

- Next.js 16.1.6 App Router with `output: "export"` (static). React 19.2.3, Tailwind 4, `@dnd-kit/*` for drag-and-drop.
- Components using state/effects/dnd must start with `'use client'` (see `KanbanBoard.tsx`).
- `app/page.tsx` is the Kanban page; `app/login/page.tsx` posts to FastAPI's `/login`.
- `components/KanbanBoard.tsx` is the orchestrator — loads/saves via `lib/api.ts`, handles DnD context. `KanbanColumn.tsx`, `KanbanCard.tsx`, `NewCardForm.tsx`, `ChatSidebar.tsx` are the leaf widgets. `ChatSidebar` posts to `/api/ai/board-chat` and re-renders if a `board` comes back.
- Unit tests live next to source (`*.test.tsx`); e2e tests live in `frontend/tests/` (`kanban.spec.ts`, `persistence.spec.ts`, `ai-chat.spec.ts`).
- The frontend treats `/api/board` and `/api/ai/board-chat` as the source of truth — do not duplicate state in `localStorage` etc.

### Backend tests (`backend/tests/`)

- Use `tests.client.TestClient` (a thin httpx + ASGI wrapper), **not** `fastapi.testclient.TestClient`. The project rule is sync handlers under threadpool-backed clients have hung in the locked dep set; prefer async handlers and this local client.
- `seed.py` is the expected demo board fixture used by `test_db.py` and `test_board.py`.
- `test_ai.py` stubs the OpenRouter client (monkeypatches `_openrouter_chat`) to verify request shape and patch application without hitting the network.
- `test_db.py` round-trips `apply_board` → `load_board` against a per-test `tmp_path` via `PM_DB_PATH`.

## Project conventions (from `AGENTS.md`)

- Use latest library versions, idiomatic approaches.
- Keep it simple — no over-engineering, no defensive programming beyond what's needed, no extra features.
- Be concise in docs. **No emojis ever.**
- Identify root cause before fixing; prove with evidence, do not guess.
- Single source of truth for the build is `docs/PLAN.md` — read the relevant Part's Checklist / Tests / Success Criteria before implementing.
- Tests are added only when needed to verify success criteria; there is no coverage target.
- `.env` carries `OPENROUTER_API_KEY` (already populated). Tests that hit the real model skip automatically when the key is absent.

## Color palette

From root `AGENTS.md`: Accent Yellow `#ecad0a`, Blue Primary `#209dd7`, Purple Secondary `#753991` (submit buttons / important actions), Dark Navy `#032147` (headings), Gray Text `#888888`.

## Environment notes

- WSL2 / Linux dev host, Docker for the runtime.
- `.claude/settings.local.json` allow-lists `bash scripts/start.sh`, `bash scripts/stop.sh`, and `docker compose *`.
- `backend/static/` is the built Next.js export; it is committed so the image can build without re-running `npm run build`, but the Dockerfile does rebuild it in `node:22-slim` to keep it in sync.