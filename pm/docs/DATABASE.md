# Database & Kanban JSON

This document is the source of truth for storage and the Kanban JSON shape.
It is the contract between the frontend, the backend, and the AI (Parts 6–10).

Working rules carried over from `pm/AGENTS.md`:

- Plain SQLite via the stdlib `sqlite3` module. No ORM.
- Keep it simple. No defensive programming. Idempotent startup.
- Source of truth: this file. Parts 6+ implement against it; do not fork the design.

---

## 1. Storage

### 1.1 Engine and connection

- SQLite file at `data/app.db` inside the container, created on first start.
- One connection per request, opened with `sqlite3.connect(path)`, `row_factory = sqlite3.Row`, `PRAGMA foreign_keys = ON`, `PRAGMA journal_mode = WAL`.
- All writes that touch the board go through a single `BEGIN` / `COMMIT` per logical operation (rename column, move card, etc.).

### 1.2 Schema

Five tables. All IDs are server-generated TEXT keys with a type prefix.

#### `schema_version`

| column      | type    | notes                          |
| ----------- | ------- | ------------------------------ |
| `version`   | INTEGER | PRIMARY KEY. Always exactly one row. |

The single row records the schema version applied to the DB. Bumping this value
is how future migrations are gated. For the MVP the value is `1`.

#### `users`

| column      | type   | notes                                       |
| ----------- | ------ | ------------------------------------------- |
| `id`        | TEXT   | PRIMARY KEY. Server-generated, `usr-...`.  |
| `username`  | TEXT   | UNIQUE NOT NULL.                            |
| `password`  | TEXT   | NOT NULL. For the MVP this is the literal `password`. |
| `created_at`| TEXT   | NOT NULL. ISO-8601 UTC timestamp.           |

The MVP only ever reads/writes the single user `user`. The table exists so
Parts 6+ can carry "future multiple users" without a redesign.

#### `boards`

| column      | type   | notes                                                       |
| ----------- | ------ | ----------------------------------------------------------- |
| `id`        | TEXT   | PRIMARY KEY. Server-generated, `brd-...`.                   |
| `user_id`   | TEXT   | UNIQUE NOT NULL, REFERENCES `users(id)` ON DELETE CASCADE. |
| `created_at`| TEXT   | NOT NULL. ISO-8601 UTC timestamp.                           |

`UNIQUE (user_id)` enforces "one board per signed-in user" from `pm/AGENTS.md`.

#### `columns`

| column      | type    | notes                                                  |
| ----------- | ------- | ------------------------------------------------------ |
| `id`        | TEXT    | PRIMARY KEY. Server-generated, `col-...`.              |
| `board_id`  | TEXT    | NOT NULL, REFERENCES `boards(id)` ON DELETE CASCADE.  |
| `title`     | TEXT    | NOT NULL.                                              |
| `position`  | INTEGER | NOT NULL. 0-indexed, dense, ordered left to right.     |
|             |         | UNIQUE (`board_id`, `position`).                       |

A column is the on-disk equivalent of `Column` from the Kanban JSON. The card
order inside a column lives in the `cards` table; see below.

#### `cards`

| column      | type    | notes                                                  |
| ----------- | ------- | ------------------------------------------------------ |
| `id`        | TEXT    | PRIMARY KEY. Server-generated, `card-...`.             |
| `board_id`  | TEXT    | NOT NULL, REFERENCES `boards(id)` ON DELETE CASCADE.  |
| `column_id` | TEXT    | NOT NULL, REFERENCES `columns(id)` ON DELETE CASCADE. |
| `title`     | TEXT    | NOT NULL.                                              |
| `details`   | TEXT    | NOT NULL. Plain text (not JSON).                       |
| `position`  | INTEGER | NOT NULL. 0-indexed, dense, ordered top to bottom.     |
|             |         | UNIQUE (`column_id`, `position`).                      |

`board_id` is denormalized onto cards so we can `WHERE board_id = ?` without a
join to columns. It is always kept consistent with the parent column.

#### Cascade summary

- `boards` row deletion cascades to its `columns` and `cards`.
- `columns` row deletion cascades to its `cards`.
- `users` row deletion cascades to its `board`.

### 1.3 ID generation

- Server-generated. Format: `<prefix>-<base36 of (time << 16 | random16)>`,
  where `<prefix>` is `usr`, `brd`, `col`, or `card`. Implemented as a single
  helper in `backend/db.py` so the format is the same everywhere.
- Seeded rows (see 1.5) use deterministic IDs (`usr-user`, `brd-user`,
  `col-backlog`, `card-1`, ...) so tests can refer to them by name.

### 1.4 Initialization

A module-level function `init_db(path)` is called on app startup:

1. Open the DB and enable `foreign_keys`.
2. `CREATE TABLE IF NOT EXISTS` for the five tables above.
3. If `schema_version` is empty, insert the row `version = 1`.
4. If `users` is empty, run the seed described in 1.5.

`init_db` is idempotent. Calling it twice is a no-op.

### 1.5 Seed (demo board)

When the user table is empty, `init_db` inserts the same data the frontend
already renders in `frontend/src/lib/kanban.ts` as `initialData`, so the first
visit shows a familiar board:

- One user: `id = "usr-user"`, `username = "user"`, `password = "password"`.
- One board: `id = "brd-user"`, `user_id = "usr-user"`.
- Five columns, in order, with these exact IDs and titles:
  - `col-backlog` — "Backlog"
  - `col-discovery` — "Discovery"
  - `col-progress` — "In Progress"
  - `col-review` — "Review"
  - `col-done` — "Done"
- Eight cards, with the same IDs, titles, and details as in `initialData`,
  placed by `position` according to `cardIds` inside each column.

If the seed ever needs to change, bump `schema_version` to `2` and add a
migration block. The MVP ships at `1`.

---

## 2. Kanban JSON (API + AI contract)

This is the wire and prompt shape. The frontend already uses it as
`BoardData`; the backend serves it from SQLite and the AI receives and emits it.

```ts
type Card      = { id: string; title: string; details: string };
type Column    = { id: string; title: string; cardIds: string[] };
type BoardData = { columns: Column[]; cards: Record<string, Card> };
```

Concrete example, matching the seed:

```json
{
  "columns": [
    { "id": "col-backlog",   "title": "Backlog",     "cardIds": ["card-1", "card-2"] },
    { "id": "col-discovery", "title": "Discovery",   "cardIds": ["card-3"] },
    { "id": "col-progress",  "title": "In Progress", "cardIds": ["card-4", "card-5"] },
    { "id": "col-review",    "title": "Review",      "cardIds": ["card-6"] },
    { "id": "col-done",      "title": "Done",        "cardIds": ["card-7", "card-8"] }
  ],
  "cards": {
    "card-1": { "id": "card-1", "title": "Align roadmap themes",   "details": "Draft quarterly themes with impact statements and metrics." },
    "card-2": { "id": "card-2", "title": "Gather customer signals", "details": "Review support tags, sales notes, and churn feedback." },
    "card-3": { "id": "card-3", "title": "Prototype analytics view","details": "Sketch initial dashboard layout and key drill-downs." },
    "card-4": { "id": "card-4", "title": "Refine status language",  "details": "Standardize column labels and tone across the board." },
    "card-5": { "id": "card-5", "title": "Design card layout",      "details": "Add hierarchy and spacing for scanning dense lists." },
    "card-6": { "id": "card-6", "title": "QA micro-interactions",   "details": "Verify hover, focus, and loading states." },
    "card-7": { "id": "card-7", "title": "Ship marketing page",     "details": "Final copy approved and asset pack delivered." },
    "card-8": { "id": "card-8", "title": "Close onboarding sprint", "details": "Document release notes and share internally." }
  }
}
```

Invariants the JSON must satisfy:

- `columns` is ordered left to right; that ordering is the source of `position`.
- Within each column, `cardIds` is ordered top to bottom; that ordering is the
  source of `position`.
- Every ID in any `cardIds` array has a matching key in `cards`.
- No card key in `cards` is left dangling (not referenced by any column).
- `card.id === key` for each entry in `cards`.

### 2.1 Read path

`load_board(user_id) -> BoardData`:

1. Fetch the board row for the user.
2. `SELECT * FROM columns WHERE board_id = ? ORDER BY position`.
3. `SELECT * FROM cards WHERE board_id = ? ORDER BY column_id, position`.
4. Stitch into the JSON shape above.

### 2.2 Write path (full-snapshot-per-column)

Every mutating endpoint takes the user, the current `BoardData`, the requested
change, and computes the new `BoardData`, then writes it back as a single
transaction:

- For a **column rename**: a single `UPDATE columns SET title = ? WHERE id = ?`.
- For a **card move** (drag and drop): rewrite the affected columns entirely:
  1. `DELETE FROM cards WHERE column_id IN (?, ?)`.
  2. `INSERT INTO cards (...) VALUES ...` for each row in the new ordering of
     both columns, with `position` reassigned 0..n-1.
  3. The untouched columns are not touched.
- For a **card edit** (title/details): `UPDATE cards SET ... WHERE id = ?`.
- For a **card create**: pick a new `card-...` ID server-side, `INSERT`, then
  update the target column's `cardIds` (full snapshot of that column only).
- For a **card delete**: `DELETE FROM cards WHERE id = ?`, then update the
  source column's `cardIds` (full snapshot).

Why full-snapshot-per-column on drag: it is the simplest correct write for a
dense `position` ordering, and a column has at most a handful of cards.
Optimizing this is a future-migration problem, not an MVP concern.

---

## 3. `board_patch` (AI contract for Part 9)

`board_patch` is the structured patch the AI emits alongside its `reply`.
The server validates it against the current board and, if valid, applies it as
a single transaction using the write path above. If validation fails, the
server rejects the patch and returns the AI reply without mutating the board.

### 3.1 Shape

```ts
type BoardPatch = {
  renames?:   { columnId: string; title: string }[];
  createCards?:  { tempId: string; columnId: string; title: string; details: string }[];
  updateCards?:  { id: string; title?: string; details?: string }[];
  moveCards?:     { id: string; toColumnId: string; toIndex: number }[];
  deleteCards?:   { id: string }[];
};
```

Semantics:

- `renames` are applied first.
- `createCards` are applied next; the server replaces each `tempId` with a
  server-generated `card-...` ID and exposes the mapping in the response.
- `updateCards`, `moveCards`, `deleteCards` are applied last, in that order.
- `moveCards.toIndex` is the 0-based position in the destination column's
  resulting `cardIds`.
- `tempId` must be unique within a single patch and must not collide with any
  existing card ID; otherwise the whole patch is rejected.

Validation rules (all must hold, otherwise reject the entire patch):

- Every referenced `columnId` exists on the user's board.
- Every referenced `id` exists on the user's board.
- `toIndex` is within `[0, destColumn.cardIds.length]` for the column at the
  moment that operation runs (the patch is replayed in order).
- `details` and `title` are non-empty strings.

After application, the server returns the new `BoardData` plus the resolved
`tempId -> cardId` map so the frontend can react.

---

## 4. Implementation plan for Part 5

Two deliverables, both inside `pm/`:

1. `backend/db.py` exposing:
   - `init_db(path) -> None`
   - `load_board(user_id) -> BoardData`
   - `apply_board(user_id, BoardData) -> BoardData` (used in tests; the
     per-operation endpoints in Part 6 use the focused write helpers).
2. `backend/tests/test_db.py`:
   - Round-trip test: `apply_board` then `load_board` returns an equal
     `BoardData` (deep-equal on the JSON shape).
   - Seed test: on a fresh DB, `load_board("usr-user")` returns the demo
     board from §1.5, deep-equal to the seed.
   - Cascade test: deleting a column removes its cards.

Part 5 ships no HTTP endpoints (those land in Part 6) and no migration runner
beyond `init_db` (the MVP has one schema version).

---

## 5. What this document does not cover

- HTTP route shapes and auth checks: Part 6.
- Drag-and-drop persistence wiring on the frontend: Part 7.
- OpenRouter client: Part 8.
- Chat sidebar and end-to-end AI flow: Parts 9–10.