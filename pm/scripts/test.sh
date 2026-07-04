#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd)"
cd "${REPO_ROOT}"

STARTED=0
cleanup() {
  if [[ "${STARTED}" = "1" ]]; then
    bash "${REPO_ROOT}/scripts/stop.sh" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

# 1. Ensure the container is running.
if ! docker compose ps --status running app 2>/dev/null | grep -q app; then
  bash "${REPO_ROOT}/scripts/start.sh"
  STARTED=1
fi

# 2. Backend unit tests inside the container.
docker compose exec -T app uv sync --dev >/dev/null
docker compose exec -T app uv run pytest -v

# 3. End-to-end smoke test for the auth flow.
JAR="$(mktemp)"
trap 'rm -f "${JAR}"; cleanup' EXIT

# Unauth GET / must 303-redirect to /login.
unauth_status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/)
unauth_loc=$(curl -s -o /dev/null -w "%{redirect_url}" http://localhost:8000/)
if [[ "${unauth_status}" != "303" ]] || [[ "${unauth_loc}" != *"login"* ]]; then
  echo "error: unauth GET / should redirect to /login (got ${unauth_status} -> ${unauth_loc})" >&2
  exit 1
fi

# /api/hello stays open regardless of session.
hello_body=$(curl -s http://localhost:8000/api/hello)
if [[ "${hello_body}" != '{"message":"hello"}' ]]; then
  echo "error: GET /api/hello did not return the expected JSON" >&2
  exit 1
fi

# Login with wrong creds -> 401.
wrong_status=$(curl -s -o /dev/null -w "%{http_code}" -d "username=user&password=wrong" http://localhost:8000/login)
if [[ "${wrong_status}" != "401" ]]; then
  echo "error: wrong password should return 401 (got ${wrong_status})" >&2
  exit 1
fi

# Login with correct creds -> 303 to / + Set-Cookie.
login_status=$(curl -s -o /dev/null -c "${JAR}" -w "%{http_code}" -d "username=user&password=password" http://localhost:8000/login)
if [[ "${login_status}" != "303" ]]; then
  echo "error: correct login should return 303 (got ${login_status})" >&2
  exit 1
fi
if ! grep -q pm_session "${JAR}"; then
  echo "error: login did not set pm_session cookie" >&2
  exit 1
fi

# Auth GET / -> 200 with Kanban HTML.
auth_status=$(curl -s -o /dev/null -b "${JAR}" -w "%{http_code}" http://localhost:8000/)
auth_body=$(curl -s -b "${JAR}" http://localhost:8000/)
if [[ "${auth_status}" != "200" ]] || ! grep -q "Kanban Studio" <<<"${auth_body}"; then
  echo "error: auth GET / should return Kanban HTML (got ${auth_status})" >&2
  exit 1
fi

# Logout clears the cookie and redirects to /login.
logout_status=$(curl -s -o /dev/null -b "${JAR}" -c "${JAR}" -X POST -w "%{http_code}" http://localhost:8000/logout)
if [[ "${logout_status}" != "303" ]]; then
  echo "error: POST /logout should return 303 (got ${logout_status})" >&2
  exit 1
fi

# After logout, GET / redirects to /login again.
post_logout_status=$(curl -s -o /dev/null -b "${JAR}" -w "%{http_code}" http://localhost:8000/)
if [[ "${post_logout_status}" != "303" ]]; then
  echo "error: after logout GET / should redirect to /login (got ${post_logout_status})" >&2
  exit 1
fi

echo "smoke: unauth -> 303 /login, login wrong -> 401, login ok -> 303+cookie, auth / -> 200 Kanban, logout -> 303, post-logout / -> 303 OK"