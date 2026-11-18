from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from app.models.db import (
    create_repair_request, get_repair_requests_for_user, get_repair_requests_for_technician,
    update_request_status, get_technician_by_id, get_technician_by_user_id,
    get_connection
)
from app.schemas.schemas import RepairRequestCreate, RepairRequestStatusUpdate
from app.api.deps import get_current_user

router = APIRouter(prefix="/bookings", tags=["Bookings & Requests"])

@router.post("/requests")
def submit_request(req_in: RepairRequestCreate, current_user: Dict[str, Any] = Depends(get_current_user)):
    tech = get_technician_by_id(req_in.technician_id)
    if not tech:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Selected technician not found")
        
    req_id = create_repair_request(
        user_id=current_user["id"],
        tech_id=req_in.technician_id,
        device_info=req_in.device_info,
        problem_summary=req_in.problem_summary,
        notes=req_in.customer_notes,
        scheduled_date=req_in.scheduled_date.isoformat() if req_in.scheduled_date else None,
        diag_id=req_in.diagnosis_id
    )
    return {"message": "Repair request submitted successfully", "request_id": req_id}

@router.get("/requests", response_model=List[dict])
def list_my_requests(current_user: Dict[str, Any] = Depends(get_current_user)):
    if current_user.get("role") == "technician":
        tech = get_technician_by_user_id(current_user["id"])
        if not tech:
            return []
        return get_repair_requests_for_technician(tech["id"])
    elif current_user.get("role") == "admin":
        con = get_connection()
        try:
            rows = con.execute("""
                SELECT r.*, t.business_name as technician_business, u.full_name as customer_name
                FROM repair_requests r
                JOIN technician_profiles t ON r.technician_id = t.id
                JOIN users u ON r.user_id = u.id
                ORDER BY r.id DESC
            """).fetchall()
            return [dict(r) for r in rows]
        finally:
            con.close()
    else:
        return get_repair_requests_for_user(current_user["id"])

@router.patch("/requests/{request_id}/status")
def change_status(request_id: int, status_in: RepairRequestStatusUpdate, current_user: Dict[str, Any] = Depends(get_current_user)):
    success = update_request_status(request_id, status_in.status, status_in.estimated_quote)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    return {"message": "Request status updated successfully", "new_status": status_in.status}
