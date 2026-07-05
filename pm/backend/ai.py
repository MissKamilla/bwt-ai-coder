"""Minimal OpenRouter client for Part 8.

Part 9 will extend this with Kanban JSON + Structured Outputs; the public
`call_ai(messages)` signature is intentionally OpenAI-compatible so the
later changes are additive.
"""

import os

import httpx

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL = "openai/gpt-oss-120b:free"


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