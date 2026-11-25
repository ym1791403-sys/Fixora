# -*- coding: utf-8 -*-
"""
Marketplace & Customer Reviews Router
Provides anonymized public technician/center reviews and authenticated
server-verified customer review submission with real rating recalculation.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List
from fastapi import APIRouter, HTTPException, Request

from api.services.db import DatabaseUnavailableError, postgrest_request
from api.routers import admin as admin_mod

router = APIRouter(tags=["marketplace"])


def _public_reviewer_name(raw_name: Any) -> str:
    """Strips email domains and returns a clean public customer display name."""
    s = str(raw_name or "").strip()
    if not s:
        return "عميل موثق"
    if "@" in s:
        s = s.split("@", 1)[0].strip()
    return s or "عميل موثق"


@router.get("/api/technicians/{tech_id}/reviews")
@router.get("/api/v1/technicians/{tech_id}/reviews")
def get_technician_reviews(tech_id: int) -> Dict[str, Any]:
    """Returns genuine anonymized customer reviews and star breakdown for a maintenance center."""
    if tech_id <= 0:
        raise HTTPException(status_code=422, detail="Invalid technician ID.")

    try:
        rows = postgrest_request(
            "repair_requests",
            {
                "select": "id,user_name,device_info,device_category,rating,review_comment,created_at,status",
                "tech_profile_id": f"eq.{tech_id}",
                "reviewed": "eq.true",
                "order": "created_at.desc",
                "limit": "100",
            },
            use_service_role=True,
        ) or []
    except DatabaseUnavailableError as e:
        raise HTTPException(status_code=503, detail=str(e))

    breakdown: Dict[str, int] = {"5": 0, "4": 0, "3": 0, "2": 0, "1": 0}
    reviews_out: List[Dict[str, Any]] = []
    ratings_sum = 0.0
    ratings_cnt = 0

    for row in rows:
        raw_rating = row.get("rating")
        try:
            star = int(round(float(raw_rating))) if raw_rating is not None else 0
        except (TypeError, ValueError):
            star = 0
        if 1 <= star <= 5:
            breakdown[str(star)] += 1
            ratings_sum += float(raw_rating)
            ratings_cnt += 1

        reviews_out.append({
            "id": row.get("id"),
            "reviewer_name": _public_reviewer_name(row.get("user_name")),
            "rating": float(raw_rating) if raw_rating is not None else 0,
            "review_comment": str(row.get("review_comment") or "").strip(),
            "device_info": str(row.get("device_info") or row.get("device_category") or "").strip(),
            "created_at": row.get("created_at"),
        })

    avg_rating = round(ratings_sum / ratings_cnt, 2) if ratings_cnt > 0 else 0.0
    return {
        "tech_id": tech_id,
        "average_rating": avg_rating,
        "reviews_count": len(reviews_out),
        "rating_breakdown": breakdown,
        "reviews": reviews_out,
    }


@router.post("/api/requests/{req_id}/review")
@router.post("/api/v1/requests/{req_id}/review")
async def submit_request_review(request: Request, req_id: str) -> Dict[str, Any]:
    """Submits a verified customer review for a COMPLETED repair request and syncs center rating."""
    user = admin_mod._verify_supabase_bearer_user(request)
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=422, detail="Invalid JSON body.")

    if not isinstance(body, dict):
        raise HTTPException(status_code=422, detail="Invalid JSON object payload.")

    raw_rating = body.get("rating")
    try:
        rating_val = int(round(float(raw_rating)))
    except (TypeError, ValueError):
        raise HTTPException(status_code=422, detail="rating must be an integer between 1 and 5.")
    if rating_val < 1 or rating_val > 5:
        raise HTTPException(status_code=422, detail="rating must be between 1 and 5.")

    comment = str(body.get("review_comment") or body.get("comment") or "").strip()

    if not admin_mod._is_valid_request_id(req_id):
        raise HTTPException(status_code=404, detail="Repair request not found.")

    try:
        rows = postgrest_request(
            "repair_requests",
            {"select": "*", "id": f"eq.{req_id}"},
            use_service_role=True,
        ) or []
        if not rows:
            raise HTTPException(status_code=404, detail="Repair request not found.")
        existing = rows[0]

        caller_uid = str(user.get("id") or "")
        caller_email = str(user.get("email") or "").strip().lower()
        if str(existing.get("user_id") or "") != caller_uid and caller_email != admin_mod.EXCLUSIVE_ADMIN_EMAIL:
            raise HTTPException(status_code=403, detail="Only the request owner can submit a review.")

        if str(existing.get("status") or "").upper() != "COMPLETED":
            raise HTTPException(status_code=400, detail="Only COMPLETED repair requests can be reviewed.")

        if bool(existing.get("reviewed")):
            raise HTTPException(status_code=409, detail="This repair request has already been reviewed.")

        history = list(existing.get("history") or []) if isinstance(existing.get("history"), list) else []
        history.append({
            "at": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S"),
            "old": existing.get("status"),
            "new": existing.get("status"),
            "actor": existing.get("user_name") or caller_email,
            "note": f"تم إضافة تقييم العميل ({rating_val}★)",
        })

        updated = postgrest_request(
            "repair_requests",
            params={"id": f"eq.{req_id}"},
            method="PATCH",
            body={
                "rating": rating_val,
                "review_comment": comment,
                "reviewed": True,
                "history": history,
            },
            headers_extra={"Prefer": "return=representation"},
            use_service_role=True,
        )
        updated_row = updated[0] if isinstance(updated, list) and updated else {
            **existing,
            "rating": rating_val,
            "review_comment": comment,
            "reviewed": True,
            "history": history,
        }

        rating_stats = admin_mod._recalc_technician_rating(existing.get("tech_profile_id"))

        tech_uid = existing.get("technician_id")
        if tech_uid and str(tech_uid) != caller_uid:
            admin_mod._notify_user(
                tech_uid,
                f"تقييم جديد ({rating_val}★)",
                comment or f"قيّم العميل طلب الصيانة ({existing.get('device_info') or '-'}) بـ {rating_val} من 5.",
                notif_type="review",
            )

        return {"request": updated_row, "center_rating": rating_stats}
    except HTTPException:
        raise
    except DatabaseUnavailableError as e:
        raise HTTPException(status_code=503, detail=str(e))
