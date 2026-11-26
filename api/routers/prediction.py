# -*- coding: utf-8 -*-
"""
API Router: Storage Failure Prediction
Provides genuine ML failure risk scoring based on SMART telemetry
via the BackblazeFailurePredictionService.
Enforces that model applies strictly to storage drives.
"""

from fastapi import APIRouter, Request, HTTPException
from api.routers import admin as admin_mod
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field
from api.services.backblaze_service import BackblazeFailurePredictionService

router = APIRouter(tags=["Hard Drive Prediction"])
service = BackblazeFailurePredictionService()

class SmartTelemetryInput(BaseModel):
    device_category: Optional[str] = "Storage"
    serial_number: Optional[str] = None
    model: Optional[str] = None
    capacity_bytes: Optional[int] = None
    smart_5_raw: Optional[float] = Field(None, description="Reallocated Sectors Count")
    smart_9_raw: Optional[float] = Field(None, description="Power-On Hours")
    smart_187_raw: Optional[float] = Field(None, description="Reported Uncorrectable Errors")
    smart_188_raw: Optional[float] = Field(None, description="Command Timeout")
    smart_194_raw: Optional[float] = Field(None, description="Temperature Celsius")
    smart_197_raw: Optional[float] = Field(None, description="Current Pending Sector Count")
    smart_198_raw: Optional[float] = Field(None, description="Offline Uncorrectable Sector Count")

@router.post("/api/prediction/hard-drive")
@router.post("/api/v1/prediction/hard-drive")
async def predict_storage_failure(request: Request, telemetry: SmartTelemetryInput):
    """
    Evaluates SMART telemetry to predict hard drive failure risk.
    Trained on Backblaze Q2 2026 data with serial-number and chronological validation.
    """
    admin_mod._verify_supabase_bearer_user(request)
    data = telemetry.model_dump()
    category = data.get("device_category") or "Storage"
    result = service.predict_failure(data, device_category=category)
    return result
