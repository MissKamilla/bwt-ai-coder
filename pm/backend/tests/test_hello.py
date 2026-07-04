from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_index_returns_hello_world_html() -> None:
    r = client.get("/")
    assert r.status_code == 200
    assert r.headers["content-type"].startswith("text/html")
    assert "hello world" in r.text


def test_api_hello_returns_json() -> None:
    r = client.get("/api/hello")
    assert r.status_code == 200
    assert r.json() == {"message": "hello"}
