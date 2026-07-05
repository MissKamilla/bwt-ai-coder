"""OpenRouter client for the PM app.

Public surface:
    call_ai(messages)               -- single round-trip chat (Part 8)
    process_message(board, history, user_message, *, user_id, db_path=None)
                                     -- Kanban-aware call (Part 9)
    BOARD_PATCH_SCHEMA              -- the JSON schema the model must return
    apply_board_patch(board, patch) -- pure function: board + patch -> board

The model is hardcoded; the API key is read from $OPENROUTER_API_KEY.
"""

from __future__ import annotations

import os
from typing import Any

import httpx

import db

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL = "openai/gpt-oss-120b:free"

# ---------------------------------------------------------------------------
# Structured Outputs schema (Part 9)
# ---------------------------------------------------------------------------
#
# `board_patch` is intentionally lenient (additionalProperties: True) — the
# real shape is enforced server-side by `apply_board_patch`.  Keeping the
# model output schema small improves reliability; the model can produce any
# patch shape and we validate it against the actual Kanban rules.

# NOTE: outer shape is strict, inner `board_patch` is loose; `apply_board_patch`
# enforces the per-op rules server-side. This lets the free model be expressive
# while we still get machine-readable output.
BOARD_PATCH_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "reply": {"type": "string"},
        "board_patch": {"type": ["object", "null"]},
    },
    "required": ["reply"],
    "additionalProperties": False,
}

SYSTEM_PROMPT = (
    "You are a Kanban assistant. The user gives you the current board as JSON "
    "and a request. You must reply with a single JSON object of shape "
    '{"reply": "<short message>", "board_patch": <object or null>}. '
    "Set `board_patch` to null if no change is needed. Otherwise include any "
    "subset of these operations inside `board_patch`:\n"
    '  {"columns_rename": [{"id": "<column_id>", "title": "<new>"}]}\n'
    '  {"cards_add": [{"id": "<new_id>", "column_id": "<column_id>", '
    '"title": "...", "details": "..."}]}\n'
    '  {"cards_update": [{"id": "<card_id>", "title": "...", "details": "...", '
    '"column_id": "<column_id>"}]}\n'
    '  {"cards_delete": ["<card_id>", ...]}\n'
    "Example for 'add a card called Foo to Backlog': "
    '{"reply":"Added Foo to Backlog.","board_patch":'
    '{"cards_add":[{"id":"card-9","column_id":"col-backlog",'
    '"title":"Foo","details":""}]}}. '
    "Output ONLY the JSON object — no markdown, no commentary."
)


# ---------------------------------------------------------------------------
# Part 8 — single round-trip
# ---------------------------------------------------------------------------

def call_ai(
    messages: list[dict],
    *,
    model: str | None = None,
    timeout: float = 30.0,
) -> str:
    """Send `messages` to OpenRouter and return the assistant text.

    Raises:
        RuntimeError: OPENROUTER_API_KEY is not set in the environment.
        httpx.HTTPError: the request failed or returned non-2xx.
    """
    api_key = os.environ.get("OPENROUTER_API_KEY")
    if not api_key:
        raise RuntimeError("OPENROUTER_API_KEY not set")

    payload = {"model": model or MODEL, "messages": messages}
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    with httpx.Client(timeout=timeout) as client:
        response = client.post(OPENROUTER_URL, json=payload, headers=headers)
        response.raise_for_status()
        data = response.json()

    choices = data.get("choices") or []
    if not choices:
        raise RuntimeError("OpenRouter returned no choices")
    return (choices[0].get("message", {}).get("content") or "").strip()


# ---------------------------------------------------------------------------
# Part 9 — Kanban-aware call (Structured Outputs)
# ---------------------------------------------------------------------------

def _openrouter_chat(
    messages: list[dict],
    *,
    response_format: dict | None = None,
    timeout: float = 60.0,
) -> str:
    """Low-level OpenRouter call with optional response_format. Returns raw content."""
    api_key = os.environ.get("OPENROUTER_API_KEY")
    if not api_key:
        raise RuntimeError("OPENROUTER_API_KEY not set")

    payload: dict[str, Any] = {"model": MODEL, "messages": messages}
    if response_format is not None:
        payload["response_format"] = response_format
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    with httpx.Client(timeout=timeout) as client:
        response = client.post(OPENROUTER_URL, json=payload, headers=headers)
        response.raise_for_status()
        data = response.json()
    choices = data.get("choices") or []
    if not choices:
        raise RuntimeError("OpenRouter returned no choices")
    return (choices[0].get("message", {}).get("content") or "").strip()


def apply_board_patch(board: dict, patch: dict | None) -> dict:
    """Pure: apply a board_patch to a board dict, return a new board.

    Raises ValueError on any structural inconsistency.
    """
    if not patch:
        return board

    # Copy so we never mutate the caller's board.
    columns = [dict(c) for c in board["columns"]]
    cards = {k: dict(v) for k, v in board["cards"].items()}

    for ren in patch.get("columns_rename") or []:
        cid = ren["id"]
        for col in columns:
            if col["id"] == cid:
                col["title"] = ren["title"]
                break
        else:
            raise ValueError(f"columns_rename: unknown column id {cid!r}")

    for add in patch.get("cards_add") or []:
        cid = add["column_id"]
        target = next((c for c in columns if c["id"] == cid), None)
        if target is None:
            raise ValueError(f"cards_add: unknown column id {cid!r}")
        if add["id"] in cards:
            raise ValueError(f"cards_add: duplicate card id {add['id']!r}")
        cards[add["id"]] = {
            "id": add["id"],
            "title": add["title"],
            "details": add.get("details", ""),
        }
        target["cardIds"] = list(target["cardIds"]) + [add["id"]]

    for upd in patch.get("cards_update") or []:
        cid = upd["id"]
        if cid not in cards:
            raise ValueError(f"cards_update: unknown card id {cid!r}")
        if upd.get("title") is not None:
            cards[cid]["title"] = upd["title"]
        if upd.get("details") is not None:
            cards[cid]["details"] = upd["details"]
        if "column_id" in upd and upd["column_id"] is not None:
            new_col = upd["column_id"]
            target = next((c for c in columns if c["id"] == new_col), None)
            if target is None:
                raise ValueError(f"cards_update: unknown target column {new_col!r}")
            for col in columns:
                if cid in col["cardIds"]:
                    col["cardIds"] = [x for x in col["cardIds"] if x != cid]
            target["cardIds"] = list(target["cardIds"]) + [cid]

    for cid in patch.get("cards_delete") or []:
        if cid not in cards:
            raise ValueError(f"cards_delete: unknown card id {cid!r}")
        del cards[cid]
        for col in columns:
            if cid in col["cardIds"]:
                col["cardIds"] = [x for x in col["cardIds"] if x != cid]

    new_board = {"columns": columns, "cards": cards}
    db.validate_board(new_board)  # raise on inconsistency
    return new_board


def process_message(
    board: dict,
    history: list[dict],
    user_message: str,
    *,
    user_id: str,
    db_path: str | None = None,
) -> tuple[str, dict]:
    """Send board + history + user_message to the AI; apply the returned patch.

    Returns (reply, new_board). Persists the new board via db.apply_board.
    """
    messages: list[dict] = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "system", "content": f"Current board (JSON):\n{board}"},
    ]
    # Trust the caller to pass validated messages. Drop anything malformed.
    for m in history or []:
        if isinstance(m, dict) and m.get("role") in {"user", "assistant"} and isinstance(m.get("content"), str):
            messages.append({"role": m["role"], "content": m["content"]})
    messages.append({"role": "user", "content": user_message})

    response_format = {
        "type": "json_schema",
        "json_schema": {
            "name": "kanban_reply",
            "schema": BOARD_PATCH_SCHEMA,
            "strict": False,
        },
    }
    raw = _openrouter_chat(messages, response_format=response_format)

    # Parse the JSON. Some free models occasionally return noisy text; we try
    # to extract a JSON object first and fall back to treating the raw output
    # as a plain reply.
    import json
    parsed: dict | None = None
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        import re
        m = re.search(r"\{.*\}", raw, re.DOTALL)
        if m:
            try:
                parsed = json.loads(m.group(0))
            except json.JSONDecodeError:
                parsed = None

    if not isinstance(parsed, dict):
        # Model gave us plain prose — degrade gracefully: keep the board, expose
        # the raw text as the reply.
        return raw, board

    reply = parsed.get("reply") or ""
    patch = parsed.get("board_patch") or None
    new_board = apply_board_patch(board, patch) if patch else board
    if patch:
        db.apply_board(user_id, new_board, path=db_path)
    return reply, new_board