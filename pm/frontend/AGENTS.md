# Frontend (working MVP, pre-Docker)

This directory holds the existing pure-frontend Project Management MVP. It has not yet been wired into the FastAPI / Docker setup described in `pm/AGENTS.md` and `pm/docs/PLAN.md`. State lives in React; there is no backend yet.

## Stack

- Next.js 16.1.6 (App Router, JSX/TSX)
- React 19.2.3
- TypeScript 5
- Tailwind CSS 4
- `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` for drag-and-drop
- Vitest 3 + Testing Library for unit tests
- Playwright 1.58 for e2e tests

## Layout

```
src/
  app/
    layout.tsx          root layout
    page.tsx            Kanban page
    globals.css         global styles (Tailwind entry)
    favicon.ico
  components/
    KanbanBoard.tsx     board container, drag-and-drop orchestration
    KanbanBoard.test.tsx
    KanbanColumn.tsx    single column
    KanbanCard.tsx      card row in a column
    KanbanCardPreview.tsx
    NewCardForm.tsx     add-card form (used inside a column)
  lib/
    kanban.ts           board state, column/card helpers
    kanban.test.ts
  test/
    setup.ts            Vitest setup (jsdom, @testing-library/jest-dom)
    vitest.d.ts
public/                 static assets (svgs and favicon)
tests/
  kanban.spec.ts        Playwright e2e
```

## How to run

From this directory only.

- `npm install`
- `npm run dev` — Next dev server
- `npm run build` — production build (export target for Part 3)
- `npm run start` — start the built app
- `npm run test` (alias `test:unit`) — Vitest unit tests
- `npm run test:unit:watch` — Vitest watch mode
- `npm run test:e2e` — Playwright e2e (browsers must be installed)
- `npm run test:all` — unit then e2e
- `npm run lint` — ESLint

## Conventions

- Color palette (accent yellow, blue primary, purple secondary, dark navy, gray text) lives in `pm/AGENTS.md`. Use Tailwind utilities that map to these hexes; do not introduce new colors.
- Components that use React state, effects, or `@dnd-kit` must start with `'use client'`.
- Unit tests live next to the file they cover (`Foo.tsx` -> `Foo.test.tsx`). E2E tests live in `tests/`.
- Do not add a backend or API client here; that is `backend/`'s job starting at Part 6.

## What changes later (do not pre-build)

- Part 2 adds `../backend/` with FastAPI and a `Dockerfile` at the repo root.
- Part 3 turns this app into a static build served by FastAPI at `/`.
- Part 4 wraps `/` behind a hardcoded sign-in (`user` / `password`).
- Parts 5–7 introduce SQLite + API + persistence; the in-memory state in `src/lib/kanban.ts` will be replaced.
- Parts 8–10 add the AI chat sidebar.

Until then, keep the MVP self-contained.
