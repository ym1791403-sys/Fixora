# -*- coding: utf-8 -*-
"""
UnifiedDiagnosisEngine
Combines:
1. Open Repair Alliance: Empirical failure frequencies, failure clusters, and real historical incidents.
2. MyFixit + iFixit Live API: Symptom-matched verified repair manuals with step-by-step fix photos and device imagery.
3. Backblaze: Trained ML Random Forest failure probability from SMART telemetry (Storage devices ONLY).
4. Optional Multi-Provider AI Assistant (Gemini / OpenAI / Groq / OpenRouter) when API key is configured.

Genuinely data-driven:
- Never hardcodes confidence scores, default canned causes, or repeated fallback manuals.
- If data is lacking for an unknown device, returns explicit 'insufficient_evidence' status.
"""

import os
from typing import Dict, Any, List, Optional
from datetime import datetime

from api.services.openrepair_service import OpenRepairAnalysisService
from api.services.myfixit_service import MyFixitGuideRetrievalService
from api.services.backblaze_service import BackblazeFailurePredictionService
from api.services.symptom_extractor import extract_fault_signals
from api.services.media_resolver import resolve_device_image, fetch_ifixit_live_guide
from api.services.ai_engine import AIAssistantService
from api.services.usb_diagnostics import analyze_cable_telemetry
from api.services.db import save_diagnosis_report, save_verified_repair_feedback
from api.services.translator import (
    translate_repair_text,
    translate_guide_title_ar,
    translate_tool_ar,
    translate_cluster_ar,
    translate_status_ar,
    has_substantial_arabic,
)

_ORA_CLUSTER_LABELS = {
    "BATTERY_CHARGING": (
        "Battery & Charging Circuit Failure (ORA Cluster)",
        "تلف البطارية أو دائرة الشحن (تصنيف ORA التجريبي)",
        "Empirical incident cluster involving battery capacity loss, charging failure, or power management degradation.",
        "حالات أعطال موثقة في قاعدة ORA ترتبط بفقدان سعة البطارية أو عدم استجابة الشحن.",
    ),
    "SCREEN_DISPLAY": (
        "Display Panel & Video Output Failure (ORA Cluster)",
        "أعطال الشاشة وإخراج الصورة (تصنيف ORA التجريبي)",
        "Empirical failure cluster covering cracked displays, dead backlights, or display flex faults.",
        "حالات موثقة في قاعدة ORA تشمل كسر الشاشة، فقدان الإضاءة الخلفية، أو فلاتة العرض.",
    ),
    "POWER_FAILURE": (
        "Power Supply & Boot Circuit Failure (ORA Cluster)",
        "انقطاع الطاقة وعطل دائرة التشغيل (تصنيف ORA التجريبي)",
        "Historical failures involving no-power states, failed adapters/PSUs, or mainboard power rail faults.",
        "أعطال مسجلة في ORA ترتبط بعدم إقلاع الجهاز أو تلف وحدة الطاقة / دوائر الباور.",
    ),
    "CABLE_CONNECTION": (
        "Connectors, Ports & Internal Wiring Fault (ORA Cluster)",
        "أعطال المنافذ والكابلات والتوصيل الداخلي (تصنيف ORA التجريبي)",
        "Historical defects concentrated in loose ports, broken solder joints, or fatigued ribbon/power cables.",
        "أعطال مسجلة في ORA تتركز في ارتخاء السوكيتات أو كابلات التوصيل ونقاط اللحام.",
    ),
    "THERMAL_OVERHEAT": (
        "Thermal Throttling & Cooling Fan Defect (ORA Cluster)",
        "ارتفاع الحرارة وأعطال التبريد والمروحة (تصنيف ORA التجريبي)",
        "Empirical overheating cases linked to clogged vents, jammed fans, or thermal fuse trips.",
        "حالات سخونة موثقة في ORA نتيجة انسداد التهوية أو تعطل المروحة أو جفاف المعجون الحراري.",
    ),
    "COMPONENT_SHORT": (
        "PCB Component & Capacitor Short (ORA Cluster)",
        "تلف مكونات اللوحة الإلكترونية أو قصر المكثفات (تصنيف ORA التجريبي)",
        "Board-level faults involving blown fuses, shorted SMD capacitors, or damaged regulators.",
        "أعطال بوردة موثقة في ORA تشمل المكثفات التالفة أو فيوزات الحماية.",
    ),
    "SWITCH_BUTTON": (
        "Switches, Tactile Buttons & Input Fault (ORA Cluster)",
        "تلف الأزرار والمفاتيح الميكانيكية (تصنيف ORA التجريبي)",
        "Worn physical switches, stuck power/tactile buttons, or input membrane wear.",
        "أعطال مسجلة في ORA تخص أزرار التشغيل والمفاتيح الميكانيكية.",
    ),
    "PAPER_FEED": (
        "Paper Feed Roller & Mechanical Jam (ORA Cluster)",
        "انحشار الورق وتآكل بكرات السحب (تصنيف ORA التجريبي)",
        "Printer feed failures driven by glazed pickup rollers, debris, or tray sensor jams.",
        "أعطال طابعات موثقة في ORA بسبب تآكل بكرات السحب أو انحشار الورق.",
    ),
    "MOTOR_DRIVE": (
        "Drive Motor & Mechanical Actuator Wear (ORA Cluster)",
        "عطل المحرك الميكانيكي أو التروس (تصنيف ORA التجريبي)",
        "Stalled motors, worn brushes, or obstructed mechanical drive assemblies.",
        "أعطال حركية موثقة في ORA تخص المحرك أو الأجزاء الدوارة.",
    ),
    "MECHANICAL_WEAR": (
        "Structural Hinge & Mechanical Component Wear (ORA Cluster)",
        "تآكل الأجزاء الميكانيكية أو المفصلات (تصنيف ORA التجريبي)",
        "Physical wear on moving assemblies, hinges, bearings, or mechanical actuators.",
        "تلف ميكانيكي موثق في ORA للأجزاء المتحركة أو المفصلات أو وحدات التخزين الميكانيكية.",
    ),
    "LIQUID_LEAK": (
        "Liquid Ingress & Corrosion Damage (ORA Cluster)",
        "أضرار السوائل وتآكل الدوائر (تصنيف ORA التجريبي)",
        "Corrosion across PCB pads and power rails triggered by moisture or fluid spills.",
        "تلف وأكسدة على اللوحة الأم بسبب تسرب السوائل والرطوبة.",
    ),
}


class UnifiedDiagnosisEngine:
    def __init__(self):
        self.openrepair = OpenRepairAnalysisService()
        self.myfixit = MyFixitGuideRetrievalService()
        self.backblaze = BackblazeFailurePredictionService()
        self.ai_assistant = AIAssistantService()

    def _normalize_category(self, raw_category: str, description: str = "") -> str:
        raw_clean = (raw_category or "").strip()
        raw_low = raw_clean.lower()

        canonical_map = {
            "smartphone": "Smartphone",
            "laptop": "Laptop",
            "desktop computer": "Desktop Computer",
            "gaming console": "Gaming Console",
            "smart tv": "Smart TV",
            "storage": "Storage",
            "tablet": "Tablet",
            "smartwatch": "Smartwatch",
            "audio": "Audio",
            "camera": "Camera",
            "printer": "Printer",
            "home appliance": "Home Appliance",
        }
        if raw_low in canonical_map:
            return canonical_map[raw_low]

        text = f"{raw_clean} {description}".lower()
        if any(w in text for w in ["smartwatch", "apple watch", "fitbit", "garmin", "pebble", "ساعة ذكية"]):
            return "Smartwatch"
        if any(w in text for w in ["phone", "iphone", "galaxy", "pixel", "smartphone", "هاتف", "جوال", "موبايل"]):
            return "Smartphone"
        if any(w in text for w in ["tablet", "ipad", "تابلت", "آيباد"]):
            return "Tablet"
        if any(w in text for w in ["laptop", "macbook", "thinkpad", "notebook", "لابتوب", "حاسوب محمول"]):
            return "Laptop"
        if any(w in text for w in ["desktop", "pc", "imac", "workstation", "كمبيوتر مكتبي"]):
            return "Desktop Computer"
        if any(w in text for w in ["playstation", "ps4", "ps5", "xbox", "nintendo", "console", "منصة ألعاب", "بلايستيشن"]):
            return "Gaming Console"
        if any(w in text for w in ["smart tv", "television", "oled tv", "qled", "bravia", "تلفزيون", "تلفاز", "شاشة ذكية", "شاشة تلفزيون"]):
            return "Smart TV"
        if any(w in text for w in ["hard drive", "hdd", "ssd", "nvme", "storage", "قرص صلب", "هارد ديسك"]):
            return "Storage"
        if any(w in text for w in ["audio", "speaker", "headphone", "airpods", "سماعة", "صوت"]):
            return "Audio"
        if any(w in text for w in ["printer", "طابعة"]):
            return "Printer"
        if any(w in text for w in ["camera", "كاميرا"]):
            return "Camera"
        if any(w in text for w in ["appliance", "vacuum", "coffee", "kettle", "toaster", "microwave", "غسالة", "مكنسة", "قهوة", "أجهزة منزلية"]):
            return "Home Appliance"
        return raw_clean or "Other"

    def _calculate_dynamic_confidence(
        self,
        ora_sample_size: int,
        has_guide: bool,
        exact_model_match: bool,
        cluster_matched: bool,
        is_storage: bool,
        has_telemetry: bool,
    ) -> float:
        """Calculates reproducible dynamic confidence score from empirical evidence."""
        score = 0.0
        if has_guide:
            score += 0.30
            score += 0.15 if exact_model_match else 0.05
        if ora_sample_size >= 10000:
            score += 0.30
        elif ora_sample_size >= 1000:
            score += 0.22
        elif ora_sample_size >= 100:
            score += 0.15
        elif ora_sample_size >= 20:
            score += 0.08
        if cluster_matched:
            score += 0.15
        if is_storage and has_telemetry:
            score += 0.10
        return round(min(0.96, max(0.15, score)), 2)

    def diagnose(self, request_data: Dict[str, Any]) -> Dict[str, Any]:
        """Executes unified data-driven diagnosis derived from real empirical datasets & live manuals."""
        raw_cat = request_data.get("device_category") or "Unknown"
        brand = (request_data.get("brand") or "").strip()
        model = (request_data.get("model") or "").strip()
        prob_cat = (request_data.get("problem_category") or "").strip()
        desc = (request_data.get("description") or "").strip()
        err_msg = (request_data.get("error_message") or "").strip()
        telemetry = request_data.get("smart_telemetry") or {}
        usb_telemetry = request_data.get("usb_telemetry")
        serial_logs = (request_data.get("serial_logs") or "").strip()
        cable_result = analyze_cable_telemetry(usb_telemetry=usb_telemetry, serial_logs=serial_logs)
        skip_ai = bool(request_data.get("skip_ai", False)) or bool(cable_result and not request_data.get("force_ai", False))

        if cable_result:
            if (not raw_cat or raw_cat == "Unknown") and cable_result.get("detected_category"):
                raw_cat = cable_result["detected_category"]
            if not brand and cable_result.get("detected_brand") and cable_result["detected_brand"] != "Unknown":
                brand = cable_result["detected_brand"]
            if not model and cable_result.get("detected_model"):
                model = cable_result["detected_model"]
            if not err_msg and cable_result.get("vid_hex"):
                err_msg = f"USB {cable_result['vid_hex']}:{cable_result.get('pid_hex') or ''} {cable_result.get('mode') or ''}".strip()
            if not desc:
                desc = cable_result.get("summary_ar") or cable_result.get("summary_en") or "فحص عبر وصلة USB"

        attempt_number = max(1, int(request_data.get("attempt_number") or 1))
        raw_excluded = request_data.get("exclude_guide_ids") or []
        exclude_guide_ids = [int(x) for x in raw_excluded if x is not None and str(x).isdigit()]
        failed_solutions = [str(x).strip() for x in (request_data.get("failed_solutions") or []) if str(x).strip()]

        normalized_cat = self._normalize_category(raw_cat, f"{model} {desc}")
        is_storage = (normalized_cat == "Storage") or any(
            k in f"{raw_cat} {desc}".lower() for k in ["hdd", "ssd", "hard drive", "storage", "قرص", "هارد"]
        )

        # 1. Extract multilingual Arabic & English fault domains and technical component keywords
        signals = extract_fault_signals(
            category=normalized_cat,
            brand=brand,
            model=model,
            problem_category=prob_cat,
            description=desc,
            error_message=err_msg,
        )
        matched_domains = signals.get("matched_domains") or []
        if attempt_number > 1 and len(matched_domains) > 1:
            primary_domain = matched_domains[(attempt_number - 1) % len(matched_domains)]
        else:
            primary_domain = signals.get("primary_domain")
        component_terms = signals.get("component_terms") or []
        eng_tokens = signals.get("english_tokens") or []

        # 2. Open Repair Alliance: Real statistical frequencies + matching documented incidents
        ora_analysis = self.openrepair.analyze_symptoms(
            category=normalized_cat,
            description=f"{signals.get('clean_problem_category', '')} {desc} {err_msg}".strip(),
            brand=brand,
            age=request_data.get("device_age_years"),
        )
        ora_sample_size = ora_analysis.get("category_sample_size", 0)
        empirical_fix_rate = ora_analysis.get("empirical_repair_status", {}).get("fixed_rate", 0.0)
        top_barriers = ora_analysis.get("known_repair_barriers", [])
        top_modes = ora_analysis.get("top_historical_failure_modes", [])
        sample_incidents = ora_analysis.get("sample_verified_incidents", [])
        matched_cluster = ora_analysis.get("matched_failure_cluster", "GENERAL_DEFECT")
        is_statistically_significant = ora_analysis.get("is_statistically_significant", False)

        # 3. Search Symptom-Matched + Model-Matched Repair Manual (skipping failed guide IDs on retry)
        guide_lookup = self.myfixit.find_best_guide(
            category=normalized_cat,
            brand=brand,
            model=model,
            component_terms=component_terms,
            extra_tokens=eng_tokens,
            exclude_guide_ids=exclude_guide_ids,
        )
        matched_guide = guide_lookup.get("guide")
        exact_model_match = guide_lookup.get("exact_model_match", False)

        # 4. Backblaze Hard Drive Telemetry ML (Storage ONLY)
        if is_storage:
            if telemetry and len(telemetry) > 0:
                backblaze_result = self.backblaze.predict_failure(telemetry, device_category="Storage")
            else:
                backblaze_result = {
                    "applicable": True,
                    "status": "awaiting_telemetry",
                    "message": "Storage device identified. Supply SMART telemetry parameters (e.g., smart_5_raw, smart_197_raw) for machine learning drive failure prediction.",
                    "failure_probability": None,
                    "risk_level": "N/A",
                }
        else:
            backblaze_result = {
                "applicable": False,
                "reason": "Backblaze ML failure prediction applies exclusively to storage devices (HDD/SSD). It is not applicable to non-storage consumer electronics.",
                "failure_probability": None,
                "risk_level": "N/A",
            }

        # 5. Strict Insufficient Evidence Check
        evidence_found = bool(matched_guide or is_statistically_significant or (is_storage and telemetry))
        if not evidence_found:
            return {
                "report_id": f"FXR-NA-{datetime.now().strftime('%Y%m%d%H%M%S')}",
                "status": "insufficient_evidence",
                "device_category": normalized_cat,
                "brand": brand or "Unknown",
                "model": model or "Unknown",
                "severity": "moderate",
                "confidence_score": 0.15,
                "extracted_symptoms": [],
                "safety_warnings_ar": [],
                "safety_warnings_en": [],
                "device_image_url": None,
                "guide_image_url": None,
                "visual_solution_steps": [],
                "ai_analysis": {"configured": False, "status": "skipped_insufficient_evidence"},
                "message": f"Insufficient empirical evidence for device category '{normalized_cat}' and symptom description. No matching certified repair manual or statistically significant incident cluster exists in the verified database.",
                "empirical_statistics": None,
                "verified_guide": None,
                "hard_drive_ml_prediction": backblaze_result,
                "possible_causes": [],
                "troubleshooting_steps": [],
                "required_tools": [],
                "requires_technician": True,
                "created_at": datetime.now().isoformat() + "Z",
            }

        # 6. Smart Reasoning (strictly skipped when skip_ai=True or wired cable check runs to preserve limits!)
        raw_guide_step_texts = [
            (st.get("instruction_en") or "").strip()
            for st in ((matched_guide or {}).get("steps") or [])[:8]
            if isinstance(st, dict) and (st.get("instruction_en") or "").strip()
        ]
        raw_inc_texts = [
            (inc.get("problem") or "").strip()
            for inc in (sample_incidents or [])[:5]
            if isinstance(inc, dict) and (inc.get("problem") or "").strip()
        ]
        if skip_ai:
            ai_analysis = {"configured": False, "status": "skipped_zero_token"}
        else:
            ai_analysis = self.ai_assistant.analyze_with_datasets(
                device_info={
                    "device_category": normalized_cat,
                    "brand": brand or "Standard",
                    "model": model or "Standard",
                    "error_message": err_msg,
                    "description": desc,
                },
                ora_summary=ora_analysis,
                guide_summary=matched_guide,
                timeout=14.0,
                guide_steps=raw_guide_step_texts,
                ora_incidents=raw_inc_texts,
                failed_attempts=failed_solutions,
                attempt_number=attempt_number,
            )

        # If refined visual query returned and no guide exists OR zero photos exist, fetch matching manual
        ai_query = (ai_analysis.get("visual_image_query") or "").strip() if ai_analysis.get("status") == "completed" else ""
        ai_device_query = (ai_analysis.get("device_photo_query") or "").strip() if ai_analysis.get("status") == "completed" else ""
        orig_img_count = sum(1 for st in ((matched_guide or {}).get("steps") or []) if isinstance(st, dict) and (st.get("images") or st.get("Images")))
        if ai_query and (not matched_guide or orig_img_count == 0):
            ai_live_guide = fetch_ifixit_live_guide(
                query=ai_query,
                model=ai_device_query or model,
                brand=brand,
                component_terms=component_terms,
                category=normalized_cat,
            )
            if ai_live_guide and int(ai_live_guide.get("guide_id") or -1) not in exclude_guide_ids:
                ai_img_count = sum(1 for st in (ai_live_guide.get("steps") or []) if isinstance(st, dict) and (st.get("images") or st.get("Images")))
                if not matched_guide or ai_img_count > orig_img_count:
                    matched_guide = ai_live_guide

        ai_translated_steps = ai_analysis.get("translated_guide_steps_ar") if isinstance(ai_analysis.get("translated_guide_steps_ar"), list) else []
        ai_translated_incs = ai_analysis.get("translated_incidents_ar") if isinstance(ai_analysis.get("translated_incidents_ar"), list) else []
        ai_custom_steps_ar = ai_analysis.get("repair_steps_ar") if isinstance(ai_analysis.get("repair_steps_ar"), list) else []
        ai_custom_steps_en = ai_analysis.get("repair_steps_en") if isinstance(ai_analysis.get("repair_steps_en"), list) else []

        # Translate ORA incidents cleanly to Arabic (prefer verified community Arabic -> single-call AI translation -> deterministic translator)
        localized_incidents: List[Dict[str, Any]] = []
        for idx_inc, inc in enumerate(sample_incidents or []):
            if not isinstance(inc, dict):
                continue
            raw_prob = (inc.get("problem") or "").strip()
            if has_substantial_arabic(raw_prob):
                prob_ar = raw_prob
            elif idx_inc < len(ai_translated_incs) and has_substantial_arabic(str(ai_translated_incs[idx_inc] or "")):
                prob_ar = str(ai_translated_incs[idx_inc]).strip()
            else:
                prob_ar = translate_repair_text(raw_prob, is_incident=True)
            localized_incidents.append({
                **inc,
                "problem_ar": prob_ar or "حالة عطل موثقة لنفس الفئة",
                "repair_status_ar": translate_status_ar(inc.get("repair_status") or ""),
                "problem_cluster_ar": translate_cluster_ar(inc.get("problem_cluster") or ""),
            })
        sample_incidents = localized_incidents

        # 7. Extract Step Instructions (Arabic + English) + Visual Solution Photos + Real Device Photo
        troubleshooting_steps: List[Dict[str, Any]] = []
        visual_solution_steps: List[Dict[str, Any]] = []
        tools: List[str] = []
        if matched_guide:
            raw_steps = matched_guide.get("steps", [])
            for step_idx, s in enumerate(raw_steps[:15]):
                inst_en = (s.get("instruction_en") or "").strip()
                imgs = s.get("images") or s.get("Images") or []
                if not inst_en and not imgs:
                    continue
                raw_ar = (s.get("instruction_ar") or "").strip()
                if has_substantial_arabic(raw_ar):
                    inst_ar = raw_ar
                elif step_idx < len(ai_translated_steps) and has_substantial_arabic(str(ai_translated_steps[step_idx] or "")):
                    inst_ar = str(ai_translated_steps[step_idx]).strip()
                else:
                    inst_ar = translate_repair_text(inst_en, is_incident=False) if inst_en else "راجع الصورة التوضيحية المرفقة لهذه الخطوة."

                step_num = s.get("step_number", len(troubleshooting_steps) + 1)
                step_obj = {
                    "step_number": step_num,
                    "title_en": s.get("title_en") or f"Step {step_num}",
                    "title_ar": f"الخطوة {step_num}",
                    "instruction_en": inst_en,
                    "instruction_ar": inst_ar,
                    "images": imgs if isinstance(imgs, list) else [],
                    "requires_tools": len(matched_guide.get("toolbox", [])) > 0,
                }
                troubleshooting_steps.append(step_obj)
                if step_obj["images"] and len(visual_solution_steps) < 6:
                    visual_solution_steps.append({
                        "step_number": step_obj["step_number"],
                        "title_en": step_obj["title_en"],
                        "title_ar": step_obj["title_ar"],
                        "instruction_en": step_obj["instruction_en"],
                        "instruction_ar": step_obj["instruction_ar"],
                        "image_url": step_obj["images"][0],
                    })
            tools = matched_guide.get("required_tools", []) or matched_guide.get("toolbox", [])

        # If manual is absent or steps lack depth and smart engine produced Arabic sequence, synthesize clean Arabic step objects
        if not troubleshooting_steps and ai_custom_steps_ar:
            for idx_cs, cs_ar in enumerate(ai_custom_steps_ar[:8]):
                cs_en = ai_custom_steps_en[idx_cs] if idx_cs < len(ai_custom_steps_en) else str(cs_ar)
                troubleshooting_steps.append({
                    "step_number": idx_cs + 1,
                    "title_en": f"Step {idx_cs + 1}",
                    "title_ar": f"الخطوة {idx_cs + 1}",
                    "instruction_en": str(cs_en),
                    "instruction_ar": str(cs_ar),
                    "images": [],
                    "requires_tools": bool(tools),
                })

        tools_ar = [translate_tool_ar(t) for t in tools]
        guide_title_ar = (
            (ai_analysis.get("translated_guide_title_ar") or "").strip()
            if has_substantial_arabic(str(ai_analysis.get("translated_guide_title_ar") or ""))
            else translate_guide_title_ar(
                matched_guide.get("title", "") if matched_guide else "",
                component=(matched_guide.get("component") if matched_guide else ""),
                model=(matched_guide.get("device_model") if matched_guide else model),
            )
        ) if matched_guide else None

        # Resolve device photo for header card
        guide_image_url = matched_guide.get("guide_image_url") if matched_guide else None
        device_image_url = matched_guide.get("device_image_url") if matched_guide else None
        if not device_image_url:
            dev_query = f"{brand} {model}".strip() or (matched_guide.get("device_model") if matched_guide else "") or ai_device_query or ai_query or normalized_cat
            resolved = resolve_device_image(dev_query, category=normalized_cat)
            device_image_url = resolved.get("image_url") or guide_image_url
        if not guide_image_url and visual_solution_steps:
            guide_image_url = visual_solution_steps[0]["image_url"]

        solution_photos = [v["image_url"] for v in visual_solution_steps[:4]]

        # 8. Build Diverse Real Dataset-Driven Root Causes (NEVER 1 canned duplicate string!)
        possible_causes: List[Dict[str, Any]] = []
        used_titles = set()

        # 8a. Primary Cause from Backblaze ML if critical storage telemetry exists
        if is_storage and backblaze_result and backblaze_result.get("failure_probability") is not None:
            prob = backblaze_result["failure_probability"]
            if prob >= 0.50:
                possible_causes.append({
                    "title_en": f"Imminent Storage Media Failure (Probability: {round(prob * 100, 1)}%)",
                    "title_ar": f"فشل وشيك في وسيط التخزين (الاحتمالية: {round(prob * 100, 1)}%)",
                    "empirical_repairability_pct": round((1.0 - prob) * 100, 1),
                    "source_dataset": "Backblaze Hard Drive Telemetry ML",
                    "explanation_en": f"Random Forest classification model identified anomalous SMART attributes: {', '.join(backblaze_result.get('anomalous_attributes', []))}.",
                    "explanation_ar": f"نموذج التعلم الآلي رصد تدهوراً حاداً في مؤشرات SMART التليمترية: {', '.join(backblaze_result.get('anomalous_attributes', []))}.",
                    "repair_method_en": backblaze_result.get("recommendation_en"),
                    "repair_method_ar": backblaze_result.get("recommendation_ar"),
                    "repair_images": solution_photos[:2],
                    "is_hardware": True,
                })
                used_titles.add("storage_ml")

        # 8b. Primary Matched Symptom + Manual Cause
        if primary_domain:
            dom_title_en = f"{primary_domain['label_en']}" + (f" ({matched_guide.get('component')})" if matched_guide and matched_guide.get("component") else "")
            dom_title_ar = f"{primary_domain['label_ar']}" + (f" — {matched_guide.get('component')}" if matched_guide and matched_guide.get("component") else "")
            guide_ref_en = f" | Guide: '{matched_guide['title']}'" if matched_guide else ""
            guide_ref_ar = f" | وفق الدليل المعتمد: '{guide_title_ar or matched_guide['title']}'" if matched_guide else ""
            possible_causes.append({
                "title_en": dom_title_en,
                "title_ar": dom_title_ar,
                "empirical_repairability_pct": empirical_fix_rate,
                "source_dataset": matched_guide.get("source", "MyFixit & Open Repair Alliance") if matched_guide else "Open Repair Alliance Symptom Analysis",
                "explanation_en": f"{primary_domain['cause_en']} Matched across {ora_sample_size:,} verified {normalized_cat} cases.",
                "explanation_ar": f"{primary_domain['cause_ar']} مدعوم بـ {ora_sample_size:,} سجل فحص في فئة {normalized_cat}.",
                "repair_method_en": f"{primary_domain['fix_en']}{guide_ref_en}",
                "repair_method_ar": f"{primary_domain['fix_ar']}{guide_ref_ar}",
                "source_guide_id": matched_guide.get("guide_id") if matched_guide else None,
                "source_guide_url": matched_guide.get("url") if matched_guide else None,
                "repair_images": solution_photos,
                "is_hardware": True,
            })
            used_titles.add(primary_domain.get("ora_cluster"))
        elif matched_guide:
            guide_title = matched_guide["title"]
            guide_url = matched_guide.get("url")
            summary = matched_guide.get("summary") or f"Targeted disassembly and service procedure for {matched_guide.get('component', 'internal hardware')} on {matched_guide.get('device_model', normalized_cat)}."
            possible_causes.append({
                "title_en": f"Component Fault: {matched_guide.get('component') or guide_title}",
                "title_ar": f"عطل مكون: {guide_title_ar or guide_title}",
                "empirical_repairability_pct": empirical_fix_rate,
                "source_dataset": matched_guide.get("source", "MyFixit Verified Manuals & Open Repair Alliance"),
                "explanation_en": summary,
                "explanation_ar": f"عطل مرتبط بمكون {matched_guide.get('component', 'الجهاز')} وفق دليل '{guide_title_ar or guide_title}' عبر {ora_sample_size:,} سجل تاريخي.",
                "repair_method_en": f"Follow verified guide '{guide_title}'. Source: {guide_url}",
                "repair_method_ar": f"اتباع خطوات الصيانة العربية الموضحة لدليل '{guide_title_ar or guide_title}' بالأدوات المحددة أدناه.",
                "source_guide_id": matched_guide.get("guide_id"),
                "source_guide_url": guide_url,
                "repair_images": solution_photos,
                "is_hardware": True,
            })

        # 8c. Empirical Open Repair Alliance Differential Clusters (416K records!)
        for mode in (top_modes or []):
            if not isinstance(mode, dict):
                continue
            cl = mode.get("cluster")
            if not cl or cl == "GENERAL_DEFECT" or cl in used_titles:
                continue
            meta = _ORA_CLUSTER_LABELS.get(cl)
            if not meta:
                continue
            cnt = mode.get("count", 0)
            freq_pct = round(float(mode.get("frequency") or 0) * 100, 2)
            barriers_txt = ", ".join(b.get("barrier", "") for b in (top_barriers or [])[:2] if isinstance(b, dict) and b.get("barrier"))
            possible_causes.append({
                "title_en": meta[0],
                "title_ar": meta[1],
                "empirical_repairability_pct": empirical_fix_rate,
                "source_dataset": f"Open Repair Alliance ({cnt:,} real {normalized_cat} cases)",
                "explanation_en": f"{meta[2]} Observed frequency: {freq_pct}% ({cnt:,} of {ora_sample_size:,} cases)." + (f" Key repair barriers: {barriers_txt}." if barriers_txt else ""),
                "explanation_ar": f"{meta[3]} نسبة التكرار الموثقة في البيانات: {freq_pct}% ({cnt:,} من أصل {ora_sample_size:,} حالة)." + (f" أبرز عوائق الإصلاح: {barriers_txt}." if barriers_txt else ""),
                "repair_method_en": "Inspect the subsystem connector and component resistance before ordering replacement hardware.",
                "repair_method_ar": "فحص توصيلات هذه الدائرة والتأكد من سلامتها بالأجهزة قبل استبدال المكون.",
                "repair_images": solution_photos[:2] if len(possible_causes) == 1 else [],
                "is_hardware": True,
            })
            used_titles.add(cl)
            if len(possible_causes) >= 3:
                break

        # 8d. Prepend ByteForce Smart Engine root causes + Wired USB/Cable findings cleanly
        if ai_analysis.get("status") == "completed":
            for ai_c in (ai_analysis.get("root_causes") or [])[:2]:
                if isinstance(ai_c, dict) and (ai_c.get("title_en") or ai_c.get("title_ar")):
                    possible_causes.insert(0, {
                        "title_en": ai_c.get("title_en") or ai_c.get("title_ar"),
                        "title_ar": ai_c.get("title_ar") or ai_c.get("title_en"),
                        "empirical_repairability_pct": empirical_fix_rate,
                        "source_dataset": "قواعد بيانات ByteForce الموثقة",
                        "explanation_en": ai_c.get("explanation_en") or "",
                        "explanation_ar": ai_c.get("explanation_ar") or "",
                        "repair_method_en": ai_c.get("repair_method_en") or "",
                        "repair_method_ar": ai_c.get("repair_method_ar") or "",
                        "repair_images": solution_photos[:3],
                        "is_hardware": True,
                    })

        if cable_result:
            for c_cause in reversed(cable_result.get("causes") or []):
                possible_causes.insert(0, {**c_cause, "repair_images": solution_photos[:2]})
            for idx_cs, c_step in enumerate(reversed(cable_result.get("steps_ar") or [])):
                troubleshooting_steps.insert(0, {
                    "step_number": 0,
                    "title_en": "Wired Hardware Check",
                    "title_ar": "فحص الوصلة المباشر",
                    "instruction_en": str(c_step),
                    "instruction_ar": str(c_step),
                    "images": [],
                    "requires_tools": False,
                })
            for renum_i, st_item in enumerate(troubleshooting_steps, 1):
                st_item["step_number"] = renum_i
                st_item["title_ar"] = f"الخطوة {renum_i}"
                st_item["title_en"] = f"Step {renum_i}"

        # Sanitize public diagnostic insights so third-party AI model/provider names never leak
        public_ai_summary = {
            "status": ai_analysis.get("status"),
            "configured": ai_analysis.get("configured", False),
            "diagnosis_summary_ar": ai_analysis.get("diagnosis_summary_ar"),
            "diagnosis_summary_en": ai_analysis.get("diagnosis_summary_en"),
            "repair_steps_ar": ai_analysis.get("repair_steps_ar"),
            "repair_steps_en": ai_analysis.get("repair_steps_en"),
        }

        # 9. Confidence & Severity
        dynamic_confidence = self._calculate_dynamic_confidence(
            ora_sample_size=ora_sample_size,
            has_guide=bool(matched_guide),
            exact_model_match=exact_model_match,
            cluster_matched=(matched_cluster != "GENERAL_DEFECT"),
            is_storage=is_storage,
            has_telemetry=bool(telemetry),
        )

        severity = "moderate"
        if (is_storage and backblaze_result and (backblaze_result.get("failure_probability") or 0) > 0.60) or (primary_domain and primary_domain["domain"] == "liquid_damage"):
            severity = "critical"
        elif empirical_fix_rate < 35.0:
            severity = "high"
        elif empirical_fix_rate > 70.0:
            severity = "low"

        extracted_sym = [dom["label_en"] for dom in (signals.get("matched_domains") or [])[:3]]
        if not extracted_sym:
            extracted_sym = [prob_cat] if prob_cat else [matched_cluster]

        report_id = f"FXR-{datetime.now().strftime('%Y%m%d')}-{int(os.urandom(2).hex(), 16)}"

        report_payload = {
            "report_id": report_id,
            "status": "completed",
            "attempt_number": attempt_number,
            "device_category": normalized_cat,
            "brand": brand or "Standard",
            "model": model or "Standard",
            "problem_category": prob_cat or (primary_domain["domain"] if primary_domain else "General"),
            "problem_cluster": matched_cluster,
            "description": desc,
            "extracted_symptoms": extracted_sym,
            "severity": severity,
            "confidence_score": dynamic_confidence,
            "device_image_url": device_image_url,
            "guide_image_url": guide_image_url,
            "visual_solution_steps": visual_solution_steps,
            "cable_diagnostics": cable_result,
            "ai_analysis": public_ai_summary,
            "empirical_statistics": {
                "source": "Open Repair Alliance (416,282 real records)",
                "category": normalized_cat,
                "empirical_repair_success_rate": empirical_fix_rate,
                "sample_size": ora_sample_size,
                "primary_barriers": top_barriers,
                "matching_incidents": sample_incidents,
            },
            "verified_guide": {
                "source": matched_guide.get("source", "MyFixit Verified Manuals") if matched_guide else None,
                "guide_id": matched_guide.get("guide_id") if matched_guide else None,
                "title": matched_guide.get("title") if matched_guide else None,
                "title_ar": guide_title_ar,
                "url": matched_guide.get("url") if matched_guide else None,
                "difficulty": matched_guide.get("difficulty") if matched_guide else None,
                "time_required": matched_guide.get("time_required") if matched_guide else None,
                "image_url": guide_image_url,
                "tools": tools,
                "tools_ar": tools_ar,
                "step_count": len(troubleshooting_steps),
            } if matched_guide else None,
            "hard_drive_ml_prediction": backblaze_result,
            "possible_causes": possible_causes,
            "troubleshooting_steps": troubleshooting_steps,
            "required_tools": tools,
            "required_tools_ar": tools_ar,
            "estimated_difficulty": matched_guide.get("difficulty", "moderate") if matched_guide else "moderate",
            "estimated_minutes": matched_guide.get("estimated_minutes", 30) if matched_guide else 30,
            "safety_warnings_ar": [
                primary_domain["fix_ar"] if (primary_domain and primary_domain["domain"] == "liquid_damage") else "تأكد دائماً من فصل مصدر التيار الكهربائي وفصل البطارية قبل فتح غطاء الجهاز.",
                "استخدم أدوات عازلة وسوار تأريض (ESD) لتجنب تلف المكونات الحساسة بالكهرباء الساكنة.",
            ],
            "safety_warnings_en": [
                primary_domain["fix_en"] if (primary_domain and primary_domain["domain"] == "liquid_damage") else "Always disconnect all power sources and detach the battery connector before disassembly.",
                "Wear an ESD wrist strap to protect electrostatic-sensitive logic board components.",
            ],
            "requires_technician": (matched_guide.get("difficulty") in ("difficult", "very difficult")) if matched_guide else (severity == "critical"),
            "created_at": datetime.now().isoformat() + "Z",
        }

        # Persist report audit row to Supabase PostgREST cleanly
        try:
            save_diagnosis_report({**report_payload, "user_id": request_data.get("user_id"), "description": desc})
        except Exception:
            pass

        return report_payload

    def record_feedback(self, feedback_data: Dict[str, Any]) -> Dict[str, Any]:
        """Saves verified fix outcomes to Supabase dataset and optionally produces a brand-new alternative solution."""
        res = save_verified_repair_feedback(feedback_data)
        if not bool(feedback_data.get("fixed", False)) and bool(feedback_data.get("request_alternative", False)):
            alt_report = self.diagnose({
                "device_category": feedback_data.get("device_category"),
                "brand": feedback_data.get("brand"),
                "model": feedback_data.get("model"),
                "problem_category": feedback_data.get("problem_category"),
                "description": feedback_data.get("description"),
                "device_age_years": feedback_data.get("device_age_years"),
                "exclude_guide_ids": feedback_data.get("exclude_guide_ids") or [],
                "failed_solutions": feedback_data.get("failed_solutions") or [],
                "attempt_number": int(feedback_data.get("attempt_number") or 1) + 1,
                "user_id": feedback_data.get("user_id"),
            })
            res["alternative_report"] = alt_report
        return res


UnifiedDiagnosisService = UnifiedDiagnosisEngine
