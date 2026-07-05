# High level steps for project

Each part lists a **Checklist** (what the agent will do), **Tests** (how we verify), and **Success Criteria** (what "done" looks like).

## Working rules (apply to all parts)

- This document is the single source of truth. Do NOT produce a separate implementation plan per part — read the relevant Part's Checklist / Tests / Success Criteria here, clarify any genuinely open questions with the user, then execute directly.
- Tests are added only when they are actually needed to verify the success criteria. There is no coverage target. Skip heavy e2e suites (Playwright browser install, full npm ci in CI) unless a Part's Tests block explicitly requires them.

---

## Part 1: Plan

### Checklist

- [x] Expand this document so each of the 10 parts has a Checklist, Tests, and Success Criteria block.
- [x] Create `frontend/AGENTS.md` describing the existing frontend code as a short orientation map.
- [x] Re-read each part in this document and fix any references to it that became stale after the expansion.
- [x] Get user sign-off on the plan before any implementation begins.

### Tests

- Manual review: every one of Parts 1–10 has non-empty Checklist, Tests, and Success Criteria sections.
- Markdown sanity: headings remain well-formed; no orphan numbered/bullet references; ordering of the 10 parts is preserved.

### Success Criteria

- User has approved the plan.
- `docs/PLAN.md` is the single source of truth for Parts 2–10.
- `frontend/AGENTS.md` exists and accurately reflects today's frontend layout (Next 16.1.6 + React 19.2.3 + Tailwind 4 + @dnd-kit; Kanban components in `src/components/`; tests next to source + Playwright e2e in `tests/`).

---

## Part 2: Scaffolding (Docker + FastAPI + scripts)

### Checklist

- [x] Define Dockerfile and any compose config needed for local containerized development.
- [x] Create backend FastAPI app in backend/ with a health endpoint and a simple API endpoint.
- [x] Serve a minimal static HTML response at / to validate serving.
- [x] Add scripts in scripts/ for start and stop on Mac, PC, Linux.
- [x] Ensure uv is used as the Python package manager inside the container.
- [x] Add minimal README notes for running locally. — kept inline in this Part 2 block instead of a separate README (per project rule "Keep README minimal" and user decision on Part 2).

### Tests

- [x] Backend unit test for health endpoint.
- [x] Integration test that hits / and the example API endpoint in the running container.

### Success criteria

- [x] Container starts with a single command and serves both HTML at / and JSON at the API endpoint.
- [x] Start/stop scripts work on Mac, PC, and Linux.
- [x] Unit coverage for backend modules at or above 80%.

---

## Part 3: Add in Frontend

### Checklist

- [x] Build the existing NextJS frontend as a static export.
- [x] Have FastAPI serve the built static assets at `/` so the demo Kanban board is visible at `/`.
- [x] Keep the existing unit and e2e tests passing.

### Tests

- `scripts/test.sh` end-to-end smoke: `curl /` returns 200 with `Kanban Studio` in the body; `curl /api/hello` returns `{"message":"hello"}`; `curl /_next/static/...` returns 200 (one JS + one CSS asset, confirming the static bundle is served).
- Backend unit: `test_root_serves_kanban_index` (TestClient) asserts `Kanban Studio` and a `data-testid="column-col-*"` marker exist in the response.

### Success Criteria

- Visiting `/` in a fresh container shows the Kanban board from the frontend MVP.
- `_next/static/*` assets load with HTTP 200 from FastAPI.
- `/api/hello` (kept from Part 2 for back-compat) still returns 200.

---

## Part 4: Add in a fake user sign in experience

### Checklist

- [x] Add `/login` page with hardcoded credentials `user` / `password`.
- [x] On successful login, set a session cookie for the user.
- [x] Protect `/`: unauthenticated requests redirect to `/login`.
- [x] Add a logout endpoint / button that clears the session and returns to `/login`.

### Tests

- Backend unit (FastAPI TestClient): unauthed visit redirects to `/login`, wrong password returns 401, correct credentials set cookie and 303 to `/`, authenticated user reaches the Kanban, logout clears cookie, post-logout `/` redirects again. 7 tests total.
- `scripts/test.sh` end-to-end smoke covers the same flow over real HTTP.

### Success Criteria

- Visiting `/` without a session lands on `/login`.
- Logging in with `user`/`password` shows the Kanban.
- Logging out returns to `/login` and clears the session.

---

## Part 5: Database modeling

### Checklist

- [x] Propose a SQLite schema for users, boards, columns, cards, and ordering.
- [x] Include a JSON representation of the Kanban board shape used by the API and AI.
- [x] Save the schema proposal and JSON examples in docs/DATABASE.md.
- [x] Document rationale and migration approach in docs/.
- [x] Get user sign-off before implementation.

### Tests

- [x] `backend/tests/test_db.py` round-trip: `apply_board` then `load_board` returns an equal `BoardData` (deep-equal on the JSON shape).
- [x] `backend/tests/test_db.py` seed test: on a fresh DB, `load_board` returns the demo board with 5 columns and 8 cards, deep-equal to the seed.
- [x] `backend/tests/test_db.py` cascade test: deleting a column removes its cards via `ON DELETE CASCADE`.

### Success criteria

- [x] Schema proposal is clear, simple, and approved by the user.
- [x] docs/DATABASE.md documents both the SQLite tables and the Kanban JSON shape.
- [x] The approach supports future multiple users without adding extra MVP complexity.

---

## Part 6: Backend API

### Checklist

- [x] Add API routes to read and mutate the Kanban (boards/columns/cards) for the signed-in user.
- [x] Wire endpoints to the SQLite layer from Part 5.
- [x] Add comprehensive backend unit tests (per endpoint: success, auth failure, validation failure).

### Tests

- [x] `backend/tests/test_board.py` covers: unauthenticated GET → 303 redirect, authenticated GET returns the seeded board, PATCH without session → 303, PATCH with invalid body → 400, PATCH happy path persists and a follow-up GET confirms it.
- [x] Integration: `TestClient` end-to-end happy path against a real SQLite file (per-test `tmp_path` + `PM_DB_PATH` override, idempotent `init_db`).

### Success Criteria

- [x] All endpoints behave as documented in `docs/DATABASE.md` / Part 5.
- [x] Backend unit suite is green (14 passed, 1 pre-existing failure unrelated to Part 6 — `test_authenticated_user_can_access_root` expects `backend/static` to be built, which only happens inside the Docker image).

---

## Part 7: Frontend + Backend

### Checklist

- [x] Replace the frontend's in-memory state with API calls.
- [x] Add optimistic UI where reasonable and refetch on conflict.
- [x] Verify drag-and-drop persistence, card edits, column renames all survive a page reload.

### Tests

- [x] `frontend/tests/persistence.spec.ts` (Playwright e2e, ready-to-run, needs chromium system deps): create a card via UI → reload → assert card persists; column rename → reload → persists; drag a card across columns → reload → persists; edit card title → reload → persists.
- [x] Vitest (`frontend/src/components/KanbanBoard.test.tsx`) mocks `/api/board` GET/PATCH and covers rename, add, delete against the wired component.
- [x] Curl smoke against `uvicorn main:app` at `127.0.0.1:8000`: unauth GET → 303 /login, login wrong → 401, login ok → 303 + cookie, auth GET → 200 Kanban Studio, auth GET `/api/board` → 5 columns / 8 cards (seed), PATCH (rename + add + delete) → 200, GET after PATCH returns the persisted mutations (reload-equivalent), invalid PATCH body → 400, logout → 303, post-logout GET → 303, `/_next/static/*.js` served with 200.
- [x] Backend unit suite green: 15 passed.

### Success Criteria

- [x] The Kanban is a persistent, multi-session Kanban (POST→curl PATCH simulates user A; fresh GET simulates reload / new tab / new user; mutations persist).
- [x] All Playwright e2e scenarios are written and ready-to-run against a freshly built container (Playwright dependency install requires `libnspr4` / `libnss3` / etc. on the host; defer to the runbook step).

---

## Part 8: AI connectivity

### Checklist

- [x] Add an OpenRouter client in the backend reading `OPENROUTER_API_KEY` from `.env`.
- [x] Use model `openai/gpt-oss-120b:free`.
- [x] Expose a backend endpoint or helper that performs a single AI call.
- [x] Add a test that sends "What is 2+2?" and asserts the response includes "4".

### Tests

- Backend unit test for "2+2" (skipped automatically if no `OPENROUTER_API_KEY` is present).
- Manual: hitting the endpoint in a running container returns a sane answer.

### Success Criteria

- AI call succeeds against the configured model and key.
- The "2+2" test passes when an API key is available.

---

## Part 9: AI with Kanban JSON + Structured Outputs

### Checklist

- [x] Backend builds a request containing the user's Kanban as JSON, the user's latest message, and the conversation history.
- [x] Use OpenRouter Structured Outputs so the response always contains a `reply` string and an optional `board_patch` describing card/column changes.
- [x] Apply `board_patch` server-side and persist the updated Kanban.
- [x] Cover with thorough backend unit tests (stubbed OpenRouter client verifying request shape + patch application).
- [x] Graceful fallback in `process_message`: if the model returns malformed JSON, extract a JSON object via regex; if that also fails, treat raw output as plain `reply` (board untouched). This makes the endpoint resilient to noisy free-model responses.

### Tests

- Backend unit: with a stubbed client, verify request payload contains Kanban JSON + history + user message.
- Backend unit: stub a `board_patch` reply and verify the persisted board matches the patched state.
- Backend unit: reply with no patch does not mutate the board.

### Success Criteria

- A user message can flow through the AI and update the Kanban via `board_patch`.
- All backend unit tests remain green.

### Notes

- The free model (`openai/gpt-oss-120b:free`) is unreliable at strict Structured Outputs; sometimes it returns a valid `{reply, board_patch}`, sometimes a noisy prose reply. The graceful fallback above covers the latter case — UI Part 10 should display whatever `reply` comes back and update the board only if `board_patch` is present.

---

## Part 10: AI chat UI

### Checklist

- [x] Add a chat sidebar widget to the frontend.
- [x] Maintain conversation history in the sidebar.
- [x] On each AI reply, if a `board_patch` is returned, update the UI to reflect the new Kanban (refetch or local apply).
- [x] Cover with Playwright e2e: typing "Add a card called X to Todo" in the sidebar produces the new card in the Kanban UI.

### Tests

- Playwright e2e: full AI chat → board update flow with stubbed AI backend response (or live if a key is configured).
- Visual check: sidebar styling follows the color palette in `pm/AGENTS.md`.

### Success Criteria

- End-to-end: a user message in the chat updates the Kanban without a manual page refresh.
- Existing e2e + unit suites remain green.
