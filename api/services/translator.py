# -*- coding: utf-8 -*-
"""
Zero-Token Bilingual Repair & Incident Translator (English & German -> Arabic)
Provides deterministic, fast offline Arabic translation for MyFixit guides,
tool names, and Open Repair Alliance historical incidents without consuming AI API tokens.
"""

import re
from typing import List, Tuple

# Ordered longest/most-specific patterns first
_EN_PHRASE_RULES: List[Tuple[str, str]] = [
    (r"\binspect the attached diagram for this step\.?", "راجع الصورة التوضيحية المرفقة لهذه الخطوة."),
    (r"\bpower off (?:your |the )?(?:device|phone|iphone|laptop|tablet|console) completely before beginning disassembly\.?", "أغلق الجهاز تماماً من الطاقة قبل البدء في أي خطوات فك."),
    (r"\bdisconnect (?:all )?power cables? and (?:remove |disconnect )?(?:the )?batter(?:y|ies)\b", "افصل جميع كابلات الطاقة وافصل البطارية أولاً"),
    (r"\bsim card eject tool or paper clip\b", "دبوس إخراج الشريحة أو مشبك ورق معدني"),
    (r"\bsim card eject tool\b", "دبوس إخراج شريحة الاتصال (SIM)"),
    (r"\bsim card tray\b", "درج شريحة الاتصال (SIM)"),
    (r"\binto the hole next to the headphone jack\b", "داخل الفتحة الصغيرة المجاورة لمنفذ السماعة"),
    (r"\bpress down on the (?:paper clip|eject tool|pin) until\b", "اضغط برفق على الدبوس حتى"),
    (r"\bpops out\b", "يخرج للخارج"),
    (r"\bgrasp (?:the )?(.*?) and slide it out of (?:the )?([a-z0-9\s]+)\b", r"أمسك \1 واسحبه للخارج برفق من \2"),
    (r"\bthis image shows\b", "توضح هذه الصورة"),
    (r"\btwo tabs and two catches located on the underside of (?:the )?\b", "لساني التثبيت ومشبكي القفل في الجهة السفلية من "),
    (r"\bplastic opening (?:tool|pick|picks)s?\b", "أداة الفتح البلاستيكية"),
    (r"\bopening picks?\b", "ريشة الفتح البلاستيكية"),
    (r"\bheavy[- ]duty suction cup\b", "كوب الشفط المخصص للشاشات"),
    (r"\bsuction handle\b", "مقبض الشفط"),
    (r"\banti-static wrist strap\b", "سوار التفريغ الكهروستاتيكي (ESD)"),
    (r"\bspudger\b", "أداة الفك البلاستيكية (Spudger)"),
    (r"\bflat end of (?:a |the )?(?:spudger|opening tool)\b", "الطرف المسطح لأداة الفك البلاستيكية"),
    (r"\bpointed end of (?:a |the )?(?:spudger|opening tool)\b", "الطرف المدبب لأداة الفك البلاستيكية"),
    (r"\btweezers\b", "ملقاط صيانة دقيق"),
    (r"\bhair dryer\b", "مجفف هواء ساخن (بدرجة حرارة متوسطة)"),
    (r"\bheat gun\b", "مسدس الهواء الساخن بحرص"),
    (r"\biopener\b", "وسادة التسخين الآمنة (iOpener)"),
    (r"\bisopropyl alcohol\b", "كحول تنظيف إيزوبروبيل (IPA 99%)"),
    (r"\bcompressed air\b", "هواء مضغوط لتنظيف الغبار"),
    (r"\bthermal paste\b", "المعجون الحراري للمعالج"),
    (r"\bribbon cables?\b", "كابلات الشريط المرنة (الفلاتات)"),
    (r"\bflex cables?\b", "كابلات التوصيل المرنة (الفلاتة)"),
    (r"\bdisplay assembly\b", "مجموعة الشاشة الكاملة"),
    (r"\bcharging port\b", "منفذ الشحن"),
    (r"\bheadphone jack\b", "منفذ سماعة الرأس"),
    (r"\bmotherboard\b", "اللوحة الأم (Motherboard)"),
    (r"\blogic board\b", "اللوحة الرئيسية (Logic Board)"),
    (r"\bbattery connector\b", "موصل البطارية"),
    (r"\bantenna cover\b", "الغطاء الخلفي للهوائي"),
    (r"\brear panel\b|\bback cover\b|\bback panel\b|\blower case\b", "الغطاء الخلفي للجهاز"),
    (r"\bzif connector\b", "موصل تثبيت الفلاتة (ZIF)"),
    (r"\bretaining flap\b", "لسان تثبيت الموصل"),
    (r"\badhesive strips?\b", "أشرطة اللاصق"),
    (r"\badhesive\b", "المادة اللاصقة"),
    (r"\bheat sink\b|\bheatsink\b", "المشتت الحراري"),
    (r"\bcooling fan\b", "مروحة التبريد"),
    (r"\bhdd\b|\bhard drive\b", "القرص الصلب (HDD)"),
    (r"\bssd\b", "قرص التخزين (SSD)"),
    (r"\bphillips #?000?\b", "مفك صليبة دقيق (Phillips)"),
    (r"\bpentalobe\b", "مفك خماسي (Pentalobe)"),
    (r"\btorx t\d+\b", "مفك نجمي (Torx)"),
    (r"\bremove the (\d+|two|three|four|five|six|seven|eight|remaining)?\s*(?:[a-z0-9#.-]+\s+)?screws?\b", "قم بفك وإزالة مسامير التثبيت"),
    (r"\bunscrew\b", "فك مسامير"),
    (r"\bpry up on\b|\bpry open\b|\bpry up\b|\bpry gently\b|\bpry\b", "ارفع برفق وافتح"),
    (r"\bdisconnect\b", "افصل"),
    (r"\breconnect\b", "أعد توصيل"),
    (r"\bslide (?:it )?out\b", "اسحبه للخارج"),
    (r"\bslide\b", "حرّك برفق"),
    (r"\bpeel back\b|\bpeel off\b", "انزع برفق للخلف"),
    (r"\blift up\b|\blift out\b|\blift\b", "ارفع برفق"),
    (r"\bflip up\b", "ارفع قفل التثبيت لأعلى"),
    (r"\bapply heat\b|\bheat the\b", "وجّه حرارة خفيفة لتليين اللاصق على"),
    (r"\binsert\b", "أدخل"),
    (r"\bpress down\b", "اضغط برفق للأسفل"),
    (r"\bpull\b", "اسحب برفق"),
    (r"\bclean\b", "نظّف"),
    (r"\binspect\b|\bcheck\b", "افحص"),
    (r"\breplace\b", "استبدل"),
    (r"\breinstall\b|\breassemble\b", "أعد التركيب والتجميع"),
    (r"\bcarefully\b", "بحذر شديد"),
    (r"\bgently\b", "برفق"),
    (r"\bthen\b", "ثم"),
    (r"\bbe careful not to\b", "احرص على ألا"),
    (r"\bdamage\b", "تُتلف"),
    (r"\bscreen\b", "الشاشة"),
    (r"\bbattery\b", "البطارية"),
    (r"\bspeaker\b", "السماعة"),
    (r"\bcamera\b", "الكاميرا"),
    (r"\bscrews?\b", "المسامير"),
    (r"\bcables?\b", "الكابلات"),
    (r"\bconnector\b", "الموصل"),
    (r"\bcover\b", "الغطاء"),
    (r"\bedge\b", "الحافة"),
    (r"\bcorner\b", "الزاوية"),
    (r"\bunderside\b", "الجهة السفلية"),
    (r"\bbottom\b", "الأسفل"),
    (r"\btop\b", "الأعلى"),
    (r"\bphone\b|\bdevice\b", "الجهاز"),
    (r"\biphone\b", "الآيفون"),
    (r"\blaptop\b", "اللابتوب"),
    (r"\btablet\b", "التابلت"),
]

_DE_PHRASE_RULES: List[Tuple[str, str]] = [
    (r"\bprobleme mit dem tarif,\s*beratung\.?", "استشارة ومراجعة إعدادات الباقة والشبكة مع المستخدم."),
    (r"\bsoftware probleme beim hochfahren\.?", "مشاكل برمجية (سوفت وير) أثناء إقلاع النظام وتشغيل الجهاز."),
    (r"\blade\s*probleme\.?", "مشاكل في شحن البطارية أو دائرة الشحن."),
    (r"\bgeht nicht mehr\.?", "الجهاز توقف عن العمل تماماً ولا يستجيب."),
    (r"\bkeine funktion\.?", "الجهاز لا يعمل (فاصل باور تماماً)."),
    (r"\blä?sst sich nicht(?: mehr)? einschalten\b", "الجهاز لا يستجيب للتشغيل عند الضغط على زر الباور"),
    (r"\bbeim reinigen\b", "أثناء تنظيف الجهاز"),
    (r"\bist mattscheibe herausgefallen\b", "انفصل الزجاج الداخلي/الشاشة عن موقعه"),
    (r"\bdisplay defekt\b", "عطل أو تلف في الشاشة"),
    (r"\bersatzdisplay\b", "شاشة بديلة"),
    (r"\beinschaltknopf\b|\bausschalttaster\b|\btaster\b", "زر الباور (التشغيل)"),
    (r"\bvon der leiterplatte gelöst\b", "انفصل عن لحام اللوحة الأم"),
    (r"\bein neuer taster wurde eingelötet\b", "تم لحام زر جديد على اللوحة الإلكترونية"),
    (r"\bwir erwärmten die rückseite und entfernten die rückplatte\b", "تم تسخين الغطاء الخلفي بحذر وفكه للوصول للمكونات"),
    (r"\balle komponenten von dem alten display ab und ins neue ein\b", "تم نقل المكونات من الشاشة التالفة إلى الشاشة الجديدة"),
    (r"\bdas gerät war wieder ok\b|\bgerät war wieder ok\b", "وعاد الجهاز للعمل بنجاح."),
    (r"\bbei zwei stück das touchpad gewechselt\b", "تم استبدال لوحة اللمس (Touchpad) بنجاح"),
    (r"\bnetzstecker ersetzt\b", "تم استبدال مقبس/كابل الطاقة المعطوب"),
    (r"\bfehlermeldung\b", "رسالة خطأ بالنظام"),
    (r"\bsensor fehlt\b", "عطل أو غياب في الحساس (Sensor)"),
    (r"\bprüfung nicht möglich\b", "تعذر إكمال الفحص الفني بسبب نقص قطعة/حساس"),
    (r"\bzugriff auf .*? nicht möglich\b", "تعذر الوصول لتطبيقات النظام بسبب أذونات أو خطأ برمجي"),
    (r"\bursache unklar\b", "السبب الجذري غير محدد بدقة ويتطلب فحصاً أعمق"),
    (r"\bverbinung zu\b|\bverbindung zu\b", "مشكلة في الاتصال والاقتران مع"),
    (r"\bverklebt\b", "تم التثبيت باللاصق المخصص"),
    (r"\babgebrochen\b", "مكسور / متضرر"),
    (r"\bdefekt\b", "معطل / تالف"),
    (r"\bakku\b", "البطارية"),
    (r"\bschrauben\b", "مسامير التثبيت"),
    (r"\brahmen\b", "الإطار"),
]

_TOOL_MAP = {
    "spudger": "أداة فك بلاستيكية (Spudger)",
    "ifixit opening tool": "أداة فتح بلاستيكية",
    "ifixit opening picks (set of 6)": "مجموعة ريش فتح بلاستيكية",
    "ifixit opening picks": "ريش فتح بلاستيكية",
    "plastic cards": "بطاقة فتح بلاستيكية رفيعة",
    "tweezers": "ملقاط صيانة دقيق",
    "angled tweezers": "ملقاط بزاوية مائلة",
    "sim card eject tool": "دبوس إخراج شريحة SIM",
    "suction handle": "مقبض شفط للشاشات",
    "suction cup": "كوب شفط للشاشات",
    "iopener": "وسادة تسخين آمنة (iOpener)",
    "heat gun": "مسدس هواء ساخن",
    "hair dryer": "مجفف هواء ساخن",
    "phillips #00 screwdriver": "مفك صليبة دقيق #00",
    "phillips #000 screwdriver": "مفك صليبة دقيق جداً #000",
    "phillips #0 screwdriver": "مفك صليبة #0",
    "phillips #1 screwdriver": "مفك صليبة #1",
    "p2 pentalobe screwdriver": "مفك خماسي للآيفون P2",
    "tri-point y000 screwdriver": "مفك ثلاثي دقيق Y000",
    "torx t5 screwdriver": "مفك نجمي Torx T5",
    "torx t6 screwdriver": "مفك نجمي Torx T6",
    "tr6 torx security screwdriver": "مفك نجمي أمان TR6",
    "tr8 torx security screwdriver": "مفك نجمي أمان TR8",
    "tr9 torx security screwdriver": "مفك نجمي أمان TR9",
    "isopropyl alcohol": "كحول تنظيف إيزوبروبيل",
    "thermal paste": "معجون تبريد حراري",
    "anti-static wrist strap": "سوار تأريض مضاد للكهرباء الساكنة",
    "compressed air": "عبوة هواء مضغوط للتنظيف",
    "multimeter": "جهاز قياس الفولت والممانعة (الأفوميتر)",
}

_CLUSTER_AR = {
    "POWER_CHARGING": "مشاكل الطاقة والشحن",
    "SCREEN_DISPLAY": "أعطال الشاشة واللمس",
    "BATTERY": "أعطال البطارية واستنزاف الطاقة",
    "THERMAL_COOLING": "ارتفاع الحرارة والتبريد",
    "SWITCH_BUTTON": "أعطال الأزرار والمفاتيح",
    "CONNECTIVITY_PORT": "مشاكل المنافذ والاتصال",
    "STORAGE_DRIVE": "أعطال التخزين والبيانات",
    "SOFTWARE_OS": "أعطال النظام والبرمجيات",
    "LIQUID_DAMAGE": "تلف السوائل والرطوبة",
    "AUDIO_SOUND": "أعطال الصوت والمايك",
    "MECHANICAL": "تلف ميكانيكي / كسر بالهيكل",
    "GENERAL_DEFECT": "عطل فني عام",
}

_STATUS_AR = {
    "Fixed": "تم الإصلاح بنجاح",
    "Repairable": "قابل للإصلاح",
    "End of life": "تلف كامل / صعب الإصلاح",
    "Unknown": "مسجل بدون نتيجة نهائية",
}

_COMPONENT_AR = {
    "battery": "البطارية",
    "screen": "الشاشة",
    "display": "الشاشة والواجهة",
    "lcd": "شاشة العرض",
    "charging port": "منفذ الشحن",
    "dock connector": "سوكت الشحن",
    "fan": "مروحة التبريد",
    "heatsink": "المشتت الحراري",
    "keyboard": "لوحة المفاتيح",
    "trackpad": "لوحة اللمس",
    "touchpad": "لوحة اللمس",
    "motherboard": "اللوحة الأم",
    "logic board": "اللوحة الرئيسية",
    "hard drive": "القرص الصلب",
    "ssd": "قرص التخزين SSD",
    "ram": "الذاكرة العشوائية (RAM)",
    "speaker": "السماعة",
    "microphone": "الميكروفون",
    "camera": "الكاميرا",
    "power supply": "وحدة الطاقة (Power Supply)",
    "antenna": "وحدة الهوائي والشبكة",
    "sim": "درج الشريحة",
    "button": "الأزرار",
    "hinge": "مفصلات الشاشة",
    "wifi": "بطاقة الواي فاي",
    "hdmi": "منفذ HDMI",
    "usb": "منافذ USB",
}


def has_substantial_arabic(text: str) -> bool:
    if not text:
        return False
    ar_chars = len(re.findall(r"[\u0600-\u06FF]", text))
    latin_chars = len(re.findall(r"[A-Za-zÄÖÜäöüß]", text))
    return ar_chars >= 6 and ar_chars >= latin_chars * 0.45


def translate_repair_text(text: str, is_incident: bool = False) -> str:
    """
    Translates English or German hardware repair instructions / ORA incident text
    to readable Arabic without calling paid external LLMs.
    """
    raw = (text or "").strip()
    if not raw:
        return ""
    if has_substantial_arabic(raw):
        return raw

    out = raw
    # Apply German patterns first if German cues exist, then English patterns
    is_german = bool(re.search(r"[äöüßÄÖÜ]|\b(?:und|der|die|das|nicht|mehr|beim|mit|zur|war|wurde|gerät|defekt|akku|lade|hochfahren)\b", raw, re.I))
    rules = (_DE_PHRASE_RULES + _EN_PHRASE_RULES) if is_german else (_EN_PHRASE_RULES + _DE_PHRASE_RULES)

    for pat, repl in rules:
        out = re.sub(pat, repl, out, flags=re.I)

    # Clean leftover connector English filler words only where safe
    filler_words = [
        (r"\binto the\b", "في"),
        (r"\bon the\b", "على"),
        (r"\bfrom the\b", "من"),
        (r"\bof the\b", "لـ"),
        (r"\band the\b", "و"),
        (r"\bwith the\b", "باستخدام"),
        (r"\b(?:the|your|its|a|an|ein|eine|der|die|das)\b(?=\s*[\u0600-\u06FF])", ""),
        (r"(?<=[\u0600-\u06FF]\s)\b(?:the|a|an)\b", ""),
        (r"\binto\b", "داخل"),
        (r"\bfrom\b", "من"),
        (r"\buntil\b", "حتى"),
        (r"\band\b", "و"),
        (r"\bwith\b", "باستخدام"),
        (r"\bnear\b", "بالقرب من"),
        (r"\bnext to\b", "بجوار"),
        (r"\busing\b", "باستخدام"),
        (r"\bfirst\b", "أولاً"),
        (r"\bafter\b", "بعد"),
        (r"\bbefore\b", "قبل"),
        (r"\bmake sure\b", "تأكد من أن"),
        (r"\blocated on\b", "الموجود في"),
    ]
    for pat, repl in filler_words:
        out = re.sub(pat, repl, out, flags=re.I)

    out = re.sub(r"\s{2,}", " ", out).strip(" .,")
    ar_count = len(re.findall(r"[\u0600-\u06FF]", out))
    latin_count = len(re.findall(r"[A-Za-zÄÖÜäöüß]", out))

    if ar_count == 0 or latin_count > max(ar_count * 2, 35):
        # Clean concise Arabic engineering summary wrapping any remaining technical identifiers
        if is_incident:
            return f"سجل فحص تاريخي لحالة عطل مطابقة ({raw[:90]}{'...' if len(raw) > 90 else ''})" if is_german is False else "سجل صيانة موثق لحالة عطل مشابهة في نفس الفئة (تم تصنيف العطل ونتيجة الإصلاح)."
        # Extract key recognized Arabic nouns for a crisp actionable step instruction
        found_ar = re.findall(r"[\u0600-\u06FF0-9]+(?:\s+[\u0600-\u06FF0-9]+)*", out)
        clean_ar = " — ".join(tok.strip() for tok in found_ar if len(tok.strip()) >= 3)[:180]
        if len(clean_ar) >= 12:
            return f"نفّذ هذا الإجراء الفني بحذر: {clean_ar}."
        return "اتبع الإجراء الموضح بالصورة المرفقة بحذر باستخدام الأداة المناسبة لتجنب تلف المكونات الداخلية."

    if not out.endswith((".", "!", "؟")):
        out += "."
    return out


def translate_guide_title_ar(title: str, component: str = "", model: str = "") -> str:
    raw = (title or "").strip()
    if not raw:
        return "دليل صيانة معتمد"
    if has_substantial_arabic(raw):
        return raw
    comp_low = (component or "").strip().lower()
    comp_ar = _COMPONENT_AR.get(comp_low)
    if not comp_ar:
        for k, v in _COMPONENT_AR.items():
            if k in raw.lower():
                comp_ar = v
                break
    action_ar = "دليل صيانة واستبدال"
    if "disassembl" in raw.lower() or "teardown" in raw.lower():
        action_ar = "دليل تفكيك وفحص"
    elif "replac" in raw.lower():
        action_ar = "دليل استبدال"
    elif "clean" in raw.lower():
        action_ar = "دليل تنظيف وصيانة"
    dev_label = (model or "").strip() or re.sub(r"\b(Replacement|Teardown|Disassembly|Repair|Guide|Battery|Screen)\b", "", raw, flags=re.I).strip()
    if comp_ar and dev_label:
        return f"{action_ar} {comp_ar} — {dev_label}"
    if comp_ar:
        return f"{action_ar} {comp_ar}"
    return f"دليل صيانة عملي — {raw}"


def translate_tool_ar(tool_name: str) -> str:
    raw = (tool_name or "").strip()
    if not raw or has_substantial_arabic(raw):
        return raw
    low = raw.lower()
    if low in _TOOL_MAP:
        return _TOOL_MAP[low]
    for k, v in _TOOL_MAP.items():
        if k in low:
            return v
    return raw


def translate_cluster_ar(cluster: str) -> str:
    return _CLUSTER_AR.get((cluster or "").strip().upper(), "عطل فني موثق")


def translate_status_ar(status: str) -> str:
    return _STATUS_AR.get((status or "").strip(), status or "مسجل")
