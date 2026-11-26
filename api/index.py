import os
import sys
import json
import time
from collections import defaultdict, deque
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse, Response

current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.abspath(os.path.join(current_dir, ".."))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from api.routers.datasets import router as datasets_router
from api.routers.analysis import router as analysis_router
from api.routers.guides import router as guides_router
from api.routers.prediction import router as prediction_router
from api.routers.diagnosis import router as diagnosis_router
from api.routers.admin import router as admin_router
from api.routers.media import router as media_router
from api.routers.messages import router as messages_router
from api.services.db import DatabaseUnavailableError

from urllib.parse import parse_qs

app = FastAPI(title="ByteForce Platform", version="4.0.15")

class VercelPathRewriter:
    """Pure ASGI middleware that modifies scope['path'] before FastAPI route matching."""
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope.get("type") == "http":
            path = scope.get("path", "")
            if "index.py" in path or path == "/api":
                qs = scope.get("query_string", b"").decode("latin1", errors="ignore")
                params = parse_qs(qs)
                if "__path" in params:
                    sub = params["__path"][0].lstrip("/")
                    scope["path"] = f"/api/{sub}"
                else:
                    for k, v in scope.get("headers", []):
                        if k.lower() == b"x-matched-path":
                            matched = v.decode("latin1", errors="ignore")
                            if matched and not matched.endswith("index.py"):
                                scope["path"] = matched
                            break
        await self.app(scope, receive, send)

app.add_middleware(VercelPathRewriter)


# Simple per-IP sliding-window rate limit for API abuse protection.
# In-memory per serverless instance: 120 requests per 60 seconds per IP
# on /api/* paths. Static assets and the homepage are not limited.
_RATE_LIMIT = 120
_RATE_WINDOW = 60.0
_rate_buckets: dict = defaultdict(deque)


class RateLimitMiddleware:
    """Pure ASGI middleware that rejects bursts with HTTP 429."""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope.get("type") == "http" and scope.get("path", "").startswith("/api"):
            ip = "unknown"
            for k, v in scope.get("headers", []):
                if k.lower() == b"x-forwarded-for":
                    ip = v.decode("latin1", errors="ignore").split(",")[0].strip() or "unknown"
                    break
                if k.lower() == b"x-real-ip":
                    ip = v.decode("latin1", errors="ignore").strip() or "unknown"
            now = time.monotonic()
            bucket = _rate_buckets[ip]
            while bucket and bucket[0] <= now - _RATE_WINDOW:
                bucket.popleft()
            if len(bucket) >= _RATE_LIMIT:
                resp = JSONResponse(
                    status_code=429,
                    content={"error": "Too many requests. Please wait a moment and try again."},
                    headers={"Retry-After": "60"},
                )
                await resp(scope, receive, send)
                return
            bucket.append(now)
        await self.app(scope, receive, send)


app.add_middleware(RateLimitMiddleware)

@app.exception_handler(DatabaseUnavailableError)
async def db_unavailable_exception_handler(request: Request, exc: DatabaseUnavailableError):
    return JSONResponse(
        status_code=503,
        content={
            "error": "Dataset unavailable",
            "status_code": 503,
            "detail": str(exc),
            "message": "The production database or dataset service is currently unavailable. No synthetic data will be returned."
        }
    )

# Mount genuine dataset status, empirical analysis, verified guides, prediction, diagnosis, and exclusive admin routers
app.include_router(datasets_router)
app.include_router(analysis_router)
app.include_router(guides_router)
app.include_router(prediction_router)
from api.routers.marketplace import router as marketplace_router

app.include_router(diagnosis_router)
app.include_router(admin_router)
app.include_router(marketplace_router)
app.include_router(media_router)
app.include_router(messages_router)

def get_content_type(path: str) -> str:
    ext = os.path.splitext(path)[1].lower()
    types = {
        ".css": "text/css; charset=utf-8",
        ".js": "application/javascript; charset=utf-8",
        ".json": "application/json; charset=utf-8",
        ".html": "text/html; charset=utf-8",
        ".svg": "image/svg+xml",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".ico": "image/x-icon",
        ".webp": "image/webp"
    }
    return types.get(ext, "application/octet-stream")

# Health endpoints
@app.api_route("/api/health", methods=["GET", "HEAD"])
@app.api_route("/api/v1/health", methods=["GET", "HEAD"])
def health_check():
    return {
        "status": "healthy",
        "service": "ByteForce Platform",
        "version": "4.0.15",
        "database": "Supabase PostgreSQL",
        "policy": "Strict empirical evidence only; zero synthetic records or mock fallback."
    }

# Fallback for unmatched API routes
@app.api_route("/api/{full_path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
def api_fallback(full_path: str):
    return JSONResponse(status_code=404, content={"error": "Endpoint not found", "path": full_path})

# Static and HTML Routes
@app.api_route("/", methods=["GET", "HEAD"])
def serve_index():
    index_path = os.path.join(root_dir, "index.html")
    if os.path.exists(index_path):
        with open(index_path, "r", encoding="utf-8") as f:
            return HTMLResponse(content=f.read())
    return HTMLResponse("<h1>ByteForce Platform Live</h1>")

@app.api_route("/{full_path:path}", methods=["GET", "HEAD"])
def serve_static(full_path: str):
    target = os.path.abspath(os.path.join(root_dir, full_path))
    if os.path.commonpath([root_dir, target]) != root_dir:
        return HTMLResponse("<h1>Not Found</h1>", status_code=404)
    if os.path.exists(target) and os.path.isfile(target):
        media_type = get_content_type(target)
        with open(target, "rb") as f:
            return Response(content=f.read(), media_type=media_type)
    
    index_path = os.path.join(root_dir, "index.html")
    if os.path.exists(index_path):
        with open(index_path, "r", encoding="utf-8") as f:
            return HTMLResponse(content=f.read())
    return HTMLResponse("<h1>Not Found</h1>", status_code=404)
