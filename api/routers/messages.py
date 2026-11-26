# -*- coding: utf-8 -*-
"""
Per-repair-request chat between the customer and the assigned technician.
Only the request owner, its assigned technician, or the exclusive admin may
read or write a request's messages. Backed by public.request_messages.
"""

from typing import Any, Dict, List
from fastapi import APIRouter, HTTPException, Request

from api.services.db import DatabaseUnavailableError, postgrest_request
from api.routers import admin as admin_mod

router = APIRouter(tags=["messages"])


def _load_request_or_404(req_id: str) -> Dict[str, Any]:
    if not admin_mod._is_valid_request_id(req_id):
        raise HTTPException(status_code=404, detail="Repair request not found.")
    rows = postgrest_request(
        "repair_requests",
        {"select": "id,user_id,technician_id,user_name,technician_name",
         "id": f"eq.{req_id}"},
        use_service_role=True,
    ) or []
    if not rows:
        raise HTTPException(status_code=404, detail="Repair request not found.")
    return rows[0]


def _authorize_participant(request: Request, req_row: Dict[str, Any]):
    """Returns (user, role) when the caller is the owner, the technician, or admin."""
    user = admin_mod._verify_supabase_bearer_user(request)
    uid = str(user.get("id") or "")
    email = str(user.get("email") or "").strip().lower()
    if email == admin_mod.EXCLUSIVE_ADMIN_EMAIL:
        return user, "admin"
    if str(req_row.get("user_id") or "") == uid:
        return user, "customer"
    if str(req_row.get("technician_id") or "") == uid:
        return user, "technician"
    raise HTTPException(
        status_code=403,
        detail="Only the request customer, its technician, or the admin can access this chat.",
    )


@router.get("/api/requests/{req_id}/messages")
@router.get("/api/v1/requests/{req_id}/messages")
def list_request_messages(request: Request, req_id: str) -> Dict[str, Any]:
    req_row = _load_request_or_404(req_id)
    _authorize_participant(request, req_row)
    try:
        rows = postgrest_request(
            "request_messages",
            {"select": "id,request_id,sender_id,sender_name,sender_role,body,created_at",
             "request_id": f"eq.{req_id}", "order": "created_at.asc", "limit": "200"},
            use_service_role=True,
        ) or []
    except DatabaseUnavailableError:
        # Table not migrated yet in the live DB: report honestly instead of 500.
        return {"request_id": req_id, "messages": [], "chat_unavailable": True}
    return {"request_id": req_id, "messages": rows}


@router.post("/api/requests/{req_id}/messages")
@router.post("/api/v1/requests/{req_id}/messages")
async def send_request_message(request: Request, req_id: str) -> Dict[str, Any]:
    req_row = _load_request_or_404(req_id)
    user, role = _authorize_participant(request, req_row)
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=422, detail="Invalid JSON body.")
    text = str((body or {}).get("body") or "").strip()
    if not text:
        raise HTTPException(status_code=422, detail="Message body required.")
    if len(text) > 2000:
        raise HTTPException(status_code=422, detail="Message too long (max 2000 characters).")
    sender_name = ((user.get("user_metadata") or {}).get("full_name")
                   or user.get("email") or "")
    try:
        created = postgrest_request(
            "request_messages",
            method="POST",
            body={
                "request_id": req_id,
                "sender_id": user.get("id"),
                "sender_name": sender_name,
                "sender_role": role,
                "body": text,
            },
            headers_extra={"Prefer": "return=representation"},
            use_service_role=True,
        )
    except DatabaseUnavailableError as e:
        raise HTTPException(status_code=503, detail=str(e))
    # Notify the other side of this request's chat.
    other_id = None
    if role == "customer":
        other_id = req_row.get("technician_id")
    elif role == "technician":
        other_id = req_row.get("user_id")
    if other_id and str(other_id) != str(user.get("id")):
        admin_mod._notify_user(other_id, "رسالة جديدة في طلب الصيانة", text[:140],
                               notif_type="chat")
    row = created[0] if isinstance(created, list) and created else {
        "request_id": req_id, "sender_id": user.get("id"),
        "sender_role": role, "body": text,
    }
    return {"message": row}
