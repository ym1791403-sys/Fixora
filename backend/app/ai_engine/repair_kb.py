"""
TechRepair - Repair Knowledge Base (KB)
Diagnostic mapping grounded in Open Repair Alliance failure categories and MyFixit troubleshooting guides.
"""

from typing import Dict, List, Any

KNOWLEDGE_BASE: List[Dict[str, Any]] = [
    {
        "id": "kb_overheating_thermal_shutdown",
        "primary_symptoms": ["overheating", "unexpected_shutdown"],
        "device_categories": ["Laptop", "Desktop Computer", "Other"],
        "severity": "high",
        "base_confidence": 0.88,
        "causes": [
            {
                "title_en": "Dried Thermal Paste & Blocked Heat Sink",
                "title_ar": "جفاف المعجون الحراري وانسداد فتحات التبريد",
                "probability": 0.72,
                "explanation_en": "Thermal paste between CPU/GPU and heat sink degrades over time, preventing heat transfer and triggering safety thermal cutoff.",
                "explanation_ar": "المعجون الحراري بين المعالج والمبرد يجف مع الوقت، مما يمنع تصريف الحرارة ويؤدي للإغلاق التلقائي للحماية.",
                "is_hardware": True
            },
            {
                "title_en": "Cooling Fan Mechanical Failure or Dust Clogging",
                "title_ar": "عطل ميكانيكي بمروحة التبريد أو تراكم الغبار",
                "probability": 0.20,
                "explanation_en": "Dust buildup restricts airflow, causing fan bearings to wear out or spin below required RPM.",
                "explanation_ar": "تراكم الأتربة يعيق تدفق الهواء ويؤدي إلى تباطؤ دوران المروحة عن السرعة المطلوبة.",
                "is_hardware": True
            },
            {
                "title_en": "Background Malware or High CPU Process",
                "title_ar": "برمجيات خبيثة أو عمليات تستهلك 100% من المعالج",
                "probability": 0.08,
                "explanation_en": "Intensive rogue processes keep CPU at 100% load continuously.",
                "explanation_ar": "عمليات برمجية مكثفة تبقي المعالج في أقصى طاقته باستمرار.",
                "is_hardware": False
            }
        ],
        "steps": [
            {
                "step_number": 1,
                "title_en": "Check Air Vents & Surface Placement",
                "title_ar": "فحص فتحات التهوية والسطح",
                "instruction_en": "Ensure device is placed on a hard, flat surface. Avoid beds, blankets, or carpets that block intake grilles.",
                "instruction_ar": "تأكد من وضع الجهاز على سطح مستوٍ وصلب وتجنب وضعه على الأقمشة أو المفارش التي تسد فتحات التهوية.",
                "requires_tools": False
            },
            {
                "step_number": 2,
                "title_en": "Inspect Task Manager for Runaway Processes",
                "title_ar": "فحص مدير المهام للعمليات المستهلكة",
                "instruction_en": "Open Task Manager (Ctrl+Shift+Esc), check CPU column. End any non-essential tasks consuming above 80% constantly.",
                "instruction_ar": "افتح مدير المهام (Ctrl+Shift+Esc) وافحص عمود المعالج CPU وأوقف أي برامج غير ضرورية تستهلك طاقة مفرطة.",
                "requires_tools": False
            },
            {
                "step_number": 3,
                "title_en": "Clean Exhaust Grilles with Compressed Air",
                "title_ar": "تنظيف فتحات المروحة بالهواء المضغوط",
                "instruction_en": "Power off and use short bursts of compressed air through exhaust vents to dislodge dust particles.",
                "instruction_ar": "أوقف تشغيل الجهاز واستخدم بخاخ هواء مضغوط بدفعات قصيرة لتنظيف فتحات المروحة من الغبار.",
                "caution_en": "Do not spin the fan blades at excessively high speeds with compressed air.",
                "caution_ar": "لا تجعل ريش المروحة تدور بسرعة مفرطة بقوة الهواء حتى لا تتلف المحامل.",
                "requires_tools": True
            },
            {
                "step_number": 4,
                "title_en": "Re-apply High Performance Thermal Compound",
                "title_ar": "تجديد المعجون الحراري للمعالج",
                "instruction_en": "If temperatures remain high (>85C idle/load), open back cover, clean old paste with 99% isopropyl alcohol, and apply a pea-sized dot of new thermal paste.",
                "instruction_ar": "إذا استمرت الحرارة مرتفعة، يتطلب الأمر فتح الغطاء وتنظيف المعجون القديم بكحول الأيزوبروبيل وإعادة وضع معجون حراري عالي الجودة.",
                "caution_en": "Disconnect battery before touching any internal motherboard components.",
                "caution_ar": "افصل البطارية أولاً قبل لمس أي مكونات على اللوحة الأم.",
                "requires_tools": True
            }
        ],
        "required_tools": ["Precision Screwdriver Set", "Compressed Air Can", "High-Conductivity Thermal Paste", "99% Isopropyl Alcohol", "Anti-static Tweezers"],
        "estimated_difficulty": "moderate",
        "estimated_minutes": 45,
        "safety_warnings_en": ["Ensure device is unplugged and fully cooled before opening chassis."],
        "safety_warnings_ar": ["تأكد من فصل التيار الكهربائي وانتظار الجهاز حتى يبرد تماماً قبل الفك."],
        "requires_technician": False
    },
    {
        "id": "kb_battery_drain_charging_failure",
        "primary_symptoms": ["battery_charging_issue"],
        "device_categories": ["Smartphone", "Tablet", "Laptop"],
        "severity": "medium",
        "base_confidence": 0.85,
        "causes": [
            {
                "title_en": "Chemical Degradation of Battery Cells",
                "title_ar": "تراجع كفاءة خلايا البطارية الكيميائية",
                "probability": 0.55,
                "explanation_en": "Lithium batteries degrade after 500-800 charge cycles, losing charge retention capacity.",
                "explanation_ar": "بطاريات الليثيوم تفقد سعتها التخزينية تدريجياً بعد 500 إلى 800 دورة شحن.",
                "is_hardware": True
            },
            {
                "title_en": "Charging Port Lint Accumulation or Pin Oxidation",
                "title_ar": "تراكم الأتربة في منفذ الشحن أو أكسدة الأسنان",
                "probability": 0.30,
                "explanation_en": "Pocket lint compresses inside USB-C/Lightning ports, preventing pins from seating properly.",
                "explanation_ar": "تتجمع الألياف والغبار داخل منفذ الشاحن فتمنع موصل الكابل من الوصول الكامل.",
                "is_hardware": True
            },
            {
                "title_en": "Faulty Power Adapter or Cable",
                "title_ar": "عطل في رأس الشاحن أو الكابل",
                "probability": 0.15,
                "explanation_en": "Damaged internal copper traces reduce charging current or fail handshake negotiation.",
                "explanation_ar": "تلف الأسلاك الداخلية في الكابل يؤدي لضعف التيار أو انقطاع الشحن.",
                "is_hardware": True
            }
        ],
        "steps": [
            {
                "step_number": 1,
                "title_en": "Test Alternative Verified Charger & Wall Outlet",
                "title_ar": "تجربة شاحن ومقبس كهربائي بديل",
                "instruction_en": "Use an original or certified cable and charging brick on a different electrical outlet.",
                "instruction_ar": "جرب استخدام كابل وشاحن أصليين موثوقين على مقبس حائط آخر للتأكد من مصدر المشكلة.",
                "requires_tools": False
            },
            {
                "step_number": 2,
                "title_en": "Clean Charging Port with Non-Conductive Probe",
                "title_ar": "تنظيف منفذ الشحن بأداة غير معدنية",
                "instruction_en": "Under bright light, gently use a wooden or plastic toothpick to extract lint from the port.",
                "instruction_ar": "استعن بإضاءة جيدة واستخدم عوداً خشبياً أو بلاستيكياً برفق لإزالة الأتربة العالقة داخل المنفذ.",
                "caution_en": "Never use metal needles or conductive pins that can short the charging pins.",
                "caution_ar": "إياك واستخدام إبرة معدنية حتى لا تحدث قفلة كهربائية بين أطراف المنفذ.",
                "requires_tools": True
            },
            {
                "step_number": 3,
                "title_en": "Check Battery Health Diagnostics",
                "title_ar": "فحص نسبة صحة البطارية",
                "instruction_en": "Check battery health in OS settings (iOS Settings -> Battery Health, or Android/Windows battery report). If below 75%, replacement is recommended.",
                "instruction_ar": "افحص صحة البطارية من إعدادات النظام، إذا كانت أقل من 75% فالبطارية بحاجة للاستبدال.",
                "requires_tools": False
            }
        ],
        "required_tools": ["Non-conductive Toothpick / Spudger", "Flashlight / Magnifier", "OEM Charging Cable"],
        "estimated_difficulty": "easy",
        "estimated_minutes": 15,
        "safety_warnings_en": ["Do not bend or force charging connectors. If the battery is swollen, stop immediately."],
        "safety_warnings_ar": ["لا تضغط بقوة على موصلات الشحن. إذا لاحظت انتفاخاً بالبطارية توقف فوراً."],
        "requires_technician": False
    },
    {
        "id": "kb_no_power_dead_device",
        "primary_symptoms": ["no_power"],
        "device_categories": ["Laptop", "Desktop Computer", "Smartphone", "Tablet"],
        "severity": "high",
        "base_confidence": 0.82,
        "causes": [
            {
                "title_en": "Depleted RTC / CMOS Battery or EC State Lockup",
                "title_ar": "تعليق وحدة التحكم المضمنة (EC) أو بطارية CMOS",
                "probability": 0.40,
                "explanation_en": "Embedded Controller is stuck in protective sleep state due to static charge accumulation.",
                "explanation_ar": "تعليق شريحة التحكم في حالة حماية بسبب الشحنات الكهربائية الساكنة.",
                "is_hardware": True
            },
            {
                "title_en": "Power Delivery Circuit or Motherboard Mosfet Short",
                "title_ar": "قصر كهربائي في دوائر تغذية الطاقة باللوحة الأم",
                "probability": 0.35,
                "explanation_en": "Blown capacitor or power MOSFET on the mainboard 19V/5V rails prevents system power-on.",
                "explanation_ar": "تلف في مكثف أو ترانزستور التغذية على خطوط الطاقة باللوحة الأم.",
                "is_hardware": True
            },
            {
                "title_en": "Faulty Power Button or Flex Cable",
                "title_ar": "عطل في زر التشغيل أو الكابل الشريطي",
                "probability": 0.25,
                "explanation_en": "Physical power button membrane worn out or disconnected from motherboard header.",
                "explanation_ar": "تلف زر التشغيل الفيزيائي أو انفصال شريط التوصيل عن اللوحة الأم.",
                "is_hardware": True
            }
        ],
        "steps": [
            {
                "step_number": 1,
                "title_en": "Perform Hardware Hard Reset (Power Drain)",
                "title_ar": "إجراء إعادة ضبط عتادي وتفريغ الشحنات",
                "instruction_en": "Unplug charger, disconnect internal battery if accessible, and hold power button down firmly for 30 seconds to drain capacitors.",
                "instruction_ar": "افصل الشاحن والبطارية، واضغط باستمرار على زر التشغيل لمدة 30 ثانية لتفريغ المكثفات من الشحنات الساكنة.",
                "requires_tools": False
            },
            {
                "step_number": 2,
                "title_en": "Inspect Charging Indicator LED",
                "title_ar": "ملاحظة مؤشر ضوء الشحن LED",
                "instruction_en": "Connect known-good charger and observe if the charge LED illuminates or blinks error codes.",
                "instruction_ar": "صل الشاحن وتأكد هل يضيء مؤشر الشحن أو يومض بنمط معين لتحديد رمز العطل.",
                "requires_tools": False
            },
            {
                "step_number": 3,
                "title_en": "Test RAM Reseating (Desktop/Laptops)",
                "title_ar": "إعادة تركيب شرائح الذاكرة العشوائية RAM",
                "instruction_en": "Remove RAM stick, clean gold contacts with pencil eraser, and reinstall in alternative slot.",
                "instruction_ar": "انزع شريحة الذاكرة RAM، ونظف أطرافها النحاسية بلطف ثم أعد تثبيتها بإحكام في المنفذ.",
                "requires_tools": True
            }
        ],
        "required_tools": ["Precision Screwdriver", "Multimeter (for Advanced Diagnosis)"],
        "estimated_difficulty": "hard",
        "estimated_minutes": 40,
        "safety_warnings_en": ["Do not touch high-voltage power supplies or internal capacitors with bare hands."],
        "safety_warnings_ar": ["تجنب ملامسة مكثفات مزود الطاقة المباشر بيديك دون عزل."],
        "requires_technician": True
    },
    {
        "id": "kb_slow_freezing_storage_degradation",
        "primary_symptoms": ["slow_performance", "storage_drive_failure"],
        "device_categories": ["Laptop", "Desktop Computer"],
        "severity": "medium",
        "base_confidence": 0.86,
        "causes": [
            {
                "title_en": "Mechanical HDD Sector Degradation or SSD Wear",
                "title_ar": "تلف قطاعات القرص الصلب الميكانيكي (Bad Sectors)",
                "probability": 0.60,
                "explanation_en": "Read/write heads encountering uncorrectable sector read errors, causing 100% disk usage freeze.",
                "explanation_ar": "وجود قطاعات تالفة بالقرص تؤدي لتجميد النظام واستهلاك القرص بنسبة 100%.",
                "is_hardware": True
            },
            {
                "title_en": "OS File System Corruption & Bloatware",
                "title_ar": "تلف ملفات النظام وتراكم البرامج الخلفية",
                "probability": 0.40,
                "explanation_en": "Excessive startup applications and unindexed system files exhausting available RAM.",
                "explanation_ar": "كثرة البرامج التي تعمل مع بدء التشغيل ونقص الذاكرة المتاحة.",
                "is_hardware": False
            }
        ],
        "steps": [
            {
                "step_number": 1,
                "title_en": "Check Disk SMART Health Status",
                "title_ar": "فحص الحالة الصحية للقرص عبر تقنية SMART",
                "instruction_en": "Run PowerShell command: 'wmic diskdrive get status' or run CrystalDiskInfo to check health.",
                "instruction_ar": "شغل أمر الفحص في موجه الأوامر للتأكد من عدم وجود تنبيهات خطر على صحة القرص.",
                "requires_tools": False
            },
            {
                "step_number": 2,
                "title_en": "Disable Unnecessary Startup Applications",
                "title_ar": "تعطيل برامج بدء التشغيل غير الضرورية",
                "instruction_en": "Open Task Manager -> Startup Apps tab. Disable third-party update checkers and high-impact apps.",
                "instruction_ar": "من إدارة المهام، ادخل تبويب بدء التشغيل وعطل البرامج الثانوية لتسريع الإقلاع.",
                "requires_tools": False
            },
            {
                "step_number": 3,
                "title_en": "Upgrade to Modern Solid State Drive (NVMe / SATA SSD)",
                "title_ar": "الترقية إلى قرص SSD سريع",
                "instruction_en": "Upgrading older spinning hard drives to an SSD provides up to 10x faster responsiveness.",
                "instruction_ar": "استبدال الأقراص الميكانيكية القديمة بقرص SSD يمنح الجهاز سرعة استجابة فائقة تصل لـ 10 أضعاف.",
                "requires_tools": True
            }
        ],
        "required_tools": ["Screwdriver", "External USB Drive for Backup"],
        "estimated_difficulty": "easy",
        "estimated_minutes": 25,
        "safety_warnings_en": ["Backup crucial personal data immediately if drive clicking sounds are heard."],
        "safety_warnings_ar": ["انسخ ملفاتك الهامة فوراً إذا سمعت أي صوت نقر أو تكتكة صادرة من القرص."],
        "requires_technician": False
    },
    {
        "id": "kb_screen_display_flicker",
        "primary_symptoms": ["screen_display_issue"],
        "device_categories": ["Smartphone", "Laptop", "Tablet"],
        "severity": "medium",
        "base_confidence": 0.84,
        "causes": [
            {
                "title_en": "Loose eDP / Display Flex Ribbon Cable",
                "title_ar": "ارتخاء كابل الشاشة الشريطي (Flex Cable)",
                "probability": 0.50,
                "explanation_en": "Hinge movement over time pulls or loosens the internal video ribbon connection.",
                "explanation_ar": "حركة مفصلات الشاشة المستمرة تؤدي لاهتزاز كابل نقل البيانات وتلاشي الصورة.",
                "is_hardware": True
            },
            {
                "title_en": "Damaged LCD/OLED Matrix or Backlight Inverter",
                "title_ar": "كسر أو تلف داخلي في لوحة الشاشة أو الإضاءة الخلفية",
                "probability": 0.35,
                "explanation_en": "Physical drop or pressure fracture damages internal pixel columns.",
                "explanation_ar": "تعرض الجهاز لضغط أو صدمة يؤدي لظهور خطوط ملونة أو انطفاء جزء من الشاشة.",
                "is_hardware": True
            },
            {
                "title_en": "Corrupted Display Graphics Driver",
                "title_ar": "تلف برنامج تشغيل بطاقة الرسوميات (Driver)",
                "probability": 0.15,
                "explanation_en": "Incompatible GPU driver update causing signal refresh rate mismatch.",
                "explanation_ar": "تحديث غير متوافق لكرت الشاشة يسبب وميضاً في التردد.",
                "is_hardware": False
            }
        ],
        "steps": [
            {
                "step_number": 1,
                "title_en": "External Monitor Output Test",
                "title_ar": "اختبار الشاشة على شاشة خارجية عبر HDMI",
                "instruction_en": "Connect laptop to TV or external monitor via HDMI. If external display is clean, GPU is healthy and issue is isolated to laptop screen panel/cable.",
                "instruction_ar": "صل الحاسوب بشاشة خارجية عبر كابل HDMI. إذا ظهرت الصورة طبيعية فالكرت سليم والمشكلة في شاشة اللابتوب نفسها أو كابلها.",
                "requires_tools": False
            },
            {
                "step_number": 2,
                "title_en": "Reinstall Clean Graphics Drivers (DDU)",
                "title_ar": "إعادة تثبيت نظيفة لبرنامج تشغيل كرت الشاشة",
                "instruction_en": "Reinstall graphics drivers from manufacturer website using safe mode if needed.",
                "instruction_ar": "قم بتنزيل أحدث تعريف رسمي لكرت الشاشة من موقع الشركة المصنعة وتثبيته.",
                "requires_tools": False
            }
        ],
        "required_tools": ["HDMI Cable", "External Monitor", "Plastic Opening Tools (if replacing screen)"],
        "estimated_difficulty": "moderate",
        "estimated_minutes": 35,
        "safety_warnings_en": ["Display panels are fragile glass. Do not twist or torque display frame."],
        "safety_warnings_ar": ["شاشات الأجهزة مصنوعة من زجاج رقيق، احذر الضغط القوي أو ثني الإطار."],
        "requires_technician": False
    }
]

def find_best_kb_match(symptoms: List[str], device_category: str) -> Dict[str, Any]:
    """
    Finds the highest matching knowledge base record based on symptom overlap and device category.
    """
    best_match = None
    highest_score = -1
    
    for record in KNOWLEDGE_BASE:
        # Category matching boost
        cat_match = 1.0 if (not record["device_categories"] or device_category in record["device_categories"] or "Other" in record["device_categories"]) else 0.5
        
        # Calculate Jaccard similarity between symptoms
        symptom_set = set(symptoms)
        kb_symptom_set = set(record["primary_symptoms"])
        overlap = len(symptom_set.intersection(kb_symptom_set))
        total = len(symptom_set.union(kb_symptom_set))
        jaccard = (overlap / total) if total > 0 else 0
        
        score = (jaccard * 0.7 + (overlap > 0) * 0.3) * cat_match
        
        if score > highest_score and overlap > 0:
            highest_score = score
            best_match = record
            
    # Default generic fallback if no specific match
    if not best_match:
        best_match = KNOWLEDGE_BASE[0]  # Overheating / general hardware
        
    return best_match
