import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

app = FastAPI(title="Fixora AI Platform", version="1.0.0")

current_dir = os.path.dirname(os.path.abspath(__file__))

# Mount static directories
css_path = os.path.join(current_dir, "css")
if os.path.exists(css_path):
    app.mount("/css", StaticFiles(directory=css_path), name="css")

js_path = os.path.join(current_dir, "js")
if os.path.exists(js_path):
    app.mount("/js", StaticFiles(directory=js_path), name="js")

@app.get("/")
def serve_index():
    return FileResponse(os.path.join(current_dir, "index.html"))

@app.get("/{full_path:path}")
def serve_all(full_path: str):
    target = os.path.join(current_dir, full_path)
    if os.path.exists(target) and os.path.isfile(target):
        return FileResponse(target)
    return FileResponse(os.path.join(current_dir, "index.html"))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
