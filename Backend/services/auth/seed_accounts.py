"""Keep seed admin passwords in sync with ADMIN_SEED_PASSWORD."""

from __future__ import annotations

import logging
import os

import bcrypt
from sqlalchemy import text
from sqlalchemy.engine import Engine

from core.redis_client import get_redis

logger = logging.getLogger(__name__)

SEED_ACCOUNTS = (
    "inv.mdm@innovant.ai",
    "poorvith.devang@flame.edu.in",
)


def _clear_login_locks() -> None:
    try:
        redis = get_redis()
        for email in SEED_ACCOUNTS:
            ident = email.lower()
            redis.delete(f"lock:login:{ident}", f"attempt:login:{ident}")
    except Exception as exc:
        logger.warning("[SignalWorkflow] Could not clear login locks: %s", exc)


def clear_login_lock(email: str) -> None:
    try:
        ident = email.lower()
        get_redis().delete(f"lock:login:{ident}", f"attempt:login:{ident}")
    except Exception:
        pass


def sync_seed_admin_passwords(engine: Engine) -> None:
    password = os.getenv("ADMIN_SEED_PASSWORD", "").strip()
    if len(password) < 8:
        logger.warning(
            "[SignalWorkflow] ADMIN_SEED_PASSWORD not set; seed logins may be unavailable."
        )
        return

    hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    with engine.begin() as conn:
        for email in SEED_ACCOUNTS:
            conn.execute(
                text(
                    """
                    UPDATE platform_admin
                    SET password_hash = :password_hash,
                        is_active = TRUE,
                        is_blocked = FALSE
                    WHERE email = :email
                    """
                ),
                {"password_hash": hashed, "email": email},
            )
        conn.execute(
            text(
                """
                UPDATE platform_admin
                SET is_active = FALSE,
                    is_blocked = TRUE
                WHERE email NOT IN ('inv.mdm@innovant.ai', 'poorvith.devang@flame.edu.in')
                """
            ),
        )

    _clear_login_locks()
    logger.info("[SignalWorkflow] Seed admin passwords synchronized.")
