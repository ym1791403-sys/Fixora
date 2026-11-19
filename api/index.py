import os
from fastapi import FastAPI
from fastapi.responses import HTMLResponse, Response

app = FastAPI(title="Fixora AI Platform", version="1.0.0")

current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.abspath(os.path.join(current_dir, ".."))

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

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "Fixora AI Platform"}

@app.get("/api/v1/health")
def v1_health():
    return {"status": "ok", "engine": "Fixora"}

@app.get("/")
def serve_index():
    index_path = os.path.join(root_dir, "index.html")
    if os.path.exists(index_path):
        with open(index_path, "r", encoding="utf-8") as f:
            return HTMLResponse(content=f.read())
    return HTMLResponse("<h1>Fixora Platform Live</h1>")

@app.get("/{full_path:path}")
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
