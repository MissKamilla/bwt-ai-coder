"""Tests for backend/db.py — Part 5 (DATABASE.md §4)."""

from pathlib import Path

import db

from tests.seed import EXPECTED_BOARD


def fresh_db(tmp_path: Path) -> Path:
    path = tmp_path / "app.db"
    db.init_db(path)
    return path


def test_seed_matches_initialData(tmp_path: Path) -> None:
    path = fresh_db(tmp_path)
    assert db.load_board("usr-user", path) == EXPECTED_BOARD


def test_round_trip_preserves_board(tmp_path: Path) -> None:
    path = fresh_db(tmp_path)
    new_board = {
        "columns": [
            {"id": "col-todo", "title": "Todo", "cardIds": ["card-a", "card-b"]},
            {"id": "col-wip",  "title": "WIP",  "cardIds": ["card-c", "card-d"]},
        ],
        "cards": {
            "card-a": {"id": "card-a", "title": "A", "details": "first"},
            "card-b": {"id": "card-b", "title": "B", "details": "second"},
            "card-c": {"id": "card-c", "title": "C", "details": "third"},
            "card-d": {"id": "card-d", "title": "D", "details": "fourth"},
        },
    }
    persisted = db.apply_board("usr-user", new_board, path)
    assert persisted == new_board
    assert db.load_board("usr-user", path) == new_board

    # Reordering (move + rename) round-trips too.
    moved = {
        "columns": [
            {"id": "col-todo", "title": "Backlog",  "cardIds": ["card-d", "card-a"]},
            {"id": "col-wip",  "title": "WIP",      "cardIds": ["card-c", "card-b"]},
        ],
        "cards": new_board["cards"],
    }
    assert db.apply_board("usr-user", moved, path) == moved


def test_cascade_delete_column_removes_cards(tmp_path: Path) -> None:
    import sqlite3

    path = fresh_db(tmp_path)
    # Delete the In Progress column directly. The two cards inside it must
    # disappear via ON DELETE CASCADE, and the rest of the board must survive.
    with sqlite3.connect(path) as conn:
        conn.execute("PRAGMA foreign_keys = ON")
        conn.execute("DELETE FROM columns WHERE id = 'col-progress'")
        conn.commit()

    board = db.load_board("usr-user", path)
    column_ids = {col["id"] for col in board["columns"]}
    assert "col-progress" not in column_ids
    assert "card-4" not in board["cards"]
    assert "card-5" not in board["cards"]
    # Untouched columns and their cards are still there.
    assert {"col-backlog", "col-discovery", "col-review", "col-done"} == column_ids
    assert board["columns"][0]["cardIds"] == ["card-1", "card-2"]
    assert board["cards"]["card-1"]["title"] == "Align roadmap themes"
