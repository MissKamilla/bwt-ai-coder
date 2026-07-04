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
if ! docker compose ps --status running app >/dev/null 2>&1; then
  bash "${REPO_ROOT}/scripts/start.sh"
  STARTED=1
fi

# 2. Backend unit tests inside the container.
docker compose exec -T app uv sync --dev >/dev/null
docker compose exec -T app uv run pytest -v

# 3. Static-serving smoke test against the running container.
index_status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/)
index_body=$(curl -s http://localhost:8000/)
if [[ "${index_status}" != "200" ]] || ! grep -q "Kanban Studio" <<<"${index_body}"; then
  echo "error: GET / did not return the Kanban HTML" >&2
  exit 1
fi
hello_body=$(curl -s http://localhost:8000/api/hello)
if [[ "${hello_body}" != '{"message":"hello"}' ]]; then
  echo "error: GET /api/hello did not return the expected JSON" >&2
  exit 1
fi
echo "smoke: / -> 200 (Kanban), /api/hello -> 200 (JSON) OK"