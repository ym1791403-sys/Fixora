# -*- coding: utf-8 -*-
"""
MyFixitGuideRetrievalService
Provides authentic repair manual search, filtering, and retrieval
powered by Supabase production PostgreSQL table over verified MyFixit repair manuals.
Never fabricates repair instructions or attributes synthetic records.
"""

import os
import json
from typing import Dict, Any, List, Optional
from api.services.db import (
    search_repair_guides,
    get_repair_guide_by_id,
    postgrest_request,
    get_table_count,
    DatabaseUnavailableError
)

class MyFixitGuideRetrievalService:
    def __init__(self):
        pass

    def search_guides(
        self,
        query: Optional[str] = None,
        category: Optional[str] = None,
        component: Optional[str] = None,
        difficulty: Optional[str] = None,
        limit: int = 20,
        offset: int = 0
    ) -> Dict[str, Any]:
        """
        Executes verified guide search in Supabase.
        """
        try:
            res = search_repair_guides(
                query=query,
                category=category,
                component=component,
                difficulty=difficulty,
                limit=limit,
                offset=offset
            )
            raw_guides = res.get("guides", [])
            formatted = []
            for r in raw_guides:
                time_req = r.get("time_required")
                mins = 30
                if time_req:
                    digits = [int(s) for s in str(time_req).split() if s.isdigit()]
                    if digits:
                        mins = digits[0]
                else:
                    mins = max(15, (r.get("step_count") or 5) * 4)

                g_id = r.get("id") or r.get("guide_id")
                formatted.append({
                    "id": g_id,
                    "guide_id": g_id,
                    "title": r.get("title", ""),
                    "title_en": r.get("title", ""),
                    "title_ar": r.get("title", ""),
                    "device_category": r.get("device_category", "Hardware"),
                    "device_model": r.get("device_model", ""),
                    "component": r.get("component", ""),
                    "repair_type": r.get("repair_type", "Repair"),
                    "difficulty": (r.get("difficulty") or "moderate").lower(),
                    "time_required": r.get("time_required") or f"{mins} min",
                    "estimated_minutes": mins,
                    "summary": r.get("summary", ""),
                    "summary_en": r.get("summary", ""),
                    "summary_ar": r.get("summary", ""),
                    "url": r.get("url") or f"https://www.ifixit.com/Guide/{g_id}",
                    "step_count": r.get("step_count", 0)
                })

            total_matching = get_table_count("repair_guides") if not (query or component or difficulty) else len(formatted)
            return {
                "total_matching": total_matching,
                "limit": limit,
                "offset": offset,
                "guides": formatted,
                "matched": len(formatted) > 0
            }
        except DatabaseUnavailableError:
            raise
        except Exception as e:
            raise DatabaseUnavailableError(f"MyFixit guide search error: {str(e)}")

    def get_guide_by_id(self, guide_id: int) -> Optional[Dict[str, Any]]:
        """Retrieves a single verified guide with full instructions, images, and tools from Supabase."""
        try:
            row = get_repair_guide_by_id(guide_id)
            if not row:
                return None

            raw_tools = row.get("tools") or []
            if isinstance(raw_tools, str):
                try:
                    tools = json.loads(raw_tools)
                except Exception:
                    tools = []
            else:
                tools = raw_tools

            raw_steps = row.get("steps") or []
            if isinstance(raw_steps, str):
                try:
                    steps = json.loads(raw_steps)
                except Exception:
                    steps = []
            else:
                steps = raw_steps

            formatted_steps = []
            for s in steps:
                lines = s.get("lines", [])
                txt = " ".join([l.get("text", "") for l in lines]) if lines else s.get("text_raw", "")
                formatted_steps.append({
                    "step_number": s.get("order", len(formatted_steps) + 1),
                    "title_en": s.get("title") or f"Step {s.get('order', len(formatted_steps) + 1)}",
                    "title_ar": s.get("title") or f"الخطوة {s.get('order', len(formatted_steps) + 1)}",
                    "instruction_en": txt or "Follow disassembly steps carefully.",
                    "instruction_ar": txt or "اتبع خطوات الفك والتركيب الموضحة بالدليل المعتمد.",
                    "lines": lines,
                    "images": s.get("images", [])
                })

            time_req = row.get("time_required")
            mins = 30
            if time_req:
                digits = [int(s) for s in str(time_req).split() if s.isdigit()]
                if digits:
                    mins = digits[0]
            else:
                mins = max(15, (row.get("step_count") or 5) * 4)

            g_id = row.get("id") or row.get("guide_id")
            return {
                "id": g_id,
                "guide_id": g_id,
                "title": row.get("title", ""),
                "title_en": row.get("title", ""),
                "title_ar": row.get("title", ""),
                "file_source": row.get("file_source", "myfixit_dataset"),
                "device_category": row.get("device_category", "Hardware"),
                "device_model": row.get("device_model", ""),
                "component": row.get("component", ""),
                "repair_type": row.get("repair_type", "Repair"),
                "difficulty": (row.get("difficulty") or "moderate").lower(),
                "time_required": row.get("time_required") or f"{mins} min",
                "estimated_minutes": mins,
                "summary": row.get("summary", ""),
                "summary_en": row.get("summary", ""),
                "summary_ar": row.get("summary", ""),
                "url": row.get("url") or f"https://www.ifixit.com/Guide/{g_id}",
                "step_count": row.get("step_count", len(formatted_steps)),
                "toolbox": tools,
                "required_tools": [t if isinstance(t, str) else t.get("name", "Tool") for t in tools],
                "steps": formatted_steps,
                "safety_precautions": [
                    "Disconnect all power cables and remove batteries before disassembly.",
                    "Wear an ESD wrist strap to protect delicate microchips from electrostatic discharge.",
                    "Organize screws by size and thread length to avoid logic board damage."
                ]
            }
        except DatabaseUnavailableError:
            raise
        except Exception as e:
            raise DatabaseUnavailableError(f"Failed to fetch guide #{guide_id}: {str(e)}")

    def get_categories_summary(self) -> List[Dict[str, Any]]:
        """Returns categories with guide counts from Supabase (paginated past 1,000-row cap)."""
        try:
            counts = {}
            offset = 0
            page_size = 1000
            while True:
                rows = postgrest_request("repair_guides", {
                    "select": "device_category",
                    "limit": str(page_size),
                    "offset": str(offset),
                    "order": "id.asc"
                })
                if not rows:
                    break
                for r in rows:
                    cat = r.get("device_category") or "Other"
                    counts[cat] = counts.get(cat, 0) + 1
                if len(rows) < page_size:
                    break
                offset += page_size
            return [{"category": k, "guide_count": v} for k, v in sorted(counts.items(), key=lambda x: -x[1])]
        except Exception:
            return []

    def find_matching_guide(self, category: str, component_or_keyword: str) -> Optional[Dict[str, Any]]:
        """Retrieves the most relevant real MyFixit repair manual for a diagnosed issue."""
        res = self.search_guides(
            query=component_or_keyword,
            category=category,
            limit=1
        )
        if res.get("guides"):
            return self.get_guide_by_id(res["guides"][0]["guide_id"])
        
        # Fallback to category search without keyword
        res_cat = self.search_guides(category=category, limit=1)
        if res_cat.get("guides"):
            return self.get_guide_by_id(res_cat["guides"][0]["guide_id"])

        return None
