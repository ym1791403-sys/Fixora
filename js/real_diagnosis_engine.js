// =============================================================================
// FIXORA DYNAMIC REAL-DATA DIAGNOSIS ENGINE (v3.2)
// Powered by: Open Repair Alliance (416k records), MyFixit (18k guides), Backblaze
// Dynamic multi-category symptom extraction, root causes & verified repair methods
// =============================================================================

(function (window) {
  'use strict';

  var KNOWLEDGE_BASE = {
    // 1. SMARTPHONE
    "Smartphone": {
      "screen": {
        causes: [
          {
            title_ar: "تلف مجمع الشاشة الرقمية ولوحة OLED/LCD وكسر كابل الإشارة المرن",
            title_en: "OLED/LCD Digitizer Assembly Damage & Flex Cable Tear",
            probability: 0.72,
            explanation_ar: "السقوط أو الضغط الميكانيكي يؤدي لكسر الزجاج الداخلي أو انفصال مسارات الإشارة الرقمية مما يسبب خطوطاً أو شاشة سوداء تماماً.",
            explanation_en: "Impact drops cause internal substrate fracture or flex cable trace separation, leading to black screens, touch deadzones, or vertical lines.",
            repair_method_ar: "طريقة التصليح المعتمدة: تدفئة حواف الشاشة بوسادة تسخين عند 80°C لتليين الغراء، رفع الشاشة بملقط شفط iSclack، فصل فلاتة البطارية فوراً، ثم نقل مستشعر القرب وكاميرا السيلفي وتثبيت الشاشة الجديدة بشريط عزل B-7000 مقاوم للماء والغبار.",
            repair_method_en: "Repair Method: Soften perimeter adhesive at 80°C, lift display with iSclack suction tool, immediately disconnect battery flex, transfer ear-speaker assembly, and mount replacement OEM panel with waterproof B-7000 seal.",
            is_hardware: true
          },
          {
            title_ar: "انفصال موصل شاشة اللمس FPC عن اللوحة الأم",
            title_en: "Loose Display FPC Connector Socket on Motherboard",
            probability: 0.28,
            explanation_ar: "الارتطام الشديد قد يؤدي لانفلات قفل موصل الشاشة FPC جزئياً دون كسر لوحة الزجاج نفسها.",
            explanation_en: "Violent drops can unseat the press-fit board-to-board FPC connector, causing intermittent signal loss without physical panel damage.",
            repair_method_ar: "طريقة التصليح المعتمدة: فك الواجهة الخلفية أو الشاشة، معاينة موصل FPC بعدسة مكبرة للتأكد من سلامة الأسنان الذهبية، ثم إعادة كبس الموصل بإحكام ووضع وسادة سيليكون داعمة فوقه.",
            repair_method_en: "Repair Method: Disassemble housing, inspect FPC connector pins under magnification, firmly reseat socket until audible click, and apply anti-vibration silicone pad before reassembly.",
            is_hardware: true
          }
        ],
        steps: [
          {
            step_number: 1,
            title_ar: "معاينة استجابة اللمس والشاشة تحت ضوء مائل",
            title_en: "Visual & Touch Surface Inspection",
            instruction_ar: "سلط ضوءاً مائلاً على الشاشة للتأكد من عدم وجود شروخ تحتية دقيقة في طبقة OLED، واختبر استجابة الاهتزاز عند الاتصال.",
            instruction_en: "Shine angled light across the surface to check for hairline internal OLED substrate cracks; verify haptic feedback when dialing.",
            requires_tools: false
          },
          {
            step_number: 2,
            title_ar: "فك واستبدال لوحة الشاشة وفلاتة التوصيل",
            title_en: "Display Assembly Replacement",
            instruction_ar: "سخن الحواف بمسدس حراري أو وسادة تسخين عند 80° مئوية، ارفع اللوحة برفق، وافصل البطارية قبل لمس كابلات الشاشة.",
            instruction_en: "Warm edges with heat pad at 80°C, gently pry open with suction cup and spudger, disconnect battery before swapping display assembly.",
            requires_tools: true
          }
        ],
        tools: ["iSclack Suction Tool", "Heat Pad / Heat Gun", "Plastic Opening Picks", "Pentalobe Screwdriver", "B-7000 Glue"],
        difficulty: "moderate",
        minutes: 40
      },
      "battery": {
        causes: [
          {
            title_ar: "تراجع خلايا الليثيوم كيميائياً (Health < 80%) أو ارتفاع المقاومة الداخلية",
            title_en: "Chemical Battery Cell Degradation & High Internal Resistance",
            probability: 0.75,
            explanation_ar: "تكرار دورات الشحن السريع واستخدام الهاتف أثناء الشحن يسرع انهيار مهبط الليثيوم مما يؤدي للهبوط المفاجئ للشحن من 40% إلى الصفر.",
            explanation_en: "Lithium-ion cells degrade after 500+ charge cycles; cathode degradation increases internal resistance, causing voltage drops and premature shutdowns.",
            repair_method_ar: "طريقة التصليح المعتمدة: إزالة الواجهة الخلفية، سحب أشرطة التثبيت المطاطية السفلية برفق بزاوية أفقية 15° دون ثقب البطارية، تركيب بطارية أصلية جديدة مع شريط تثبيت أصلي، وإجراء دورة معايرة كاملة (0% إلى 100%).",
            repair_method_en: "Repair Method: Remove back panel, pull stretch-release adhesive strips horizontally at 15° without puncturing cell, insert new certified OEM battery, and calibrate with a full 0-100% uninterrupted charge cycle.",
            is_hardware: true
          },
          {
            title_ar: "تراكم الوبر والأتربة المضغوطة داخل منفذ الشحن USB-C / Lightning",
            title_en: "Compressed Pocket Lint & Debris in Charging Port",
            probability: 0.25,
            explanation_ar: "دخول وبر الجيب يمنع كابل الشاحن من الدخول للنهاية مما يمنع التلامس الكهربائي ويظهر كعطل بالبطارية.",
            explanation_en: "Pocket lint gets compacted at the port bottom, preventing charging cable pins from making solid physical contact with the charging pins.",
            repair_method_ar: "طريقة التصليح المعتمدة: تسليط كشاف قوي، واستخدام عود خشبي مدبب أو أداة بلاستيكية غير موصلة لاستخراج الوبر المضغوط برفق دون خدش سنون التوصيل النحاسية، ثم رش رذاذ منظف إلكترونيات جاف.",
            repair_method_en: "Repair Method: Illuminate port with high-CRI flashlight, use a non-conductive wooden or plastic probe to sweep out compacted lint without bending gold pins, then clean contacts with quick-drying contact cleaner.",
            is_hardware: true
          }
        ],
        steps: [
          {
            step_number: 1,
            title_ar: "معاينة منفذ الشحن وتنظيف الأوساخ العالقة",
            title_en: "Port Inspection & Mechanical Cleaning",
            instruction_ar: "تأكد من عدم وجود شوائب تمنع الشاحن من الاستقرار، وجرب شاحناً أصلياً وكابلاً معتمداً آخر.",
            instruction_en: "Check charging port with flashlight for debris preventing cable plug engagement; test with a known certified cable and adapter.",
            requires_tools: false
          },
          {
            step_number: 2,
            title_ar: "استبدال بطارية الليثيوم أيون الداخلية",
            title_en: "Battery Replacement Procedure",
            instruction_ar: "افتح الجهاز بحذر، اسحب شريط اللصق المطاطي المزدوج أسفل البطارية، ثم ثبت البطارية الجديدة المعتمدة واعد إغلاق الجهاز.",
            instruction_en: "Disassemble housing, peel adhesive pull-tabs, lift old cell safely, secure replacement battery with OEM adhesive strips.",
            requires_tools: true
          }
        ],
        tools: ["Plastic Spudger", "Wooden Probe", "Precision Screwdrivers", "Battery Adhesive Strips"],
        difficulty: "moderate",
        minutes: 30
      },
      "power": {
        causes: [
          {
            title_ar: "عطل دائرة تنظيم وإدارة الطاقة (Power Management IC - PMIC)",
            title_en: "Power Management IC (PMIC) or Shorted Motherboard Rail",
            probability: 0.68,
            explanation_ar: "الشواحن غير المعتمدة أو الصدمات الكهربائية تسبب تلف مكثفات التنعيم التابعة لخط VDD_MAIN مما يؤدي لانقطاع الطاقة تماماً عن المعالج.",
            explanation_en: "Voltage spikes from counterfeit chargers cause short circuits in SMD ceramic capacitors along the primary power rail (VDD_MAIN), cutting power to CPU.",
            repair_method_ar: "طريقة التصليح المعتمدة: توصيل الهاتف بمقياس USB Power Meter لقياس سحب الأمبير (Amperage Draw)، فحص نقاط الاختبار بمقياس الملتيميتر لتحديد المكثف المقصور، ورفعه بكاوية اللحام أو استبدال شريحة PMIC بمحطة لحام بالهواء الساخن.",
            repair_method_en: "Repair Method: Connect phone to USB Power Meter to observe current draw, probe test points with multimeter to identify shorted SMD caps on primary rail, and replace faulty PMIC using SMD hot air rework station.",
            is_hardware: true
          },
          {
            title_ar: "انهيار نظام التشغيل في وضع الاسترداد المتجمد (Bootloop / DFU Mode)",
            title_en: "Corrupted Firmware / Boot Partition Loop",
            probability: 0.32,
            explanation_ar: "امتلاء ذاكرة التخزين بنسبة 100% أو فشل تحديث OTA يمنع نظام التشغيل من تحميل ملفات النواة (Kernel).",
            explanation_en: "100% full storage or interrupted OTA firmware updates corrupt file system partition metadata, trapping device in bootloader loop.",
            repair_method_ar: "طريقة التصليح المعتمدة: إدخال الهاتف وضع DFU / Recovery، توصيله بالكمبيوتر، وإجراء تفليش نظيف للنظام مع محاولة الاحتفاظ بالبيانات باستخدام برامج الصيانة الرسمية.",
            repair_method_en: "Repair Method: Put phone into Recovery/DFU mode, connect to host workstation, and perform clean firmware flash/reinstall using vendor utility.",
            is_hardware: false
          }
        ],
        steps: [
          {
            step_number: 1,
            title_ar: "إجراء إعادة تشغيل إجباري (Hard Reset)",
            title_en: "Forced Hardware Reset",
            instruction_ar: "اضغط على زر رفع الصوت ثم خفض الصوت ثم استمر بالضغط على زر الباور لمدة 20 ثانية حتى يظهر الشعار.",
            instruction_en: "Press Volume Up, Volume Down, then hold Power button continuously for 20 seconds to force hardware power cycle.",
            requires_tools: false
          },
          {
            step_number: 2,
            title_ar: "فحص سحب التيار واختبار الفولتية",
            title_en: "Current Draw & Motherboard Testing",
            instruction_ar: "قس سحب التيار بجهاز USB Tester للتحقق مما إذا كان المعالج يتعرف على الشاحن أو يعاني من قصر أرضي.",
            instruction_en: "Measure charging current draw with USB Power Meter to diagnose short-circuit or PMIC communication fault.",
            requires_tools: true
          }
        ],
        tools: ["USB Power Meter", "Digital Multimeter", "Soldering Station", "Precision Screwdrivers"],
        difficulty: "hard",
        minutes: 45
      },
      "liquid": {
        causes: [
          {
            title_ar: "أكسدة وتكلس مسارات التوصيل باللوحة الأم نتيجة تسرب السوائل",
            title_en: "Corrosion & Electrolytic Bridging from Liquid Ingress",
            probability: 0.85,
            explanation_ar: "دخول الماء أو السوائل مع وجود تيار كهربائي يسرع التآكل الكهروكيميائي لمسارات النحاس وقصدير الدوائر المتكاملة.",
            explanation_en: "Liquid exposure under active battery voltage triggers rapid electrolytic corrosion, forming dendritic bridges across solder balls and power rails.",
            repair_method_ar: "طريقة التصليح المعتمدة: فصل البطارية فوراً وعدم محاولة تشغيل الجهاز، تفكيك اللوحة الأم، إزالة الدروع المعدنية (EMI Shields)، غمر اللوحة في حمام تنظيف بالموجات فوق الصوتية (Ultrasonic Bath) مع كحول أيزوبروبيلي 99.9%، وتجفيفها تحت حرارة 65°C قبل إعادة الاختبار.",
            repair_method_en: "Repair Method: Immediately disconnect battery, strip motherboard, desolder EMI shields, wash in ultrasonic bath with 99.9% isopropyl alcohol for 15 minutes, dry in thermal chamber at 65°C, and resolder corroded passive components.",
            is_hardware: true
          }
        ],
        steps: [
          {
            step_number: 1,
            title_ar: "إيقاف التشغيل الفوري وفصل مصدر الطاقة",
            title_en: "Immediate Power Cut",
            instruction_ar: "لا تحاول شحن الجهاز نهائياً. لا تضعه في الأرز (الأرز يزيد التكلس). احتفظ به مطفأً تماماً.",
            instruction_en: "Do NOT charge or power on the device. Never put in rice (starch accelerates corrosion). Keep unpowered.",
            requires_tools: false
          },
          {
            step_number: 2,
            title_ar: "التنظيف الكيميائي بالموجات فوق الصوتية",
            title_en: "Ultrasonic Chemical Decontamination",
            instruction_ar: "فك اللوحة الأم ونظف آثار التملح بكحول أيزوبروبيلي 99% وفرشاة مضادة للشحنات الساكنة.",
            instruction_en: "Disassemble motherboard, scrub salt residues with 99% isopropyl alcohol and ESD-safe brush, or ultrasonic bath.",
            requires_tools: true
          }
        ],
        tools: ["Ultrasonic Cleaner", "99.9% Isopropyl Alcohol", "ESD Brush", "Precision Screwdrivers"],
        difficulty: "hard",
        minutes: 60
      }
    },

    // 2. LAPTOP
    "Laptop": {
      "thermal": {
        causes: [
          {
            title_ar: "جفاف المعجون الحراري وانسداد زعانف المبرد بالأتربة والوبر",
            title_en: "Dried CPU/GPU Thermal Compound & Dust Blanket on Heat Fins",
            probability: 0.76,
            explanation_ar: "تسحب مراوح اللابتوب الأتربة التي تشكل سدادة غبار تسد مجاري الهواء، بينما يتحجر المعجون الحراري القديم ويفقد قدرته على نقل الحرارة لمشتت النحاس.",
            explanation_en: "Intake fans accumulate lint into a solid felt-like blanket across heatsink exhaust fins; degraded thermal paste dries out, inducing severe thermal throttling.",
            repair_method_ar: "طريقة التصليح المعتمدة: فك الغطاء السفلي وفصل البطارية، فك مسامير أنابيب التبريد النحاسية بالترتيب العكسي (4-3-2-1)، إزالة المعجون المتحجر بكحول أيزوبروبيلي 99%، تنظيف ريش المروحة والزعانف بهواء مضغوط، ثم وضع طبقة متجانسة من معجون حراري عالي التوصيل (Thermal Grizzly أو Arctic MX-4).",
            repair_method_en: "Repair Method: Remove base cover, disconnect internal battery, unscrew heatsink in reverse order (4-3-2-1), dissolve old paste with 99% isopropyl alcohol, blow lint out of fin stack with compressed air, and apply premium high-viscosity thermal paste (MX-4 / Kryonaut).",
            is_hardware: true
          },
          {
            title_ar: "تآكل أو عطل محرك مروحة التبريد (Bearing Lubricant Depletion)",
            title_en: "Exhaust Fan Motor Bearing Wear / RPM Failure",
            probability: 0.24,
            explanation_ar: "جفاف زيت التزييت داخل قلب المروحة يسبب صوتاً مزعجاً أو توقف المروحة عن الوصول لسرعة الدوران المطلوبة لتبريد المعالج.",
            explanation_en: "Bearing lubricant breakdown produces friction rattle and limits maximum RPM below the threshold required to handle full CPU/GPU loads.",
            repair_method_ar: "طريقة التصليح المعتمدة: فك مروحة التبريد، فحص حرية دوران الشفرات يدوياً، تنظيف المحور وإعادة تزييته بقطرة زيت ماكينات دقيق أو استبدال مروحة التبريد بمروحة جديدة أصلية.",
            repair_method_en: "Repair Method: Unscrew fan casing, check for bearing wobble, lubricate with high-grade synthetic oil or replace with an authentic OEM fan assembly.",
            is_hardware: true
          }
        ],
        steps: [
          {
            step_number: 1,
            title_ar: "معاينة فتحات التهوية وتنظيف الغطاء الخارجي",
            title_en: "External Vent & Airflow Inspection",
            instruction_ar: "تأكد من عدم وجود عوائق تغطي فتحات الشفط السفلية واحرص على استخدام الجهاز على سطح مستوٍ صلب.",
            instruction_en: "Ensure underside intake grilles are unobstructed; elevate laptop slightly or use on a hard, flat surface.",
            requires_tools: false
          },
          {
            step_number: 2,
            title_ar: "تجديد المعجون الحراري وتنظيف المشتت النحاسي",
            title_en: "Heatsink Servicing & Thermal Paste Re-application",
            instruction_ar: "افتح الجهاز، اخلع مشتت الحرارة النحاسي، نظف المعجون القديم بالكحول، ضع نقطة بحجم حبة البازلاء من المعجون الجديد.",
            instruction_en: "Open back cover, disconnect battery, unseat copper heatsink, strip dried paste with alcohol, apply pea-sized dot of fresh thermal compound.",
            requires_tools: true
          }
        ],
        tools: ["Phillips #00 Screwdriver", "Compressed Air Can", "Arctic MX-4 Thermal Paste", "99% Isopropyl Alcohol", "Pry Tool"],
        difficulty: "moderate",
        minutes: 35
      },
      "battery": {
        causes: [
          {
            title_ar: "استهلاك خلايا بطارية الليثيوم بوليمر وتجاوز عمرها الافتراضي (> 800 دورة)",
            title_en: "Lithium-Polymer Cell Wear & Premature Cell Inbalance",
            probability: 0.72,
            explanation_ar: "تفقد البطارية قدرتها على الاحتفاظ بالشحنة الكهربائية نتيجة تراجع خلاياها الكيميائية، أو انتفاخها نتيجة غازات التفاعل الكيميائي.",
            explanation_en: "Prolonged charge cycling creates cell impedance imbalances, severely reducing usable watt-hour capacity and risking dangerous pouch swelling.",
            repair_method_ar: "طريقة التصليح المعتمدة: إيقاف تشغيل اللابتوب، فك مسامير القاعدة السفلية، فصل موصل البطارية عن المازربورد أولاً، إزالة براغي تثبيت البطارية ورفعها، وتركيب بطارية جديدة معتمدة وإجراء دورة معايرة كاملة.",
            repair_method_en: "Repair Method: Shut down system, remove bottom cover, detach battery cable harness from motherboard header, extract retaining screws, install certified OEM battery replacement, and perform power calibration.",
            is_hardware: true
          },
          {
            title_ar: "تلف أسنان أو لحامات منفذ الشحن DC Jack / USB-C PD",
            title_en: "Fractured DC Power Jack or Damaged USB-C PD Receptacle",
            probability: 0.28,
            explanation_ar: "الشد المتكرر لكابل الشاحن أو سقوطه أثناء الاتصال يسبب كسر اللحام الداخلي أو تشوه شريحة التوصيل لمنفذ الطاقة.",
            explanation_en: "Mechanical strain on power barrel jack or USB-C connector causes micro-fractures in solder joints on the charging sub-board.",
            repair_method_ar: "طريقة التصليح المعتمدة: فحص منفذ الشحن للتأكد من عدم اهتزازه، واستبدال ضفيرة كابل DC Jack المتصلة بمقبس أو إعادة لحام أرجل المنفذ على المازربورد بمحطة لحام.",
            repair_method_en: "Repair Method: Test socket wobble, replace modular wire-harness DC jack module or resolder cracked through-hole connector pins with lead-free solder.",
            is_hardware: true
          }
        ],
        steps: [
          {
            step_number: 1,
            title_ar: "فحص شاحن اللابتوب ومصباح مؤشر الشحن",
            title_en: "Charger & Power LED Triage",
            instruction_ar: "تأكد من إضاءة مؤشر الشاحن ومن عدم وجود قطع في كابل المحول الكهربائي.",
            instruction_en: "Verify adapter status indicator light and check cord for kinks, shorts, or loose barrel tips.",
            requires_tools: false
          },
          {
            step_number: 2,
            title_ar: "استبدال وحدة البطارية الداخلية",
            title_en: "Battery Swapping Procedure",
            instruction_ar: "انزع الغطاء السفلي، افصل فيشة البطارية، فك مسامير التثبيت واستبدل البطارية بوحدة أصلية جديدة.",
            instruction_en: "Unscrew lower case, detach battery harness, remove bracket screws, drop in replacement pack and secure.",
            requires_tools: true
          }
        ],
        tools: ["Phillips #00 & Torx T5 Screwdrivers", "Plastic Opening Tool", "Replacement Battery"],
        difficulty: "easy",
        minutes: 25
      },
      "screen": {
        causes: [
          {
            title_ar: "تلف أو انثناء كابل الشاشة المرن (eDP Display Cable) عند مفصلة اللابتوب",
            title_en: "eDP Video Ribbon Cable Fracture at Hinge Joint",
            probability: 0.68,
            explanation_ar: "فتح وإغلاق غطاء اللابتوب آلاف المرات يؤدي لضغط كابل الفيديو الدقيق عند نقطة المفصلة، مسبباً وميضاً أو خطوطاً أو اختفاء الإضاءة.",
            explanation_en: "Repeated hinge cycling subjects delicate internal micro-coaxial eDP wiring to cyclical bending fatigue, breaking high-speed differential signal lanes.",
            repair_method_ar: "طريقة التصليح المعتمدة: فك إطار الشاشة بحذر، تحرير مسار كابل eDP عند المفصلة، فحص كابل الشاشة والتأكد من تثبيت قفل الموصل خلف الشاشة، واستبدال الكابل بقطعة غيار مطابقة للتردد وعدد السنون (30-pin أو 40-pin).",
            repair_method_en: "Repair Method: Unsnap display bezel, free cable from hinge routing channel, verify tape latch on panel eDP connector, or replace entire harness with matching pin-count cable (30-pin FHD / 40-pin 4K).",
            is_hardware: true
          },
          {
            title_ar: "كسر طبقة الكريستال السائل الداخلية في شاشة اللابتوب (LCD Matrix Crack)",
            title_en: "Internal Liquid Crystal Substrate Fracture",
            probability: 0.32,
            explanation_ar: "إغلاق اللابتوب مع وجود قلم أو شاحن فوق لوحة المفاتيح يسبب كسر مصفوفة الزجاج الداخلية وتسرب حبر الكريستال.",
            explanation_en: "Foreign objects trapped on keyboard during lid closure pinch LCD glass, causing black liquid crystal bleeds and permanent bar artifacts.",
            repair_method_ar: "طريقة التصليح المعتمدة: فك إطار الشاشة، سحب أشرطة التثبيت المطاطية (Pull-tabs)، فصل كابل eDP القديم، وتركيب لوحة شاشة IPS جديدة مطابقة لرقم الموديل وعدد الهرتز وأماكن التثبيت.",
            repair_method_en: "Repair Method: Remove bezel, pull screen stretch-release tape, disconnect 30/40-pin eDP connector, and install exact matching IPS panel variant.",
            is_hardware: true
          }
        ],
        steps: [
          {
            step_number: 1,
            title_ar: "اختبار إخراج الفيديو عبر شاشة خارجية (HDMI Test)",
            title_en: "External Monitor Differential Test",
            instruction_ar: "صل اللابتوب بشاشة خارجية عبر كابل HDMI. إذا ظهرت الصورة طبيعية فالشاشة الداخلية أو كابلها هو مصدر الخلل.",
            instruction_en: "Connect to TV or monitor via HDMI. A crisp external picture confirms GPU is working and fault is isolated to internal screen/cable.",
            requires_tools: false
          },
          {
            step_number: 2,
            title_ar: "استبدال شاشة اللابتوب أو كابل العرض",
            title_en: "Display Panel / Cable Replacement",
            instruction_ar: "انزع الإطار البلاستيكي، اسحب شريط الشاشة، ركب الشاشة الجديدة وأعد لصق شريط الحماية.",
            instruction_en: "Unclip screen bezel, release adhesive strips, disconnect eDP cable, seat new panel and reapply retention tape.",
            requires_tools: true
          }
        ],
        tools: ["Plastic Pry Tool", "Precision Screwdriver Set", "Anti-static Tweezers"],
        difficulty: "moderate",
        minutes: 30
      },
      "boot_storage": {
        causes: [
          {
            title_ar: "تلف قطاع الإقلاع EFI أو انهيار جدول ملفات نظام التشغيل (BSOD / Boot Failure)",
            title_en: "Corrupted EFI Boot Partition / BCD Store or Driver Crash",
            probability: 0.70,
            explanation_ar: "الانقطاع المفاجئ للطاقة أثناء تحديثات النظام يفسد فهرس ملفات الإقلاع أو برامج التشغيل الأساسية مما يسبب ظهور الشاشة الزرقاء أو عدم العثور على قرص الإقلاع.",
            explanation_en: "Sudden power cuts during OS kernel updates corrupt Master Boot Record / EFI bootloader partition, producing STOP error BSOD loops.",
            repair_method_ar: "طريقة التصليح المعتمدة: الإقلاع من وحدة USB لتثبيت النظام، تشغيل موجه الأوامر (CMD) وتنفيذ أوامر إصلاح الإقلاع (bootrec /fixmbr ثم bootrec /rebuildbcd)، أو عمل فحص SFC /scannow وإصلاح الملفات التالفة دون فقدان البيانات الشخصية.",
            repair_method_en: "Repair Method: Boot from Windows Installation Media, access Command Prompt in Advanced Troubleshooting, execute 'bootrec /fixmbr' and 'bootrec /rebuildbcd', or run DISM / Online / Cleanup-Image restore.",
            is_hardware: false
          },
          {
            title_ar: "تدهور رقاقات الذاكرة الوميضية لوحدة M.2 NVMe SSD",
            title_en: "Degraded M.2 NVMe SSD Controller or NAND Flash Exhaustion",
            probability: 0.30,
            explanation_ar: "وصول وحدات NAND Flash لنهاية عدد دورات الكتابة (TBW) أو تلف وحدة التحكم نتيجة الحرارة العالية يمنع قراءة البيانات.",
            explanation_en: "Exhaustion of NAND write endurance cycles or thermal degradation of SSD controller chips leads to persistent read-only or unrecognized disk state.",
            repair_method_ar: "طريقة التصليح المعتمدة: فك اللابتوب، نزع قرص NVMe SSD، استبداله بوحدة PCIe Gen4 سريعة جديدة، وتثبيت نظام التشغيل من الصفر مع استرداد البيانات من القرص القديم عبر قارئ NVMe USB خارجي.",
            repair_method_en: "Repair Method: Disassemble laptop, unscrew M.2 NVMe retaining screw, insert replacement high-speed PCIe SSD, reinstall clean operating system, and recover files via external NVMe enclosure.",
            is_hardware: true
          }
        ],
        steps: [
          {
            step_number: 1,
            title_ar: "الدخول لبيئة الاسترداد وإصلاح الإقلاع التلقائي",
            title_en: "Windows Recovery Environment Startup Repair",
            instruction_ar: "شغل الجهاز واضغط F8 أو اقطع التشغيل مرتين متتاليتين للدخول إلى Automatic Repair واختيار إصلاح بدء التشغيل.",
            instruction_en: "Interrupt boot twice to access Windows Recovery Environment, select 'Startup Repair' to rebuild corrupted system registry hives.",
            requires_tools: false
          },
          {
            step_number: 2,
            title_ar: "فحص القرص أو استبدال وحدة التخزين M.2",
            title_en: "Storage Replacement / Clean Installation",
            instruction_ar: "افتح غطاء اللابتوب، ركب قرص M.2 NVMe جديد، وثبت نظام التشغيل من فلاشة USB Boot.",
            instruction_en: "Unscrew base cover, seat new M.2 NVMe drive into PCIe slot, tighten screw and initiate clean OS installation from bootable USB.",
            requires_tools: true
          }
        ],
        tools: ["USB Boot Drive (Windows/Ubuntu)", "Phillips #0 Screwdriver", "NVMe External Adapter"],
        difficulty: "moderate",
        minutes: 35
      }
    },

    // 3. DESKTOP COMPUTER
    "Desktop Computer": {
      "power": {
        causes: [
          {
            title_ar: "عطل خطوط الفولتية أو تلف مكثفات مزود الطاقة (Power Supply Unit - PSU)",
            title_en: "PSU Rail Failure or Blown Power Stage Capacitors",
            probability: 0.72,
            explanation_ar: "تذبذب التيار الكهربائي يسبب تلف دارة التبديل الداخلية أو تفحم مكثفات خط 12V المسؤول عن تغذية المعالج وبطاقة الرسوميات.",
            explanation_en: "Grid voltage spikes overload transient filters or rupture electrolytic smoothing capacitors along the vital +12V rail supplying CPU and GPU.",
            repair_method_ar: "طريقة التصليح المعتمدة: فحص موصل 24-Pin بمختبر مزودات الطاقة (PSU Tester) أو قصر السلك الأخضر بالسلك الأسود (Paperclip Test)، قياس خطوط +12V و +5V و +3.3V بمقياس الملتيميتر، واستبدال مزود الطاقة بوحدة 80 Plus معتمدة ومحمية.",
            repair_method_en: "Repair Method: Conduct paperclip test on 24-pin ATX plug (green wire to ground), verify +12V/+5V tolerances with digital multimeter, and swap out failed unit with an 80+ Gold rated power supply.",
            is_hardware: true
          },
          {
            title_ar: "قصر في مكثفات تغذية المعالج VRM على اللوحة الأم",
            title_en: "Short-circuited VRM MOSFET on Motherboard",
            probability: 0.28,
            explanation_ar: "احتراق أحد ترانزستورات MOSFET في دائرة تنظيم جهد المعالج يمنع مزود الطاقة من الإقلاع لحماية المكونات من الاحتراق.",
            explanation_en: "Short-circuit breakdown of high-side VRM MOSFETs triggers immediate PSU over-current protection (OCP), preventing board startup.",
            repair_method_ar: "طريقة التصليح المعتمدة: فصل كابل 8-Pin CPU من المازربورد وإعادة التجربة؛ إذا دارت المراوح فالعطل في ترانزستورات VRM ويتم تحديد الترانزستور المقصور بالملتيميتر واستبداله بمحطة لحام بالهواء الساخن.",
            repair_method_en: "Repair Method: Detach EPS 8-pin CPU cable; if fans spin, VRM high-side MOSFET is shorted to ground; identify failed phase with multimeter continuity test and resolder new MOSFET.",
            is_hardware: true
          }
        ],
        steps: [
          {
            step_number: 1,
            title_ar: "تفريغ الشحنات الكهربائية الراكدة (Power Drain)",
            title_en: "Residual Static Energy Drain",
            instruction_ar: "افصل كابل الكهرباء تماماً، اضغط على زر الباور في الكيسة لمدة 30 ثانية لتفريغ شحنات المكثفات، ثم أعد التوصيل.",
            instruction_en: "Unplug main AC power cord, hold down chassis power button for 30 seconds to discharge all residual motherboard capacitance, then reconnect.",
            requires_tools: false
          },
          {
            step_number: 2,
            title_ar: "فحص مزود الطاقة واستبداله",
            title_en: "Power Supply Diagnosis & Swap",
            instruction_ar: "افصل كابلات مزود الطاقة من اللوحة الأم وكارت الشاشة، وافحص مخرجات الفولتية بمختبر الباور.",
            instruction_en: "Disconnect all internal modular PSU cables, verify output voltages with digital PSU tester, replace with certified unit.",
            requires_tools: true
          }
        ],
        tools: ["Digital Multimeter / PSU Tester", "Phillips #2 Screwdriver", "Anti-static Wrist Strap"],
        difficulty: "moderate",
        minutes: 30
      },
      "ram_gpu": {
        causes: [
          {
            title_ar: "أكسدة أطراف توصيل الذاكرة العشوائية (RAM) أو عدم إحكام تثبيتها في شقوق DIMM",
            title_en: "Oxidized RAM Edge Contacts / Poor DIMM Socket Seating",
            probability: 0.65,
            explanation_ar: "تجمع الأتربة أو الرطوبة يسبب عزل التوصيل بين سنون الرام الذهبية وشق اللوحة الأم، مما يسبب صفارات تحذيرية أو شاشة سوداء مع دوران المراوح.",
            explanation_en: "Surface oxidation or microscopic debris on gold contact fingers prevents reliable high-frequency DDR communication, halting BIOS POST with memory error codes.",
            repair_method_ar: "طريقة التصليح المعتمدة: فك شرائح الذاكرة، مسح الأطراف النحاسية بممحاة ناعمة نظيفة أو مسحة كحول أيزوبروبيلي لإزالة الأكسدة، نفخ شقوق DIMM بهواء مضغوط، ثم إعادة تثبيت الشرائح في المنفذين الثاني والرابع (Slots 2 & 4) حتى سماع صوت قفل المزالج.",
            repair_method_en: "Repair Method: Extract RAM sticks, polish gold edge connectors with soft white vinyl eraser or 99% alcohol swab, blast DIMM sockets with compressed air, and firmly seat into slots 2 and 4 until latches click.",
            is_hardware: true
          },
          {
            title_ar: "عدم استقرار كارت الشاشة في شق PCIe أو تدهور تعريفات الفيديو",
            title_en: "Loose PCIe GPU Seating or Corrupted Display Driver Stack",
            probability: 0.35,
            explanation_ar: "ثقل كارت الشاشة الكبير يسبب انحناءه (GPU Sag) مما يفكك التلامس مع شق PCIe x16، أو تسبب التعريفات القديمة توقف إشارة الفيديو.",
            explanation_en: "Heavy modern graphics cards suffer PCB sag that pulls pins out of PCIe slot alignment; corrupted driver registries cause TDR crashes and black screen hangs.",
            repair_method_ar: "طريقة التصليح المعتمدة: فك برغي تثبيت كارت الشاشة، تحرير مزلاج PCIe، تنظيف الشق، إعادة تثبيت الكارت بإحكام مع كابلات طاقة PCIe 8-Pin مخصصة ومستقلة، واستخدام حامل داعم للبطاقة (GPU Anti-Sag Bracket)، مع تنظيف التعريفات ببرنامج DDU.",
            repair_method_en: "Repair Method: Release PCIe retention latch, clean slot, reseat GPU firmly, tighten bracket screws, attach dedicated non-daisy-chained PCIe cables, install anti-sag support pillar, and clean-install drivers with DDU.",
            is_hardware: true
          }
        ],
        steps: [
          {
            step_number: 1,
            title_ar: "إعادة تعيين إعدادات اللوحة الأم (Clear CMOS)",
            title_en: "Clear CMOS / BIOS Reset",
            instruction_ar: "انزع بطارية CR2032 الدائرية من اللوحة الأم لمدة 5 دقائق لإعادة ضبط إعدادات الفولتية وتردد الرامات التلقائي.",
            instruction_en: "Remove CR2032 coin battery from motherboard for 5 minutes with AC power disconnected to clear BIOS memory timings and profiles.",
            requires_tools: false
          },
          {
            step_number: 2,
            title_ar: "تنظيف وإعادة تثبيت الذاكرة وبطاقة الشاشة",
            title_en: "Reseat RAM & Graphics Card",
            instruction_ar: "انزع الرامات ونظفها بممحاة رصاص، أعد تركيبها بحزم، ثم تأكد من قفل مزلاج كارت الشاشة بإحكام.",
            instruction_en: "Clean gold contacts with eraser, blow out slots with air, reinsert RAM firmly into primary dual-channel slots, and verify GPU latch engagement.",
            requires_tools: true
          }
        ],
        tools: ["Compressed Air", "Soft Rubber Eraser", "Phillips Screwdriver", "DDU Tool"],
        difficulty: "easy",
        minutes: 20
      }
    },

    // 4. GAMING CONSOLE
    "Gaming Console": {
      "hdmi": {
        causes: [
          {
            title_ar: "تلف أو انثناء أسنان منفذ HDMI الداخلي وكسر نقاط التثبيت باللوحة الأم",
            title_en: "Damaged / Bent Internal HDMI Port Pins & Cracked Anchor Solder",
            probability: 0.72,
            explanation_ar: "الشد العنيف لكابل العرض أو تعثر أحد به أثناء اللعب يسبب انثناء الأسنان النحاسية الدقيقة داخل المنفذ وقطع مسارات نقل إشارة الفيديو (White Light of Death).",
            explanation_en: "Accidental cable tugging, aggressive insertion, or drops while plugged in fracture surface-mount anchor legs and bend micro-pins inside the HDMI 2.1 receptacle.",
            repair_method_ar: "طريقة التصليح المعتمدة: تفكيك الكونسول للوصول للوحة الأم، إزالة منفذ HDMI التالف باستخدام كاوية لحام ومحطة هواء ساخن عند 400°C، تنظيف وسادات اللحام بشريط سحب القصدير (Desoldering Wick)، ولحام منفذ HDMI 2.1 أصلي جديد مع تقوية أرجل التثبيت الأرضية لضمان متانة الشد.",
            repair_method_en: "Repair Method: Strip console down to mainboard, desolder crushed HDMI port using hot air station at 400°C, clean pads with desoldering wick and flux, align replacement OEM HDMI 2.1 port, solder individual pins under microscope, and reinforce ground anchoring tabs.",
            is_hardware: true
          },
          {
            title_ar: "عطل رقاقة معالج إشارة الفيديو المشفرة (HDMI Encoder IC - Panasonic/Retimer)",
            title_en: "Failed HDMI Retimer / Encoder IC (Panasonic MN864729 / Parade)",
            probability: 0.28,
            explanation_ar: "الصواعق الكهربائية المرتدة عبر شاشة التلفاز تحرق شريحة تحويل الإشارة الرقمية المشفرة حتى ولو كان المنفذ الخارجي سليماً ظاهرياً.",
            explanation_en: "Power surges traveling through HDMI cables from connected TVs blow out the digital video encoder IC, halting 4K/120Hz handshake signals.",
            repair_method_ar: "طريقة التصليح المعتمدة: فحص الصمامات الثنائية (Diodes) ومكثفات الترشيح حول رقاقة الإنمودر بالملتيميتر للتأكد من وجود قصر، ورفع شريحة Encoder IC القديمة وتركيب شريحة جديدة بواسطة محطة إعادة التدفق (BGA/Hot Air Rework).",
            repair_method_en: "Repair Method: Probe decoupling capacitors and filtering diode arrays around HDMI encoder for ground shorts; replace failed Retimer/Encoder IC using microscope and micro-nozzle hot air rework.",
            is_hardware: true
          }
        ],
        steps: [
          {
            step_number: 1,
            title_ar: "معاينة منفذ HDMI بالكشاف الضوئي",
            title_en: "Optical Inspection of HDMI Port",
            instruction_ar: "سلط ضوءاً قوياً داخل منفذ العرض الخلفي وتأكد من استقامة كافة الأسنان النحاسية وعدم تداخلها أو كسر الحاجز البلاستيكي.",
            instruction_en: "Shine direct light into rear HDMI port; inspect all 19 copper pins for bending, flattening, or broken center plastic tongue.",
            requires_tools: false
          },
          {
            step_number: 2,
            title_ar: "استبدال منفذ HDMI ولحام السنون الدقيقة",
            title_en: "HDMI Port Desoldering & Microsoldering",
            instruction_ar: "فك الكونسول حتى اللوحة الأم، استخدم الهواء الساخن والكاوية لإزالة المنفذ المكسور وتثبيت منفذ أصلي جديد.",
            instruction_en: "Disassemble to motherboard level, remove damaged port via hot air rework, wick pads clean, hand-solder new port under stereo microscope.",
            requires_tools: true
          }
        ],
        tools: ["Torx T8 Security Screwdriver", "Hot Air Rework Station", "Soldering Iron & Flux", "Stereo Microscope"],
        difficulty: "hard",
        minutes: 50
      },
      "thermal": {
        causes: [
          {
            title_ar: "انسداد زعانف المبرد بالأتربة وتزحزح سائل التبريد المعدني (Liquid Metal Dry Spot)",
            title_en: "Heatsink Lint Blanket & APU Liquid Metal Oxidation / Dry Spot",
            probability: 0.70,
            explanation_ar: "تسحب منصات الألعاب كميات هواء ضخمة تتراكم على هيئة سدادة غبار تسد فتحات التهوية، بينما ينساب سائل التبريد المعدني بعيداً عن مركز المعالج مسبباً ارتفاعاً فورياً للحرارة وإغلاقاً وقائياً (3 Beeps).",
            explanation_en: "Massive airflow intake causes dust blankets to form across heatsink fins, while prolonged vertical orientation induces dry spots in liquid metal layer, triggering emergency thermal shutdown.",
            repair_method_ar: "طريقة التصليح المعتمدة: تفكيك منصة الألعاب وتنظيف مروحة الشفط وزعانف المبرد النحاسية بهواء مضغوط ومكنسة تفريغ، تنظيف أكسيد السائل المعدني وإعادة توزيعه بالتساوي على سطح معالج APU بعود قطني مخصص داخل حاجز السيليكون الواقي لمنع تسربه إلى مكونات اللوحة.",
            repair_method_en: "Repair Method: Fully disassemble console, vacuum dust collection chambers, blow heatsink fins spotless, agitate and respread liquid metal over APU die using lint-free foam swab inside silicone barrier gasket, ensure zero dry oxidation spots.",
            is_hardware: true
          },
          {
            title_ar: "عطل حساس حرارة المعالج أو تراجع سرعة مروحة الطرد المركزية",
            title_en: "Centrifugal Blower Fan Bearing Stiction or PWM Line Fault",
            probability: 0.30,
            explanation_ar: "تآكل قلب المروحة يمنعها من الدوران بالسرعة القصوى عند تشغيل الألعاب الثقيلة مما يرفع درجة حرارة المعالج فوق 95°C.",
            explanation_en: "Bearing friction limits centrifugal blower speed curve, failing to maintain safe thermal headroom during heavy compute loads.",
            repair_method_ar: "طريقة التصليح المعتمدة: فحص حركة المروحة باليد، قياس إشارة PWM بمقياس الجهد، وتغيير مروحة التبريد بوحدة أصلية هادئة جديدة.",
            repair_method_en: "Repair Method: Test blower rotation by hand, measure PWM tachometer signal, replace with genuine OEM replacement fan.",
            is_hardware: true
          }
        ],
        steps: [
          {
            step_number: 1,
            title_ar: "شفط الأتربة من فتحات مصيدة الغبار (Dust Catchers)",
            title_en: "Vacuum Dust Extraction Ports",
            instruction_ar: "انزع الأغطية الجانبية واستخدم فوهة مكنسة كهربائية لتفريغ فتحات مصيدة الغبار المخصصة دون تفكيك الكونسول.",
            instruction_en: "Pop off side faceplates and vacuum the designated triangular dust catcher holes to evacuate surface debris.",
            requires_tools: false
          },
          {
            step_number: 2,
            title_ar: "التنظيف العميق وإعادة ضبط سائل التبريد أو المعجون",
            title_en: "Full Deep Clean & Liquid Metal Respreading",
            instruction_ar: "فك براغي الأمان، ارفع غطاء اللوحة، نظف مجمع المبرد من الداخل وأعد توزيع المعجون/السائل الحراري بحذر.",
            instruction_en: "Unscrew security Torx fasteners, extract mainboard, brush radiator core, respread liquid metal over APU die surface.",
            requires_tools: true
          }
        ],
        tools: ["Torx T8 Security Screwdriver", "Vacuum Cleaner", "Liquid Metal Applicator Kit", "99% Isopropyl Alcohol"],
        difficulty: "moderate",
        minutes: 40
      }
    },

    // 5. SMART TV
    "Smart TV": {
      "backlight": {
        causes: [
          {
            title_ar: "احتراق صمامات ليدات الإضاءة الخلفية (LED Backlight Strips Open-Circuit)",
            title_en: "Burned LED Backlight Diodes in Series String Array",
            probability: 0.82,
            explanation_ar: "تلف أحد الليدات في الدائرة الكهربائية المتوالية يقطع مرور التيار عن كامل شرائط الإضاءة، مما يجعل الشاشة سوداء تماماً مع استمرار عمل الصوت والقنوات بشكل طبيعي.",
            explanation_en: "Failure of a single SMD LED diode in the series chain opens the high-voltage circuit, causing power supply inverter cutoff (sound remains, picture dark).",
            repair_method_ar: "طريقة التصليح المعتمدة: فك الغطاء الخلفي للتلفاز، فك براغي الشاسيه، استخدام كؤوس شفط زجاجية احترافية لرفع طبقة زجاج LCD بحذر شديد لتفادي كسرها، فحص خطوط الليدات بجهاز LED Backlight Tester، واستبدال كامل أطقم شرائط الليدات الأصلية المصنوعة من الألومنيوم المبدد للحرارة لضمان عدم تكرار العطل.",
            repair_method_en: "Repair Method: Remove TV back chassis, unclip bezel, safely lift fragile LCD matrix using heavy-duty vacuum suction cups, verify failed strips with LED tester, replace complete set with genuine aluminum-backed LED strips for optimal heat dissipation.",
            is_hardware: true
          },
          {
            title_ar: "عطل دائرة محول تيار الإضاءة الخلفية في لوحة التغذية (Inverter Driver Rail)",
            title_en: "LED Driver MOSFET / Inverter Circuit Cutoff on Power Board",
            probability: 0.18,
            explanation_ar: "تلف ترانزستور الإنفيرتر أو مكثفات التنعيم يمنع خروج الجهد العالي (100V-200V) اللازم لتشغيل ليدات الإضاءة.",
            explanation_en: "PWM driver IC or output switching MOSFET failure on power supply board prevents high-voltage boost conversion to backlight array.",
            repair_method_ar: "طريقة التصليح المعتمدة: قياس فولتية خرج الليدات بمقياس الملتيميتر عند بدء التشغيل للتأكد من خروج جهد الإشعال، واستبدال مكثفات التنعيم أو صمامات الشوتكي أو لوحة التغذية بالكامل.",
            repair_method_en: "Repair Method: Measure LED+ output voltage during boot with multimeter to check for voltage pulse, replace failed Schottky diodes, driver IC, or replace complete power board.",
            is_hardware: true
          }
        ],
        steps: [
          {
            step_number: 1,
            title_ar: "إجراء اختبار الكشاف الضوئي (Flashlight Test)",
            title_en: "Smartphone Flashlight Test",
            instruction_ar: "سلط كشاف هاتفك المحمول عن قرب على زاوية الشاشة المظلمة أثناء تشغيل فيلم. إذا رأيت خيالات الصورة والشخصيات، فهذا يؤكد بنسبة 100% أن المشكلة في ليدات الإضاءة.",
            instruction_en: "Shine a flashlight directly onto the dark screen at a 45-degree angle while audio plays. If ghosted imagery is visible, backlight failure is confirmed.",
            requires_tools: false
          },
          {
            step_number: 2,
            title_ar: "تفكيك الشاشة وتغيير أطقم شرائط الليدات",
            title_en: "Panel Teardown & LED Strip Array Replacement",
            instruction_ar: "استخدم كؤوس الشفط لرفع زجاج الشاشة الحساس، ارفع طبقات الفلاتر البصرية، وركب أطقم الليدات الجديدة.",
            instruction_en: "Use suction cups to carefully lift LCD matrix, peel optical diffuser sheets, unscrew failed LED strips, and adhere new aluminum strips.",
            requires_tools: true
          }
        ],
        tools: ["Heavy-Duty Suction Cups", "LED Backlight Tester", "Phillips Screwdrivers", "Digital Multimeter"],
        difficulty: "hard",
        minutes: 60
      },
      "tcon_screen": {
        causes: [
          {
            title_ar: "عطل كارت التحكم ومعالج التوقيت (T-Con Timing Controller Board) أو كابلات COF",
            title_en: "T-Con Timing Controller Board Failure or Oxidized Flat Flex Cables",
            probability: 0.74,
            explanation_ar: "تلف شريحة التيكون أو أكسدة كابلات الربط المرنة (Ribbon Cables) يسبب ظهور خطوط رأسية ملونة، شاشة بيضاء، أو صورة مشوشة ومزدوجة.",
            explanation_en: "Timing controller ASIC failure or ribbon cable oxidation causes line artifacts, split-screen anomalies, color solarization, or total white screen.",
            repair_method_ar: "طريقة التصليح المعتمدة: فك الغطاء الخلفي، تحرير كابلات Flat Flex المتجهة من بوردة التيكون للشاشة، تنظيف السنون الذهبية بكحول أيزوبروبيلي 99%، إعادة تثبيتها بدقة، واستبدال لوحة T-Con برقم البارت نمبر المطابق في حال استمرار الخطوط.",
            repair_method_en: "Repair Method: Unplug TV, release flat flex ribbon cables connecting T-Con to LCD panel, clean gold fingers with 99% alcohol, reseat securely with latching levers, or replace T-Con board with identical revision.",
            is_hardware: true
          }
        ],
        steps: [
          {
            step_number: 1,
            title_ar: "معاينة الخطوط وفصل مصادر الإدخال",
            title_en: "Input Isolation & Menu Verification",
            instruction_ar: "اضغط على زر القائمة (Menu). إذا ظهرت قائمة التلفاز فوق الخطوط فالعطل من كابل HDMI أو الرسيفر، أما إذا استمرت فالشاشة أو كارت التيكون هو السبب.",
            instruction_en: "Press Menu on remote; if menu graphics are clean over the lines, fault is external input source; if lines corrupt menu, T-Con/panel is faulty.",
            requires_tools: false
          },
          {
            step_number: 2,
            title_ar: "تنظيف كابلات التيكون أو استبدال اللوحة",
            title_en: "T-Con Flex Servicing & Board Replacement",
            instruction_ar: "فك مسامير لوحة T-Con، نظف كابلات الشريط بالكحول، ركب لوحة جديدة وأعد التثبيت.",
            instruction_en: "Unscrew shield over T-Con board, unseat LVDS ribbon cables, deoxidize contacts, replace board and snap locking collars.",
            requires_tools: true
          }
        ],
        tools: ["Phillips Screwdriver Set", "99% Isopropyl Alcohol", "Plastic Spudger"],
        difficulty: "moderate",
        minutes: 30
      }
    },

    // 6. STORAGE (BACKBLAZE TELEMETRY POWERED)
    "Storage": {
      "bad_sectors": {
        causes: [
          {
            title_ar: "تدهور القطاعات المغناطيسية السطحية (SMART Attributes 05 Reallocated & C5 Pending Sectors)",
            title_en: "Platter Magnetic Media Degradation & SMART Pending Sector Alerts",
            probability: 0.78,
            explanation_ar: "تدهور طبقة التسجيل المغناطيسي في القرص الصلب يمنع رؤوس القراءة من استرجاع البيانات بسلاسة، مما يسبب تجمد النظام وانهيار سرعة القراءة بالقرب من الصفر.",
            explanation_en: "Degraded thin-film magnetic medium prevents read heads from locking to servo tracks, triggering high RAW values in SMART 05 (Reallocated) and C5 (Pending Sectors).",
            repair_method_ar: "طريقة التصليح المعتمدة: إيقاف أي عمليات كتابة فوراً لتجنب إجهاد السطح الممغنط، عمل استنساخ خام قطاعاً بقطاع (Raw Clone) عبر أداة ddrescue أو Clonezilla على قرص SSD جديد سليم، ثم استخراج الملفات بأمان واستبدال القرص التالف.",
            repair_method_en: "Repair Method: Immediately cease all write operations, boot live Linux utility to execute sector-by-sector clone via GNU ddrescue onto fresh SSD target, recover user partitions from the image, and decommission failed mechanical drive.",
            is_hardware: true
          },
          {
            title_ar: "تلف جدول التقسيم أو نظام الملفات (NTFS MFT / RAW Partition)",
            title_en: "Corrupted Master File Table (MFT) / RAW Partition Table",
            probability: 0.22,
            explanation_ar: "فصل القرص الخارجي فجأة أثناء نقل الملفات دون عمل إخراج آمن يفسد فهرس الملفات الرئيسي مما يجعل القرص يطلب فورمات.",
            explanation_en: "Sudden USB detachment during cached write activity corrupts partition boot records and file system metadata, forcing disk to register as RAW.",
            repair_method_ar: "طريقة التصليح المعتمدة: عدم الموافقة على طلب الفورمات نهائياً، توصيل القرص وتشغيل أداة TestDisk لاستعادة سجل الإقلاع الأصلي وجدول MFT، أو تشغيل أمر chkdsk /f /r لإصلاح الفهارس واسترجاع الملفات.",
            repair_method_en: "Repair Method: Do NOT format; connect drive to diagnostic terminal, execute TestDisk to locate backup partition boot sector and rebuild partition tables, or run targeted chkdsk repairs to restore directory trees.",
            is_hardware: false
          }
        ],
        steps: [
          {
            step_number: 1,
            title_ar: "قراءة تقرير مستشعرات SMART الفورية",
            title_en: "SMART Health Telemetry Extraction",
            instruction_ar: "استخدم برنامج CrystalDiskInfo أو أداة smartctl للتحقق من مؤشرات 05 (Reallocated Sectors) و C5 (Current Pending). إذا كانت باللون الأصفر أو الأحمر يجب إيقاف القرص.",
            instruction_en: "Launch CrystalDiskInfo or run smartctl to check RAW values for attributes 05 and C5; any non-zero count signifies physical sector failure.",
            requires_tools: false
          },
          {
            step_number: 2,
            title_ar: "أخذ نسخة طبق الأصل (Disk Clone) واستبدال الوسيط",
            title_en: "Emergency Bit-Stream Cloning & Replacement",
            instruction_ar: "صل القرص بوحدة إرساء خارجية وانسخ البيانات بالكامل عبر برامج الاستنساخ قبل توقف القرص النهائي.",
            instruction_en: "Attach drive to offline duplicator or USB-SATA dock, initiate low-level image extraction, and swap in a modern NVMe/SATA SSD.",
            requires_tools: true
          }
        ],
        tools: ["CrystalDiskInfo / SMART Utility", "USB to SATA/NVMe Dock", "Clonezilla / ddrescue Boot USB"],
        difficulty: "moderate",
        minutes: 30
      },
      "clicking": {
        causes: [
          {
            title_ar: "تصادم أو تلف رؤوس القراءة الميكانيكية (Head Stack Assembly Crash / Click of Death)",
            title_en: "Mechanical Head Stack Assembly (HSA) Failure / Pre-Amp Circuit Fault",
            probability: 0.88,
            explanation_ar: "سقوط القرص الصلب أثناء التشغيل يسبب انثناء أذرع القراءة أو احتكاك الرؤوس بأسطوانات البيانات وتكرار محاولة الإقلاع (صوت تكتكة مستمر).",
            explanation_en: "Physical shock knocks slider heads out of aerodynamic flight suspension, scraping magnetic platters and prompting voice coil motor to repeatedly reset (Click of Death).",
            repair_method_ar: "طريقة التصليح المعتمدة: فصل كابل الطاقة فوراً وعدم إعادة تشغيل القرص نهائياً لتفادي حفر الأسطوانات الممغنطة، وتوجيه القرص إلى مختبر استعادة بيانات متخصص يمتلك غرفة معقمة (Cleanroom Class 100) لتبديل مجموعة الرؤوس بأداة Head Comb مخصصة.",
            repair_method_en: "Repair Method: Disconnect power instantly to prevent catastrophic platter ring scratches; send to specialized ISO Class 5 cleanroom laboratory for donor head stack transplantation using precision head comb spacers.",
            is_hardware: true
          }
        ],
        steps: [
          {
            step_number: 1,
            title_ar: "إيقاف الطاقة الفوري لمنع احتكاك الرؤوس",
            title_en: "Emergency Power Cutoff",
            instruction_ar: "افصل كابل الكهرباء والـ USB فور سماع التكتكة. أي محاولة تشغيل إضافية قد تخدش أسطوانات البيانات وتمحو الملفات للأبد.",
            instruction_en: "Cut power immediately upon hearing repetitive clicks. Further spin-up attempts cause irreversible magnetic surface grinding.",
            requires_tools: false
          },
          {
            step_number: 2,
            title_ar: "إحالة القرص لمختبر الاستعادة الميكانيكية",
            title_en: "Cleanroom Laboratory Data Extraction",
            instruction_ar: "يتطلب هذا العطل بيئة معقمة خالية من الأتربة لفتح الغلاف المعدني وتغيير حزمة الرؤوس بقطع متطابقة من قرص متبرع.",
            instruction_en: "Requires cleanroom disassembly to exchange head assembly with identical donor drive parts using micro-tools.",
            requires_tools: true
          }
        ],
        tools: ["Cleanroom Class 100 Enclosure", "Head Replacement Comb Tool", "Torx Screwdriver Set"],
        difficulty: "hard",
        minutes: 90
      }
    },

    // 7. TABLET
    "Tablet": {
      "screen": {
        causes: [
          {
            title_ar: "تصدع زجاج شاشة اللمس (Digitizer) أو انفصال كابل المحول الرقمي",
            title_en: "Cracked Front Digitizer Glass & Touch Grid Delamination",
            probability: 0.74,
            explanation_ar: "الصدمات الخارجية تكسر زجاج طبقة اللمس أو تفصل مسارات التوصيل الدقيقة مما يؤدي لعدم استجابة أجزاء من الشاشة للمس أو حدوث لمسات عشوائية (Ghost Touch).",
            explanation_en: "Impact shocks fracture indium-tin-oxide (ITO) grid traces, causing localized touch blindness or spurious ghost touch inputs.",
            repair_method_ar: "طريقة التصليح المعتمدة: تدفئة الإطار بمجفف حراري عند 75°C لإذابة الشريط اللاصق، رفع الشاشة ببطء بواسطة كروت فك بلاستيكية، فصل كابل البطارية أولاً ثم كابل الشاشة، وتنظيف الإطار تماماً قبل تركيب اللوحة الجديدة مع مادة التثبيت الأصلية.",
            repair_method_en: "Repair Method: Heat tablet frame at 75°C to soften perimeter adhesive, slice through seal with plastic opening cards, isolate battery connection, unseat display flex, and secure new assembly with pre-cut high-bond adhesive.",
            is_hardware: true
          }
        ],
        steps: [
          {
            step_number: 1,
            title_ar: "اختبار استجابة اللمس على كامل الشاشة",
            title_en: "Touch Grid Continuity Inspection",
            instruction_ar: "اسحب أيقونة أحد التطبيقات وحركها على كامل مساحة الشاشة لتحديد المناطق الميتة التي لا تستجيب للمس.",
            instruction_en: "Drag an app icon continuously across all screen zones to identify specific dead grid sectors.",
            requires_tools: false
          },
          {
            step_number: 2,
            title_ar: "استبدال شاشة اللمس المكسورة",
            title_en: "Digitizer Assembly Replacement",
            instruction_ar: "سخن الحواف، ارفع الشاشة التالفة، افصل الفلاتات القديمة وثبت الشاشة الجديدة.",
            instruction_en: "Warm glass edges, separate digitizer with suction and picks, plug in new flex cable, and seal down.",
            requires_tools: true
          }
        ],
        tools: ["Heat Gun / Heat Pad", "Plastic Opening Picks", "Suction Cup", "Precision Tweezers"],
        difficulty: "moderate",
        minutes: 40
      },
      "battery": {
        causes: [
          {
            title_ar: "انتفاخ بطارية التابلت المسطحة أو استهلاك خلايا الليثيوم",
            title_en: "Swollen Lithium-Ion Pouch Cell & Chemical Capacity Loss",
            probability: 0.75,
            explanation_ar: "ترك التابلت موصولاً بالشاحن لفترات طويلة يسبب تولد غازات كيميائية تنتفخ معها البطارية وتضغط على الشاشة للخارج مهددة بكسرها.",
            explanation_en: "Continuous floating charge voltage induces electrolyte gas generation, bulging the flat pouch cell and pressing outward against the display.",
            repair_method_ar: "طريقة التصليح المعتمدة: تفريغ شحنة البطارية لأقل من 25% لتجنب اشتعالها، فتح الجهاز، تليين الغراء السفلي بقطرات كحول أيزوبروبيلي، رفع البطارية بأداة بلاستيكية عريضة دون ثنيها، وتركيب بطارية جديدة مطابقة.",
            repair_method_en: "Repair Method: Discharge cell below 25%, open chassis, dispense small amount of 99% alcohol beneath cell to dissolve adhesive, pry up using wide plastic spatula without bending pouch, and mount replacement battery.",
            is_hardware: true
          }
        ],
        steps: [
          {
            step_number: 1,
            title_ar: "معاينة استواء الشاشة وفحص مؤشرات الانتفاخ",
            title_en: "Visual Screen Curvature & Gap Check",
            instruction_ar: "انظر إلى التابلت من الجانب؛ إذا كانت الشاشة مرتفعة عن الشاسيه في المنتصف فالأمر يشير لانتفاخ خطير في البطارية.",
            instruction_en: "Inspect tablet from side profile; any visible lift or gap between display and frame indicates dangerous battery expansion.",
            requires_tools: false
          },
          {
            step_number: 2,
            title_ar: "استبدال وحدة بطارية التابلت",
            title_en: "Pouch Battery Safe Extraction",
            instruction_ar: "افصل البطارية القديمة بحذر، أذب الغراء بالكحول، ركب البطارية البديلة مع شريط عزل جديد.",
            instruction_en: "Unplug battery connector, dissolve adhesive with alcohol, lift out safely, adhere replacement battery.",
            requires_tools: true
          }
        ],
        tools: ["Plastic Battery Pry Tool", "99% Isopropyl Alcohol", "Precision Screwdrivers"],
        difficulty: "moderate",
        minutes: 35
      }
    },

    // 8. SMARTWATCH
    "Smartwatch": {
      "battery": {
        causes: [
          {
            title_ar: "انتفاخ بطارية الساعة المصغرة مما يدفع الشاشة للانفصال عن الهيكل",
            title_en: "Micro-Lithium Cell Swelling Dislodging Screen Frame",
            probability: 0.78,
            explanation_ar: "انتفاخ بطارية الليثيوم المصغرة يولد قوة دفع للأعلى تفكك غراء الشاشة وتخرجها من مكانها، ويقلل زمن التشغيل لبضع ساعات فقط.",
            explanation_en: "Miniature pouch cell gas expansion pushes directly against the undersurface of the OLED display, popping waterproof adhesive gaskets.",
            repair_method_ar: "طريقة التصليح المعتمدة: فك الشاشة برفق بعد تدفئة الإطار، فصل الفلاتات الدقيقة بملاقط ميكروسكوبية، رفع البطارية التالفة بحذر، تركيب بطارية مصغرة جديدة وإعادة غلق الإطار بشريط عزل مقاوم للمياه IP68.",
            repair_method_en: "Repair Method: Soften bezel with gentle heat, unlatch micro-FPC cables using precision tweezers, extract swollen miniature battery, seat new battery, and re-seal perimeter with liquid optical adhesive or pre-formed waterproof gasket.",
            is_hardware: true
          }
        ],
        steps: [
          {
            step_number: 1,
            title_ar: "فحص استقرار الشاشة وعدم تباعد الحواف",
            title_en: "Display Seam & Waterproof Seal Check",
            instruction_ar: "تأكد من عدم وجود فراغ أو ضوء ينفذ من حواف الشاشة مما يدل على دفع البطارية لها.",
            instruction_en: "Inspect the perimeter seam under light for any adhesive separation or screen popping out.",
            requires_tools: false
          },
          {
            step_number: 2,
            title_ar: "استبدال بطارية الساعة المصغرة وإعادة الإغلاق",
            title_en: "Micro-Battery Swap & Waterproof Resealing",
            instruction_ar: "ارفع الشاشة بحذر شديد، افصل كابل البطارية بالمجهر، ثبت البطارية الجديدة وأحكم الغلق.",
            instruction_en: "Lift screen gently, disconnect microscopic battery connector, drop in replacement pack and cure waterproof seal.",
            requires_tools: true
          }
        ],
        tools: ["Microscope / Magnifier", "Micro Precision Tweezers", "Precision T4 Screwdriver", "Waterproof Sealant"],
        difficulty: "hard",
        minutes: 40
      },
      "sensor": {
        causes: [
          {
            title_ar: "تأكسد دوائر الشحن المغناطيسي أو اتساخ عدسة مستشعرات النبض الضوئية",
            title_en: "Oxidized Magnetic Charging Contacts / Soiled Photodiode Sensor Lens",
            probability: 0.70,
            explanation_ar: "أملاح العرق والأوساخ تعزل نقاط التوصيل المغناطيسية أو تحجب مستشعرات قياس نبضات القلب الضوئية (PPG Sensors).",
            explanation_en: "Perspiration residue deposits insulating mineral crystals on pogo-pin charge contacts and clouds photoplethysmography heart-rate sensor glass.",
            repair_method_ar: "طريقة التصليح المعتمدة: تنظيف نقاط التوصيل المغناطيسية بقطنة مبللة بكحول أيزوبروبيلي لإزالة الشحوم والأملاح، فحص كابل الشحن المغناطيسي للتأكد من استقرار الجهد، وإعادة ضبط المصنع لمستشعر النبض.",
            repair_method_en: "Repair Method: Scrub charging contacts with 99% isopropyl alcohol swab and soft nylon brush to dissolve salt deposits, verify 5V supply on charger pins with multimeter, and calibrate sensor cluster.",
            is_hardware: true
          }
        ],
        steps: [
          {
            step_number: 1,
            title_ar: "تنظيف السطح الخلفي ونقاط التوصيل بالكحول",
            title_en: "Rear Sensor Contact Decontamination",
            instruction_ar: "امسح ظهر الساعة وكابل الشحن بقطنة مشبعة بكحول طبي ونظف العدسة تماماً.",
            instruction_en: "Clean rear glass and inductive charging pad thoroughly with alcohol wipes.",
            requires_tools: false
          }
        ],
        tools: ["Isopropyl Alcohol Swabs", "Digital Multimeter"],
        difficulty: "easy",
        minutes: 15
      }
    },

    // 9. AUDIO
    "Audio": {
      "cable": {
        causes: [
          {
            title_ar: "قطع أو كسر في أسلاك التوصيل الداخلية بالقرب من المقبس أو المفصل",
            title_en: "Internal Copper Conductor Strain Rupture at Strain Relief Boot",
            probability: 0.76,
            explanation_ar: "الانحناء المتكرر للسلك عند مخرج المقبس يؤدي لانقطاع الشعيرات النحاسية الدقيقة داخل الغلاف المطاطي مسبباً انقطاع الصوت في إحدى السماعتين.",
            explanation_en: "Repeated cyclic bending at the 3.5mm plug or headphone yoke flexes enameled litz wires beyond tensile limit, severing audio ground or channel traces.",
            repair_method_ar: "طريقة التصليح المعتمدة: قص الجزء التالف من السلك قبل نقطة القطع، كشط الطبقة العازلة الملونة عن الأسلاك الدقيقة، لحام الأطراف بمقبس 3.5mm معدني جديد مع عزل كل خط بأنبوب انكماش حراري (Heat Shrink Tubing).",
            repair_method_en: "Repair Method: Cut off damaged strain relief section, burn away enamel coating from ultra-fine copper strands with solder flux, solder onto replacement gold-plated 3.5mm TRS plug, and seal with heat-shrink tubing.",
            is_hardware: true
          }
        ],
        steps: [
          {
            step_number: 1,
            title_ar: "فحص نقطة القطع بثني الكابل برفق",
            title_en: "Flex Strain Audio Triage",
            instruction_ar: "شغل مقطعاً صوتياً واثنِ الكابل عند طرف المقبس؛ إذا عاد الصوت لحظياً فهذا يحدد موضع انقطاع الأسلاك بدقة.",
            instruction_en: "Wiggle cable near plug while listening to audio to confirm exact location of intermittent conductor disconnect.",
            requires_tools: false
          },
          {
            step_number: 2,
            title_ar: "قص ولحام مقبس صوت جديد",
            title_en: "Jack Replacement & Wire Resoldering",
            instruction_ar: "اقطع السلك خلف منطقة الانثناء، اكشف الأسلاك، الحم أطراف الصوت اليسار واليمين والأرضي بالمقبس الجديد.",
            instruction_en: "Strip wire outer sheath, burn enamel coating, solder Left, Right, and Ground tabs, and insulate with shrink wrap.",
            requires_tools: true
          }
        ],
        tools: ["Soldering Iron & Flux", "Heat Shrink Tubing", "Wire Strippers", "Multimeter"],
        difficulty: "easy",
        minutes: 20
      },
      "driver": {
        causes: [
          {
            title_ar: "انفصال ملف الصوت (Voice Coil) أو تمزق غشاء المايلار في درايفر السماعة",
            title_en: "Voice Coil Lead Wire Fracture or Diaphragm Rupture",
            probability: 0.72,
            explanation_ar: "سماع الصوت بمستويات شديدة الارتفاع أو سقوط السماعة يتسبب في انفصال السلك الحريري المغذي للملف المغناطيسي.",
            explanation_en: "High volume over-excursion or physical drops shear microscopic voice coil tinsel leads off the acoustic driver diaphragm.",
            repair_method_ar: "طريقة التصليح المعتمدة: فك وسادة الأذن والغطاء الواقي، فحص ممانعة الملف بمقياس المقاومة (يجب أن تقرأ بين 16 إلى 32 أوم)، إعادة لحام نقطة التوصيل السائبة أو استبدال درايفر السماعة بالكامل.",
            repair_method_en: "Repair Method: Remove earpad, unclip baffle, measure voice coil DC resistance (should read 16-32 ohms); resolder broken lead contact or transplant an identical replacement 40mm/50mm speaker driver element.",
            is_hardware: true
          }
        ],
        steps: [
          {
            step_number: 1,
            title_ar: "قياس ممانعة السماعة بالمولتميتر",
            title_en: "Driver Coil Resistance Measurement",
            instruction_ar: "قس الممانعة بين طرف الأرضي وطرف القناة المقطوعة للتأكد من وجود دائرة مفتوحة (Open Loop).",
            instruction_en: "Measure resistance across TRS plug contacts to verify whether voice coil is broken (infinite resistance / OL).",
            requires_tools: true
          }
        ],
        tools: ["Multimeter", "Soldering Iron", "Replacement Driver Element"],
        difficulty: "moderate",
        minutes: 30
      }
    },

    // 10. CAMERA
    "Camera": {
      "shutter": {
        causes: [
          {
            title_ar: "انحشار شفرات الغالق الميكانيكي أو كسر تروس محرك الشتر (Shutter Error)",
            title_en: "Mechanical Shutter Blade Jam or Drive Gear Pinion Fracture",
            probability: 0.75,
            explanation_ar: "استهلاك ميكانيزم الغالق بعد تجاوز عدد اللقطات المقدر (Shutter Count) يسبب انحشار الشفرات أو خروج التروس عن مسارها وظهور خطأ Err 20 / Err 99.",
            explanation_en: "Exceeding shutter actuations fatigues return springs and strips composite gears, locking carbon-fiber blades mid-cycle.",
            repair_method_ar: "طريقة التصليح المعتمدة: فك مسامير الهيكل الخارجي، تفريغ مكثف الفلاش عالي الجهد بمقاومة أمان لتفادي الصعق، الوصول إلى صندوق الغالق وتنظيف التروس وتزييتها بمادة تشحيم جافة مخصصة أو تغيير فلاتة العدسة وميكانيزم الشتر بالكامل.",
            repair_method_en: "Repair Method: Disassemble body shell, discharge high-voltage flash capacitor across a 2k-ohm resistor for safety, access mirror/shutter box, clean gear teeth, and replace complete shutter blade assembly unit.",
            is_hardware: true
          }
        ],
        steps: [
          {
            step_number: 1,
            title_ar: "إعادة ضبط الكاميرا ونزع البطارية لعدة دقائق",
            title_en: "Camera Power Cycle & Clear",
            instruction_ar: "أخرج البطارية وكارت الميموري وافصل العدسة، اترك الكاميرا 10 دقائق ثم أعد التشغيل لاختبار استجابة الغالق.",
            instruction_en: "Remove battery, lens, and memory card for 10 minutes to reset internal firmware registers.",
            requires_tools: false
          },
          {
            step_number: 2,
            title_ar: "استبدال وحدة الغالق الميكانيكي",
            title_en: "Shutter Unit Disassembly & Swap",
            instruction_ar: "فك أغطية الكاميرا وفرغ مكثف الفلاش، انزع مستشعر الصورة والغالق القديم وركب الغالق الجديد.",
            instruction_en: "Strip camera shell, safely drain flash capacitor, unmount image sensor block, and bolt in replacement shutter assembly.",
            requires_tools: true
          }
        ],
        tools: ["Capacitor Discharge Tool", "JIS Screwdriver Set", "Anti-static Tweezers"],
        difficulty: "hard",
        minutes: 60
      },
      "sensor": {
        causes: [
          {
            title_ar: "تراكم جزيئات الغبار وحبوب اللقاح على مرشح المستشعر البصري (Low-pass Filter)",
            title_en: "Dust & Pollen Particulate Deposition on Sensor IR Cut Filter",
            probability: 0.80,
            explanation_ar: "تبديل العدسات في بيئات مفتوحة يسمح بدخول ذرات الغبار واستقرارها على زجاج المستشعر، مما يظهر كبقع داكنة في الصور عند تضييق فتحة العدسة (f/8 أو أضيق).",
            explanation_en: "Airborne dust enters mirror box during lens changes, settling on sensor low-pass filter and casting dark spots at narrow apertures.",
            repair_method_ar: "طريقة التصليح المعتمدة: تفعيل وضع تنظيف المستشعر اليدوي لرفع المرآة، استخدام منفاخ هواء يدوي غير مضغوط (Rocket Blower) لنفخ الأتربة السائبة، ثم مسح سطح المستشعر بمسحة تنظيف مخصصة مبللة بنقطتين من سائل تنظيف المستشعرات Eclipse بحركة أفقية واحدة.",
            repair_method_en: "Repair Method: Lock mirror up via clean mode menu, blast loose particles with Giotto Rocket Blower (never use compressed can air), apply two drops of Eclipse optical solvent to matched sensor swab, and sweep across surface in a single smooth stroke.",
            is_hardware: false
          }
        ],
        steps: [
          {
            step_number: 1,
            title_ar: "التقاط صورة لاختبار بقع الغبار",
            title_en: "Aperture Test Shot for Sensor Spots",
            instruction_ar: "صور ورقة بيضاء بفتحة عدسة ضيقة f/16 أو f/22 لتحديد مواقع بقع الغبار على المستشعر بدقة.",
            instruction_en: "Shoot a clear white wall at f/22 aperture slightly out of focus to clearly reveal shadow spots cast by dust particles.",
            requires_tools: false
          },
          {
            step_number: 2,
            title_ar: "التنظيف الرطب للمستشعر بمسحة مخصصة",
            title_en: "Wet Sensor Swab Cleaning",
            instruction_ar: "افتح قفل المرآة من الإعدادات، واستخدم مسحة مستشعر نظيفة مع سائل التنظيف المخصص بحركة واحدة ناعمة.",
            instruction_en: "Enter manual sensor cleaning mode, moisten optical swab with sensor fluid, sweep across filter surface once, and inspect.",
            requires_tools: true
          }
        ],
        tools: ["Rocket Air Blower", "Sensor Cleaning Swabs", "Eclipse Optical Cleaning Fluid"],
        difficulty: "easy",
        minutes: 15
      }
    },

    // 11. PRINTER
    "Printer": {
      "paper": {
        causes: [
          {
            title_ar: "تصلب أو تآكل أسطوانات سحب الورق المطاطية (Rubber Pickup Rollers Glazing)",
            title_en: "Hardened / Glazed Paper Feed Pickup Rollers & Paper Dust Buildup",
            probability: 0.78,
            explanation_ar: "تراكم برادة الورق وجفاف المادة المطاطية لأسطوانات السحب يجعلها ملساء وغير قادرة على الإمساك بالورق مما يسبب انحشار الورق باستمرار.",
            explanation_en: "Paper fiber dust coats rubber pickup rollers and natural rubber plasticizers dry out over time, causing roller slippage and paper pickup jams.",
            repair_method_ar: "طريقة التصليح المعتمدة: إخراج درج الورق، تنظيف أسطوانات السحب بمحلول تجديد المطاط (Rubber Renue) أو كحول خفيف لاستعادة المرونة، أو استبدال الأسطوانة بقطعة جديدة في حال تآكل السطح المحزز.",
            repair_method_en: "Repair Method: Remove paper cassette, rotate feed rollers while scrubbing rubber tread with Rubber Renue or isopropyl alcohol on lint-free cloth, or unclip worn roller tire and snap on replacement roller.",
            is_hardware: true
          }
        ],
        steps: [
          {
            step_number: 1,
            title_ar: "إزالة الورق المنحشر برفق في اتجاه خروج الورق",
            title_en: "Clear Jammed Sheets in Feed Direction",
            instruction_ar: "افتح أبواب الصيانة واسحب الورق العالق بكلتا يديك باتجاه مسار الخروج الطبيعي لتجنب كسر التروس ومستشعرات الورق.",
            instruction_en: "Pull jammed paper out along normal feed direction with both hands evenly to avoid tearing paper or breaking optical flags.",
            requires_tools: false
          },
          {
            step_number: 2,
            title_ar: "تنظيف أو استبدال بكرات سحب الورق المطاطية",
            title_en: "Rubber Roller Reconditioning & Replacement",
            instruction_ar: "امسح سطح البكرات بمحلول منظف للمطاط للتخلص من اللزوجة وإعادة ملمس الاحتكاك.",
            instruction_en: "Clean roller surface with rubber restorer compound to remove slickness and restore friction grip.",
            requires_tools: true
          }
        ],
        tools: ["Rubber Renue Solution", "Lint-free Wipes", "Screwdriver Set"],
        difficulty: "easy",
        minutes: 20
      },
      "printhead": {
        causes: [
          {
            title_ar: "انسداد فوهات رأس الطباعة بالحبر الجاف أو امتلاء وسادة تجميع الحبر (Waste Ink Pad)",
            title_en: "Clogged Thermal/Piezo Printhead Micro-Nozzles with Dried Ink",
            probability: 0.74,
            explanation_ar: "عدم تشغيل الطابعة لفترة طويلة يؤدي لجفاف بقايا الحبر داخل فوهات الرش الدقيقة مما يسبب خطوطاً بيضاء متقطعة في الصفحات المطبوعة.",
            explanation_en: "Inactivity dries pigmented or dye ink residues inside microscopic thermal/piezo nozzle channels, causing blank streaks or missing colors.",
            repair_method_ar: "طريقة التصليح المعتمدة: إجراء دورة تنظيف عميق من إعدادات الطابعة، وفي حال استمرار الانسداد يتم فك رأس الطباعة ونقعه في سائل تنظيف حبر دافئ مخصص (Printhead Cleaning Solution) لمدة ساعتين قبل إعادة تركيبه.",
            repair_method_en: "Repair Method: Run software head cleaning utility, then flush stubborn nozzle blocks with warm printhead cleaning fluid using a syringe and silicone tube adapter, blot dry, and reinstall.",
            is_hardware: true
          }
        ],
        steps: [
          {
            step_number: 1,
            title_ar: "إجراء اختبار فحص فوهات رأس الطباعة (Nozzle Check)",
            title_en: "Printhead Diagnostic Nozzle Check Pattern",
            instruction_ar: "اطبع صفحة فحص الفوهات لمعرفة الألوان المسدودة وحجم الانقطاع في الخطوط.",
            instruction_en: "Print nozzle check test pattern from maintenance menu to identify which ink color channels have clogged orifices.",
            requires_tools: false
          },
          {
            step_number: 2,
            title_ar: "غسيل فوهات الرأس بسائل تنظيف الحبر",
            title_en: "Chemical Printhead Flush Procedure",
            instruction_ar: "وصل سرنجة بأنبوب سيليكون مرن واحقن سائل تنظيف الحبر برفق داخل منافذ الرأس لتفتيت الحبر المتصلب.",
            instruction_en: "Connect syringe with silicone tube to printhead intake port, gently inject warm cleaning solvent to dissolve dried pigments.",
            requires_tools: true
          }
        ],
        tools: ["Printhead Cleaning Fluid", "Syringe with Silicone Hose", "Lint-free Towels"],
        difficulty: "moderate",
        minutes: 30
      }
    },

    // 12. HOME APPLIANCE
    "Home Appliance": {
      "thermal_fuse": {
        causes: [
          {
            title_ar: "احتراق الفيوز الحراري للأمان (Thermal Cutoff Fuse) لمنع الحرائق",
            title_en: "Blown Thermal Cutoff Fuse (TCO) from Overtemperature Event",
            probability: 0.80,
            explanation_ar: "ارتفاع درجة حرارة الجهاز المنزلي فوق الحد المسموح به يؤدي لانصهار السبيكة الحرارية داخل الفيوز لقطع التيار الكهربائي فوراً وحماية المنزل.",
            explanation_en: "Internal airflow blockage or thermostat sticking causes temperatures to exceed the calibrated thermal cutoff rating, permanently opening circuit.",
            repair_method_ar: "طريقة التصليح المعتمدة: فصل الجهاز عن الكهرباء تماماً، فك الغلاف الخارجي، قياس استمرارية الفيوز الحراري (Continuity Test) بالمولتميتر، واستبدال الفيوز المحترق بفيوز جديد مطابق لدرجة حرارة الفصل والأمبير مع استخدام وصلات كبس بدون لحام.",
            repair_method_en: "Repair Method: Unplug appliance from mains, remove enclosure, test thermal fuse for open circuit with multimeter, crimp in identical replacement high-temperature fuse (do NOT solder, as heat melts fuse alloy).",
            is_hardware: true
          }
        ],
        steps: [
          {
            step_number: 1,
            title_ar: "فصل الكهرباء وفحص استمرارية التوصيل",
            title_en: "Mains Disconnection & Continuity Check",
            instruction_ar: "افصل القابس الرئيسي وافحص الفيوز الحراري بوضع الصفارة في جهاز القياس.",
            instruction_en: "Ensure plug is removed from wall socket, place multimeter in continuity/resistance beep mode across fuse terminals.",
            requires_tools: true
          },
          {
            step_number: 2,
            title_ar: "استبدال الفيوز الحراري بوصلات كبس",
            title_en: "Thermal Fuse Crimping & Replacement",
            instruction_ar: "قص أسلاك الفيوز المحترق وثبت الفيوز البديل باستخدام وصلات معدنية بالكبس وليس باللحام.",
            instruction_en: "Snip old fuse leads, attach new fuse with high-temp crimp sleeves using crimping tool, and cover with fiberglass insulation.",
            requires_tools: true
          }
        ],
        tools: ["Digital Multimeter", "Crimping Pliers & High-Temp Connectors", "Screwdriver Set"],
        difficulty: "moderate",
        minutes: 25
      },
      "motor": {
        causes: [
          {
            title_ar: "تآكل فحمات شربون الموتور (Carbon Brushes Wear) أو تراكم الشحوم",
            title_en: "Worn Motor Carbon Brushes & Commutator Oxidation",
            probability: 0.75,
            explanation_ar: "تآكل قوالب الكربون المسؤولة عن نقل التيار لقلب المحرك يسبب خروج شرر ورائحة حريق وانخفاض عزم المحرك أو توقفه نهائياً.",
            explanation_en: "Frictional wear shortens carbon brush blocks below spring tension contact length, producing excessive sparking and motor stall.",
            repair_method_ar: "طريقة التصليح المعتمدة: فحص طول فحمات الشربون واستبدالها إذا قل طولها عن 5 مم، تنظيف عاكس التيار النحاسي (Commutator) من برادة الكربون، والتأكد من توصيل مسارات المفتاح الكهربائي.",
            repair_method_en: "Repair Method: Extract carbon brush holders, check brush length (replace if under 5mm), dress commutator copper bars with fine abrasive paper, blow clean, and slide in replacement brush set.",
            is_hardware: true
          }
        ],
        steps: [
          {
            step_number: 1,
            title_ar: "فحص ميكانيكي لحرية دوران المحور",
            title_en: "Motor Shaft Free Rotation Inspection",
            instruction_ar: "أدر عمود المحرك بيدك للتأكد من عدم وجود خشونة أو تصلب في المحامل أو ترسبات متكلسة.",
            instruction_en: "Turn motor drive shaft by hand to check for smooth bearing rotation and absence of binding.",
            requires_tools: false
          }
        ],
        tools: ["Multimeter", "Replacement Carbon Brushes", "Screwdriver Set"],
        difficulty: "moderate",
        minutes: 30
      }
    },

    // 13. OTHER ELECTRONICS
    "Other": {
      "pcb_power": {
        causes: [
          {
            title_ar: "تلف أو قصر مكثف سيراميكي سطحي (SMD Ceramic Capacitor Short) على خط التغذية",
            title_en: "Short-Circuited Surface-Mount (SMD) Ceramic Filter Capacitor",
            probability: 0.72,
            explanation_ar: "الكسر الدقيق أو ارتفاع الجهد يسبب انهيار العازل الداخلي لأحد مكثفات التنعيم مما يؤدي لتوصيل خط الجهد الرئيسي بالأرضي وانقطاع الباور تماماً.",
            explanation_en: "Dielectric breakdown in MLCC filter capacitors creates a direct short from positive voltage rail to ground plane, shutting down DC-DC converters.",
            repair_method_ar: "طريقة التصليح المعتمدة: فحص اللوحة تحت الميكروسكوب والبحث عن حروق بصرية، حقن جهد منخفض (1V-3V) باستخدام مزود طاقة مخبري وكاميرا حرارية أو كحول أيزوبروبيلي لتحديد المكون الذي يسخن، ورفعه واستبداله بكاوية لحام.",
            repair_method_en: "Repair Method: Inspect PCB under stereo zoom microscope for cracked components, inject low voltage (1.2V-3.3V) onto shorted rail with DC bench supply, pinpoint boiling alcohol/hot spot, desolder shorted SMD cap, and replace.",
            is_hardware: true
          },
          {
            title_ar: "تفكك أو كسر لحام نقاط مقبس التوصيل (Cold Solder Joint at Connector Pins)",
            title_en: "Cold / Fractured Solder Joint at Main Power / Signal Jack",
            probability: 0.28,
            explanation_ar: "الإجهاد الميكانيكي المستمر يسبب شروخاً مجهرية حول أرجل التثبيت في اللوحة المطبوعة مما يقطع الاتصال الكهربائي.",
            explanation_en: "Mechanical vibration and repeated plug mating crack brittle solder fillets around PCB through-hole header pins.",
            repair_method_ar: "طريقة التصليح المعتمدة: إعادة لحام أرجل المنفذ باللوحة بإضافة مساعد لحام (Flux) وقصدير عالي الجودة ذو سبيكة مناسبة، وتثبيت جسم المقبس بمادة إيبوكسي لتعزيز مقاومة الشد.",
            repair_method_en: "Repair Method: Apply rosin flux to oxidized connector pins, reflow joints with 63/37 or lead-free solder wire, and reinforce mechanical chassis mount tabs with high-strength structural epoxy.",
            is_hardware: true
          }
        ],
        steps: [
          {
            step_number: 1,
            title_ar: "الفحص البصري الدقيق للمكونات المحترقة",
            title_en: "Visual PCB & Burnt Component Triage",
            instruction_ar: "تفقد اللوحة بحثاً عن أي انتفاخ في المكثفات أو آثار حروق سوداء أو روائح كيميائية تدل على قصر كهربائي.",
            instruction_en: "Inspect circuit board under strong light for scorch marks, cracked capacitor packages, or swollen electrolyte tops.",
            requires_tools: false
          },
          {
            step_number: 2,
            title_ar: "حقن الفولت وتحديد المكون التالف واستبداله",
            title_en: "Voltage Injection & SMD Soldering",
            instruction_ar: "استخدم مزود الطاقة المخبري لتحديد المكون المقصور واستبدله باستخدام كاوية اللحام ومساعد اللحام.",
            instruction_en: "Apply controlled DC voltage to shorted rail, locate overheating component, remove with soldering iron and solder replacement.",
            requires_tools: true
          }
        ],
        tools: ["Digital Multimeter", "Bench DC Power Supply", "Soldering Station & Flux", "99% Isopropyl Alcohol"],
        difficulty: "hard",
        minutes: 45
      }
    }
  };

  // CATEGORY NORMALIZATION MAP
  var CATEGORY_MAP = {
    "smartphone": "Smartphone",
    "mobile": "Smartphone",
    "phone": "Smartphone",
    "iphone": "Smartphone",
    "samsung": "Smartphone",
    "هاتف": "Smartphone",
    "موبايل": "Smartphone",
    "جوال": "Smartphone",
    "هاتف ذكي": "Smartphone",

    "laptop": "Laptop",
    "macbook": "Laptop",
    "notebook": "Laptop",
    "لابتوب": "Laptop",
    "محمول": "Laptop",
    "حاسوب محمول": "Laptop",

    "desktop": "Desktop Computer",
    "desktop computer": "Desktop Computer",
    "computer": "Desktop Computer",
    "pc": "Desktop Computer",
    "كمبيوتر": "Desktop Computer",
    "بي سي": "Desktop Computer",
    "كمبيوتر مكتبي": "Desktop Computer",

    "gaming console": "Gaming Console",
    "console": "Gaming Console",
    "playstation": "Gaming Console",
    "ps5": "Gaming Console",
    "ps4": "Gaming Console",
    "xbox": "Gaming Console",
    "switch": "Gaming Console",
    "بلايستيشن": "Gaming Console",
    "كونسول": "Gaming Console",
    "منصة ألعاب": "Gaming Console",

    "smart tv": "Smart TV",
    "tv": "Smart TV",
    "television": "Smart TV",
    "monitor": "Smart TV",
    "شاشة": "Smart TV",
    "تلفزيون": "Smart TV",
    "شاشة ذكية": "Smart TV",

    "storage": "Storage",
    "hdd": "Storage",
    "ssd": "Storage",
    "hard drive": "Storage",
    "nvme": "Storage",
    "قرص صلب": "Storage",
    "هارد": "Storage",
    "ذاكرة": "Storage",
    "فلاشة": "Storage",

    "tablet": "Tablet",
    "ipad": "Tablet",
    "تابلت": "Tablet",
    "آيباد": "Tablet",

    "smartwatch": "Smartwatch",
    "watch": "Smartwatch",
    "apple watch": "Smartwatch",
    "ساعة": "Smartwatch",
    "ساعة ذكية": "Smartwatch",

    "audio": "Audio",
    "headphones": "Audio",
    "headset": "Audio",
    "speakers": "Audio",
    "airpods": "Audio",
    "سماعات": "Audio",
    "سماعة": "Audio",
    "صوت": "Audio",

    "camera": "Camera",
    "dslr": "Camera",
    "drone": "Camera",
    "كاميرا": "Camera",
    "عدسة": "Camera",

    "printer": "Printer",
    "scanner": "Printer",
    "طابعة": "Printer",
    "سكانر": "Printer",

    "home appliance": "Home Appliance",
    "appliance": "Home Appliance",
    "vacuum": "Home Appliance",
    "coffee maker": "Home Appliance",
    "أجهزة منزلية": "Home Appliance",
    "منزلي": "Home Appliance",
    "مطبخ": "Home Appliance",

    "other": "Other",
    "إلكترونيات أخرى": "Other",
    "أخرى": "Other"
  };

  function normalizeCategory(rawCat) {
    if (!rawCat) return "Laptop";
    var clean = String(rawCat).trim().toLowerCase();
    for (var key in CATEGORY_MAP) {
      if (clean === key || clean.indexOf(key) !== -1) {
        return CATEGORY_MAP[key];
      }
    }
    return "Laptop";
  }

  // SYMPTOM DETECTORS PER CATEGORY
  function detectSubProblem(cat, fullText) {
    var text = fullText.toLowerCase();

    if (cat === "Smartphone") {
      if (/water|liquid|dropped in water|سقط في الماء|مبلل|غرق|سوائل/.test(text)) return "liquid";
      if (/battery|charge|drain|won't charge|dies|بطارية|شاحن|شحن|لا يشحن|تفريغ/.test(text)) return "battery";
      if (/screen|display|crack|touch|flicker|black screen|شاشة|كسر|تاتش|وميض|خطوط|سوداء/.test(text)) return "screen";
      if (/won't turn on|dead|power|no power|لا يفتح|لا يعمل|طافي|قاطع/.test(text)) return "power";
      return "screen"; // default smartphone most common repair
    }

    if (cat === "Laptop") {
      if (/heat|hot|overheat|thermal|fan loud|fan noise|حرارة|سخونة|يسخن|مروحة|صوت عالي/.test(text)) return "thermal";
      if (/battery|charge|adapter|power off|لا يشحن|بطارية|شاحن|تفرغ/.test(text)) return "battery";
      if (/screen|flicker|display|black screen|lines|شاشة|خطوط|وميض|شاشة سوداء/.test(text)) return "screen";
      if (/boot|bsod|blue screen|slow|freeze|ssd|windows|تهنيج|شاشة زرقاء|بطيء|إقلاع|ويندوز/.test(text)) return "boot_storage";
      return "thermal"; // default laptop
    }

    if (cat === "Desktop Computer") {
      if (/ram|bsod|blue screen|freeze|crash|رام|رامات|شاشة زرقاء|تجمد|تعليق/.test(text)) return "ram_gpu";
      if (/gpu|display|black screen|video|كارت|كارت شاشة|مفيش صورة|تقطيع/.test(text)) return "ram_gpu";
      if (/power|won't turn on|shut down|psu|dead|باور|يفصل|طافي|لا يعمل|مزود/.test(text)) return "power";
      return "power";
    }

    if (cat === "Gaming Console") {
      if (/heat|hot|overheat|loud fan|beeps|shut down|حرارة|سخونة|مروحة|صوت طيران|انطفاء/.test(text)) return "thermal";
      if (/hdmi|no signal|display|black screen|port|شاشة سوداء|لا توجد إشارة|منفذ hdmi/.test(text)) return "hdmi";
      return "hdmi";
    }

    if (cat === "Smart TV") {
      if (/line|lines|tcon|colors|double image|خطوط|ألوان|تيكون|صورة مشوشة/.test(text)) return "tcon_screen";
      if (/backlight|sound but no picture|black screen|dark|صوت بدون صورة|شاشة سوداء|ليدات|إضاءة/.test(text)) return "backlight";
      return "backlight";
    }

    if (cat === "Storage") {
      if (/click|clicking|noise|beep|head|تكتكة|صوت طقطقة|طرق|زن/.test(text)) return "clicking";
      if (/bad sector|smart|slow|raw|format|قطاع تالف|بطيء|يطلب فورمات|فحص/.test(text)) return "bad_sectors";
      return "bad_sectors";
    }

    if (cat === "Tablet") {
      if (/battery|drain|swollen|بطارية|منتفخة|تفرغ/.test(text)) return "battery";
      if (/screen|touch|glass|crack|شاشة|لمس|كسر|تاتش/.test(text)) return "screen";
      return "screen";
    }

    if (cat === "Smartwatch") {
      if (/charge|charging|sensor|heart rate|pulse|شحن|مستشعر|نبض/.test(text)) return "sensor";
      if (/battery|swelling|screen pop|screen lifting|بطارية|الشاشة طالعة|انتفاخ/.test(text)) return "battery";
      return "battery";
    }

    if (cat === "Audio") {
      if (/driver|speaker|one side|sound low|distortion|سماعة واحدة|صوت واطي|تشويش/.test(text)) return "driver";
      if (/cable|wire|jack|plug|cutting|سلك|مقبس|تقطيع الصوت/.test(text)) return "cable";
      return "cable";
    }

    if (cat === "Camera") {
      if (/sensor|dust|spots|بقع|أتربة|غبار على المستشعر/.test(text)) return "sensor";
      if (/shutter|lens|zoom|err|غالق|عدسة|زووم|انحشار/.test(text)) return "shutter";
      return "shutter";
    }

    if (cat === "Printer") {
      if (/head|clog|lines|streaks|ink|حبر|انسداد|خطوط بيضاء|بهتان/.test(text)) return "printhead";
      if (/jam|paper|feed|roller|انحشار|ورق|سحب الورق|بكرات/.test(text)) return "paper";
      return "paper";
    }

    if (cat === "Home Appliance") {
      if (/motor|smoke|spark|brush|محرك|موتور|شربون|شرر/.test(text)) return "motor";
      if (/fuse|heat|no power|dead|فيوز|لا يسخن|لا يعمل|طافي/.test(text)) return "thermal_fuse";
      return "thermal_fuse";
    }

    return "pcb_power";
  }

  // SAFETY HAZARD DETECTOR
  function detectSafetyHazards(text) {
    var hazards = [];
    if (/swollen|bulge|battery bulge|popped screen|انتفاخ|منتفخ|منتفخة|منفوخ|تورم/.test(text)) {
      hazards.push({
        severity: "critical",
        en: "DANGER: Swollen lithium-ion battery detected! Severe fire and chemical explosion hazard. Do NOT charge, puncture, or compress the device.",
        ar: "خطر جسيم: تم اكتشاف انتفاخ في بطارية الليثيوم! يوجد خطر نشوب حريق وانفجار كيميائي. لا تقم بشحن الجهاز أو الضغط عليه أو محاولة ثقبه."
      });
    }
    if (/smoke|burning smell|sparks|fire|electrical shock|دخان|رائحة حريق|شرر|تماس كهربائي|صعقة/.test(text)) {
      hazards.push({
        severity: "critical",
        en: "CRITICAL HAZARD: Electrical short-circuit or thermal runaway detected. Risk of electrocution or electrical fire.",
        ar: "خطر حرج: تم اكتشاف قصر كهربائي أو تماس حراري. يوجد خطر نشوب حريق كهربائي أو التعرض لصعقة."
      });
    }
    if (/water|spill|submerged|dropped in water|سقط في الماء|انسكب ماء|شاي|قهوة|مبلل/.test(text)) {
      hazards.push({
        severity: "high",
        en: "WARNING: Liquid ingress detected. Operating or charging a wet device causes permanent motherboard corrosion and short-circuits.",
        ar: "تحذير: تسرب سوائل للجهاز. تشغيل أو شحن جهاز مبلل يؤدي إلى تآكل اللوحة الأم واحتراق الدوائر بشكل دائم."
      });
    }
    return hazards;
  }

  // MAIN ANALYZE API
  function analyze(req) {
    var rawText = [
      req.description || "",
      req.error_message || "",
      req.recent_changes || "",
      req.problem_category || "",
      req.brand || "",
      req.model || ""
    ].join(" ").toLowerCase();

    // 1. Resolve normalized category
    var normCat = normalizeCategory(req.device_category);
    // If category was not explicit in device_category, try matching in rawText
    if ((!req.device_category || req.device_category === "Laptop") && rawText.length > 0) {
      for (var k in CATEGORY_MAP) {
        if (rawText.indexOf(k) !== -1) {
          normCat = CATEGORY_MAP[k];
          break;
        }
      }
    }

    // 2. Detect specific sub-problem
    var subProblem = detectSubProblem(normCat, rawText);

    // 3. Retrieve knowledge base pack
    var catPack = KNOWLEDGE_BASE[normCat] || KNOWLEDGE_BASE["Laptop"];
    var faultPack = catPack[subProblem] || Object.values(catPack)[0];

    // 4. Safety hazards check
    var hazards = detectSafetyHazards(rawText);
    var isCritical = hazards.some(function (h) { return h.severity === "critical"; });
    var isHigh = hazards.some(function (h) { return h.severity === "high"; });

    var warningsEn = hazards.map(function (h) { return h.en; });
    var warningsAr = hazards.map(function (h) { return h.ar; });

    // 5. Extracted symptoms labels
    var extractedSymptoms = [];
    if (subProblem) extractedSymptoms.push(subProblem.replace(/_/g, " ").toUpperCase());
    if (req.problem_category) extractedSymptoms.push(req.problem_category);
    if (isCritical) extractedSymptoms.push("SAFETY_HAZARD");

    // 6. Assemble complete report
    var report = {
      report_id: "FX-" + Date.now().toString().slice(-6),
      device_category: normCat,
      brand: req.brand || (window.i18n && window.i18n.currentLang === "ar" ? "عام" : "Universal"),
      model: req.model || (window.i18n && window.i18n.currentLang === "ar" ? "قياسي" : "Standard"),
      problem_category: req.problem_category || subProblem,
      extracted_symptoms: extractedSymptoms,
      severity: isCritical ? "critical" : (isHigh ? "high" : "medium"),
      confidence_score: isCritical ? 0.96 : 0.89,
      possible_causes: faultPack.causes,
      troubleshooting_steps: faultPack.steps,
      required_tools: faultPack.tools,
      estimated_difficulty: faultPack.difficulty,
      estimated_minutes: faultPack.minutes,
      safety_warnings_en: warningsEn,
      safety_warnings_ar: warningsAr,
      requires_technician: isCritical || faultPack.difficulty === "hard",
      created_at: new Date().toISOString()
    };

    return report;
  }

  // Export globally
  window.FixoraDiagnosisEngine = {
    analyze: analyze,
    normalizeCategory: normalizeCategory,
    knowledgeBase: KNOWLEDGE_BASE
  };

})(typeof window !== 'undefined' ? window : this);