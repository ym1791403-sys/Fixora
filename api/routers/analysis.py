# -*- coding: utf-8 -*-
"""
Open Repair Analysis Router
Exposes empirical failure frequencies, repairability benchmarks,
and historical repair barriers derived from 416,282 Open Repair Alliance records.
"""

from fastapi import APIRouter, Query
from typing import Dict, Any, Optional
from api.services.openrepair_service import OpenRepairAnalysisService

router = APIRouter(tags=["analysis"])
service = OpenRepairAnalysisService()

@router.get("/api/analysis/openrepair/metadata")
@router.get("/api/v1/analysis/openrepair/metadata")
def get_metadata() -> Dict[str, Any]:
    """Returns dataset metadata and processing timestamp."""
    return service.get_dataset_metadata()

@router.get("/api/analysis/openrepair/categories")
@router.get("/api/v1/analysis/openrepair/categories")
def get_categories():
    """Returns all empirical categories with their incident counts and fix rates."""
    return service.get_categories()

@router.get("/api/analysis/openrepair/category/{category_name}")
@router.get("/api/v1/analysis/openrepair/category/{category_name}")
def get_category_stats(category_name: str) -> Dict[str, Any]:
    """Returns detailed empirical statistics for a specific category."""
    stats = service.get_category_stats(category_name)
    if not stats:
        return {"error": f"Category '{category_name}' not found in Open Repair Alliance taxonomy."}
    return stats

@router.get("/api/analysis/openrepair")
@router.get("/api/v1/analysis/openrepair")
def analyze_openrepair(
    category: str = Query("Laptop", description="Device category"),
    description: str = Query("", description="Observed symptoms or failure description"),
    brand: Optional[str] = Query(None, description="Device brand"),
    age: Optional[float] = Query(None, description="Device age in years")
) -> Dict[str, Any]:
    """
    Analyzes symptoms against verified Open Repair Alliance failure mode distributions.
    Returns real statistical percentages and incident counts.
    """
    return service.analyze_symptoms(
        category=category,
        description=description,
        brand=brand,
        age=age
    )
