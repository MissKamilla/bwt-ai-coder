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