# -*- coding: utf-8 -*-
"""
Multilingual Hardware Symptom & Fault Domain Extractor
Maps Arabic and English fault descriptions to concrete hardware components
(for MyFixit / iFixit guide search) and empirical Open Repair Alliance clusters.
"""

from typing import Dict, Any, List

GENERIC_FILLER_TOKENS = {
    "hardware", "software", "network", "unknown", "general", "other", "issue",
    "problem", "broken", "damaged", "device", "error", "عطل", "مشكلة", "عام", "غير معروف"
}

FAULT_DOMAINS: List[Dict[str, Any]] = [
    {
        "domain": "battery_charging",
        "ora_cluster": "BATTERY_CHARGING",
        "label_en": "Battery Degradation & Charging System Fault",
        "label_ar": "تدهور البطارية أو خلل منظومة الشحن",
        "component_terms": ["Battery", "Charging", "Battery Connector", "Dock Connector", "Power"],
        "keywords": [
            "battery", "drain", "draining", "swollen", "charge", "charging", "charger",
            "power bank", "akku", "lädt", "بطارية", "البطارية", "شحن", "الشحن", "شاحن",
            "الشاحن", "تخلص بسرعة", "تنفد", "تفريغ", "منفوخة", "انتفاخ", "ما بيشحنش", "لا يشحن"
        ],
        "cause_en": "Lithium battery cell wear, swollen battery pack, degraded charging IC (Tristar/Hydra/PMIC), or oxidized charging contacts.",
        "cause_ar": "تلف خلايا بطارية الليثيوم أو انتفاخها، أو ضعف دائرة الشحن (IC) أو اتساخ/تأكسد نقاط توصيل الشحن.",
        "fix_en": "Inspect charging cable/adapter output, clean charging port pins with isopropyl alcohol, test battery health cycles, and replace the worn battery assembly if capacity < 80% or swollen.",
        "fix_ar": "افحص كفاءة الشاحن والكابل، نظف منفذ الشحن بكحول إيزوبروبيل، افحص جهد البطارية ودوائر الشحن، واستبدل البطارية بأخرى أصلية عند انخفاض كفاءتها أو وجود انتفاخ."
    },
    {
        "domain": "charging_port_connector",
        "ora_cluster": "CABLE_CONNECTION",
        "label_en": "Charging Port, Socket & Internal Flex Connection",
        "label_ar": "تلف منفذ الشحن أو السوكيت أو كابلات التوصيل",
        "component_terms": ["Charging Port", "Lightning Connector", "USB", "DC Jack", "Headphone Jack", "Cable", "HDMI"],
        "keywords": [
            "port", "usb", "type-c", "type c", "lightning", "dc jack", "socket", "loose",
            "connector", "ribbon", "flex", "hdmi", "cable", "wire", "wackelkontakt", "kabel",
            "منفذ", "سوكيت", "مدخل", "وصلة", "فلاتة", "كابل", "سلك", "مهزوز", "مقطوع", "لا يتعرف", "hdmi"
        ],
        "cause_en": "Bent pins, cracked solder joints on the charging/HDMI/DC daughterboard, loose flex ribbon cable, or debris packed inside the connector.",
        "cause_ar": "انثناء أو تآكل سنون المنفذ، فك لحام نقاط التثبيت على البوردة (منفذ الشحن أو HDMI)، أو ارتخاء كابل الشريط الداخلي (Flex Cable).",
        "fix_en": "Disconnect battery first, clear compressed lint gently with a plastic pick (ESD-safe), reseat the internal flex connector, or replace/micro-solder the defective port assembly.",
        "fix_ar": "افصل البطارية أولاً، نظف المنفذ بأداة بلاستيكية دقيقة بدون معدن، وتأكد من ثبات الفلاتة الداخلية أو استبدل وحدة السوكيت/المنفذ التالفة."
    },
    {
        "domain": "screen_display",
        "ora_cluster": "SCREEN_DISPLAY",
        "label_en": "Display Panel, Digitizer & Backlight Failure",
        "label_ar": "عطل الشاشة أو طبقة اللمس أو الإضاءة الخلفية",
        "component_terms": ["Display", "Screen", "LCD", "Display Assembly", "Front Panel", "Digitizer", "Backlight", "Display Cable"],
        "keywords": [
            "screen", "display", "lcd", "oled", "digitizer", "touch", "cracked", "crack",
            "black screen", "blank", "lines", "flicker", "flickering", "dim", "backlight",
            "no video", "no signal", "شاشة", "الشاشة", "مكسورة", "كسر", "تاتش", "اللمس",
            "سوداء", "سودة", "ما بتعرضش", "خطوط", "ترعش", "إضاءة", "صورة", "فلاتة الشاشة", "أزرق"
        ],
        "cause_en": "Fractured OLED/LCD substrate, failed touch digitizer flex, loose eDP/LVDS display ribbon cable, or failed LED backlight driver coil/filter.",
        "cause_ar": "كسر داخلي في لوحة العرض (OLED/LCD)، تلف فلاتة اللمس، ارتخاء كابل الشاشة (Flex/eDP)، أو عطل دائرة الإضاءة الخلفية على اللوحة.",
        "fix_en": "Test external HDMI output (for laptops/consoles) to isolate GPU vs panel, disconnect battery, inspect/reseat the display flex cable, or replace the full Display Assembly.",
        "fix_ar": "جرّب توصيل شاشة خارجية (للحاسوب أو الكونسول) لعزل كارت الشاشة عن الشاشة نفسها، ثم افحص وتأكد من فلاتة الشاشة أو استبدل وحدة الشاشة بالكامل."
    },
    {
        "domain": "thermal_cooling",
        "ora_cluster": "THERMAL_OVERHEAT",
        "label_en": "Thermal Overheating & Cooling Fan Obstruction",
        "label_ar": "ارتفاع الحرارة المفرط وعطل مروحة التبريد أو المعجون الحراري",
        "component_terms": ["Fan", "Heat Sink", "Thermal", "Cooling", "Heatsink"],
        "keywords": [
            "heat", "hot", "overheat", "overheating", "thermal", "fan", "loud", "noise",
            "paste", "shuts down", "shutdown", "throttle", "temperature",
            "حرارة", "سخونة", "سخن", "بيسخن", "مروحة", "المروحة", "صوتها عالي", "معجون",
            "تبريد", "يفصل", "بيطفي", "ينطفئ"
        ],
        "cause_en": "Clogged heatsink fins, seized cooling fan bearings, dried/pumped-out thermal paste (or liquid metal oxidation on PS5), causing thermal trip shutdowns.",
        "cause_ar": "تراكم الأتربة في زعانف المشتت الحراري، ضعف أو توقف محرك المروحة، أو جفاف المعجون الحراري فوق المعالج مما يؤدي لإغلاق تلقائي لحماية الجهاز.",
        "fix_en": "Open rear housing, blow dust cleanly off heatsink fins while holding fan blades still, clean old compound with 90%+ isopropyl alcohol, apply fresh high-conductivity thermal paste, and verify fan spin.",
        "fix_ar": "افتح الغطاء بحذر، نظف مجاري الهواء والمروحة من الأتربة، أزل المعجون الحراري الجاف بكحول نقي وأعد وضع معجون حراري احترافي مع فحص دوران المروحة."
    },
    {
        "domain": "power_logic_board",
        "ora_cluster": "POWER_FAILURE",
        "label_en": "Power Delivery, PSU & Logic Board Failure",
        "label_ar": "انقطاع الطاقة وعطل وحدة التغذية أو اللوحة الأم",
        "component_terms": ["Power Supply", "Logic Board", "Motherboard", "Power Button", "Fuse", "PSU"],
        "keywords": [
            "no power", "won't turn on", "wont turn on", "won't boot", "dead", "no boot",
            "power supply", "psu", "motherboard", "logic board", "short", "capacitor",
            "fuse", "beep", "blinking", "blue light", "لا يعمل", "ما بيفتحش", "لا يفتح",
            "ميت", "فاصل باور", "باور", "طافي", "ماذربورد", "بوردة", "شورت", "مكثف", "صفارة", "لمبة"
        ],
        "cause_en": "Blown fuse, shorted SMD ceramic capacitor on main power rail (PPBUS / 12V), faulty power supply board (PSU), or corrupted firmware preventing POST.",
        "cause_ar": "انصهار فيوز الحماية أو وجود قصر كهربائي (Short) في أحد المكثفات على خط التغذية الرئيسي، أو تلف وحدة مزود الطاقة (PSU) أو أعطال اللوحة الأم.",
        "fix_en": "Test external power rail voltage with a multimeter, perform hard CMOS/battery power drain, inspect board under magnification for burnt components, and replace the PSU or trace board shorts.",
        "fix_ar": "اختبر خرج الشاحن/وحدة الباور بالأفوميتر، قم بتفريغ الشحنات (فصل البطارية 60 ثانية)، وافحص خط الطاقة على اللوحة الأم لتحديد المكثفات التالفة أو استبدل وحدة الباور."
    },
    {
        "domain": "storage_hdd_ssd",
        "ora_cluster": "MECHANICAL_WEAR",
        "label_en": "Storage Drive Media Wear & SMART Errors",
        "label_ar": "تآكل وسائط التخزين أو قطاعات تالفة (HDD / SSD / NVMe)",
        "component_terms": ["Hard Drive", "SSD", "Storage", "Optical Drive"],
        "keywords": [
            "hdd", "ssd", "nvme", "hard drive", "storage", "disk", "clicking", "click",
            "bad sector", "smart", "not detected", "slow boot", "corrupt", "read error",
            "هارد", "قرص", "تخزين", "نقر", "تكتكة", "قطاعات", "بطيء", "لا يظهر", "ضاع", "تالف"
        ],
        "cause_en": "Reallocated/pending magnetic sectors (SMART 5/197), clicking read/write actuator heads on HDDs, or worn NAND flash controller blocks on SSDs.",
        "cause_ar": "ظهور قطاعات تالفة (Bad Sectors) أو صوت نقر ميكانيكي من إبرة القراءة في الأقراص الصلبة، أو تآكل وحدة التحكم وذاكرة NAND في أقراص SSD.",
        "fix_en": "STOP heavy writes immediately and clone critical data to an external backup. Do NOT open sealed HDD platters outside a cleanroom; replace the drive using the bay teardown guide.",
        "fix_ar": "أوقف الكتابة على القرص فوراً وانسخ البيانات الهامة لوسيط خارجي. يُمنع فتح القرص الميكانيكي خارج غرف معزولة، واستبدل القرص التالف بوحدة SSD جديدة."
    },
    {
        "domain": "audio_speaker_mic",
        "ora_cluster": "CABLE_CONNECTION",
        "label_en": "Speaker, Microphone & Audio Output Failure",
        "label_ar": "عطل السماعة أو الميكروفون أو دائرة الصوت",
        "component_terms": ["Speaker", "Loudspeaker", "Earpiece", "Microphone", "Audio", "Headphone Jack"],
        "keywords": [
            "speaker", "sound", "audio", "mic", "microphone", "earpiece", "no sound",
            "crackling", "distorted", "muffled", "سماعة", "صوت", "مايك", "ميكروفون",
            "مكتوم", "وش", "تقطيع", "لا يوجد صوت", "ما بيطلعش صوت"
        ],
        "cause_en": "Clogged acoustic mesh, torn speaker membrane, debris in headphone detection switch, or failed audio codec IC / speaker spring contacts.",
        "cause_ar": "انسداد شبكة السماعة، تمزق غشاء المكبر الصوتي، تلف حساس مقبس السماعة، أو ضعف نقاط التلامس النحاسية بين السماعة واللوحة الأم.",
        "fix_en": "Clean speaker grille with dry soft brush and isopropyl, verify software output mute/balance, and replace the modular speaker/earpiece unit if resistance/continuity fails.",
        "fix_ar": "نظف شبك السماعة بفرشاة جافة وتأكد من إعدادات الإخراج الصوتي، وإذا استمر ضعف الصوت أو التشويش تُستبدل وحدة السماعة وفق خطوات الفك المعتمدة."
    },
    {
        "domain": "camera_optics",
        "ora_cluster": "GENERAL_DEFECT",
        "label_en": "Camera Sensor, Lens & Stabilization Fault",
        "label_ar": "عطل وحدة الكاميرا أو العدسة أو المثبت البصري",
        "component_terms": ["Camera", "Rear Camera", "Front Camera", "Lens", "Flash"],
        "keywords": [
            "camera", "lens", "blur", "blurry", "focus", "ois", "flash", "black camera", "shutter", "sensor",
            "كاميرا", "الكاميرا", "عدسة", "ضبابية", "فوكس", "فلاش", "لا تصور", "تهز", "مغوشة"
        ],
        "cause_en": "Loose camera FPC mezzanine connector, damaged optical image stabilization (OIS) actuator, or scratched/humidified outer sapphire glass.",
        "cause_ar": "ارتخاء موصل الكاميرا الدقيق على اللوحة، أو عطل محرك التركيز التلقائي/المثبت البصري (OIS)، أو وجود رطوبة/كسر في زجاج العدسة.",
        "fix_en": "Inspect outer glass for haze, power off and reseat the camera flex connector on the motherboard, and swap the camera module if image stays black or out of focus.",
        "fix_ar": "افحص عدسة الغطاء الخارجي، ثم افصل البطارية وأعد تثبيت سوكت الكاميرا على البوردة، أو استبدل وحدة الكاميرا في حال بقاء الصورة سوداء أو مشوشة."
    },
    {
        "domain": "keyboard_buttons",
        "ora_cluster": "SWITCH_BUTTON",
        "label_en": "Keyboard Matrix, Trackpad & Mechanical Buttons Fault",
        "label_ar": "عطل لوحة المفاتيح أو التاتش باد أو الأزرار الميكانيكية",
        "component_terms": ["Keyboard", "Trackpad", "Button", "Power Button", "Home Button", "Volume Button", "Joystick", "Trigger"],
        "keywords": [
            "keyboard", "key", "keys", "typing", "trackpad", "touchpad", "button", "switch",
            "stuck", "drift", "analog", "joystick", "controller",
            "كيبورد", "لوحة مفاتيح", "زرار", "أزرار", "معلق", "درافت", "ذراع", "انالوج", "تاتش باد"
        ],
        "cause_en": "Dust/liquid residue under scissor switches, fractured dome switch actuator, stick potentiometer drift (on gamepads), or worn ZIF keyboard ribbon cable.",
        "cause_ar": "تراكم رواسب أو سوائل تحت مفاتيح الكيبورد، تلف مفاتيح القبة (Dome Switch)، انحراف عصا التحكم (Analog Drift)، أو تلف فلاتة التوصيل.",
        "fix_en": "Clean under caps with contact cleaner / IPA, check ZIF ribbon latch under keyboard palmrest, and replace worn keyboard or thumbstick module.",
        "fix_ar": "نظف حول المفاتيح بمنظف إلكترونيات جاف، وتفقد كابل الزيف (ZIF) الموصل باللوحة، واستبدل لوحة المفاتيح أو عصا التحكم إذا استمر التعليق."
    },
    {
        "domain": "printer_feed_printhead",
        "ora_cluster": "PAPER_FEED",
        "label_en": "Printer Paper Feed Rollers & Printhead Clog",
        "label_ar": "عطل بكرات سحب الورق أو انسداد رأس الطباعة",
        "component_terms": ["Roller", "Printhead", "Paper", "Tray", "Hood", "Cartridge"],
        "keywords": [
            "paper", "jam", "jamming", "roller", "feed", "printhead", "ink", "streaks", "fuser",
            "ورق", "انحشار", "سحب", "بكرة", "حبر", "طباعة", "تقطع", "فيوزر", "طابعة"
        ],
        "cause_en": "Smooth hardened rubber pickup rollers slipping on paper sheets, torn paper fragment blocking opto-sensor, or dried ink nozzles inside printhead.",
        "cause_ar": "جفاف وتآكل المطاط على بكرات سحب الورق، وجود قصاصة ورق عالقة عند حساس السحب، أو جفاف الحبر داخل فوهات رأس الطباعة.",
        "fix_en": "Unplug printer, open access hood/rear duplexer, inspect and clean pickup rollers with damp lint-free cloth, remove paper scraps carefully, and run printhead cleaning cycle.",
        "fix_ar": "افصل الطابعة من الكهرباء، افتح الغطاء الخلفي لإزالة أي بقايا ورق، نظف بكرات السحب بقطعة قماش خالية من الوبر، أو نظف/استبدل وحدة رأس الطباعة."
    },
    {
        "domain": "liquid_damage",
        "ora_cluster": "LIQUID_LEAK",
        "label_en": "Liquid Ingress & PCB Corrosion",
        "label_ar": "دخول سوائل وتأكسد مسارات اللوحة الإلكترونية",
        "component_terms": ["Logic Board", "Motherboard", "Battery", "Keyboard"],
        "keywords": [
            "water", "liquid", "spill", "coffee", "tea", "wet", "rain", "corrosion", "dropped in",
            "ماء", "مية", "سوائل", "سائل", "قهوة", "شاي", "وقع في المية", "رطوبة", "صدأ", "أكسدة"
        ],
        "cause_en": "Conductive mineral deposits shorting low-voltage logic board SMD pads and eroding tin/copper traces near battery & display connectors.",
        "cause_ar": "تكون ترسبات موصلة وأملاح تسبب قصر كهربائي بين أرجل الدوائر المتكاملة وتآكل مسارات النحاس قرب البطارية والشاشة.",
        "fix_en": "DO NOT turn on or charge! Power off immediately, open enclosure and disconnect battery right away, clean corroded areas with 99% isopropyl alcohol and soft brush.",
        "fix_ar": "لا تقم بالتشغيل أو الشحن إطلاقاً! افصل البطارية فوراً، نظف آثار الأكسدة والأملاح على البوردة بكحول إيزوبروبيل 99% وفرشاة ناعمة قبل التجفيف الكامل."
    },
    {
        "domain": "network_wireless",
        "ora_cluster": "CABLE_CONNECTION",
        "label_en": "Wi-Fi / Bluetooth Antenna & RF Module Fault",
        "label_ar": "عطل هوائي الشبكة (Wi-Fi / Bluetooth) أو شريحة الاتصال",
        "component_terms": ["Wi-Fi", "Antenna", "Wireless", "Airport", "Bluetooth", "Network"],
        "keywords": [
            "wifi", "wi-fi", "wireless", "bluetooth", "signal", "no service", "antenna", "network",
            "disconnecting", "sim", "router", "modem", "واي فاي", "نت", "بلوتوث", "شبكة", "إشارة", "انتنا", "شريحة", "راوتر", "مودم"
        ],
        "cause_en": "Detached coaxial U.FL antenna pigtail connector after shock/drop, damaged RF shield traces, or failing WLAN/Bluetooth M.2 or BGA IC.",
        "cause_ar": "انفصال كابل الانتنا المحوري الدقيق داخل الجهاز بعد صدمة، أو عطل كارت الشبكة اللاسلكية / قارئ الشريحة على اللوحة.",
        "fix_en": "Open device cover carefully, snap loose coaxial U.FL antenna connectors firmly onto Wi-Fi card/board sockets, or swap removable WLAN card.",
        "fix_ar": "افتح الغطاء بحذر وتفقد ثبات كابلات الهوائي المحورية على كارت Wi-Fi أو استبدل وحدة الشبكة اللاسلكية."
    }
]


def extract_fault_signals(
    category: str = "",
    brand: str = "",
    model: str = "",
    problem_category: str = "",
    description: str = "",
    error_message: str = "",
) -> Dict[str, Any]:
    """
    Parses bilingual (Arabic & English) device symptoms and technical inputs into:
    - matched fault domains (ordered by keyword hits)
    - clean component search terms for MyFixit / iFixit
    - matching Open Repair Alliance problem_cluster candidates
    - clean device search terms ignoring generic filler like 'Hardware'
    """
    prob_clean = problem_category.strip()
    if prob_clean.lower() in GENERIC_FILLER_TOKENS:
        prob_clean = ""

    combined = f" {prob_clean} {description} {error_message} ".lower()

    scored_domains = []
    for dom in FAULT_DOMAINS:
        hits = [kw for kw in dom["keywords"] if kw in combined]
        if hits:
            # Prefer specific longer phrase matches slightly
            weight = sum(2 if len(h) >= 6 else 1 for h in hits)
            scored_domains.append((weight, len(hits), dom, hits))

    scored_domains.sort(key=lambda x: (-x[0], -x[1]))

    matched_domains = [item[2] for item in scored_domains]
    matched_hits = [h for item in scored_domains for h in item[3]]

    component_terms: List[str] = []
    for dom in matched_domains[:2]:
        for term in dom["component_terms"]:
            if term not in component_terms:
                component_terms.append(term)

    if prob_clean and prob_clean not in component_terms:
        component_terms.insert(0, prob_clean)

    # Also extract clean English technical words from user description if present
    import re
    eng_tokens = re.findall(r"[A-Za-z][A-Za-z0-9\-]{2,}", f"{prob_clean} {description}")
    clean_desc_tokens = [
        tok for tok in eng_tokens
        if tok.lower() not in GENERIC_FILLER_TOKENS
        and tok.lower() not in (brand or "").lower()
        and tok.lower() not in (model or "").lower()
    ]

    ora_clusters = []
    for dom in matched_domains:
        c = dom["ora_cluster"]
        if c not in ora_clusters:
            ora_clusters.append(c)

    primary_component = component_terms[0] if component_terms else (clean_desc_tokens[0] if clean_desc_tokens else "")

    return {
        "matched_domains": matched_domains,
        "primary_domain": matched_domains[0] if matched_domains else None,
        "ora_clusters": ora_clusters,
        "primary_cluster": ora_clusters[0] if ora_clusters else None,
        "component_terms": component_terms,
        "primary_component": primary_component,
        "english_tokens": clean_desc_tokens[:5],
        "matched_keywords": matched_hits[:8],
        "clean_problem_category": prob_clean,
    }
