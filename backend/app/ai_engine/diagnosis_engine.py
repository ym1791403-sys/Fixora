"""
TechRepair - Core AI Diagnosis Engine
Coordinates safety triage, NLP symptom extraction, and calibrated cause probability ranking.
"""

from datetime import datetime, timezone
from typing import Dict, Any, List
from app.ai_engine.safety_rules import evaluate_safety_hazards
from app.ai_engine.symptom_extractor import extract_symptoms
from app.ai_engine.repair_kb import find_best_kb_match
from app.schemas.schemas import DiagnosisRequest, DiagnosisResponse, DiagnosisCause, TroubleshootingStep

class DiagnosisEngine:
    def __init__(self):
        pass

    def diagnose(self, req: DiagnosisRequest) -> DiagnosisResponse:
        """
        Executes the full diagnostic pipeline.
        """
        text = req.description
        if req.error_message:
            text += f" Error: {req.error_message}"
        if req.recent_changes:
            text += f" Recent changes: {req.recent_changes}"

        # Stage 1: Safety & Risk Triage
        is_critical, hazard_severity, safety_en, safety_ar = evaluate_safety_hazards(text)

        # Stage 2: Symptom Extraction (NLP)
        extracted_symptoms = extract_symptoms(text)

        # Stage 3: Knowledge Base Matching
        kb_record = find_best_kb_match(extracted_symptoms, req.device_category)

        # Stage 4: Calibration & Severity Adjustment
        final_severity = hazard_severity if is_critical else kb_record["severity"]
        
        # Calculate calibrated confidence score
        # Base confidence adjusted by input detail level
        input_length_factor = min(len(text) / 200.0, 0.1)  # max +0.1 for detailed description
        brand_model_bonus = 0.05 if (req.brand and req.model) else 0.0
        confidence = min(0.96, kb_record["base_confidence"] + input_length_factor + brand_model_bonus)

        # Stage 5: Safety Precedence & Technician Referral
        requires_technician = kb_record["requires_technician"] or is_critical
        tech_reason = None
        if is_critical:
            tech_reason = "Critical electrical or fire hazard requires certified technician inspection with specialized safety gear."
        elif requires_technician:
            tech_reason = "Component-level micro-soldering or board diagnostics required beyond consumer DIY safety limits."

        # Merge safety warnings
        all_warnings_en = list(safety_en) + kb_record.get("safety_warnings_en", [])
        all_warnings_ar = list(safety_ar) + kb_record.get("safety_warnings_ar", [])

        # Format causes
        causes = [
            DiagnosisCause(
                title_en=c["title_en"],
                title_ar=c["title_ar"],
                probability=c["probability"],
                explanation_en=c["explanation_en"],
                explanation_ar=c["explanation_ar"],
                is_hardware=c.get("is_hardware", True)
            ) for c in kb_record["causes"]
        ]

        # Format steps
        steps = [
            TroubleshootingStep(
                step_number=s["step_number"],
                title_en=s["title_en"],
                title_ar=s["title_ar"],
                instruction_en=s["instruction_en"],
                instruction_ar=s["instruction_ar"],
                caution_en=s.get("caution_en"),
                caution_ar=s.get("caution_ar"),
                requires_tools=s.get("requires_tools", False)
            ) for s in kb_record["steps"]
        ]

        return DiagnosisResponse(
            device_category=req.device_category,
            brand=req.brand,
            model=req.model,
            severity=final_severity,
            confidence_score=round(confidence, 2),
            extracted_symptoms=extracted_symptoms,
            possible_causes=causes,
            troubleshooting_steps=steps,
            required_tools=kb_record.get("required_tools", []),
            estimated_difficulty=kb_record.get("estimated_difficulty", "moderate"),
            estimated_minutes=kb_record.get("estimated_minutes", 30),
            safety_warnings_en=all_warnings_en,
            safety_warnings_ar=all_warnings_ar,
            requires_technician=requires_technician,
            technician_recommendation_reason=tech_reason,
            created_at=datetime.now(timezone.utc)
        )

# Global singleton
diagnosis_engine = DiagnosisEngine()
