import json
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.schemas import DiagnosisRequest, DiagnosisResponse
from app.ai_engine.diagnosis_engine import diagnosis_engine
from app.models.db import (
    create_diagnosis_report, get_diagnosis_report, get_user_diagnosis_reports,
    delete_diagnosis_report
)
from app.api.deps import get_optional_user, get_current_user

router = APIRouter(prefix="/diagnosis", tags=["Diagnosis"])

@router.post("/analyze", response_model=DiagnosisResponse)
def analyze_device_problem(
    req: DiagnosisRequest,
    user: Optional[Dict[str, Any]] = Depends(get_optional_user)
):
    # Run the AI Diagnosis Pipeline
    response = diagnosis_engine.diagnose(req)
    
    # Save report to SQLite database
    report_data = {
        "user_id": user["id"] if user else None,
        "device_category": response.device_category,
        "brand": response.brand,
        "model": response.model,
        "problem_category": req.problem_category,
        "raw_description": req.description,
        "extracted_symptoms": response.extracted_symptoms,
        "severity_level": response.severity,
        "confidence_score": response.confidence_score,
        "possible_causes": [c.model_dump() for c in response.possible_causes],
        "recommended_steps": [s.model_dump() for s in response.troubleshooting_steps],
        "required_tools": response.required_tools,
        "estimated_difficulty": response.estimated_difficulty,
        "estimated_minutes": response.estimated_minutes,
        "safety_warnings": response.safety_warnings_en,
        "requires_technician": response.requires_technician
    }
    report_id = create_diagnosis_report(report_data)
    response.report_id = report_id
    return response

@router.get("/reports", response_model=List[dict])
def get_user_reports(current_user: Dict[str, Any] = Depends(get_current_user)):
    reports = get_user_diagnosis_reports(current_user["id"])
    output = []
    for r in reports:
        output.append({
            "id": r["id"],
            "device_category": r["device_category"],
            "brand": r["brand"],
            "model": r["model"],
            "severity_level": r["severity_level"],
            "confidence_score": r["confidence_score"],
            "raw_description": r["raw_description"],
            "extracted_symptoms": json.loads(r["extracted_symptoms"] or "[]"),
            "possible_causes": json.loads(r["possible_causes"] or "[]"),
            "recommended_steps": json.loads(r["recommended_steps"] or "[]"),
            "required_tools": json.loads(r["required_tools"] or "[]"),
            "estimated_difficulty": r["estimated_difficulty"],
            "estimated_minutes": r["estimated_minutes"],
            "requires_technician": bool(r["requires_technician"]),
            "created_at": r["created_at"]
        })
    return output

@router.get("/reports/{report_id}", response_model=dict)
def get_report_detail(report_id: int):
    report = get_diagnosis_report(report_id)
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
        
    return {
        "id": report["id"],
        "device_category": report["device_category"],
        "brand": report["brand"],
        "model": report["model"],
        "severity_level": report["severity_level"],
        "confidence_score": report["confidence_score"],
        "raw_description": report["raw_description"],
        "extracted_symptoms": json.loads(report["extracted_symptoms"] or "[]"),
        "possible_causes": json.loads(report["possible_causes"] or "[]"),
        "recommended_steps": json.loads(report["recommended_steps"] or "[]"),
        "required_tools": json.loads(report["required_tools"] or "[]"),
        "estimated_difficulty": report["estimated_difficulty"],
        "estimated_minutes": report["estimated_minutes"],
        "safety_warnings": json.loads(report["safety_warnings"] or "[]"),
        "requires_technician": bool(report["requires_technician"]),
        "created_at": report["created_at"]
    }

@router.delete("/reports/{report_id}")
def delete_report(report_id: int, current_user: Dict[str, Any] = Depends(get_current_user)):
    success = delete_diagnosis_report(report_id, current_user["id"])
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found or not authorized")
    return {"message": "Report deleted successfully"}
