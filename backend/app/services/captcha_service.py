import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

from app.database import get_captcha_collection

# Fallback when MongoDB is unavailable (local dev / misconfigured URI)
_memory_captcha: dict[str, tuple[int, datetime]] = {}


def _rand_challenge() -> tuple[str, int]:
    import random

    op = random.choice(["+", "-", "×"])
    if op == "+":
        a, b = random.randint(1, 10), random.randint(1, 10)
        answer = a + b
    elif op == "-":
        a = random.randint(1, 10)
        b = random.randint(0, a - 1)
        answer = a - b
    else:
        a, b = random.randint(2, 10), random.randint(2, 10)
        answer = a * b
    return f"{a} {op} {b} = ?", answer


def _purge_expired_memory(now: datetime) -> None:
    expired = [t for t, (_, exp) in _memory_captcha.items() if exp <= now]
    for t in expired:
        _memory_captcha.pop(t, None)


def generate_captcha_challenge() -> dict[str, str]:
    question, answer = _rand_challenge()
    token = secrets.token_hex(16)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=5)

    col = get_captcha_collection()
    if col is not None:
        col.insert_one({"token": token, "answer": answer, "expiresAt": expires_at})
    else:
        now = datetime.now(timezone.utc)
        _purge_expired_memory(now)
        _memory_captcha[token] = (answer, expires_at)

    return {"token": token, "question": question}


def verify_captcha(token: str, user_answer: int) -> bool:
    now = datetime.now(timezone.utc)
    col = get_captcha_collection()
    if col is not None:
        doc = col.find_one_and_delete(
            {"token": token, "expiresAt": {"$gt": now}}
        )
        if not doc:
            return False
        return doc.get("answer") == user_answer

    entry: Optional[tuple[int, datetime]] = _memory_captcha.pop(token, None)
    if not entry:
        return False
    answer, expires_at = entry
    if expires_at <= now:
        return False
    return answer == user_answer
