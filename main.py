import os
from fastapi import FastAPI
from fastapi.responses import HTMLResponse, Response

app = FastAPI(title="Fixora AI Platform", version="1.0.0")

def get_content_type(filepath: str) -> str:
    ext = os.path.splitext(filepath)[1].lower()
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

@app.get("/")
def serve_home():
    if os.path.exists("index.html"):
        with open("index.html", "r", encoding="utf-8") as f:
            return HTMLResponse(content=f.read())
    return HTMLResponse("<h1>Fixora Platform Live</h1>")

@app.get("/{full_path:path}")
def serve_static(full_path: str):
    if os.path.exists(full_path) and os.path.isfile(full_path):
        media_type = get_content_type(full_path)
        with open(full_path, "rb") as f:
            return Response(content=f.read(), media_type=media_type)
    if os.path.exists("index.html"):
        with open("index.html", "r", encoding="utf-8") as f:
            return HTMLResponse(content=f.read())
    return HTMLResponse("<h1>Page Not Found</h1>", status_code=404)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
