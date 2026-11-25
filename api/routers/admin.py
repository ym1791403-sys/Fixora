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
