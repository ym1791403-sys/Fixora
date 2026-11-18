"""
TechRepair - Safety Rules Engine
Deterministic safety checks to protect users from high-risk electrical, chemical, or mechanical hazards.
"""

from typing import Tuple, List

# High risk trigger keywords (English & Arabic)
CRITICAL_HAZARDS = [
    {
        "id": "swollen_battery",
        "keywords": ["swollen", "bulging", "battery bulge", "popped screen", "bulge", "swell", "انتفاخ", "منتفخ", "منتفخة", "منفوخ", "منفوخة", "تورم", "متورمة", "بطارية منتفخة", "شاشة مرتفعة"],
        "severity": "critical",
        "warning_en": "DANGER: Swollen or bulging lithium-ion batteries are a severe fire and explosion hazard. Do NOT charge, puncture, or apply pressure to the device.",
        "warning_ar": "خطر جسيم: بطاريات الليثيوم المنتفخة تشكل خطراً كبيراً لنشوب حريق أو انفجار. لا تقم بشحن الجهاز أو الضغط عليه أو محاولة ثقبه.",
        "action_en": "Immediately power off the device, disconnect chargers, store in a fire-safe container, and take it to a certified technician.",
        "action_ar": "أوقف تشغيل الجهاز فوراً، وافصل الشاحن، وضعه في مكان آمن غير قابل للاشتعال، وتوجه فوراً لفني صيانة معتمد."
    },
    {
        "id": "smoke_or_burning",
        "keywords": ["smoke", "burning smell", "sparks", "fire", "electrical shock", "دخان", "رائحة حريق", "شرر", "تماس كهربائي", "صعقة"],
        "severity": "critical",
        "warning_en": "CRITICAL HAZARD: Electrical short-circuit or thermal runaway detected. Risk of electrocution or electrical fire.",
        "warning_ar": "خطر حرج: تم اكتشاف قصر كهربائي أو تماس حراري. يوجد خطر نشوب حريق كهربائي أو التعرض لصعقة.",
        "action_en": "Disconnect all power cords immediately from the wall outlet if safe to do so. Do not touch bare circuits.",
        "action_ar": "افصل كابل الكهرباء فوراً من القابس بحذر إن كان ذلك آمناً. لا تلمس الدوائر الداخلية المكشوفة."
    },
    {
        "id": "liquid_with_power",
        "keywords": ["dropped in water", "water spill", "submerged", "coffee spill", "سقط في الماء", "انسكب ماء", "شاي", "قهوة", "مبلل"],
        "severity": "high",
        "warning_en": "WARNING: Liquid ingress detected. Operating or charging a wet device will cause permanent motherboard corrosion and short-circuits.",
        "warning_ar": "تحذير: تسرب سوائل للجهاز. تشغيل أو شحن جهاز مبلل يؤدي إلى تآكل اللوحة الأم واحتراق الدوائر بشكل دائم.",
        "action_en": "Power off immediately. Do NOT plug in a charger or attempt to turn on. Dry externally and bring to a professional for ultrasonic cleaning.",
        "action_ar": "أوقف التشغيل فوراً ولا تقم بتوصيل الشاحن إطلاقاً. جفف السطح الخارجي وتوجه لمركز صيانة معتمد للتنظيف الكيميائي الداخلي."
    }
]

def evaluate_safety_hazards(text: str) -> Tuple[bool, str, List[str], List[str]]:
    """
    Evaluates text for critical safety hazards.
    Returns: (is_critical, severity, warnings_en, warnings_ar)
    """
    text_lower = text.lower()
    warnings_en = []
    warnings_ar = []
    highest_severity = "low"
    is_critical = False
    
    for hazard in CRITICAL_HAZARDS:
        matched = any(kw in text_lower for kw in hazard["keywords"])
        if matched:
            warnings_en.append(f"{hazard['warning_en']} {hazard['action_en']}")
            warnings_ar.append(f"{hazard['warning_ar']} {hazard['action_ar']}")
            if hazard["severity"] == "critical":
                highest_severity = "critical"
                is_critical = True
            elif highest_severity != "critical" and hazard["severity"] == "high":
                highest_severity = "high"
                
    return is_critical, highest_severity, warnings_en, warnings_ar
