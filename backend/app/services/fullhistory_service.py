"""Append-only audit log for all kundli history changes (not exposed via API)."""

from __future__ import annotations

from copy import deepcopy
from datetime import datetime, timezone
from typing import Any, Literal, Optional

from bson import ObjectId

from app.database import get_fullhistory_collection

FullHistoryAction = Literal["create", "update", "delete"]


def _json_safe(value: Any) -> Any:
    if isinstance(value, ObjectId):
        return str(value)
    if isinstance(value, datetime):
        return value
    if isinstance(value, dict):
        return {k: _json_safe(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_json_safe(v) for v in value]
    return value


def record_fullhistory(
    action: FullHistoryAction,
    *,
    history_id: Optional[str],
    payload: Optional[dict],
    user_id: Optional[str] = None,
    user_email: Optional[str] = None,
) -> None:
    col = get_fullhistory_collection()
    if col is None:
        return

    entry = {
        "action": action,
        "history_id": history_id,
        "recorded_at": datetime.now(timezone.utc),
        "user_id": user_id,
        "user_email": user_email,
        "payload": _json_safe(deepcopy(payload)) if payload is not None else None,
    }
    try:
        col.insert_one(entry)
    except Exception as exc:
        print(f"[fullhistory] write failed ({action}): {exc!r}")