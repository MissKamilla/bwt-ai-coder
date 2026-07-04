"""SQLite-backed Kanban storage for the PM app.

Public surface (per docs/DATABASE.md §4):
    init_db(path)        -- idempotent schema + seed bootstrap
    load_board(user_id)  -- read the user's board as BoardData
    apply_board(user_id, board) -- persist a full BoardData snapshot, return the
                                  persisted truth

No ORM. No defensive programming. The caller owns the DB path lifecycle.
"""

from __future__ import annotations

import os
import sqlite3
from pathlib import Path
from typing import Any

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

SCHEMA_VERSION = 1

DEMO_USER_ID = "usr-user"
DEMO_USER_NAME = "user"
DEMO_USER_PASSWORD = "password"
DEMO_BOARD_ID = "brd-user"
DEMO_CREATED_AT = "2026-01-01T00:00:00Z"

DEFAULT_DB_PATH = Path(__file__).parent / "data" / "app.db"


def db_path() -> Path:
    """Return the active database path, honoring PM_DB_PATH."""
    override = os.environ.get("PM_DB_PATH")
    return Path(override) if override else DEFAULT_DB_PATH


# ---------------------------------------------------------------------------
# Schema
# ---------------------------------------------------------------------------

_SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS schema_version (
    version INTEGER PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS users (
    id         TEXT PRIMARY KEY,
    username   TEXT UNIQUE NOT NULL,
    password   TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS boards (
    id         TEXT PRIMARY KEY,
    user_id    TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS columns (
    id        TEXT PRIMARY KEY,
    board_id  TEXT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    title     TEXT NOT NULL,
    position  INTEGER NOT NULL,
    UNIQUE(board_id, position)
);

CREATE TABLE IF NOT EXISTS cards (
    id        TEXT PRIMARY KEY,
    board_id  TEXT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    column_id TEXT NOT NULL REFERENCES columns(id) ON DELETE CASCADE,
    title     TEXT NOT NULL,
    details   TEXT NOT NULL,
    position  INTEGER NOT NULL,
    UNIQUE(column_id, position)
);
"""


# ---------------------------------------------------------------------------
# Seed (mirrors frontend/src/lib/kanban.ts:initialData exactly)
# ---------------------------------------------------------------------------

SEED_COLUMNS: list[dict[str, Any]] = [
    {"id": "col-backlog",   "title": "Backlog",     "card_ids": ["card-1", "card-2"]},
    {"id": "col-discovery", "title": "Discovery",   "card_ids": ["card-3"]},
    {"id": "col-progress",  "title": "In Progress", "card_ids": ["card-4", "card-5"]},
    {"id": "col-review",    "title": "Review",      "card_ids": ["card-6"]},
    {"id": "col-done",      "title": "Done",        "card_ids": ["card-7", "card-8"]},
]

SEED_CARDS: dict[str, dict[str, str]] = {
    "card-1": {"title": "Align roadmap themes",    "details": "Draft quarterly themes with impact statements and metrics."},
    "card-2": {"title": "Gather customer signals", "details": "Review support tags, sales notes, and churn feedback."},
    "card-3": {"title": "Prototype analytics view","details": "Sketch initial dashboard layout and key drill-downs."},
    "card-4": {"title": "Refine status language",  "details": "Standardize column labels and tone across the board."},
    "card-5": {"title": "Design card layout",      "details": "Add hierarchy and spacing for scanning dense lists."},
    "card-6": {"title": "QA micro-interactions",   "details": "Verify hover, focus, and loading states."},
    "card-7": {"title": "Ship marketing page",     "details": "Final copy approved and asset pack delivered."},
    "card-8": {"title": "Close onboarding sprint", "details": "Document release notes and share internally."},
}


# ---------------------------------------------------------------------------
# Connection helpers
# ---------------------------------------------------------------------------

def _connect(path: Path) -> sqlite3.Connection:
    path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA journal_mode = WAL")
    return conn


def _apply_seed(conn: sqlite3.Connection) -> None:
    conn.execute(
        "INSERT INTO users (id, username, password, created_at) VALUES (?, ?, ?, ?)",
        (DEMO_USER_ID, DEMO_USER_NAME, DEMO_USER_PASSWORD, DEMO_CREATED_AT),
    )
    conn.execute(
        "INSERT INTO boards (id, user_id, created_at) VALUES (?, ?, ?)",
        (DEMO_BOARD_ID, DEMO_USER_ID, DEMO_CREATED_AT),
    )
    for position, col in enumerate(SEED_COLUMNS):
        conn.execute(
            "INSERT INTO columns (id, board_id, title, position) VALUES (?, ?, ?, ?)",
            (col["id"], DEMO_BOARD_ID, col["title"], position),
        )
        for card_position, card_id in enumerate(col["card_ids"]):
            card = SEED_CARDS[card_id]
            conn.execute(
                "INSERT INTO cards (id, board_id, column_id, title, details, position) "
                "VALUES (?, ?, ?, ?, ?, ?)",
                (card_id, DEMO_BOARD_ID, col["id"], card["title"], card["details"], card_position),
            )


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def init_db(path: str | Path | None = None) -> Path:
    """Create the schema and seed if empty. Idempotent. Returns the resolved path."""
    resolved = Path(path) if path is not None else db_path()
    with _connect(resolved) as conn:
        conn.executescript(_SCHEMA_SQL)
        version = conn.execute("SELECT version FROM schema_version").fetchone()
        if version is None:
            conn.execute("INSERT INTO schema_version (version) VALUES (?)", (SCHEMA_VERSION,))
        user_count = conn.execute("SELECT COUNT(*) AS n FROM users").fetchone()["n"]
        if user_count == 0:
            _apply_seed(conn)
    return resolved


def _resolve_user(conn: sqlite3.Connection, user_key: str) -> str:
    """Resolve a username or user-id to the canonical user id."""
    row = conn.execute(
        "SELECT id FROM users WHERE id = ? OR username = ?",
        (user_key, user_key),
    ).fetchone()
    if row is None:
        raise KeyError(f"no user for user_key={user_key!r}")
    return row["id"]


def load_board(user_key: str, path: str | Path | None = None) -> dict[str, Any]:
    """Read the user's board as a BoardData-shaped dict. Raises KeyError if absent."""
    resolved = Path(path) if path is not None else db_path()
    with _connect(resolved) as conn:
        uid = _resolve_user(conn, user_key)
        board = conn.execute(
            "SELECT id FROM boards WHERE user_id = ?", (uid,)
        ).fetchone()
        if board is None:
            raise KeyError(f"no board for user_key={user_key!r}")
        board_id = board["id"]

        col_rows = conn.execute(
            "SELECT id, title FROM columns WHERE board_id = ? ORDER BY position",
            (board_id,),
        ).fetchall()
        card_rows = conn.execute(
            "SELECT id, column_id, title, details FROM cards "
            "WHERE board_id = ? ORDER BY column_id, position",
            (board_id,),
        ).fetchall()

    cards: dict[str, dict[str, str]] = {}
    cards_by_column: dict[str, list[str]] = {row["id"]: [] for row in col_rows}
    for row in card_rows:
        cards[row["id"]] = {
            "id": row["id"],
            "title": row["title"],
            "details": row["details"],
        }
        cards_by_column[row["column_id"]].append(row["id"])

    columns = [
        {"id": row["id"], "title": row["title"], "cardIds": cards_by_column[row["id"]]}
        for row in col_rows
    ]
    return {"columns": columns, "cards": cards}


def validate_board(board: dict[str, Any]) -> None:
    columns = board.get("columns")
    cards = board.get("cards")
    if not isinstance(columns, list) or not columns:
        raise ValueError("board.columns must be a non-empty list")
    if not isinstance(cards, dict):
        raise ValueError("board.cards must be an object")

    seen_column_ids: set[str] = set()
    referenced_card_ids: list[str] = []
    for col in columns:
        if not isinstance(col, dict):
            raise ValueError("each column must be an object")
        cid, title, card_ids = col.get("id"), col.get("title"), col.get("cardIds")
        if not isinstance(cid, str) or not cid:
            raise ValueError("column.id must be a non-empty string")
        if cid in seen_column_ids:
            raise ValueError(f"duplicate column id: {cid!r}")
        seen_column_ids.add(cid)
        if not isinstance(title, str) or not title:
            raise ValueError(f"column {cid!r} title must be a non-empty string")
        if not isinstance(card_ids, list):
            raise ValueError(f"column {cid!r} cardIds must be a list")
        for card_id in card_ids:
            if not isinstance(card_id, str) or not card_id:
                raise ValueError(f"column {cid!r} contains invalid card id")
            referenced_card_ids.append(card_id)

    seen_card_ids: set[str] = set()
    for key, card in cards.items():
        if not isinstance(card, dict):
            raise ValueError(f"cards[{key!r}] must be an object")
        if card.get("id") != key:
            raise ValueError(f"cards[{key!r}].id must equal its key")
        if key in seen_card_ids:
            raise ValueError(f"duplicate card id: {key!r}")
        seen_card_ids.add(key)
        if not isinstance(card.get("title"), str) or not card["title"]:
            raise ValueError(f"card {key!r} title must be a non-empty string")
        if not isinstance(card.get("details"), str):
            raise ValueError(f"card {key!r} details must be a string")

    referenced = set(referenced_card_ids)
    if referenced != seen_card_ids:
        missing = referenced - seen_card_ids
        dangling = seen_card_ids - referenced
        problems = []
        if missing:
            problems.append(f"cards referenced by columns but missing: {sorted(missing)}")
        if dangling:
            problems.append(f"cards present but not referenced by any column: {sorted(dangling)}")
        raise ValueError("; ".join(problems))


def apply_board(
    user_key: str, board: dict[str, Any], path: str | Path | None = None
) -> dict[str, Any]:
    """Persist a full BoardData snapshot for the user. Returns the persisted truth."""
    validate_board(board)
    resolved = Path(path) if path is not None else db_path()

    with _connect(resolved) as conn:
        uid = _resolve_user(conn, user_key)
        board_row = conn.execute(
            "SELECT id FROM boards WHERE user_id = ?", (uid,)
        ).fetchone()
        if board_row is None:
            raise KeyError(f"no board for user_key={user_key!r}")
        board_id = board_row["id"]

        try:
            conn.execute("BEGIN")
            # Wipe this board's columns and cards before rewriting. CASCADE on
            # the cards FK keeps things consistent, but deleting columns first
            # makes the intent obvious.
            conn.execute("DELETE FROM columns WHERE board_id = ?", (board_id,))
            for position, col in enumerate(board["columns"]):
                conn.execute(
                    "INSERT INTO columns (id, board_id, title, position) "
                    "VALUES (?, ?, ?, ?)",
                    (col["id"], board_id, col["title"], position),
                )
                for card_position, card_id in enumerate(col["cardIds"]):
                    card = board["cards"][card_id]
                    conn.execute(
                        "INSERT INTO cards "
                        "(id, board_id, column_id, title, details, position) "
                        "VALUES (?, ?, ?, ?, ?, ?)",
                        (card_id, board_id, col["id"], card["title"], card["details"], card_position),
                    )
            conn.execute("COMMIT")
        except Exception:
            conn.execute("ROLLBACK")
            raise

    return load_board(user_key, resolved)
