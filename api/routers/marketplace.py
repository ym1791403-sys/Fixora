# -*- coding: utf-8 -*-
"""
Marketplace & Customer Reviews Router
Provides anonymized public technician/center reviews and authenticated
server-verified customer review submission with real rating recalculation.
"""

from datetime import datetime, timezone
import json
import math
import time
import urllib.parse
import urllib.request
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query, Request

from api.services.db import DatabaseUnavailableError, postgrest_request
from api.routers import admin as admin_mod

router = APIRouter(tags=["marketplace"])

_NEARBY_SHOPS_CACHE: Dict[str, Any] = {}


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (
        math.sin(d_lat / 2) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lon / 2) ** 2
    )
    return 2 * r * math.asin(min(1.0, math.sqrt(a)))


def _categorize_osm_shop(tags: Dict[str, Any]) -> str:
    craft = str(tags.get("craft") or "").lower()
    shop = str(tags.get("shop") or "").lower()
    if "electronics_repair" in craft:
        return "مركز صيانة إلكترونيات"
    if "appliance_repair" in craft:
        return "صيانة أجهزة منزلية"
    if shop == "mobile_phone":
        return "مبيعات وصيانة هواتف محمولة"
    if shop == "computer":
        return "صيانة كمبيوتر ولابتوب"
    if shop == "electronics":
        return "إلكترونيات وصيانة أجهزة"
    return "ورشة / محل صيانة تقنية"


@router.get("/api/marketplace/nearby-shops")
@router.get("/api/v1/marketplace/nearby-shops")
def get_nearby_public_repair_shops(
    lat: float = Query(..., ge=-90.0, le=90.0),
    lng: float = Query(..., ge=-180.0, le=180.0),
    radius_km: float = Query(6.0, ge=1.0, le=30.0),
) -> Dict[str, Any]:
    """
    Fetches real public electronics/mobile/computer repair shops near user coordinates
    from OpenStreetMap Overpass API alongside direct Google Maps navigation links.
    Never fabricates shops when upstream map providers time out.
    """
    cache_key = f"{round(lat, 2)}_{round(lng, 2)}_{int(radius_km)}"
    now = time.time()
    cached = _NEARBY_SHOPS_CACHE.get(cache_key)
    if cached and (now - cached["ts"]) < 900.0:
        return cached["data"]

    radius_m = int(min(max(radius_km, 1.0), 30.0) * 1000)
    google_search_url = f"https://www.google.com/maps/search/{urllib.parse.quote('صيانة موبايل ولابتوب والالكترونيات')}/@{lat},{lng},14z"
    overpass_q = (
        f"[out:json][timeout:8];"
        f"("
        f'nwr["craft"~"electronics_repair|appliance_repair"](around:{radius_m},{lat},{lng});'
        f'nwr["shop"~"mobile_phone|computer|electronics|appliance"](around:{radius_m},{lat},{lng});'
        f'nwr["name"~"صيانة|تصليح|Repair|Service Center|Fix",i](around:{radius_m},{lat},{lng});'
        f");out center 45;"
    )

    shops: List[Dict[str, Any]] = []
    source_used = "Google Maps & OpenStreetMap"
    try:
        req = urllib.request.Request(
            "https://overpass-api.de/api/interpreter",
            data=urllib.parse.urlencode({"data": overpass_q}).encode("utf-8"),
            headers={"User-Agent": "ByteForce-Platform/4.0", "Content-Type": "application/x-www-form-urlencoded"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=9) as resp:
            raw = json.loads(resp.read().decode("utf-8"))
        seen_coords = set()
        for el in (raw.get("elements") or []):
            tags = el.get("tags") or {}
            name = (tags.get("name:ar") or tags.get("name") or tags.get("brand") or "").strip()
            if not name:
                continue
            c_lat = el.get("lat") if el.get("lat") is not None else (el.get("center") or {}).get("lat")
            c_lng = el.get("lon") if el.get("lon") is not None else (el.get("center") or {}).get("lon")
            if c_lat is None or c_lng is None:
                continue
            coord_key = (round(float(c_lat), 4), round(float(c_lng), 4), name.lower())
            if coord_key in seen_coords:
                continue
            seen_coords.add(coord_key)

            dist = round(_haversine_km(lat, lng, float(c_lat), float(c_lng)), 2)
            addr_parts = [tags.get("addr:street"), tags.get("addr:suburb") or tags.get("addr:district"), tags.get("addr:city")]
            addr = " - ".join(str(p).strip() for p in addr_parts if p)
            phone = (tags.get("phone") or tags.get("contact:phone") or tags.get("mobile") or "").strip()
            hours = (tags.get("opening_hours") or "").strip()
            gm_query = urllib.parse.quote(f"{name} {c_lat},{c_lng}")
            shops.append({
                "id": f"osm_{el.get('type', 'n')}_{el.get('id')}",
                "name": name,
                "category_ar": _categorize_osm_shop(tags),
                "lat": float(c_lat),
                "lng": float(c_lng),
                "distance_km": dist,
                "address": addr,
                "phone": phone,
                "opening_hours": hours,
                "google_maps_url": f"https://www.google.com/maps/search/?api=1&query={gm_query}",
                "source": "OpenStreetMap / Public Maps",
            })
        shops.sort(key=lambda x: x["distance_km"])
        shops = shops[:25]
    except Exception:
        source_used = "Google Maps Direct"

    out = {
        "lat": lat,
        "lng": lng,
        "radius_km": radius_km,
        "count": len(shops),
        "shops": shops,
        "source": source_used,
        "google_maps_search_url": google_search_url,
    }
    _NEARBY_SHOPS_CACHE[cache_key] = {"ts": now, "data": out}
    return out


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
