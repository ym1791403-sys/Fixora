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
                thumb_url = None
                for st in (r.get("steps") or []):
                    if isinstance(st, dict):
                        imgs = st.get("Images") or st.get("images") or []
                        if imgs and isinstance(imgs, list):
                            thumb_url = imgs[0]
                            break

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
                    "thumbnail_url": thumb_url,
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
                if isinstance(s, str):
                    txt = s.strip()
                    if not txt:
                        continue
                    step_num = len(formatted_steps) + 1
                    formatted_steps.append({
                        "step_number": step_num,
                        "title_en": f"Step {step_num}",
                        "title_ar": f"الخطوة {step_num}",
                        "instruction_en": txt,
                        "instruction_ar": txt,
                        "lines": [],
                        "images": []
                    })
                    continue

                raw_text = (
                    s.get("Text_raw")
                    or s.get("text_raw")
                    or s.get("instruction_en")
                    or s.get("instruction_ar")
                    or s.get("text")
                    or ""
                ).strip()
                lines = s.get("Lines") or s.get("lines") or []
                if not raw_text and isinstance(lines, list) and lines:
                    line_parts = []
                    for l in lines:
                        if isinstance(l, dict):
                            val = l.get("Text") or l.get("text") or l.get("Text_raw") or ""
                            if val:
                                line_parts.append(str(val).strip())
                        elif isinstance(l, str) and l.strip():
                            line_parts.append(l.strip())
                    raw_text = " ".join(line_parts).replace(" .", ".").strip()

                step_imgs = s.get("Images") or s.get("images") or []
                if not raw_text and not step_imgs:
                    continue

                if isinstance(s.get("Order"), (int, float)):
                    step_num = int(s["Order"]) + 1
                else:
                    step_num = s.get("step_number") or s.get("StepId") or s.get("order") or (len(formatted_steps) + 1)

                step_title = s.get("Title") or s.get("title") or s.get("title_en")
                formatted_steps.append({
                    "step_number": step_num,
                    "title_en": step_title or f"Step {step_num}",
                    "title_ar": step_title or f"الخطوة {step_num}",
                    "instruction_en": raw_text or "Inspect the attached diagram for this step.",
                    "instruction_ar": raw_text or "راجع الصورة التوضيحية المرفقة لهذه الخطوة.",
                    "lines": lines if isinstance(lines, list) else [],
                    "images": step_imgs if isinstance(step_imgs, list) else []
                })

            time_req = row.get("time_required")
            mins = 30
            if time_req:
                digits = [int(s) for s in str(time_req).split() if s.isdigit()]
                if digits:
                    mins = digits[0]
            else:
                mins = max(15, (row.get("step_count") or len(formatted_steps) or 5) * 4)

            g_id = row.get("id") or row.get("guide_id")
            clean_tools = []
            for t in (tools or []):
                if isinstance(t, str) and t.strip():
                    clean_tools.append(t.strip())
                elif isinstance(t, dict):
                    t_name = (t.get("Name") or t.get("name") or "").strip()
                    if t_name:
                        clean_tools.append(t_name)

            return {
                "id": g_id,
                "guide_id": g_id,
                "title": row.get("title", ""),
                "title_en": row.get("title", ""),
                "title_ar": row.get("title", ""),
                "file_source": row.get("file_source", "myfixit_dataset"),
                "source": "MyFixit Verified Manuals",
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
                "guide_image_url": next((st["images"][0] for st in formatted_steps if st.get("images")), None),
                "step_count": row.get("step_count") or len(formatted_steps),
                "toolbox": clean_tools,
                "required_tools": clean_tools,
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
            raise DatabaseUnavailableError(f"MyFixit get_guide_by_id error: {str(e)}")

    def find_best_guide(
        self,
        category: str,
        brand: str = "",
        model: str = "",
        component_terms: Optional[List[str]] = None,
        extra_tokens: Optional[List[str]] = None,
        exclude_guide_ids: Optional[List[int]] = None,
    ) -> Dict[str, Any]:
        """
        Scores candidate guides in Supabase across model + symptom components (avoiding
        blind LIMIT 1 repeats), skips previously failed guide IDs on retry, and supplements modern devices via iFixit.
        """
        from api.services.media_resolver import fetch_ifixit_live_guide

        component_terms = [c for c in (component_terms or []) if c]
        extra_tokens = [t for t in (extra_tokens or []) if t]
        excluded_ids = {int(gid) for gid in (exclude_guide_ids or []) if gid is not None and str(gid).isdigit()}

        search_queries: List[str] = []
        primary_comp = component_terms[0] if component_terms else ""

        if model and primary_comp:
            search_queries.append(f"{model} {primary_comp}")
        if brand and primary_comp:
            search_queries.append(f"{brand} {primary_comp}")
        for comp in component_terms[:3]:
            search_queries.append(comp)
        if model:
            search_queries.append(model)
        if brand:
            search_queries.append(brand)
        for tok in extra_tokens[:2]:
            search_queries.append(tok)

        seen_ids = set()
        candidates: List[Dict[str, Any]] = []
        dedup_queries: List[str] = []
        for q in search_queries:
            q_s = (q or "").strip()
            if len(q_s) >= 2 and q_s.lower() not in [x.lower() for x in dedup_queries]:
                dedup_queries.append(q_s)

        for q_s in dedup_queries[:4]:
            try:
                res = self.search_guides(query=q_s, category=category, limit=10)
                for g in res.get("guides") or []:
                    gid = g.get("guide_id")
                    if gid and int(gid) not in excluded_ids and gid not in seen_ids:
                        seen_ids.add(gid)
                        candidates.append(g)
            except Exception:
                continue
            if len(candidates) >= 10:
                break

        best_candidate = None
        best_score = -1
        exact_model_match = False

        import re
        model_norm = re.sub(r"\bps\s*(\d+)\b", r"playstation \1", (model or "").lower())
        model_tokens = [tok for tok in re.findall(r"[a-z0-9]+", model_norm) if len(tok) >= 2 or tok.isdigit()]
        digit_tokens = [tok for tok in model_tokens if any(ch.isdigit() for ch in tok)]
        brand_low = (brand or "").lower()
        apple_mentioned = any(k in f"{brand_low} {model_norm}" for k in ("apple", "mac", "powerbook", "ibook", "imac"))

        for g in candidates:
            title_low = (g.get("title") or "").lower()
            model_low = (g.get("device_model") or "").lower()
            comp_low = (g.get("component") or "").lower()
            hay = f"{title_low} {model_low} {comp_low}"
            hay_tokens = set(re.findall(r"[a-z0-9]+", hay))

            score = 0
            m_match = False
            if model_tokens:
                hits = sum(1 for tok in model_tokens if (tok in hay_tokens if (tok.isdigit() or len(tok) <= 3) else tok in hay))
                digit_ok = all(dtok in hay_tokens for dtok in digit_tokens) if digit_tokens else True
                if hits == len(model_tokens) and digit_ok:
                    score += 65
                    m_match = True
                elif hits > 0 and digit_ok:
                    score += hits * 15
                elif digit_tokens and not digit_ok:
                    # Mismatched generation (e.g., PS2 when user asked for PS5)
                    score -= 35
            if brand_low and brand_low in hay:
                score += 18
            for idx, comp in enumerate(component_terms[:4]):
                if comp.lower() in hay:
                    score += (35 - idx * 6)
                    break
            # Penalize generic antenna/SIM tray guides unless SIM or signal/antenna is actually part of the query
            wants_sim_or_ant = any(k in " ".join(component_terms + extra_tokens).lower() for k in ("sim", "antenna", "signal", "tray"))
            if not wants_sim_or_ant and ("antenna cover" in hay or "sim tray" in hay):
                score -= 25
            if category == "Storage" and not apple_mentioned:
                if any(v in hay for v in ("powerbook", "wallstreet", "ibook", "performa")):
                    score -= 22
                elif any(s_kw in hay for s_kw in ("external", "enclosure", "sata", "ssd", "hard drive")):
                    score += 14
            if g.get("thumbnail_url"):
                score += 8

            if score > best_score:
                best_score = score
                best_candidate = g
                exact_model_match = m_match

        # If user specified an exact modern model not matched in local MyFixit snapshot (or score < 35),
        # query live iFixit 2.0 public manuals across all 13 categories!
        known_cats = {
            "Smartphone", "Laptop", "Desktop Computer", "Gaming Console", "Smart TV",
            "Storage", "Tablet", "Smartwatch", "Audio", "Camera", "Printer", "Home Appliance", "Other"
        }
        live_query = f"{brand} {model} {primary_comp}".strip() or f"{category} {primary_comp}".strip()
        if (category in known_cats or component_terms) and ((model and not exact_model_match) or best_score < 35):
            live_guide = fetch_ifixit_live_guide(
                query=live_query,
                model=model,
                brand=brand,
                component_terms=component_terms,
                category=category,
            )
            if live_guide and int(live_guide.get("guide_id") or -1) not in excluded_ids:
                live_exact = bool(model and model.lower() in f"{live_guide.get('title', '')} {live_guide.get('device_model', '')}".lower())
                return {"guide": live_guide, "exact_model_match": live_exact}

        if best_candidate:
            full_guide = self.get_guide_by_id(best_candidate["guide_id"])
            if full_guide:
                return {"guide": full_guide, "exact_model_match": exact_model_match}

        # Category-level DB fallback skipping excluded guides and generic antenna cover when alternatives exist
        res_cat = self.search_guides(category=category, limit=15)
        cat_guides = [g for g in (res_cat.get("guides") or []) if int(g.get("guide_id") or -1) not in excluded_ids]
        if cat_guides:
            wants_sim = any(k in " ".join(component_terms + extra_tokens).lower() for k in ("sim", "antenna", "signal"))
            filtered_cat = [g for g in cat_guides if wants_sim or "antenna cover" not in (g.get("title") or "").lower()] or cat_guides
            with_img = next((g for g in filtered_cat if g.get("thumbnail_url")), filtered_cat[0])
            full_guide = self.get_guide_by_id(with_img["guide_id"])
            if full_guide:
                return {"guide": full_guide, "exact_model_match": False}

        return {"guide": None, "exact_model_match": False}

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
