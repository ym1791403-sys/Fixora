# -*- coding: utf-8 -*-
"""
Live Device & Verified Repair Guide Image Resolver
Fetches authentic, high-resolution device photos and illustrated teardown steps from:
1. iFixit Official Public API 2.0 (wikis, devices, guides, step images)
2. Wikipedia / Wikimedia Commons public pageimages API
Zero synthetic images; caches results cleanly in memory with strict timeouts.
"""

import json
import time
import urllib.parse
import urllib.request
from typing import Dict, Any, List, Optional

_HTTP_CACHE: Dict[str, Any] = {}
_CACHE_TTL_SEC = 1800

_CATEGORY_FALLBACK_QUERY = {
    "Smartphone": "iPhone",
    "Laptop": "MacBook Pro",
    "Desktop Computer": "Desktop PC",
    "Gaming Console": "PlayStation 5",
    "Smart TV": "Flat Screen Television",
    "Storage": "Hard Disk Drive",
    "Tablet": "iPad",
    "Smartwatch": "Apple Watch",
    "Audio": "Headphones",
    "Camera": "DSLR Camera",
    "Printer": "Inkjet Printer",
    "Home Appliance": "Coffee Maker",
    "Other": "Router Electronics",
}


def _http_get_json(url: str, timeout: float = 4.5) -> Optional[Dict[str, Any]]:
    now = time.time()
    cached = _HTTP_CACHE.get(url)
    if cached and (now - cached[0]) < _CACHE_TTL_SEC:
        return cached[1]
    try:
        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": "ByteForceDiagnostics/4.0 (Hardware Repair Platform)",
                "Accept": "application/json",
            },
        )
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            if resp.status != 200:
                return None
            data = json.loads(resp.read().decode("utf-8") or "{}")
            if len(_HTTP_CACHE) > 256:
                _HTTP_CACHE.clear()
            _HTTP_CACHE[url] = (now, data)
            return data
    except Exception:
        return None


def _ifixit_image(term: str) -> Optional[Dict[str, Any]]:
    """First iFixit Suggest hit with a photo for this exact term, or None."""
    q_enc = urllib.parse.quote(term)
    url = f"https://www.ifixit.com/api/2.0/suggest/{q_enc}?doctypes=device,guide"
    data = _http_get_json(url, timeout=4.0)
    results = (data or {}).get("results") or []
    for r in results:
        img_obj = r.get("image") or {}
        img_url = img_obj.get("standard") or img_obj.get("medium") or img_obj.get("large")
        if img_url and str(img_url).startswith("http"):
            return {
                "image_url": img_url,
                "title": r.get("title") or term,
                "source": "iFixit Public Device Catalog",
            }
    return None


def _wikipedia_image(term: str) -> Optional[Dict[str, Any]]:
    """First Wikimedia Commons thumbnail for this exact term, or None."""
    q_enc = urllib.parse.quote(term)
    url = (
        f"https://en.wikipedia.org/w/api.php?action=query&generator=search"
        f"&gsrsearch={q_enc}&gsrlimit=2&prop=pageimages&pithumbsize=500&format=json"
    )
    data = _http_get_json(url, timeout=4.0)
    pages = ((data or {}).get("query") or {}).get("pages") or {}
    for _, page in pages.items():
        thumb = (page.get("thumbnail") or {}).get("source")
        if thumb and str(thumb).startswith("http"):
            return {
                "image_url": thumb,
                "title": page.get("title") or term,
                "source": "Wikimedia Commons",
            }
    return None


def resolve_device_image(query: str, category: str = "") -> Dict[str, Any]:
    """
    Resolves a real photograph/thumbnail for the exact device searched
    (brand/model from the diagnosis), not for a generic category device.
    Lookup order per device: iFixit, then Wikipedia. The category's canonical
    device (e.g. iPhone for Smartphone, MacBook Pro for Laptop) is only a last
    resort, after the exact device was tried on both sources. This prevents
    every search in a category from showing the same one device photo.
    Returns {"image_url": str|None, "title": str|None, "source": str|None}.
    """
    clean_q = (query or "").strip()
    exact_term = clean_q if len(clean_q) >= 2 else ""
    fallback_term = ""
    if category and category in _CATEGORY_FALLBACK_QUERY:
        fb = _CATEGORY_FALLBACK_QUERY[category]
        if fb.lower() != clean_q.lower():
            fallback_term = fb

    for term in (exact_term, fallback_term):
        if not term:
            continue
        hit = _ifixit_image(term) or _wikipedia_image(term)
        if hit:
            return hit

    return {"image_url": None, "title": None, "source": None}


def fetch_ifixit_live_guide(
    query: str,
    model: str = "",
    brand: str = "",
    component_terms: Optional[List[str]] = None,
    category: str = "",
) -> Optional[Dict[str, Any]]:
    """
    Searches iFixit Public API 2.0 for a genuine modern repair guide matching
    the user's device model + faulty component, returning full steps, tools, and step photos.
    """
    component_terms = component_terms or []
    clean_q = (query or "").strip()
    if len(clean_q) < 2:
        return None

    import re
    model_norm = re.sub(r"\bps\s*(\d+)\b", r"playstation \1", (model or "").lower())
    m_tokens = [tok for tok in re.findall(r"[a-z0-9]+", model_norm) if len(tok) >= 2 or tok.isdigit()]
    d_tokens = [tok for tok in m_tokens if any(ch.isdigit() for ch in tok)]

    queries_to_try = [clean_q]
    if model and component_terms:
        q2 = f"{model} {component_terms[0]}".strip()
        if q2.lower() != clean_q.lower():
            queries_to_try.insert(0, q2)
    if model and model.lower() not in [q.lower() for q in queries_to_try]:
        queries_to_try.append(model.strip())

    ranked_candidates = []
    device_thumb = None

    for q in queries_to_try[:3]:
        url = f"https://www.ifixit.com/api/2.0/suggest/{urllib.parse.quote(q)}?doctypes=guide,device"
        data = _http_get_json(url, timeout=4.5)
        results = (data or {}).get("results") or []
        for r in results:
            dtype = r.get("dataType")
            img_obj = r.get("image") or {}
            if dtype == "wiki" and not device_thumb:
                device_thumb = img_obj.get("standard") or img_obj.get("medium")
            if dtype != "guide" or not r.get("guideid"):
                continue

            title_low = (r.get("title") or "").lower()
            cat_low = (r.get("category") or "").lower()
            subj_low = (r.get("subject") or "").lower()
            hay = f"{title_low} {cat_low} {subj_low}"
            hay_tokens = set(re.findall(r"[a-z0-9]+", hay))
            score = 0

            if m_tokens:
                hits = sum(1 for tok in m_tokens if (tok in hay_tokens if (tok.isdigit() or len(tok) <= 3) else tok in hay))
                digit_ok = all(dtok in hay_tokens for dtok in d_tokens) if d_tokens else True
                if hits == len(m_tokens) and digit_ok:
                    score += 65
                elif hits > 0 and digit_ok:
                    score += hits * 18
                elif d_tokens and not digit_ok:
                    score -= 35
            if brand and brand.lower() in hay:
                score += 18
            for idx, comp in enumerate(component_terms[:4]):
                c_low = comp.lower()
                if c_low in title_low or c_low in subj_low:
                    score += (48 - idx * 6)
                    break
            g_type = (r.get("type") or "").lower()
            if g_type in ("replacement", "teardown", "disassembly"):
                score += 30
            elif g_type == "troubleshooting" or title_low.startswith("how to fix") or "troubleshooting" in title_low:
                score -= 45
            if img_obj.get("standard") or img_obj.get("medium"):
                score += 8

            ranked_candidates.append((score, r))

        if ranked_candidates and max(s for s, _ in ranked_candidates) >= 85:
            break

    if not ranked_candidates:
        return None

    # Deduplicate by guideid and sort descending by score
    dedup = {}
    for sc, item in ranked_candidates:
        gid = item["guideid"]
        if gid not in dedup or sc > dedup[gid][0]:
            dedup[gid] = (sc, item)
    sorted_items = sorted(dedup.values(), key=lambda x: -x[0])

    # Pick highest-scoring guide that actually contains step images (fall back to top if none have images)
    best_guide_item = None
    detail = None
    for _, cand in sorted_items[:3]:
        d = _http_get_json(f"https://www.ifixit.com/api/2.0/guides/{cand['guideid']}", timeout=5.0)
        if not d or not d.get("steps"):
            continue
        has_step_imgs = any(
            isinstance(st, dict) and isinstance(st.get("media"), dict) and bool(st["media"].get("data"))
            for st in d.get("steps", [])
        )
        if best_guide_item is None:
            best_guide_item = cand
            detail = d
        if has_step_imgs:
            best_guide_item = cand
            detail = d
            break

    if not best_guide_item or not detail:
        return None

    guide_id = best_guide_item["guideid"]
    guide_img = (detail.get("image") or {}).get("standard") or (best_guide_item.get("image") or {}).get("standard")
    tools: List[str] = []
    for t in detail.get("tools") or []:
        if isinstance(t, dict):
            name = (t.get("text") or t.get("title") or t.get("type") or "").strip()
            if name:
                tools.append(name)
        elif isinstance(t, str) and t.strip():
            tools.append(t.strip())

    formatted_steps: List[Dict[str, Any]] = []
    for idx, s in enumerate(detail.get("steps") or [], 1):
        if not isinstance(s, dict):
            continue
        lines = s.get("lines") or []
        parts = []
        for ln in lines:
            if isinstance(ln, dict):
                txt = (ln.get("text_raw") or ln.get("text_rendered") or "").strip()
                if txt:
                    parts.append(txt)
        instruction = " ".join(parts).strip()

        imgs: List[str] = []
        media = s.get("media") or {}
        if isinstance(media, dict):
            for m in media.get("data") or []:
                if isinstance(m, dict):
                    img_u = m.get("standard") or m.get("medium") or m.get("large") or m.get("thumbnail")
                    if img_u:
                        imgs.append(img_u)

        if not instruction and not imgs:
            continue

        order_num = s.get("orderby") or idx
        step_title = (s.get("title") or "").strip()
        formatted_steps.append({
            "step_number": int(order_num) if isinstance(order_num, (int, float)) else idx,
            "title_en": step_title or f"Step {idx}",
            "title_ar": step_title or f"الخطوة {idx}",
            "instruction_en": instruction or "Inspect the attached diagram for this step.",
            "instruction_ar": instruction or "راجع الصورة التوضيحية المرفقة لهذه الخطوة.",
            "images": imgs,
        })

    if not formatted_steps:
        return None

    time_req = detail.get("time_required") or ""
    digits = [int(tok) for tok in str(time_req).split() if tok.isdigit()]
    est_mins = digits[0] if digits else max(15, len(formatted_steps) * 3)

    return {
        "id": guide_id,
        "guide_id": guide_id,
        "title": detail.get("title") or best_guide_item.get("title") or "Repair Guide",
        "title_en": detail.get("title") or best_guide_item.get("title") or "Repair Guide",
        "title_ar": detail.get("title") or best_guide_item.get("title") or "دليل الصيانة",
        "file_source": "ifixit_live_api",
        "source": "MyFixit & iFixit Verified Manuals",
        "device_category": category or detail.get("category") or "Hardware",
        "device_model": detail.get("category") or model or "",
        "component": detail.get("subject") or (component_terms[0] if component_terms else "Hardware"),
        "repair_type": detail.get("type") or "Replacement",
        "difficulty": (detail.get("difficulty") or "moderate").lower(),
        "time_required": time_req or f"{est_mins} min",
        "estimated_minutes": est_mins,
        "summary": detail.get("summary") or "",
        "url": detail.get("url") or f"https://www.ifixit.com/Guide/{guide_id}",
        "guide_image_url": guide_img or device_thumb,
        "device_image_url": device_thumb or guide_img,
        "step_count": len(formatted_steps),
        "toolbox": tools,
        "required_tools": tools,
        "steps": formatted_steps,
        "safety_precautions": [
            "Disconnect all power cables and remove batteries before disassembly.",
            "Wear an ESD wrist strap to protect delicate microchips from electrostatic discharge.",
            "Organize screws by size and thread length to avoid logic board damage.",
        ],
    }
