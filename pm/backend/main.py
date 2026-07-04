import json
from functools import lru_cache
from pathlib import Path

from fastapi import Depends, FastAPI, Form, Request, Response
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles
from starlette.types import ASGIApp, Receive, Scope, Send

import db
from auth import SESSION_COOKIE, SESSION_USER, decode_session, encode_session, require_user, verify_credentials

app = FastAPI()

STATIC_DIR = Path(__file__).parent / "static"


@lru_cache(maxsize=1)
def _ensure_db() -> None:
    db.init_db()


@app.get("/api/hello")
def api_hello() -> dict[str, str]:
    return {"message": "hello"}


@app.get("/api/board")
def get_board(_user: str = Depends(require_user)) -> dict:
    _ensure_db()
    return db.load_board(SESSION_USER)


@app.patch("/api/board")
async def patch_board(request: Request, _user: str = Depends(require_user)) -> Response:
    _ensure_db()
    body = await request.json()
    try:
        payload = db.apply_board(SESSION_USER, body)
    except (ValueError, TypeError) as exc:
        return Response(
            content=json.dumps({"error": str(exc)}),
            status_code=400,
            media_type="application/json",
        )
    return Response(
        content=json.dumps(payload),
        status_code=200,
        media_type="application/json",
    )


@app.post("/login")
def login(username: str = Form(...), password: str = Form(...)) -> Response:
    if not verify_credentials(username, password):
        return Response("Invalid credentials", status_code=401, media_type="text/plain")
    response = RedirectResponse(url="/", status_code=303)
    response.set_cookie(
        SESSION_COOKIE,
        encode_session(username),
        httponly=True,
        samesite="lax",
        path="/",
    )
    return response


@app.post("/logout")
def logout() -> RedirectResponse:
    response = RedirectResponse(url="/login", status_code=303)
    response.delete_cookie(SESSION_COOKIE, path="/")
    return response


# Routes that do NOT require an authenticated session.
ALWAYS_OPEN_EXACT = frozenset({"/login", "/login/", "/api/hello"})
ALWAYS_OPEN_PREFIXES = ("/_next/", "/favicon")


class AuthGateMiddleware:
    """Pure ASGI middleware that 303-redirects unauthenticated GETs to /login."""

    def __init__(self, inner: ASGIApp) -> None:
        self.inner = inner

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.inner(scope, receive, send)
            return

        path = scope.get("path", "/")
        method = scope.get("method", "GET").upper()

        is_open = path in ALWAYS_OPEN_EXACT or any(
            path.startswith(p) for p in ALWAYS_OPEN_PREFIXES
        )
        needs_auth = method == "GET" and not is_open

        if needs_auth:
            # Pull cookie header from the raw scope (cheap; no need to parse).
            cookie_header = ""
            for name, value in scope.get("headers", []):
                if name == b"cookie":
                    cookie_header = value.decode("latin1")
                    break
            cookies = _parse_cookies(cookie_header)
            if decode_session(cookies.get(SESSION_COOKIE)) is None:
                redirect = RedirectResponse(url="/login", status_code=303)
                await redirect(scope, receive, send)
                return

        await self.inner(scope, receive, send)


def _parse_cookies(header: str) -> dict[str, str]:
    out: dict[str, str] = {}
    if not header:
        return out
    for part in header.split(";"):
        if "=" in part:
            k, v = part.strip().split("=", 1)
            out[k] = v
    return out


app.add_middleware(AuthGateMiddleware)

if STATIC_DIR.is_dir():
    app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")