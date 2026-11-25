# -*- coding: utf-8 -*-
"""
Exclusive Administration Control Center Router
Implements the complete administrative control system (modeled after the reference
Fixora workflow) backed by Supabase PostgreSQL and strictly locked to snsr19344@gmail.com.
"""

import json
import time
import urllib.request
import urllib.error
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, Request

from api.services.db import (
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    DatabaseUnavailableError,
    get_table_count,
    postgrest_request,
)
from api.services.ai_engine import get_ai_status, save_ai_api_key, AIAssistantService

EXCLUSIVE_ADMIN_EMAIL = "snsr19344@gmail.com"
CLOSED_REQUEST_STATUSES = {"COMPLETED", "CANCELED", "CANCELLED", "REJECTED"}
STATUS_ORDER = {"pending": 0, "approved": 1, "suspended": 2, "rejected": 3}

router = APIRouter(tags=["admin"])


def _extract_bearer_token(request: Request) -> str:
    auth_header = request.headers.get("Authorization") or request.headers.get("authorization") or ""
    if not auth_header.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Authentication required.")
    token = auth_header.split(" ", 1)[1].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Empty bearer token.")
    return token


def _verify_supabase_bearer_user(request: Request) -> Dict[str, Any]:
    """Validates a caller's Supabase access token against Supabase Auth /auth/v1/user."""
    token = _extract_bearer_token(request)
    url = f"{SUPABASE_URL}/auth/v1/user"
    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {token}",
    }

    last_err: Optional[Exception] = None
    for attempt in range(3):
        req = urllib.request.Request(url, headers=headers, method="GET")
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode("utf-8") or "{}")
                if not data or not data.get("email"):
                    raise HTTPException(status_code=401, detail="Invalid user session.")
                return data
        except urllib.error.HTTPError as e:
            if e.code in (401, 403):
                raise HTTPException(status_code=401, detail="Invalid or expired session token.")
            last_err = e
            if attempt < 2:
                time.sleep(0.25 * (attempt + 1))
                continue
            raise HTTPException(status_code=503, detail=f"Auth verification error: HTTP {e.code}")
        except HTTPException:
            raise
        except Exception as e:
            last_err = e
            if attempt < 2:
                time.sleep(0.25 * (attempt + 1))
                continue
            raise HTTPException(status_code=503, detail=f"Auth service unavailable: {last_err}")

    raise HTTPException(status_code=503, detail=f"Auth verification failed: {last_err}")


def _require_exclusive_admin(request: Request) -> Dict[str, Any]:
    """Enforces that only snsr19344@gmail.com can access any admin endpoint."""
    user = _verify_supabase_bearer_user(request)
    email = str(user.get("email") or "").strip().lower()
    if email != EXCLUSIVE_ADMIN_EMAIL:
        raise HTTPException(
            status_code=403,
            detail=f"Forbidden: Admin control center is strictly restricted to {EXCLUSIVE_ADMIN_EMAIL}.",
        )
    return user


def _get_admin_profile_id() -> Optional[str]:
    rows = postgrest_request(
        "profiles",
        {"select": "id,email", "limit": "50"},
        use_service_role=True,
    ) or []
    for row in rows:
        if str(row.get("email") or "").strip().lower() == EXCLUSIVE_ADMIN_EMAIL:
            return row.get("id")
    return None


def _record_admin_audit(admin_user: Dict[str, Any], action: str, title: str, message: str) -> None:
    """Persists real administrative audit entries in Supabase notifications (type='admin_audit')."""
    try:
        admin_uid = admin_user.get("id") or _get_admin_profile_id()
        if not admin_uid:
            return
        postgrest_request(
            "notifications",
            method="POST",
            body={
                "user_id": admin_uid,
                "title": title,
                "message": f"[{action}] {message}",
                "type": "admin_audit",
                "is_read": True,
            },
            headers_extra={"Prefer": "return=minimal"},
            use_service_role=True,
        )
    except Exception:
        pass


def _notify_user(user_id: Optional[str], title: str, message: str, notif_type: str = "status", unread: bool = True) -> None:
    if not user_id:
        return
    try:
        postgrest_request(
            "notifications",
            method="POST",
            body={
                "user_id": user_id,
                "title": title,
                "message": message,
                "type": notif_type,
                "is_read": not unread,
            },
            headers_extra={"Prefer": "return=minimal"},
            use_service_role=True,
        )
    except Exception:
        pass


@router.get("/api/admin/stats")
@router.get("/api/v1/admin/stats")
def get_admin_stats(request: Request) -> Dict[str, Any]:
    """Returns real platform-wide administrative metrics across users, centers, requests, and diagnostics."""
    _require_exclusive_admin(request)
    try:
        guides_count = get_table_count("repair_guides")
        incidents_count = get_table_count("repair_incidents")
        users_count = get_table_count("profiles", use_service_role=True)
        diagnoses_count = get_table_count("diagnosis_reports", use_service_role=True)

        tech_rows = postgrest_request(
            "technicians",
            {"select": "id,status"},
            use_service_role=True,
        ) or []
        approved_centers = sum(1 for t in tech_rows if str(t.get("status") or "").lower() == "approved")
        pending_approvals = sum(1 for t in tech_rows if str(t.get("status") or "").lower() == "pending")
        suspended_centers = sum(
            1 for t in tech_rows if str(t.get("status") or "").lower() in ("suspended", "rejected")
        )

        req_rows = postgrest_request(
            "repair_requests",
            {"select": "id,status"},
            use_service_role=True,
        ) or []
        active_requests = sum(
            1 for r in req_rows if str(r.get("status") or "NEW").upper() not in CLOSED_REQUEST_STATUSES
        )
        completed_requests = sum(
            1 for r in req_rows if str(r.get("status") or "").upper() == "COMPLETED"
        )

        return {
            "verified_guides_count": guides_count,
            "repair_incidents_count": incidents_count,
            "active_technicians_count": approved_centers,
            "repair_requests_count": len(req_rows),
            "active_requests": active_requests,
            "completed_requests": completed_requests,
            "total_users": users_count,
            "total_technicians": approved_centers,
            "approved_centers": approved_centers,
            "pending_approvals": pending_approvals,
            "suspended_centers": suspended_centers,
            "total_diagnoses": diagnoses_count,
            "source": "Supabase Production Database",
        }
    except DatabaseUnavailableError as e:
        raise HTTPException(status_code=503, detail=str(e))


@router.get("/api/admin/centers")
@router.get("/api/v1/admin/centers")
def list_admin_centers(request: Request, status: Optional[str] = None) -> List[Dict[str, Any]]:
    """Lists all maintenance centers and independent technicians ordered pending-first."""
    _require_exclusive_admin(request)
    try:
        params: Dict[str, str] = {"select": "*", "order": "created_at.desc"}
        if status and status.lower() != "all":
            params["status"] = f"eq.{status.lower()}"
        rows = postgrest_request("technicians", params, use_service_role=True) or []
        rows.sort(key=lambda r: (STATUS_ORDER.get(str(r.get("status") or "pending").lower(), 9), -(r.get("id") or 0)))
        return rows
    except DatabaseUnavailableError as e:
        raise HTTPException(status_code=503, detail=str(e))


def _transition_center_status(request: Request, tech_id: int, target_status: str) -> Dict[str, Any]:
    """Shared handler to approve, suspend, or reject a technician/repair center."""
    admin_user = _require_exclusive_admin(request)
    try:
        existing_rows = postgrest_request(
            "technicians",
            {"select": "*", "id": f"eq.{tech_id}"},
            use_service_role=True,
        ) or []
        if not existing_rows:
            raise HTTPException(status_code=404, detail="Technician or center not found.")
        center = existing_rows[0]

        updated = postgrest_request(
            "technicians",
            params={"id": f"eq.{tech_id}"},
            method="PATCH",
            body={"status": target_status},
            headers_extra={"Prefer": "return=representation"},
            use_service_role=True,
        )
        updated_row = updated[0] if isinstance(updated, list) and updated else {**center, "status": target_status}

        uid = center.get("user_id")
        if uid:
            # Update user profile role only if not the exclusive admin
            prof_rows = postgrest_request(
                "profiles",
                {"select": "id,email,role", "id": f"eq.{uid}"},
                use_service_role=True,
            ) or []
            if prof_rows and str(prof_rows[0].get("email") or "").strip().lower() != EXCLUSIVE_ADMIN_EMAIL:
                new_role = "technician" if target_status == "approved" else "user"
                postgrest_request(
                    "profiles",
                    params={"id": f"eq.{uid}"},
                    method="PATCH",
                    body={"role": new_role},
                    headers_extra={"Prefer": "return=minimal"},
                    use_service_role=True,
                )

            if target_status == "approved":
                _notify_user(
                    uid,
                    "تم قبول حسابك الفني / Center Approved",
                    "تمت مراجعة وتوثيق ملفك المهني من قِبل الإدارة وهو ظاهر الآن للعملاء.",
                )
            elif target_status == "suspended":
                _notify_user(
                    uid,
                    "تم إيقاف الحساب الفني مؤقتاً / Center Suspended",
                    "تم إيقاف ظهور مركز الصيانة من قِبل مدير النظام مؤقتاً. تواصل مع الإدارة للمراجعة.",
                )
            elif target_status == "rejected":
                _notify_user(
                    uid,
                    "تحديث طلب التوثيق / Application Rejected",
                    "نعتذر، لم يتم قبول طلب الانضمام كمركز صيانة. يرجى مراجعة البيانات والمحاولة مجدداً.",
                )

        biz = center.get("business_name") or center.get("name") or f"#{tech_id}"
        _record_admin_audit(
            admin_user,
            f"center:{tech_id}:{target_status}",
            f"إجراء على مركز الصيانة ({target_status})",
            f"{biz} ({center.get('city') or '-'})",
        )
        return updated_row
    except HTTPException:
        raise
    except DatabaseUnavailableError as e:
        raise HTTPException(status_code=503, detail=str(e))


@router.post("/api/admin/centers/{tech_id}/approve")
@router.post("/api/v1/admin/centers/{tech_id}/approve")
def approve_center(request: Request, tech_id: int) -> Dict[str, Any]:
    return _transition_center_status(request, tech_id, "approved")


@router.post("/api/admin/centers/{tech_id}/suspend")
@router.post("/api/v1/admin/centers/{tech_id}/suspend")
def suspend_center(request: Request, tech_id: int) -> Dict[str, Any]:
    return _transition_center_status(request, tech_id, "suspended")


@router.post("/api/admin/centers/{tech_id}/reject")
@router.post("/api/v1/admin/centers/{tech_id}/reject")
def reject_center(request: Request, tech_id: int) -> Dict[str, Any]:
    return _transition_center_status(request, tech_id, "rejected")


@router.get("/api/admin/users")
@router.get("/api/v1/admin/users")
def list_admin_users(request: Request) -> List[Dict[str, Any]]:
    """Lists all registered platform user profiles ordered newest first."""
    _require_exclusive_admin(request)
    try:
        rows = postgrest_request(
            "profiles",
            {
                "select": "id,email,full_name,role,phone,avatar_initial,avatar_url,is_active,created_at,updated_at",
                "order": "created_at.desc",
            },
            use_service_role=True,
        )
        return rows or []
    except DatabaseUnavailableError as e:
        raise HTTPException(status_code=503, detail=str(e))


@router.post("/api/admin/users/{user_id}/toggle")
@router.post("/api/v1/admin/users/{user_id}/toggle")
def toggle_admin_user(request: Request, user_id: str) -> Dict[str, Any]:
    """Toggles user account activation state while strictly protecting the primary admin account."""
    admin_user = _require_exclusive_admin(request)
    try:
        rows = postgrest_request(
            "profiles",
            {"select": "id,email,full_name,role,is_active", "id": f"eq.{user_id}"},
            use_service_role=True,
        ) or []
        if not rows:
            raise HTTPException(status_code=404, detail="User not found.")
        target = rows[0]
        target_email = str(target.get("email") or "").strip().lower()
        if target_email == EXCLUSIVE_ADMIN_EMAIL:
            raise HTTPException(status_code=400, detail="Cannot deactivate the primary system administrator account.")

        next_state = False if target.get("is_active") is not False else True
        updated = postgrest_request(
            "profiles",
            params={"id": f"eq.{user_id}"},
            method="PATCH",
            body={"is_active": next_state},
            headers_extra={"Prefer": "return=representation"},
            use_service_role=True,
        )
        updated_row = updated[0] if isinstance(updated, list) and updated else {**target, "is_active": next_state}

        state_label = "reactivate" if next_state else "suspend"
        _record_admin_audit(
            admin_user,
            f"user:{user_id}:{state_label}",
            "تفعيل حساب مستخدم" if next_state else "تعطيل حساب مستخدم",
            f"{target.get('full_name') or target_email} ({target_email})",
        )
        return updated_row
    except HTTPException:
        raise
    except DatabaseUnavailableError as e:
        raise HTTPException(status_code=503, detail=str(e))


@router.get("/api/admin/requests")
@router.get("/api/v1/admin/requests")
def list_all_repair_requests(request: Request) -> List[Dict[str, Any]]:
    """Provides system-wide repair request visibility to the exclusive administrator."""
    _require_exclusive_admin(request)
    try:
        rows = postgrest_request(
            "repair_requests",
            {"select": "*", "order": "created_at.desc", "limit": "200"},
            use_service_role=True,
        )
        return rows or []
    except DatabaseUnavailableError as e:
        raise HTTPException(status_code=503, detail=str(e))


@router.get("/api/admin/audit")
@router.get("/api/v1/admin/audit")
def list_admin_audit_logs(request: Request) -> List[Dict[str, Any]]:
    """Returns persistent administrative audit events recorded in Supabase."""
    _require_exclusive_admin(request)
    try:
        rows = postgrest_request(
            "notifications",
            {
                "select": "id,title,message,type,created_at",
                "type": "eq.admin_audit",
                "order": "created_at.desc",
                "limit": "100",
            },
            use_service_role=True,
        )
        return rows or []
    except DatabaseUnavailableError as e:
        raise HTTPException(status_code=503, detail=str(e))


@router.post("/api/notifications/pending-tech-alert")
@router.post("/api/v1/notifications/pending-tech-alert")
def notify_admin_of_pending_tech(request: Request, payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Notifies snsr19344@gmail.com inside Supabase notifications whenever a real pending
    technician/center application is recorded (verified against the database).
    """
    try:
        email = str(payload.get("email") or "").strip()
        business_name = str(payload.get("business_name") or "").strip()
        if not email and not business_name:
            raise HTTPException(status_code=422, detail="Application identifier required.")

        params: Dict[str, str] = {"select": "id,business_name,name,email,city,kind,status", "status": "eq.pending", "order": "created_at.desc", "limit": "1"}
        if email:
            params["email"] = f"eq.{email}"
        elif business_name:
            params["business_name"] = f"eq.{business_name}"

        pending_rows = postgrest_request("technicians", params, use_service_role=True) or []
        if not pending_rows:
            return {"notified": False, "reason": "No matching pending application found."}

        tech = pending_rows[0]
        admin_uid = _get_admin_profile_id()
        if not admin_uid:
            return {"notified": False, "reason": "Administrator profile not registered yet."}

        biz = tech.get("business_name") or tech.get("name") or "New Specialist"
        city = tech.get("city") or "-"
        _notify_user(
            admin_uid,
            "طلب اعتماد مركز/فني صيانة جديد",
            f"تقدم {biz} ({city}) بطلب اعتماد جديد وبانتظار مراجعتك في لوحة الإدارة.",
            notif_type="pending_approval",
            unread=True,
        )
        return {"notified": True}
    except HTTPException:
        raise
    except DatabaseUnavailableError as e:
        raise HTTPException(status_code=503, detail=str(e))


@router.get("/api/admin/ai-status")
@router.get("/api/v1/admin/ai-status")
def admin_get_ai_status(request: Request) -> Dict[str, Any]:
    """Returns safe status of configured external AI model API provider (admin only)."""
    _require_exclusive_admin(request)
    return get_ai_status()


@router.post("/api/admin/ai-config")
@router.post("/api/v1/admin/ai-config")
def admin_configure_ai_key(request: Request, payload: Dict[str, Any]) -> Dict[str, Any]:
    """Configures external AI API key on server runtime/.env (admin only)."""
    admin_user = _require_exclusive_admin(request)
    try:
        provider = str(payload.get("provider") or "gemini")
        api_key = str(payload.get("api_key") or "")
        result = save_ai_api_key(provider, api_key)
        _record_admin_audit(
            admin_user,
            f"ai:config:{result.get('provider')}",
            "تحديث إعدادات نموذج الذكاء الاصطناعي",
            f"Provider={result.get('provider')}, Key={result.get('masked_key')}",
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))


@router.post("/api/admin/ai-test")
@router.post("/api/v1/admin/ai-test")
def admin_test_ai_connection(request: Request) -> Dict[str, Any]:
    """Tests the active external AI model key with a brief diagnostic sanity prompt."""
    _require_exclusive_admin(request)
    res = AIAssistantService().analyze_with_datasets(
        device_info={
            "device_category": "Smartphone",
            "brand": "Apple",
            "model": "iPhone 13",
            "description": "Battery drains rapidly",
        },
        ora_summary={"category_sample_size": 6290, "empirical_repair_status": {"fixed_rate": 50.0}, "matched_failure_cluster": "BATTERY_CHARGING"},
        guide_summary={"title": "iPhone 13 Battery Replacement"},
        timeout=16.0,
    )
    return res


# =========================================================================
# Admin Maintenance Center CRUD, Bulk Upload & Review Moderation
# =========================================================================

_CITY_COORDS_MAP: Dict[str, tuple[float, float]] = {
    "cairo": (30.0444, 31.2357),
    "القاهرة": (30.0444, 31.2357),
    "giza": (30.0131, 31.2089),
    "الجيزة": (30.0131, 31.2089),
    "alexandria": (31.2001, 29.9187),
    "الإسكندرية": (31.2001, 29.9187),
    "الاسكندرية": (31.2001, 29.9187),
    "6th of october": (29.9285, 30.9188),
    "السادس من أكتوبر": (29.9285, 30.9188),
    "6 أكتوبر": (29.9285, 30.9188),
    "fayoum": (29.3084, 30.8428),
    "الفيوم": (29.3084, 30.8428),
    "beni suef": (29.0661, 31.0994),
    "بني سويف": (29.0661, 31.0994),
    "mansoura": (31.0409, 31.3785),
    "المنصورة": (31.0409, 31.3785),
    "tanta": (30.7865, 31.0004),
    "طنطا": (30.7865, 31.0004),
    "zagazig": (30.5877, 31.5020),
    "الزقازيق": (30.5877, 31.5020),
    "ismailia": (30.5965, 32.2715),
    "الإسماعيلية": (30.5965, 32.2715),
    "suez": (29.9668, 32.5498),
    "السويس": (29.9668, 32.5498),
    "port said": (31.2653, 32.3019),
    "بورسعيد": (31.2653, 32.3019),
    "luxor": (25.6872, 32.6396),
    "الأقصر": (25.6872, 32.6396),
    "aswan": (24.0889, 32.8998),
    "أسوان": (24.0889, 32.8998),
    "assiut": (27.1809, 31.1837),
    "أسيوط": (27.1809, 31.1837),
    "nasr city": (30.0561, 31.3301),
    "مدينة نصر": (30.0561, 31.3301),
    "maadi": (29.9602, 31.2569),
    "المعادي": (29.9602, 31.2569),
    "heliopolis": (30.0866, 31.3297),
    "مصر الجديدة": (30.0866, 31.3297),
    "new cairo": (30.0074, 31.4913),
    "القاهرة الجديدة": (30.0074, 31.4913),
}


def _lookup_city_coords(city: str) -> tuple[Optional[float], Optional[float]]:
    c = str(city or "").strip().lower()
    if not c:
        return None, None
    if c in _CITY_COORDS_MAP:
        return _CITY_COORDS_MAP[c]
    for key, coords in _CITY_COORDS_MAP.items():
        if key in c or c in key:
            return coords
    return None, None


def _normalize_center_payload(data: Dict[str, Any], is_create: bool = True) -> Dict[str, Any]:
    """Validates and normalizes maintenance center / technician fields for Supabase."""
    if not isinstance(data, dict):
        raise HTTPException(status_code=422, detail="Invalid JSON object payload.")

    raw_biz = str(data.get("business_name") or "").strip()
    raw_name = str(data.get("name") or data.get("full_name") or "").strip()
    business_name = raw_biz or raw_name
    name = raw_name or raw_biz
    city = str(data.get("city") or "").strip()

    if is_create and (not business_name or not city):
        raise HTTPException(
            status_code=422,
            detail="Both business_name (or name) and city are required.",
        )

    payload: Dict[str, Any] = {}
    if business_name:
        payload["business_name"] = business_name
    if name:
        payload["name"] = name
    if city:
        payload["city"] = city

    if "phone" in data or is_create:
        payload["phone"] = str(data.get("phone") or "").strip()
    if "email" in data or is_create:
        email_val = str(data.get("email") or "").strip()
        payload["email"] = email_val or None
    if "address" in data or is_create:
        payload["address"] = str(data.get("address") or "").strip()
    if "bio" in data or is_create:
        payload["bio"] = str(data.get("bio") or "").strip()
    if "working_hours" in data or is_create:
        wh = str(data.get("working_hours") or "").strip()
        payload["working_hours"] = wh or None

    if "kind" in data or is_create:
        kind_raw = str(data.get("kind") or "CENTER").strip().upper()
        payload["kind"] = kind_raw if kind_raw in ("CENTER", "TECHNICIAN") else "CENTER"

    if "specializations" in data or is_create:
        specs = data.get("specializations")
        if isinstance(specs, list):
            payload["specializations"] = ", ".join(str(s).strip() for s in specs if str(s).strip())
        else:
            payload["specializations"] = str(specs or "").strip()

    if "home_service" in data or is_create:
        hs = data.get("home_service")
        if isinstance(hs, str):
            payload["home_service"] = hs.strip().lower() in ("true", "1", "yes", "نعم")
        else:
            payload["home_service"] = bool(hs)

    if "experience_years" in data or is_create:
        exp = data.get("experience_years")
        try:
            payload["experience_years"] = int(exp) if exp not in (None, "") else None
        except (TypeError, ValueError):
            payload["experience_years"] = None

    lat_val = data.get("lat")
    lng_val = data.get("lng")
    try:
        parsed_lat = float(lat_val) if lat_val not in (None, "") else None
        parsed_lng = float(lng_val) if lng_val not in (None, "") else None
    except (TypeError, ValueError):
        parsed_lat, parsed_lng = None, None

    if (parsed_lat is None or parsed_lng is None) and city:
        c_lat, c_lng = _lookup_city_coords(city)
        if parsed_lat is None:
            parsed_lat = c_lat
        if parsed_lng is None:
            parsed_lng = c_lng

    if parsed_lat is not None:
        payload["lat"] = parsed_lat
    if parsed_lng is not None:
        payload["lng"] = parsed_lng

    if "user_id" in data and data.get("user_id"):
        payload["user_id"] = str(data.get("user_id")).strip()

    if "status" in data or is_create:
        st = str(data.get("status") or "approved").strip().lower()
        if st in STATUS_ORDER:
            payload["status"] = st
        elif is_create:
            payload["status"] = "approved"

    if is_create:
        payload["rating"] = 0
        payload["reviews_count"] = 0

    return payload


def _recalc_technician_rating(tech_profile_id: Optional[int]) -> Dict[str, Any]:
    """Recomputes real rating and reviews_count on public.technicians from reviewed repair_requests."""
    if not tech_profile_id:
        return {"rating": 0.0, "reviews_count": 0}
    try:
        tid = int(tech_profile_id)
    except (TypeError, ValueError):
        return {"rating": 0.0, "reviews_count": 0}

    rows = postgrest_request(
        "repair_requests",
        {
            "select": "id,rating",
            "tech_profile_id": f"eq.{tid}",
            "reviewed": "eq.true",
        },
        use_service_role=True,
    ) or []
    ratings = [float(r["rating"]) for r in rows if r.get("rating") is not None]
    count = len(ratings)
    avg = round(sum(ratings) / count, 2) if count > 0 else 0.0

    postgrest_request(
        "technicians",
        params={"id": f"eq.{tid}"},
        method="PATCH",
        body={"rating": avg, "reviews_count": count},
        headers_extra={"Prefer": "return=minimal"},
        use_service_role=True,
    )
    return {"rating": avg, "reviews_count": count}


@router.post("/api/admin/centers")
@router.post("/api/v1/admin/centers")
async def create_admin_center(request: Request) -> Dict[str, Any]:
    """Creates a maintenance center or technician directly from the Admin Control Center."""
    admin_user = _require_exclusive_admin(request)
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=422, detail="Invalid JSON body.")

    payload = _normalize_center_payload(body, is_create=True)
    try:
        created = postgrest_request(
            "technicians",
            method="POST",
            body=payload,
            headers_extra={"Prefer": "return=representation"},
            use_service_role=True,
        )
        row = created[0] if isinstance(created, list) and created else (created if isinstance(created, dict) else payload)

        uid = row.get("user_id")
        if uid and str(row.get("status") or "").lower() == "approved":
            prof_rows = postgrest_request(
                "profiles",
                {"select": "id,email,role", "id": f"eq.{uid}"},
                use_service_role=True,
            ) or []
            if prof_rows and str(prof_rows[0].get("email") or "").strip().lower() != EXCLUSIVE_ADMIN_EMAIL:
                postgrest_request(
                    "profiles",
                    params={"id": f"eq.{uid}"},
                    method="PATCH",
                    body={"role": "technician"},
                    headers_extra={"Prefer": "return=minimal"},
                    use_service_role=True,
                )

        biz = row.get("business_name") or row.get("name") or "-"
        cid = row.get("id") or "new"
        _record_admin_audit(
            admin_user,
            f"center:{cid}:create",
            "إضافة مركز صيانة جديد",
            f"{biz} ({row.get('city') or '-'})",
        )
        return row
    except DatabaseUnavailableError as e:
        raise HTTPException(status_code=503, detail=str(e))


@router.post("/api/admin/centers/bulk")
@router.post("/api/v1/admin/centers/bulk")
async def bulk_create_admin_centers(request: Request) -> Dict[str, Any]:
    """Bulk uploads verified maintenance centers from a JSON array or {centers: [...]} payload."""
    admin_user = _require_exclusive_admin(request)
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=422, detail="Invalid JSON body.")

    raw_items = body.get("centers") if isinstance(body, dict) else body
    if not isinstance(raw_items, list) or not raw_items:
        raise HTTPException(status_code=422, detail="Expected a non-empty list of centers.")

    valid_payloads: List[Dict[str, Any]] = []
    errors: List[Dict[str, Any]] = []
    for idx, item in enumerate(raw_items):
        try:
            valid_payloads.append(_normalize_center_payload(item, is_create=True))
        except HTTPException as he:
            errors.append({"index": idx, "error": he.detail})

    if not valid_payloads:
        raise HTTPException(status_code=422, detail=f"No valid center rows provided: {errors[:3]}")

    try:
        created = postgrest_request(
            "technicians",
            method="POST",
            body=valid_payloads,
            headers_extra={"Prefer": "return=representation"},
            use_service_role=True,
        )
        created_rows = created if isinstance(created, list) else ([created] if created else [])
        _record_admin_audit(
            admin_user,
            "centers:bulk:create",
            "رفع مجموعة مراكز صيانة",
            f"تم إضافة {len(created_rows)} مركز صيانة (أخطاء: {len(errors)})",
        )
        return {
            "created_count": len(created_rows),
            "failed_count": len(errors),
            "centers": created_rows,
            "errors": errors,
        }
    except DatabaseUnavailableError as e:
        raise HTTPException(status_code=503, detail=str(e))


@router.put("/api/admin/centers/{tech_id}")
@router.put("/api/v1/admin/centers/{tech_id}")
async def update_admin_center(request: Request, tech_id: int) -> Dict[str, Any]:
    """Updates fields on an existing maintenance center or technician."""
    admin_user = _require_exclusive_admin(request)
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=422, detail="Invalid JSON body.")

    patch = _normalize_center_payload(body, is_create=False)
    if not patch:
        raise HTTPException(status_code=422, detail="No updatable fields provided.")

    try:
        existing_rows = postgrest_request(
            "technicians",
            {"select": "*", "id": f"eq.{tech_id}"},
            use_service_role=True,
        ) or []
        if not existing_rows:
            raise HTTPException(status_code=404, detail="Technician or center not found.")

        updated = postgrest_request(
            "technicians",
            params={"id": f"eq.{tech_id}"},
            method="PATCH",
            body=patch,
            headers_extra={"Prefer": "return=representation"},
            use_service_role=True,
        )
        row = updated[0] if isinstance(updated, list) and updated else {**existing_rows[0], **patch}
        biz = row.get("business_name") or row.get("name") or f"#{tech_id}"
        _record_admin_audit(
            admin_user,
            f"center:{tech_id}:update",
            "تعديل بيانات مركز صيانة",
            f"{biz} ({row.get('city') or '-'})",
        )
        return row
    except HTTPException:
        raise
    except DatabaseUnavailableError as e:
        raise HTTPException(status_code=503, detail=str(e))


@router.delete("/api/admin/centers/{tech_id}")
@router.delete("/api/v1/admin/centers/{tech_id}")
def delete_admin_center(request: Request, tech_id: int) -> Dict[str, Any]:
    """Deletes a maintenance center or technician and unlinks dependent repair requests."""
    admin_user = _require_exclusive_admin(request)
    try:
        existing_rows = postgrest_request(
            "technicians",
            {"select": "id,business_name,name,city,user_id", "id": f"eq.{tech_id}"},
            use_service_role=True,
        ) or []
        if not existing_rows:
            raise HTTPException(status_code=404, detail="Technician or center not found.")
        center = existing_rows[0]

        # Detach existing requests cleanly before deletion
        postgrest_request(
            "repair_requests",
            params={"tech_profile_id": f"eq.{tech_id}"},
            method="PATCH",
            body={"tech_profile_id": None},
            headers_extra={"Prefer": "return=minimal"},
            use_service_role=True,
        )

        postgrest_request(
            "technicians",
            params={"id": f"eq.{tech_id}"},
            method="DELETE",
            headers_extra={"Prefer": "return=minimal"},
            use_service_role=True,
        )

        uid = center.get("user_id")
        if uid:
            other_rows = postgrest_request(
                "technicians",
                {"select": "id", "user_id": f"eq.{uid}", "status": "eq.approved"},
                use_service_role=True,
            ) or []
            if not other_rows:
                prof_rows = postgrest_request(
                    "profiles",
                    {"select": "id,email,role", "id": f"eq.{uid}"},
                    use_service_role=True,
                ) or []
                if prof_rows and str(prof_rows[0].get("email") or "").strip().lower() != EXCLUSIVE_ADMIN_EMAIL:
                    postgrest_request(
                        "profiles",
                        params={"id": f"eq.{uid}"},
                        method="PATCH",
                        body={"role": "user"},
                        headers_extra={"Prefer": "return=minimal"},
                        use_service_role=True,
                    )

        biz = center.get("business_name") or center.get("name") or f"#{tech_id}"
        _record_admin_audit(
            admin_user,
            f"center:{tech_id}:delete",
            "حذف مركز صيانة",
            f"{biz} ({center.get('city') or '-'})",
        )
        return {"deleted": True, "id": tech_id}
    except HTTPException:
        raise
    except DatabaseUnavailableError as e:
        raise HTTPException(status_code=503, detail=str(e))


def _is_valid_request_id(req_id: str) -> bool:
    import uuid
    s = str(req_id or "").strip()
    if not s:
        return False
    if s.isdigit():
        return True
    try:
        uuid.UUID(s)
        return True
    except ValueError:
        return False


@router.post("/api/admin/requests/{req_id}/clear-review")
@router.post("/api/v1/admin/requests/{req_id}/clear-review")
def clear_admin_request_review(request: Request, req_id: str) -> Dict[str, Any]:
    """Clears a customer rating/review from a repair request and recalculates center rating."""
    admin_user = _require_exclusive_admin(request)
    if not _is_valid_request_id(req_id):
        raise HTTPException(status_code=404, detail="Repair request not found.")
    try:
        rows = postgrest_request(
            "repair_requests",
            {"select": "id,tech_profile_id,device_info,rating,review_comment", "id": f"eq.{req_id}"},
            use_service_role=True,
        ) or []
        if not rows:
            raise HTTPException(status_code=404, detail="Repair request not found.")
        req_row = rows[0]

        postgrest_request(
            "repair_requests",
            params={"id": f"eq.{req_id}"},
            method="PATCH",
            body={"rating": None, "review_comment": None, "reviewed": False},
            headers_extra={"Prefer": "return=minimal"},
            use_service_role=True,
        )
        stats = _recalc_technician_rating(req_row.get("tech_profile_id"))
        _record_admin_audit(
            admin_user,
            f"request:{req_id}:clear-review",
            "إزالة تقييم عميل",
            f"طلب #{req_id} ({req_row.get('device_info') or '-'})",
        )
        return {"cleared": True, "id": req_id, "center_rating": stats}
    except HTTPException:
        raise
    except DatabaseUnavailableError as e:
        raise HTTPException(status_code=503, detail=str(e))
