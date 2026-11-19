from fastapi import FastAPI

app = FastAPI(title="Fixora API", version="1.0.0")

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "Fixora AI Platform"}

@app.get("/api/v1/health")
def v1_health():
    return {"status": "ok", "engine": "Fixora Native"}
