from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_api_hello_returns_json() -> None:
    r = client.get("/api/hello")
    assert r.status_code == 200
    assert r.json() == {"message": "hello"}


def test_root_redirects_to_login_when_unauthenticated() -> None:
    r = client.get("/", follow_redirects=False)
    assert r.status_code == 303
    assert r.headers["location"] == "/login"


def test_login_with_wrong_password_returns_401() -> None:
    r = client.post("/login", data={"username": "user", "password": "wrong"}, follow_redirects=False)
    assert r.status_code == 401


def test_login_with_correct_credentials_sets_cookie_and_redirects() -> None:
    r = client.post(
        "/login",
        data={"username": "user", "password": "password"},
        follow_redirects=False,
    )
    assert r.status_code == 303
    assert r.headers["location"] == "/"
    assert "pm_session" in r.cookies


def test_authenticated_user_can_access_root() -> None:
    client.post(
        "/login",
        data={"username": "user", "password": "password"},
        follow_redirects=False,
    )
    r = client.get("/", follow_redirects=False)
    assert r.status_code == 200


def test_logout_clears_cookie_and_redirects() -> None:
    client.post(
        "/login",
        data={"username": "user", "password": "password"},
        follow_redirects=False,
    )
    r = client.post("/logout", follow_redirects=False)
    assert r.status_code == 303
    assert r.headers["location"] == "/login"


def test_root_is_blocked_again_after_logout() -> None:
    client.post(
        "/login",
        data={"username": "user", "password": "password"},
        follow_redirects=False,
    )
    client.post("/logout", follow_redirects=False)
    r = client.get("/", follow_redirects=False)
    assert r.status_code == 303
