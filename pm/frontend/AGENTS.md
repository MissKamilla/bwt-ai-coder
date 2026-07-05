# Frontend

This directory contains the Next.js Kanban UI. It is no longer a standalone demo:
the app is exported as static files and served by the FastAPI backend from `/`.

## Stack

- Next.js 16.1.6 with App Router and static export
- React 19.2.3
- TypeScript 5
- Tailwind CSS 4
- `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` for drag and drop
- Vitest 3 + Testing Library for unit tests
- Playwright 1.58 for e2e tests

## Layout

```
src/
  app/
    layout.tsx          root layout
    page.tsx            Kanban page
    login/page.tsx      static login page posted to FastAPI
    globals.css         Tailwind entry and app CSS variables
  components/
    KanbanBoard.tsx     board container, API loading/saving, drag orchestration
    KanbanColumn.tsx    single column and rename input
    KanbanCard.tsx      editable card row
    NewCardForm.tsx     add-card form
    ChatSidebar.tsx     AI chat UI
  lib/
    api.ts              browser API calls to FastAPI
    kanban.ts           board types and local move/id helpers
  test/
    setup.ts            Vitest setup
tests/
  kanban.spec.ts        base UI e2e
  persistence.spec.ts   API persistence e2e
  ai-chat.spec.ts       AI sidebar e2e with a stubbed backend reply
```

## How to Run

From `frontend/`:

- `npm install`
- `npm run dev`
- `npm run build`
- `npm run test`
- `npm run test:e2e`
- `npm run lint`

For the full app, prefer the root `scripts/start.sh` / `scripts/test.sh` flow so
the static frontend is served by FastAPI like production.

## Conventions

- Keep the color palette from root `AGENTS.md`.
- Components using React state, effects, or drag and drop must start with `'use client'`.
- Use `src/lib/api.ts` for browser calls to the backend.
- Unit tests live next to source files. E2E tests live in `frontend/tests/`.
- The backend owns authentication, persistence, and AI calls. The frontend should
  treat `/api/board` and `/api/ai/board-chat` as the source of truth.
