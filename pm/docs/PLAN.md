# High level steps for project

Each part lists a **Checklist** (what the agent will do), **Tests** (how we verify), and **Success Criteria** (what "done" looks like).

## Working rules (apply to all parts)

- This document is the single source of truth. Do NOT produce a separate implementation plan per part — read the relevant Part's Checklist / Tests / Success Criteria here, clarify any genuinely open questions with the user, then execute directly.
- Tests are added only when they are actually needed to verify the success criteria. There is no coverage target. Skip heavy e2e suites (Playwright browser install, full npm ci in CI) unless a Part's Tests block explicitly requires them.
- Coding rules from `pm/AGENTS.md` still apply: no emojis, color palette (Accent `#ecad0a`, Blue `#209dd7`, Purple `#753991`, Navy `#032147`, Gray `#888888`), latest idiomatic libraries, no over-engineering, root-cause first.

---

## Part 1: Plan

### Checklist

- [ ] Expand this document so each of the 10 parts has a Checklist, Tests, and Success Criteria block.
- [ ] Create `frontend/AGENTS.md` describing the existing frontend code as a short orientation map.
- [ ] Re-read each part in this document and fix any references to it that became stale after the expansion.
- [ ] Get user sign-off on the plan before any implementation begins.

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

- Playwright e2e: navigate to `/`, assert the Kanban board renders.
- Unit: existing Vitest suite still passes unchanged against the static build.

### Success Criteria

- Visiting `/` in a fresh container shows the Kanban board from the frontend MVP.
- All previous unit + e2e tests stay green.

---

## Part 4: Add in a fake user sign in experience

### Checklist

- [ ] Add `/login` page with hardcoded credentials `user` / `password`.
- [ ] On successful login, set a session cookie for the user.
- [ ] Protect `/`: unauthenticated requests redirect to `/login`.
- [ ] Add a logout endpoint / button that clears the session and returns to `/login`.

### Tests

- Playwright e2e: unauthed visit to `/` redirects to `/login`; correct credentials reach the Kanban; incorrect credentials show an error; logout returns to `/login`.
- Backend unit: auth middleware/dependency rejects requests without a valid session.

### Success Criteria

- Visiting `/` without a session lands on `/login`.
- Logging in with `user`/`password` shows the Kanban.
- Logging out returns to `/login` and clears the session.

---

## Part 5: Database modeling

### Checklist

- [ ] Propose a SQLite schema for users, boards, columns, cards, and ordering.
- [ ] Include a JSON representation of the Kanban board shape used by the API and AI.
- [ ] Save the schema proposal and JSON examples in docs/DATABASE.md.
- [ ] Document rationale and migration approach in docs/.
- [ ] Get user sign-off before implementation.

### Tests

- [ ] Validate the documented Kanban JSON structure with a simple unit test.
- [ ] Validate that the proposed schema supports one board per user, fixed renameable columns, ordered cards, and drag-and-drop persistence.

### Success criteria

- Schema proposal is clear, simple, and approved by the user.
- docs/DATABASE.md documents both the SQLite tables and the Kanban JSON shape.
- The approach supports future multiple users without adding extra MVP complexity.

---

## Part 6: Backend API

### Checklist

- [ ] Add API routes to read and mutate the Kanban (boards/columns/cards) for the signed-in user.
- [ ] Wire endpoints to the SQLite layer from Part 5.
- [ ] Add comprehensive backend unit tests (per endpoint: success, auth failure, validation failure).

### Tests

- Pytest unit tests for each route: success path, missing session, invalid input.
- Integration: `TestClient` runs an end-to-end happy-path scenario against the real SQLite file.

### Success Criteria

- All endpoints behave as documented in `docs/DATABASE.md` / Part 5.
- Backend unit suite is green.

---

## Part 7: Frontend + Backend

### Checklist

- [ ] Replace the frontend's in-memory state with API calls.
- [ ] Add optimistic UI where reasonable and refetch on conflict.
- [ ] Verify drag-and-drop persistence, card edits, column renames all survive a page reload.

### Tests

- Playwright e2e: create a card via UI → reload → assert card persists.
- Playwright e2e: rename a column, drag a card across columns, edit card text → reload → all changes persist.
- Backend unit: still green.

### Success Criteria

- The Kanban is a persistent, multi-session Kanban.
- All e2e scenarios pass against a freshly built container.

---

## Part 8: AI connectivity

### Checklist

- [ ] Add an OpenRouter client in the backend reading `OPENROUTER_API_KEY` from `.env`.
- [ ] Use model `openai/gpt-oss-120b:free`.
- [ ] Expose a backend endpoint or helper that performs a single AI call.
- [ ] Add a test that sends "What is 2+2?" and asserts the response includes "4".

### Tests

- Backend unit test for "2+2" (skipped automatically if no `OPENROUTER_API_KEY` is present).
- Manual: hitting the endpoint in a running container returns a sane answer.

### Success Criteria

- AI call succeeds against the configured model and key.
- The "2+2" test passes when an API key is available.

---

## Part 9: AI with Kanban JSON + Structured Outputs

### Checklist

- [ ] Backend builds a request containing the user's Kanban as JSON, the user's latest message, and the conversation history.
- [ ] Use OpenRouter Structured Outputs so the response always contains a `reply` string and an optional `board_patch` describing card/column changes.
- [ ] Apply `board_patch` server-side and persist the updated Kanban.
- [ ] Cover with thorough backend unit tests (stubbed OpenRouter client verifying request shape + patch application).

### Tests

- Backend unit: with a stubbed client, verify request payload contains Kanban JSON + history + user message.
- Backend unit: stub a `board_patch` reply and verify the persisted board matches the patched state.
- Backend unit: reply with no patch does not mutate the board.

### Success Criteria

- A user message can flow through the AI and update the Kanban via `board_patch`.
- All backend unit tests remain green.

---

## Part 10: AI chat UI

### Checklist

- [ ] Add a chat sidebar widget to the frontend.
- [ ] Maintain conversation history in the sidebar.
- [ ] On each AI reply, if a `board_patch` is returned, update the UI to reflect the new Kanban (refetch or local apply).
- [ ] Cover with Playwright e2e: typing "Add a card called X to Todo" in the sidebar produces the new card in the Kanban UI.

### Tests

- Playwright e2e: full AI chat → board update flow with stubbed AI backend response (or live if a key is configured).
- Visual check: sidebar styling follows the color palette in `pm/AGENTS.md`.

### Success Criteria

- End-to-end: a user message in the chat updates the Kanban without a manual page refresh.
- Existing e2e + unit suites remain green.
