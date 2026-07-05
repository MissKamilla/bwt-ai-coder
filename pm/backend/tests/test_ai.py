import os

import pytest
from fastapi.testclient import TestClient

import ai
from main import app

client = TestClient(app)


def test_ai_module_exports_call_ai() -> None:
    assert callable(getattr(ai, "call_ai", None))


def test_missing_api_key_raises(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)
    with pytest.raises(RuntimeError, match="OPENROUTER_API_KEY"):
        ai.call_ai([{"role": "user", "content": "hi"}])


def test_chat_endpoint_requires_auth() -> None:
    r = client.post(
        "/api/ai/chat",
        json={"messages": [{"role": "user", "content": "hi"}]},
        follow_redirects=False,
    )
    # require_user raises HTTPException(303) when the session is missing.
    assert r.status_code == 303
    assert r.headers["location"] == "/login"


def test_chat_endpoint_rejects_empty_messages() -> None:
    client.post(
        "/login",
        data={"username": "user", "password": "password"},
        follow_redirects=False,
    )
    r = client.post("/api/ai/chat", json={"messages": []}, follow_redirects=False)
    assert r.status_code == 400


@pytest.mark.skipif(
    not os.environ.get("OPENROUTER_API_KEY"),
    reason="OPENROUTER_API_KEY not configured",
)
def test_2_plus_2() -> None:
    reply = ai.call_ai([{"role": "user", "content": "What is 2+2?"}])
    assert "4" in reply


# ---------------------------------------------------------------------------
# Part 9 — board-chat (Structured Outputs) with stubbed OpenRouter client.
# ---------------------------------------------------------------------------

import json
import db


def _client_with_tmp_db(tmp_path, monkeypatch) -> TestClient:
    db_path = str(tmp_path / "app.db")
    monkeypatch.setenv("PM_DB_PATH", db_path)
    db.init_db(db_path)
    import main as main_module
    main_module._ensure_db.cache_clear()
    return TestClient(app)


def test_board_chat_endpoint_requires_auth() -> None:
    # Use a fresh TestClient so we don't inherit cookies from earlier tests.
    fresh = TestClient(app)
    r = fresh.post(
        "/api/ai/board-chat",
        json={"user_message": "hi"},
        follow_redirects=False,
    )
    assert r.status_code == 303
    assert r.headers["location"] == "/login"


def test_board_chat_request_payload_includes_board_history_and_user(
    tmp_path, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Stub the OpenRouter client and assert the outgoing payload shape."""
    monkeypatch.setenv("OPENROUTER_API_KEY", "stub-key")
    captured: dict = {}

    def fake_chat(messages, *, response_format=None, timeout=60.0):
        captured["messages"] = messages
        captured["response_format"] = response_format
        return json.dumps({"reply": "ok", "board_patch": None})

    monkeypatch.setattr(ai, "_openrouter_chat", fake_chat)

    c = _client_with_tmp_db(tmp_path, monkeypatch)
    c.post("/login", data={"username": "user", "password": "password"}, follow_redirects=False)
    r = c.post(
        "/api/ai/board-chat",
        json={
            "user_message": "add card 'Foo' to Backlog",
            "history": [
                {"role": "user", "content": "earlier turn"},
                {"role": "assistant", "content": "earlier reply"},
            ],
        },
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["reply"] == "ok"
    assert "columns" in body["board"] and "cards" in body["board"]

    msgs = captured["messages"]
    assert msgs[0]["role"] == "system"
    # Second system message carries the Kanban JSON.
    assert msgs[1]["role"] == "system" and "Current board (JSON)" in msgs[1]["content"]
    # History comes next, then user message.
    assert msgs[2]["content"] == "earlier turn"
    assert msgs[3]["content"] == "earlier reply"
    assert msgs[-1]["role"] == "user" and msgs[-1]["content"] == "add card 'Foo' to Backlog"

    # response_format forces Structured Outputs.
    rf = captured["response_format"]
    assert rf["type"] == "json_schema"
    assert rf["json_schema"]["name"] == "kanban_reply"
    assert rf["json_schema"]["strict"] is False
    assert "reply" in rf["json_schema"]["schema"]["properties"]


def test_board_chat_applies_patch_and_persists(
    tmp_path, monkeypatch: pytest.MonkeyPatch
) -> None:
    """A board_patch reply is applied server-side and persisted to the DB."""
    monkeypatch.setenv("OPENROUTER_API_KEY", "stub-key")

    patch = {
        "cards_add": [
            {
                "id": "card-99",
                "column_id": "col-backlog",
                "title": "From AI",
                "details": "added by test",
            }
        ]
    }

    def fake_chat(messages, *, response_format=None, timeout=60.0):
        return json.dumps({"reply": "added a card", "board_patch": patch})

    monkeypatch.setattr(ai, "_openrouter_chat", fake_chat)

    c = _client_with_tmp_db(tmp_path, monkeypatch)
    c.post("/login", data={"username": "user", "password": "password"}, follow_redirects=False)
    r = c.post(
        "/api/ai/board-chat",
        json={"user_message": "add a card", "history": []},
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["reply"] == "added a card"
    # The response board has the new card.
    assert "card-99" in body["board"]["cards"]
    assert body["board"]["cards"]["card-99"]["title"] == "From AI"
    assert "card-99" in body["board"]["columns"][0]["cardIds"]

    # And the DB was actually mutated (a follow-up GET to the live endpoint
    # would also see it; here we hit the db layer directly).
    persisted = db.load_board("user", path=str(tmp_path / "app.db"))
    assert "card-99" in persisted["cards"]
    assert persisted["cards"]["card-99"]["title"] == "From AI"


def test_board_chat_with_no_patch_does_not_mutate_board(
    tmp_path, monkeypatch: pytest.MonkeyPatch
) -> None:
    """If the model returns no patch, the persisted board is unchanged."""
    monkeypatch.setenv("OPENROUTER_API_KEY", "stub-key")

    def fake_chat(messages, *, response_format=None, timeout=60.0):
        return json.dumps({"reply": "no changes", "board_patch": None})

    monkeypatch.setattr(ai, "_openrouter_chat", fake_chat)

    c = _client_with_tmp_db(tmp_path, monkeypatch)
    c.post("/login", data={"username": "user", "password": "password"}, follow_redirects=False)

    before = db.load_board("user", path=str(tmp_path / "app.db"))
    r = c.post(
        "/api/ai/board-chat",
        json={"user_message": "say hi", "history": []},
    )
    assert r.status_code == 200, r.text
    after = db.load_board("user", path=str(tmp_path / "app.db"))
    assert before == after
    assert r.json()["reply"] == "no changes"