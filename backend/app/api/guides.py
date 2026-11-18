import json
from typing import List, Optional
from fastapi import APIRouter, HTTPException, status
from app.models.db import list_guides, get_guide_by_id

router = APIRouter(prefix="/guides", tags=["Repair Guides"])

@router.get("", response_model=List[dict])
def get_guides(category: Optional[str] = None, difficulty: Optional[str] = None, search: Optional[str] = None):
    guides = list_guides(category, difficulty, search)
    output = []
    for g in guides:
        output.append({
            "id": g["id"],
            "device_category": g["device_category"],
            "problem_category": g["problem_category"],
            "title_en": g["title_en"],
            "title_ar": g["title_ar"],
            "summary_en": g["summary_en"],
            "summary_ar": g["summary_ar"],
            "difficulty": g["difficulty"],
            "estimated_minutes": g["estimated_minutes"],
            "required_tools": json.loads(g["required_tools"] or "[]"),
            "safety_precautions": json.loads(g["safety_precautions"] or "[]"),
            "steps_count": len(json.loads(g["steps_json"] or "[]")),
            "created_at": g["created_at"]
        })
    return output

@router.get("/{guide_id}", response_model=dict)
def get_guide(guide_id: int):
    guide = get_guide_by_id(guide_id)
    if not guide:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Repair guide not found")
        
    return {
        "id": guide["id"],
        "device_category": guide["device_category"],
        "problem_category": guide["problem_category"],
        "title_en": guide["title_en"],
        "title_ar": guide["title_ar"],
        "summary_en": guide["summary_en"],
        "summary_ar": guide["summary_ar"],
        "difficulty": guide["difficulty"],
        "estimated_minutes": guide["estimated_minutes"],
        "required_tools": json.loads(guide["required_tools"] or "[]"),
        "safety_precautions": json.loads(guide["safety_precautions"] or "[]"),
        "steps": json.loads(guide["steps_json"] or "[]"),
        "created_at": guide["created_at"]
    }
