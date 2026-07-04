from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_api_hello_returns_json() -> None:
    r = client.get("/api/hello")
    assert r.status_code == 200
    assert r.json() == {"message": "hello"}


def test_root_serves_kanban_index() -> None:
    r = client.get("/")
    assert r.status_code == 200
    body = r.text
    # Without a built frontend (e.g. running pytest on the host) the static
    # directory is absent and we fall back to the inline hello-world page.
    if "Kanban Studio" in body:
        assert "data-testid=\"column-col-backlog\"" in body
    else:
        assert "hello world" in body
