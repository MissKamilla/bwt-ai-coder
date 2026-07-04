from fastapi import Cookie, HTTPException, status
from itsdangerous import BadSignature, SignatureExpired, TimestampSigner

SESSION_COOKIE = "pm_session"
SESSION_USER = "user"
SESSION_PASSWORD = "password"
# NOTE: hardcoded for the MVP per project rules ("keep it simple"). In a real
# deployment this would come from an environment variable or secret manager.
SESSION_SECRET = "dev-secret-change-me"

_signer = TimestampSigner(SESSION_SECRET, salt="pm-session")


def encode_session(username: str) -> str:
    return _signer.sign(username.encode("utf-8")).decode("utf-8")


def decode_session(token: str | None) -> str | None:
    if not token:
        return None
    try:
        return _signer.unsign(token, max_age=60 * 60 * 12).decode("utf-8")
    except (BadSignature, SignatureExpired):
        return None


def require_user(pm_session: str | None = Cookie(default=None)) -> str:
    username = decode_session(pm_session)
    if username != SESSION_USER:
        raise HTTPException(
            status_code=status.HTTP_303_SEE_OTHER,
            headers={"Location": "/login"},
        )
    return username


def verify_credentials(username: str, password: str) -> bool:
    return username == SESSION_USER and password == SESSION_PASSWORD
