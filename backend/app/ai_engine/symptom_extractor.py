"""
TechRepair - Bilingual NLP Symptom Extractor
Extracts technical symptoms and device state tags from natural language problem descriptions.
"""

import re
from typing import List, Dict

# Lexicon mapping canonical symptom tags to English and Arabic keyword patterns
SYMPTOM_PATTERNS: Dict[str, Dict[str, List[str]]] = {
    "overheating": {
        "en": ["hot", "overheat", "overheating", "high temp", "thermal", "boiling", "fan loud", "fan noise"],
        "ar": ["ساخن", "حرارة", "سخونة", "يسخن", "حرارة مرتفعة", "صوت المروحة", "مروحة عالية"]
    },
    "unexpected_shutdown": {
        "en": ["shuts down", "shut down", "turns off", "powers off", "restarts randomly", "cuts off", "crashes after minutes"],
        "ar": ["ينطفئ", "يطفئ", "إيقاف مفاجئ", "يعيد التشغيل تلقائيا", "يفصل", "يطفي فجأة"]
    },
    "no_power": {
        "en": ["won't turn on", "does not turn on", "no power", "completely dead", "no lights", "won't boot", "black screen on start"],
        "ar": ["لا يعمل", "لا يفتح", "لا يستجيب", "قاطع باور", "لا يضيء", "ميت تماماً", "لا يقلع"]
    },
    "battery_charging_issue": {
        "en": ["battery drains", "won't charge", "not charging", "battery dies fast", "percentage drops", "loose charger", "charger port"],
        "ar": ["البطارية تفرغ", "لا يشحن", "الشاحن لا يعمل", "نسبة الشحن تهبط", "منفذ الشاحن", "تفريغ سريع للبطارية"]
    },
    "screen_display_issue": {
        "en": ["screen flicker", "lines on screen", "cracked screen", "touch not working", "dim display", "black display", "no display"],
        "ar": ["شاشة سوداء", "وميض", "خطوط في الشاشة", "اللمس لا يعمل", "تاتش", "شاشة مكسورة", "إضاءة الشاشة ضعيفة"]
    },
    "slow_performance": {
        "en": ["slow", "lagging", "freezing", "sluggish", "unresponsive", "takes forever", "high cpu", "100% disk"],
        "ar": ["بطيء", "تهنيج", "تعليق", "ثقيل جداً", "توقف عن الاستجابة", "استهلاك المعالج مرتفع", "بطء شديد"]
    },
    "boot_loop_os_crash": {
        "en": ["blue screen", "bsod", "bootloop", "stuck on logo", "windows crash", "system error", "failed to boot"],
        "ar": ["شاشة زرقاء", "يعلق على الشعار", "شاشة الموت", "خطأ في النظام", "فشل الإقلاع", "فشل الويندوز"]
    },
    "storage_drive_failure": {
        "en": ["clicking sound", "disk error", "drive not detected", "smart error", "corrupted files", "hard drive noise"],
        "ar": ["صوت تكتكة", "الهارد غير مقروء", "خطأ في القرص", "تلف الملفات", "القرص الصلب"]
    },
    "network_wifi_issue": {
        "en": ["wifi drops", "no internet", "wifi disconnected", "dns error", "slow connection", "can't connect to network"],
        "ar": ["انقطاع الوايفاي", "لا يوجد إنترنت", "فصل الشبكة", "بطء الإنترنت", "مشكلة اتصال"]
    },
    "liquid_damage": {
        "en": ["water", "liquid", "spill", "coffee", "wet", "juice", "rain"],
        "ar": ["ماء", "سوائل", "انسكاب", "قهوة", "شاي", "عصير", "رطوبة"]
    }
}

def extract_symptoms(text: str) -> List[str]:
    """
    Extracts canonical symptom codes matching English or Arabic phrases.
    """
    cleaned = text.lower()
    matched_symptoms = []
    
    for symptom_code, langs in SYMPTOM_PATTERNS.items():
        found = False
        # Match English keywords
        for kw in langs.get("en", []):
            if re.search(r'\b' + re.escape(kw) + r'\b', cleaned):
                found = True
                break
        
        # Match Arabic keywords (substring / word match)
        if not found:
            for kw in langs.get("ar", []):
                if kw in cleaned:
                    found = True
                    break
                    
        if found:
            matched_symptoms.append(symptom_code)
            
    # Default fallback symptom if none extracted
    if not matched_symptoms:
        matched_symptoms.append("general_malfunction")
        
    return matched_symptoms
