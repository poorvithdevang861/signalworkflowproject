"""
main.py
--------
SignalWorkflow — FastAPI Application Entrypoint

Security layers:
  1. SecurityHeadersMiddleware — sets strict HTTP security headers on every response
  2. require_auth (FastAPI dependency) — AES decrypt → Redis check → JWT verify → fingerprint

Run (API only):
    uvicorn main:app --reload --host 0.0.0.0 --port 8000

Run:
    python dev_server.py
"""

from __future__ import annotations

import time
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import json
from starlette.middleware.base import BaseHTTPMiddleware

from dotenv import load_dotenv
load_dotenv()

# ---------------------------------------------------------------------------
# Import all models so SQLAlchemy sees them before create_all()
# ---------------------------------------------------------------------------
import db.models  # noqa: F401 — registers all mappers with Base

from db.sessions.database import engine, Base
from core.config import settings

# ---------------------------------------------------------------------------
# Routers — login + platform RBAC only
# ---------------------------------------------------------------------------
from api.routes.auth_router import router as auth_router
from api.routes.platform_rbac_router import router as platform_rbac_router


logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Security Headers Middleware
# ---------------------------------------------------------------------------

class SecurityHeadersMiddleware:
    """
    Adds strict HTTP security headers to every response.

    These headers are the first line of defence at the HTTP layer and
    are independent of the JWT / AES auth flow.
    """
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        start = time.monotonic()

        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                headers = list(message.get("headers", []))

                # Security headers to set/override (single-value headers only)
                security_headers = {
                    b"x-content-type-options": b"nosniff",
                    b"x-frame-options": b"DENY",
                    b"strict-transport-security": b"max-age=31536000; includeSubDomains",
                    b"referrer-policy": b"strict-origin-when-cross-origin",
                    b"permissions-policy": b"geolocation=(), microphone=(), camera=()",
                    b"x-xss-protection": b"1; mode=block",
                    b"content-security-policy": b"default-src 'self'",
                }

                # Headers to remove
                remove_headers = {b"server"}

                # Build new header list: keep existing headers that we don't
                # need to override, preserving duplicates (e.g. Set-Cookie)
                override_keys = set(security_headers.keys()) | remove_headers
                new_headers = [
                    (k, v) for k, v in headers
                    if k.lower() not in override_keys
                ]

                # Append security headers
                for k, v in security_headers.items():
                    new_headers.append((k, v))

                # Append response time
                elapsed = round((time.monotonic() - start) * 1000, 2)
                new_headers.append((b"x-response-time", f"{elapsed}ms".encode("utf-8")))

                message["headers"] = new_headers

            await send(message)

        try:
            await self.app(scope, receive, send_wrapper)
        except Exception as exc:
            logger.exception("SecurityHeadersMiddleware unhandled error")
            response = JSONResponse(
                status_code=500,
                content={
                    "success": False,
                    "message": "Internal server error",
                    "data": None,
                    "errors": [str(exc)],
                },
            )
            await response(scope, receive, send_wrapper)
    
class ResponseEnvelopeMiddleware:
    """
    Standardises all successful API responses into a uniform envelope:
    { "success": true, "message": "...", "data": T, "errors": [] }

    This ensures the frontend client (api.ts) always receives a predictable structure.
    """
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        path = scope.get("path", "")
        if not path.startswith("/api/v1"):
            await self.app(scope, receive, send)
            return

        response_start = None
        body_chunks = []

        async def send_wrapper(message):
            nonlocal response_start

            if message["type"] == "http.response.start":
                response_start = message
                return

            if message["type"] == "http.response.body":
                body_chunks.append(message.get("body", b""))
                if message.get("more_body", False):
                    return

                full_body = b"".join(body_chunks)
                status_code = response_start.get("status", 200)
                headers = list(response_start.get("headers", []))

                is_json = False
                for k, v in headers:
                    if k.lower() == b"content-type" and b"application/json" in v.lower():
                        is_json = True
                        break

                if status_code >= 400 or not is_json:
                    await send(response_start)
                    await send({
                        "type": "http.response.body",
                        "body": full_body,
                        "more_body": False
                    })
                    return

                try:
                    if not full_body:
                        await send(response_start)
                        await send(message)
                        return

                    data = json.loads(full_body.decode("utf-8"))
                    
                    # If it's already wrapped (has 'success' and 'data' keys), don't wrap again
                    if isinstance(data, dict) and "success" in data and "data" in data:
                        await send(response_start)
                        await send(message)
                        return

                    wrapped = {
                        "success": True,
                        "message": "Request fulfilled successfully.",
                        "data": data,
                        "errors": []
                    }
                    
                    wrapped_body = json.dumps(wrapped).encode("utf-8")
                    
                    # Prepare new headers: remove Content-Length as it will be recalculated
                    new_headers = []
                    for k, v in headers:
                        if k.lower() != b"content-length":
                            new_headers.append((k, v))
                    new_headers.append((b"content-length", str(len(wrapped_body)).encode("utf-8")))
                    
                    response_start["headers"] = new_headers
                    
                    await send(response_start)
                    await send({
                        "type": "http.response.body",
                        "body": wrapped_body,
                        "more_body": False
                    })
                except Exception as e:
                    logger.error("[middleware] Failed to wrap response: %s", e)
                    await send(response_start)
                    await send({
                        "type": "http.response.body",
                        "body": full_body,
                        "more_body": False
                    })

        try:
            await self.app(scope, receive, send_wrapper)
        except Exception as exc:
            logger.exception("ResponseEnvelopeMiddleware error: %s", exc)
            response = JSONResponse(
                status_code=500,
                content={
                    "success": False,
                    "message": "Internal server error",
                    "data": None,
                    "errors": [str(exc)]
                }
            )
            await response(scope, receive, send)


# ---------------------------------------------------------------------------
# Lifespan — startup / shutdown
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    from sqlalchemy import text

    try:
        with engine.begin() as conn:
            conn.execute(text("""
                DO $$
                DECLARE r RECORD;
                BEGIN
                  FOR r IN
                    SELECT tablename
                    FROM pg_tables
                    WHERE schemaname = 'public'
                      AND tablename NOT IN (
                        'platform_admin',
                        'platform_role',
                        'platform_permission',
                        'platform_role_permission'
                      )
                  LOOP
                    EXECUTE format('DROP TABLE IF EXISTS public.%I CASCADE', r.tablename);
                  END LOOP;
                END $$;
            """))
            conn.execute(text("""
                DO $$
                DECLARE r RECORD;
                BEGIN
                  FOR r IN
                    SELECT t.typname
                    FROM pg_type t
                    JOIN pg_namespace n ON n.oid = t.typnamespace
                    WHERE n.nspname = 'public' AND t.typtype = 'e'
                  LOOP
                    EXECUTE format('DROP TYPE IF EXISTS public.%I CASCADE', r.typname);
                  END LOOP;
                END $$;
            """))
        print("[SignalWorkflow] Unused tables dropped. Kept platform RBAC + login.")
    except Exception as e:
        print(f"[SignalWorkflow] Schema prune warning: {e}")

    Base.metadata.create_all(bind=engine)
    print("[SignalWorkflow] Database tables verified / created.")

    try:
        with engine.begin() as conn:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS pgcrypto;"))
            conn.execute(text("""
                ALTER TABLE platform_permission
                ALTER COLUMN permission_id SET DEFAULT gen_random_uuid();
            """))
            conn.execute(text("""
                ALTER TABLE platform_admin
                ADD COLUMN IF NOT EXISTS google_sub VARCHAR(255);
            """))
            conn.execute(text("""
                CREATE UNIQUE INDEX IF NOT EXISTS ix_platform_admin_google_sub
                ON platform_admin (google_sub)
                WHERE google_sub IS NOT NULL;
            """))
            conn.execute(text("""
                DELETE FROM platform_role_permission
                WHERE permission_id IN (
                    SELECT permission_id FROM platform_permission
                    WHERE screen_key <> 'platform'
                );
            """))
            conn.execute(text("""
                DELETE FROM platform_permission WHERE screen_key <> 'platform';
            """))
            conn.execute(text("""
                INSERT INTO platform_permission (screen_key, feature_key, label, description)
                VALUES
                    ('platform', 'view', 'View Platform', 'Access platform RBAC screen'),
                    ('platform', 'manage', 'Manage Platform', 'Manage platform RBAC')
                ON CONFLICT (screen_key, feature_key) DO NOTHING;
            """))
            conn.execute(text("""
                INSERT INTO platform_role_permission (role_id, permission_id)
                SELECT r.role_id, p.permission_id
                FROM platform_role r, platform_permission p
                WHERE r.role_key IN ('super_admin', 'admin')
                  AND p.screen_key = 'platform'
                ON CONFLICT DO NOTHING;
            """))
        print("[SignalWorkflow] Platform RBAC permissions verified.")
    except Exception as e:
        print(f"[SignalWorkflow] Database migration warning: {e}")

    from services.auth.seed_accounts import sync_seed_admin_passwords
    try:
        sync_seed_admin_passwords(engine)
    except Exception as e:
        print(f"[SignalWorkflow] Seed password sync warning: {e}")

    from core.redis_client import is_redis_available
    print(f"[SignalWorkflow] Redis available: {is_redis_available()}")

    yield
    print("[SignalWorkflow] Shutting down.")


# ---------------------------------------------------------------------------
# Application
# ---------------------------------------------------------------------------

is_prod = settings.app_env == "production"

# localhost and 127.0.0.1 are different browser origins — allow both in dev.
CORS_ORIGINS = [
    f"http://{host}:{port}"
    for host in ("localhost", "127.0.0.1")
    for port in (5173, 5174, 3000, 3030)
]


def _is_allowed_cors_origin(origin: str | None) -> bool:
    return bool(origin and origin in CORS_ORIGINS)

app = FastAPI(
    title=settings.app_title,
    version=settings.app_version,
    description="SignalWorkflow API — authentication and platform RBAC.",
    lifespan=lifespan,
    docs_url=None if is_prod else "/docs",
    redoc_url=None if is_prod else "/redoc",
    openapi_url=None if is_prod else "/openapi.json",
)

# ---------------------------------------------------------------------------
# Middleware — order matters: outermost first
# ---------------------------------------------------------------------------

# 1. Rate limiting (applied first/innermost after routing)
from middleware.rate_limit import RateLimitingMiddleware
app.add_middleware(RateLimitingMiddleware)

# 2. Response envelope (wraps successful JSON responses)
app.add_middleware(ResponseEnvelopeMiddleware)

# 3. Security headers (applied to ALL responses, wrapping the envelope and rate limiter)
app.add_middleware(SecurityHeadersMiddleware)

# 3. CORS (before security headers so preflight OPTIONS also gets headers)
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Response-Time"],
)

# ---------------------------------------------------------------------------
# Global exception handler — uniform StandardResponse on unhandled errors
# ---------------------------------------------------------------------------

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    response = JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": exc.detail,
            "data": None,
            "errors": [exc.detail],
        },
    )
    # Add CORS headers manually to error responses so they aren't masked by CORS errors
    origin = request.headers.get("origin")
    if _is_allowed_cors_origin(origin):
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
    return response

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    import traceback
    print(f"[ERROR] Unhandled exception: {exc}")
    traceback.print_exc()

    response = JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "An unexpected server error occurred.",
            "data": None,
            "errors": [str(exc)],
        },
    )
    origin = request.headers.get("origin")
    if _is_allowed_cors_origin(origin):
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
    return response


# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------

PREFIX = "/api/v1"

app.include_router(auth_router, prefix=PREFIX)
app.include_router(platform_rbac_router, prefix=PREFIX)




# ---------------------------------------------------------------------------
# Health / root endpoints  (no auth required)
# ---------------------------------------------------------------------------

@app.get("/", tags=["Health"])
def root():
    return {
        "status": "SignalWorkflow Backend Running",
        "version": settings.app_version,
        "environment": settings.app_env,
        "phase": "Auth + Platform RBAC",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
def health():
    """Kubernetes / load-balancer liveness probe."""
    from core.redis_client import is_redis_available
    return {
        "status": "ok",
        "redis": "connected" if is_redis_available() else "unavailable",
    }
