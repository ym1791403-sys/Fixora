from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from app.models.db import (
    list_technicians, get_technician_by_id, get_technician_by_user_id,
    create_technician_profile, get_connection
)
from app.schemas.schemas import TechnicianProfileUpdate
from app.api.deps import get_current_user

router = APIRouter(prefix="/technicians", tags=["Technicians"])

@router.get("", response_model=List[dict])
def get_approved_technicians(city: Optional[str] = None, specialization: Optional[str] = None):
    techs = list_technicians(city, specialization, status="approved")
    output = []
    for t in techs:
        output.append({
            "id": t["id"],
            "user_id": t["user_id"],
            "business_name": t["business_name"],
            "technician_name": t.get("technician_name", "Certified Technician"),
            "technician_phone": t.get("technician_phone"),
            "bio": t["bio"],
            "specializations": [s.strip() for s in t["specializations"].split(",") if s.strip()],
            "experience_years": t["experience_years"],
            "city": t["city"],
            "address": t["address"],
            "rating": t["rating"],
            "total_reviews": t["total_reviews"],
            "is_available": bool(t["is_available"]),
            "verification_status": t["verification_status"]
        })
    return output

@router.get("/{tech_id}", response_model=dict)
def get_technician(tech_id: int):
    t = get_technician_by_id(tech_id)
    if not t:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Technician not found")
        
    return {
        "id": t["id"],
        "user_id": t["user_id"],
        "business_name": t["business_name"],
        "technician_name": t.get("technician_name", "Certified Technician"),
        "technician_email": t.get("technician_email"),
        "technician_phone": t.get("technician_phone"),
        "bio": t["bio"],
        "specializations": [s.strip() for s in t["specializations"].split(",") if s.strip()],
        "experience_years": t["experience_years"],
        "city": t["city"],
        "address": t["address"],
        "rating": t["rating"],
        "total_reviews": t["total_reviews"],
        "is_available": bool(t["is_available"]),
        "verification_status": t["verification_status"]
    }

@router.put("/profile")
def update_profile(profile_in: TechnicianProfileUpdate, current_user: Dict[str, Any] = Depends(get_current_user)):
    if current_user.get("role") not in ["technician", "admin"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Must be a technician account")
        
    tech = get_technician_by_user_id(current_user["id"])
    if not tech:
        create_technician_profile(
            user_id=current_user["id"],
            business_name=profile_in.business_name or current_user["full_name"],
            specializations=", ".join(profile_in.specializations) if profile_in.specializations else "General Repair",
            city=profile_in.city or "Cairo",
            bio=profile_in.bio
        )
    else:
        con = get_connection()
        try:
            updates = []
            params = []
            if profile_in.business_name is not None:
                updates.append("business_name = ?")
                params.append(profile_in.business_name)
            if profile_in.bio is not None:
                updates.append("bio = ?")
                params.append(profile_in.bio)
            if profile_in.specializations is not None:
                updates.append("specializations = ?")
                params.append(", ".join(profile_in.specializations))
            if profile_in.experience_years is not None:
                updates.append("experience_years = ?")
                params.append(profile_in.experience_years)
            if profile_in.city is not None:
                updates.append("city = ?")
                params.append(profile_in.city)
            if profile_in.address is not None:
                updates.append("address = ?")
                params.append(profile_in.address)
            if profile_in.is_available is not None:
                updates.append("is_available = ?")
                params.append(1 if profile_in.is_available else 0)
                
            if updates:
                params.append(tech["id"])
                con.execute(f"UPDATE technician_profiles SET {', '.join(updates)} WHERE id = ?", params)
                con.commit()
        finally:
            con.close()
            
    return {"message": "Profile updated successfully"}
