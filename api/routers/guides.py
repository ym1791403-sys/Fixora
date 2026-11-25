# -*- coding: utf-8 -*-
"""
API Router: Repair Guides
Endpoints for searching, filtering, and retrieving verified repair guides
from the 18,995-guide MyFixit dataset.
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from api.services.myfixit_service import MyFixitGuideRetrievalService
from api.services.translator import translate_repair_text, translate_guide_title_ar, translate_tool_ar

router = APIRouter(tags=["Guides"])
service = MyFixitGuideRetrievalService()

@router.get("/api/guides")
@router.get("/api/guides/")
@router.get("/api/v1/guides")
@router.get("/api/v1/guides/")
def list_guides(
    q: Optional[str] = Query(None, description="Search term for title, summary, or steps"),
    category: Optional[str] = Query(None, description="Device category filter"),
    component: Optional[str] = Query(None, description="Component filter (e.g. Battery, Screen)"),
    difficulty: Optional[str] = Query(None, description="Difficulty level (e.g. Easy, Moderate, Difficult)"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    lang: Optional[str] = Query("en", description="Response localization language (en or ar)")
):
    """
    Search and filter verified repair guides from the MyFixit dataset.
    """
    res = service.search_guides(
        query=q,
        category=category,
        component=component,
        difficulty=difficulty,
        limit=limit,
        offset=offset
    )
    if (lang or "").lower() == "ar":
        for g in res.get("guides") or []:
            g["title_ar"] = translate_guide_title_ar(g.get("title", ""), g.get("component", ""), g.get("device_model", ""))
    return res

@router.get("/api/guides/categories")
@router.get("/api/v1/guides/categories")
def get_categories():
    """Returns all device categories available in the MyFixit dataset and their guide counts."""
    return service.get_categories_summary()

@router.get("/api/guides/{guide_id}")
@router.get("/api/v1/guides/{guide_id}")
def get_guide(guide_id: int, lang: Optional[str] = Query("en")):
    """
    Retrieves full details for a verified guide, including step-by-step instructions,
    required tools, time estimate, and source URL (translated cleanly when lang=ar).
    """
    guide = service.get_guide_by_id(guide_id)
    if not guide:
        raise HTTPException(status_code=404, detail=f"Guide with ID {guide_id} not found in MyFixit dataset.")
    if (lang or "").lower() == "ar":
        guide["title_ar"] = translate_guide_title_ar(guide.get("title", ""), guide.get("component", ""), guide.get("device_model", ""))
        guide["tools_ar"] = [translate_tool_ar(t) for t in (guide.get("required_tools") or guide.get("toolbox") or [])]
        for idx, st in enumerate(guide.get("steps") or []):
            if isinstance(st, dict):
                num = st.get("step_number") or (idx + 1)
                st["title_ar"] = f"الخطوة {num}"
                en_txt = st.get("instruction_en") or ""
                if en_txt:
                    st["instruction_ar"] = translate_repair_text(en_txt, is_incident=False)
    return guide
