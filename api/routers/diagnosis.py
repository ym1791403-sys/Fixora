# -*- coding: utf-8 -*-
"""
API Router: Unified Diagnosis
Exposes /api/diagnosis/analyze and /api/v1/diagnosis/analyze.
Provides data-driven diagnostic evaluation by combining:
- Open Repair Alliance (416,282 real records)
- MyFixit Dataset (18,995 verified repair manuals)
- Backblaze Hard Drive ML Failure Predictor (SMART telemetry)
Strictly removes all hardcoded probabilities and static fabricated outcomes.
"""

from fastapi import APIRouter, Request
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field
from api.services.unified_diagnosis import UnifiedDiagnosisService

router = APIRouter(tags=["Diagnosis"])
service = UnifiedDiagnosisService()

class DiagnosisRequest(BaseModel):
    device_category: Optional[str] = Field("Laptop", description="Device category (e.g. Smartphone, Laptop, Console, Storage)")
    brand: Optional[str] = Field(None, description="Device brand (e.g. Apple, Sony, Dell, Seagate)")
    model: Optional[str] = Field(None, description="Device model (e.g. iPhone 13, PS5, Barracuda 4TB)")
    problem_category: Optional[str] = Field(None, description="Problem symptom (e.g. Screen, Battery, Overheating, Bad Sectors)")
    description: Optional[str] = Field(None, description="Detailed problem description")
    device_age_years: Optional[float] = Field(None, description="Age of the device in years")
    smart_telemetry: Optional[Dict[str, Any]] = Field(None, description="SMART attributes dictionary for storage devices")
    usb_telemetry: Optional[Dict[str, Any]] = Field(None, description="Wired WebUSB/Serial descriptor metadata")
    serial_logs: Optional[str] = Field(None, description="Captured UART/Serial diagnostic text logs")
    skip_ai: Optional[bool] = Field(False, description="Skip external LLM calls for instant zero-token diagnosis")

@router.api_route("/api/diagnosis/analyze", methods=["POST", "GET"])
@router.api_route("/api/v1/diagnosis/analyze", methods=["POST", "GET"])
async def run_diagnosis(request: Request):
    """
    Executes unified diagnosis using real empirical records and ML prediction.
    """
    if request.method == "POST":
        try:
            body = await request.json()
        except Exception:
            body = {}
    else:
        # GET query params support
        body = dict(request.query_params)
        
    return service.diagnose(body)


@router.post("/api/diagnosis/feedback")
@router.post("/api/v1/diagnosis/feedback")
async def submit_diagnosis_feedback(request: Request):
    """
    Records user-verified repair outcome (fixed -> stores solution in live Supabase dataset;
    not fixed -> logs failed attempt and returns an alternative solution path).
    """
    try:
        body = await request.json()
    except Exception:
        body = {}
    return service.record_feedback(body)
