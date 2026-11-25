import os
import sys
import json
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
from api.services.db import DatabaseUnavailableError

from urllib.parse import parse_qs

app = FastAPI(title="ByteForce AI Platform", version="3.0.0")

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
app.include_router(diagnosis_router)
app.include_router(admin_router)

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
        ".ico": "image/x-icon"
    }
    return types.get(ext, "application/octet-stream")

# Health endpoints
@app.api_route("/api/health", methods=["GET", "HEAD"])
@app.api_route("/api/v1/health", methods=["GET", "HEAD"])
def health_check():
    return {
        "status": "healthy",
        "service": "ByteForce AI Platform",
        "version": "3.0.0",
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
    target = os.path.join(root_dir, full_path)
    if os.path.exists(target) and os.path.isfile(target):
        media_type = get_content_type(target)
        with open(target, "rb") as f:
            return Response(content=f.read(), media_type=media_type)
    
    index_path = os.path.join(root_dir, "index.html")
    if os.path.exists(index_path):
        with open(index_path, "r", encoding="utf-8") as f:
            return HTMLResponse(content=f.read())
    return HTMLResponse("<h1>Not Found</h1>", status_code=404)
