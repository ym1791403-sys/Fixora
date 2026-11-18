from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from app.models.db import (
    get_stats, list_technicians, set_technician_status, list_users,
    toggle_user_active
)
from app.api.deps import get_current_admin

router = APIRouter(prefix="/admin", tags=["Admin Operations"])

@router.get("/stats")
def platform_stats(admin: Dict[str, Any] = Depends(get_current_admin)):
    return get_stats()

@router.get("/technicians/pending")
def pending_technicians(admin: Dict[str, Any] = Depends(get_current_admin)):
    techs = list_technicians(status="pending")
    return [{
        "id": t["id"],
        "user_id": t["user_id"],
        "technician_name": t.get("technician_name", ""),
        "technician_email": t.get("technician_email", ""),
        "business_name": t["business_name"],
        "specializations": t["specializations"],
        "city": t["city"],
        "experience_years": t["experience_years"],
        "created_at": t["created_at"]
    } for t in techs]

@router.post("/technicians/{tech_id}/approve")
def approve_tech(tech_id: int, admin: Dict[str, Any] = Depends(get_current_admin)):
    success = set_technician_status(tech_id, "approved")
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Technician not found")
    return {"message": "Technician approved successfully"}

@router.post("/technicians/{tech_id}/reject")
def reject_tech(tech_id: int, admin: Dict[str, Any] = Depends(get_current_admin)):
    success = set_technician_status(tech_id, "rejected")
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Technician not found")
    return {"message": "Technician rejected"}

@router.get("/users")
def get_all_users(admin: Dict[str, Any] = Depends(get_current_admin)):
    return list_users(limit=100)

@router.patch("/users/{user_id}/status")
def toggle_status(user_id: int, admin: Dict[str, Any] = Depends(get_current_admin)):
    if user_id == admin["id"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot deactivate yourself")
    new_status = toggle_user_active(user_id)
    if new_status is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return {"message": "User status updated", "is_active": new_status}
