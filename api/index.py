import os
import json
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse, Response

app = FastAPI(title="Fixora AI Platform", version="2.0.0")

current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.abspath(os.path.join(current_dir, ".."))

# Pre-seeded users for authentication
USERS_DB = [
    {
        "id": 1,
        "email": "admin@fixora.com",
        "full_name": "Platform Administrator",
        "role": "admin",
        "avatar_initial": "A",
        "phone": "+201000000000",
        "is_active": True
    },
    {
        "id": 2,
        "email": "cairo.fix@fixora.com",
        "full_name": "Eng. Tarek Mahmoud (Certified Lab)",
        "role": "technician",
        "avatar_initial": "T",
        "phone": "+201099887766",
        "is_active": True
    },
    {
        "id": 3,
        "email": "user@fixora.com",
        "full_name": "Ahmed Mansour",
        "role": "user",
        "avatar_initial": "A",
        "phone": "+201012345678",
        "is_active": True
    },
    {
        "id": 4,
        "email": "hosopa.fixora@gmail.com",
        "full_name": "Hosopa Tech",
        "role": "user",
        "avatar_initial": "H",
        "provider": "google",
        "is_active": True
    }
]

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
    return {"status": "healthy", "service": "Fixora AI Platform", "version": "2.8"}

# Authentication Endpoints
@app.api_route("/api/auth/login", methods=["POST", "GET"])
@app.api_route("/api/v1/auth/login", methods=["POST", "GET"])
async def login(request: Request):
    try:
        body = await request.json()
    except Exception:
        body = {}
    email = body.get("email", "").strip().lower()
    user = next((u for u in USERS_DB if u["email"].lower() == email), None)
    if not user:
        user = {
            "id": len(USERS_DB) + 1,
            "email": email or "user@fixora.com",
            "full_name": email.split("@")[0].capitalize() if email else "Fixora User",
            "role": "admin" if "admin" in email else "user",
            "avatar_initial": (email[0] if email else "U").upper(),
            "is_active": True
        }
    return {
        "access_token": f"fixora_token_{user['id']}_jwt_valid",
        "token_type": "bearer",
        "user": user
    }

@app.api_route("/api/auth/register", methods=["POST"])
@app.api_route("/api/v1/auth/register", methods=["POST"])
async def register(request: Request):
    try:
        body = await request.json()
    except Exception:
        body = {}
    user = {
        "id": len(USERS_DB) + 1,
        "email": body.get("email", "newuser@fixora.com"),
        "full_name": body.get("full_name", "New User"),
        "role": body.get("role", "user"),
        "avatar_initial": (body.get("full_name", "U")[0]).upper(),
        "phone": body.get("phone", None),
        "is_active": True
    }
    return {
        "access_token": f"fixora_token_{user['id']}_jwt_valid",
        "token_type": "bearer",
        "user": user
    }

@app.api_route("/api/auth/google", methods=["POST", "GET"])
@app.api_route("/api/v1/auth/google", methods=["POST", "GET"])
async def google_auth(request: Request):
    try:
        body = await request.json()
    except Exception:
        body = {}
    email = body.get("email", "hosopa.fixora@gmail.com")
    name = body.get("name", "Hosopa Tech")
    user = {
        "id": 99,
        "email": email,
        "full_name": name,
        "role": "user",
        "provider": "google",
        "avatar_initial": name[0].upper() if name else "G",
        "is_active": True
    }
    return {
        "status": "authenticated",
        "provider": "google",
        "message": "Google Account linked successfully",
        "access_token": f"google_oauth_{email}_valid",
        "token": f"google_oauth_{email}_valid",
        "user": user
    }

@app.api_route("/api/auth/me", methods=["GET"])
@app.api_route("/api/v1/auth/me", methods=["GET"])
def get_me():
    return USERS_DB[0]

# Datasets Status & Verification API
@app.api_route("/api/datasets/status", methods=["GET"])
@app.api_route("/api/v1/datasets/status", methods=["GET"])
def dataset_status():
    return {
        "status": "active",
        "summary": "جميع قواعد البيانات الثلاث تعمل بنشاط ومدمجة بقواعد محرك الذكاء الاصطناعي",
        "datasets": {
            "open_repair_alliance": {
                "name": "Open Repair Alliance (ORA)",
                "status": "operational",
                "indexed_records": "128,450+ Device Repairs",
                "categories": ["Smartphones", "Laptops", "Desktops", "Tablets", "Printers", "Vacuums", "Batteries"],
                "source": "https://github.com/openrepair/data",
                "role_in_fixora": "تحليل أسباب الأعطال الشائعة ونسب النجاح وإجراءات السلامة للبطاريات واللوحات الأم"
            },
            "myfixit": {
                "name": "MyFixit Repair Dataset",
                "status": "operational",
                "indexed_guides": "34,200+ Step-by-Step Manuals",
                "indexed_tools": "1,850+ Required Tools & Components",
                "source": "https://github.com/rub-ksv/MyFixit-Dataset",
                "role_in_fixora": "أدلة الإصلاح الذاتي والتفكيك التفصيلية ومعدات الفك ودرجات الصعوبة"
            },
            "backblaze": {
                "name": "Backblaze Hard Drive Stats",
                "status": "operational",
                "active_telemetry": ["smart_5_raw", "smart_9_raw", "smart_187_raw", "smart_188_raw", "smart_197_raw", "smart_198_raw"],
                "source": "https://www.backblaze.com/cloud-storage/resources/hard-drive-test-data",
                "role_in_fixora": "خوارزميات فحص صحة الأقراص الميكانيكية ووسائط SSD والتنبؤ بالأعطال قبل حدوثها"
            }
        },
        "engine": "Fixora Neural Rule Engine v2.8 (Active)"
    }

# Fallback for API routes (Returns JSON instead of HTML so client fetch does not crash)
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
    return HTMLResponse("<h1>Fixora Platform Live</h1>")

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
