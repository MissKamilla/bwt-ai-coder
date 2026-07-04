"""Tests for /api/board — Part 6."""

from fastapi.testclient import TestClient

import db
from main import app

from tests.seed import EXPECTED_BOARD


def _client(tmp_path, monkeypatch) -> TestClient:
    """Point db at a temp file, init it, and return a TestClient.

    PM_DB_PATH must be set BEFORE the first call into db so that
    init_db() creates the schema/seed at the test location.
    """
    db_path = str(tmp_path / "app.db")
    monkeypatch.setenv("PM_DB_PATH", db_path)
    db.init_db(db_path)
    # Reset the lru_cache on the ensure helper so it re-evaluates db_path().
    import main as main_module
    main_module._ensure_db.cache_clear()
    return TestClient(app)


def _login(client: TestClient) -> None:
    r = client.post(
        "/login",
        data={"username": "user", "password": "password"},
        follow_redirects=False,
    )
    assert r.status_code == 303
    assert "pm_session" in r.cookies


# --- GET /api/board ---------------------------------------------------------

def test_get_board_unauthenticated_redirects_to_login(tmp_path, monkeypatch) -> None:
    client = _client(tmp_path, monkeypatch)
    r = client.get("/api/board", follow_redirects=False)
    assert r.status_code == 303
    assert r.headers["location"].startswith("/login")


def test_get_board_returns_seeded_board_for_user(tmp_path, monkeypatch) -> None:
    client = _client(tmp_path, monkeypatch)
    _login(client)
    r = client.get("/api/board")
    assert r.status_code == 200
    assert r.json() == EXPECTED_BOARD


# --- PATCH /api/board -------------------------------------------------------

def test_patch_board_without_session_returns_303(tmp_path, monkeypatch) -> None:
    client = _client(tmp_path, monkeypatch)
    r = client.patch(
        "/api/board",
        json={"columns": [], "cards": {}},
        follow_redirects=False,
    )
    assert r.status_code == 303
    assert r.headers["location"].startswith("/login")


def test_patch_board_with_invalid_body_returns_400(tmp_path, monkeypatch) -> None:
    client = _client(tmp_path, monkeypatch)
    _login(client)
    # Column references a card id that does not exist in cards.
    invalid = {
        "columns": [{"id": "col-x", "title": "X", "cardIds": ["ghost"]}],
        "cards": {},
    }
    r = client.patch("/api/board", json=invalid)
    assert r.status_code == 400
    body = r.json()
    assert "error" in body and body["error"]


def test_patch_board_persists_and_returns_persisted_state(tmp_path, monkeypatch) -> None:
    client = _client(tmp_path, monkeypatch)
    _login(client)
    new_board = {
        "columns": [
            {"id": "col-todo", "title": "Todo", "cardIds": ["card-a", "card-b"]},
            {"id": "col-wip",  "title": "WIP",  "cardIds": ["card-c"]},
        ],
        "cards": {
            "card-a": {"id": "card-a", "title": "A", "details": "first"},
            "card-b": {"id": "card-b", "title": "B", "details": "second"},
            "card-c": {"id": "card-c", "title": "C", "details": "third"},
        },
    }
    r = client.patch("/api/board", json=new_board)
    assert r.status_code == 200
    assert r.json() == new_board

    # Persistence is confirmed by a follow-up GET.
    r2 = client.get("/api/board")
    assert r2.status_code == 200
    assert r2.json() == new_board
