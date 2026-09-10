"""JSON parsing helpers for LLM outputs."""
from __future__ import annotations

import json
import re
from typing import Any


def extract_json_object(raw_output: str) -> dict[str, Any]:
    """Extract one JSON object from direct text, markdown fences, or surrounding prose."""
    cleaned = (raw_output or "").strip()
    if not cleaned:
        raise ValueError("empty LLM output")

    candidates = [cleaned]
    if "```" in cleaned:
        fenced = cleaned
        if fenced.startswith("```"):
            fenced = "\n".join(fenced.split("\n")[1:])
        if fenced.endswith("```"):
            fenced = "\n".join(fenced.split("\n")[:-1])
        fenced = fenced.strip()
        if fenced.lower().startswith("json"):
            fenced = fenced[4:].strip()
        candidates.append(fenced)

    match = re.search(r"\{.*\}", cleaned, re.DOTALL)
    if match:
        candidates.append(match.group())

    last_error: Exception | None = None
    for candidate in candidates:
        try:
            parsed = json.loads(candidate)
            if isinstance(parsed, dict):
                return parsed
        except json.JSONDecodeError as exc:
            last_error = exc

    if last_error:
        raise ValueError(f"invalid JSON object: {last_error}") from last_error
    raise ValueError("LLM output did not contain a JSON object")


def clamp_ratio(value: Any, default: float = 0.0) -> float:
    """Normalize a numeric value into the 0..1 range."""
    try:
        numeric = float(value)
    except (TypeError, ValueError):
        return default
    if numeric > 1:
        numeric = numeric / 100
    return max(0.0, min(1.0, numeric))


def ensure_string_list(value: Any) -> list[str]:
    """Convert common LLM/list-like values to a clean list of strings."""
    if value is None:
        return []
    if isinstance(value, str):
        return [value] if value.strip() else []
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]
    return [str(value).strip()]
