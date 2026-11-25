# -*- coding: utf-8 -*-
"""
Media & Device Visual Lookup Router
Provides authentic device photographs and visual references across all UI pages.
"""

from fastapi import APIRouter, Query
from typing import Dict, Any
from api.services.media_resolver import resolve_device_image

router = APIRouter(tags=["media"])


@router.get("/api/media/device-image")
@router.get("/api/v1/media/device-image")
def get_device_image(
    q: str = Query("", description="Device brand/model or search term"),
    category: str = Query("", description="Normalized device category"),
) -> Dict[str, Any]:
    return resolve_device_image(query=q, category=category)
