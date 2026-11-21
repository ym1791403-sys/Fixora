/**
 * Fixora API Client & Client-Side AI Engine
 * Full-stack hybrid: Connects to backend if available, or runs 100% in-browser on static platforms (Vercel / GitHub Pages).
 */

class ApiClient {
  constructor() {
    this.baseUrl = "/api/v1";
    this.token = localStorage.getItem("techrepair_token") || null;
    this.currentUser = JSON.parse(localStorage.getItem("techrepair_user") || "null");
    this.initMockStorage();
  }

  setSession(token, user) {
    this.token = token;
    this.currentUser = user;
    localStorage.setItem("techrepair_token", token);
    localStorage.setItem("techrepair_user", JSON.stringify(user));
  }

  clearSession() {
    this.token = null;
    this.currentUser = null;
    localStorage.removeItem("techrepair_token");
    localStorage.removeItem("techrepair_user");
  }

  isLoggedIn() {
    return !!this.token;
  }

  getUser() {
    return this.currentUser;
  }

  getRole() {
    return this.currentUser ? this.currentUser.role : "guest";
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {})
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, { ...options, headers });
      if (response.status === 401) {
        this.clearSession();
        if (window.app && typeof window.app.updateNavAuth === "function") {
          window.app.updateNavAuth();
        }
      }

      if (response.ok) {
        return await response.json();
      }
      throw new Error(`HTTP ${response.status}`);
    } catch (err) {
      // Fallback to client-side engine (for static Vercel / GitHub Pages deployments)
      return this.handleMockRequest(endpoint, options);
    }
  }

  // ==========================================
  // CLIENT-SIDE STORAGE & PRE-SEEDED DATA
  // ==========================================
  initMockStorage() {
    if (!localStorage.getItem("techrepair_users")) {
      const initialUsers = [
        {
          id: 1,
          email: "admin@fixora.com",
          full_name: "Platform Administrator",
          role: "admin",
          phone: "+201000000000",
          is_active: true
        },
        {
          id: 2,
          email: "user@fixora.com",
          full_name: "Ahmed Mansour",
          role: "user",
          phone: "+201012345678",
          is_active: true
        }
      ];
      localStorage.setItem("techrepair_users", JSON.stringify(initialUsers));
    }

    if (!localStorage.getItem("techrepair_devices")) {
      const initialDevices = [
        {
          id: 1,
          user_id: 2,
          category: "Laptop",
          brand: "Dell",
          model: "XPS 15 9500",
          serial: "DELL-9500-2022",
          year: 2022,
          os_v: "Windows 11 Pro"
        }
      ];
      localStorage.setItem("techrepair_devices", JSON.stringify(initialDevices));
    }

    if (!localStorage.getItem("techrepair_reports")) {
      localStorage.setItem("techrepair_reports", JSON.stringify([]));
    }

    if (!localStorage.getItem("techrepair_requests")) {
      localStorage.setItem("techrepair_requests", JSON.stringify([]));
    }
  }

  getPreseededGuides() {
    if (typeof window !== 'undefined' && window.REAL_FIXORA_GUIDES && window.REAL_FIXORA_GUIDES.length > 0) {
      return window.REAL_FIXORA_GUIDES;
    }
    return [];
  }

  getPreseededTechnicians() {
    return [
      {
        id: 1,
        user_id: 3,
        name: "Eng. Mahmoud Hassan",
        email: "cairo.fix@fixora.com",
        business_name: "Apex Laptop & Board Diagnostics",
        city: "Cairo",
        specializations: "Laptops, Motherboard Repair, Micro-soldering, MacBooks",
        bio: "Certified IPC specialist with 8+ years experience in micro-soldering, motherboard repairs, and GPU reballing.",
        rating: 4.9,
        reviews_count: 128,
        status: "approved"
      },
      {
        id: 2,
        user_id: 4,
        name: "Sarah Al-Ghamdi",
        email: "alex.tech@fixora.com",
        business_name: "SmartFix Mobile & Tablet Lab",
        city: "Alexandria",
        specializations: "Smartphones, Tablets, Screen Refurbishing, Water Damage Recovery",
        bio: "Specialized laboratory in advanced OLED screen lamination, face-ID repair, and battery management board swaps.",
        rating: 4.8,
        reviews_count: 94,
        status: "approved"
      },
      {
        id: 3,
        user_id: 5,
        name: "Khaled El-Sayed",
        email: "giza.pc@fixora.com",
        business_name: "ProBuild Workstations & Data Recovery",
        city: "Giza",
        specializations: "Desktop Computers, Data Recovery, NVMe SSDs, Custom PCs",
        bio: "Cleanroom data recovery expert from failed HDDs and SSDs, alongside custom high-end PC troubleshooting.",
        rating: 5.0,
        reviews_count: 76,
        status: "approved"
      }
    ];
  }

  // ==========================================
  // CLIENT-SIDE AI DIAGNOSIS ENGINE
  // ==========================================
  runClientDiagnosis(req) {
    const text = `${req.description} ${req.error_message || ""} ${req.recent_changes || ""}`.toLowerCase();

    // 1. Safety Hazards Check
    const hazards = [
      {
        id: "swollen_battery",
        keywords: ["swollen", "bulging", "battery bulge", "popped screen", "bulge", "swell", "انتفاخ", "منتفخ", "منتفخة", "منفوخ", "منفوخة", "تورم", "متورمة", "بطارية منتفخة", "شاشة مرتفعة"],
        warning_en: "DANGER: Swollen or bulging lithium-ion batteries are a severe fire and explosion hazard. Do NOT charge, puncture, or apply pressure to the device.",
        warning_ar: "خطر جسيم: بطاريات الليثيوم المنتفخة تشكل خطراً كبيراً لنشوب حريق أو انفجار. لا تقم بشحن الجهاز أو الضغط عليه أو محاولة ثقبه."
      },
      {
        id: "smoke_or_burning",
        keywords: ["smoke", "burning smell", "sparks", "fire", "electrical shock", "دخان", "رائحة حريق", "شرر", "تماس كهربائي", "صعقة"],
        warning_en: "CRITICAL HAZARD: Electrical short-circuit or thermal runaway detected. Risk of electrocution or electrical fire.",
        warning_ar: "خطر حرج: تم اكتشاف قصر كهربائي أو تماس حراري. يوجد خطر نشوب حريق كهربائي أو التعرض لصعقة."
      },
      {
        id: "liquid_with_power",
        keywords: ["dropped in water", "water spill", "submerged", "coffee spill", "سقط في الماء", "انسكب ماء", "شاي", "قهوة", "مبلل"],
        warning_en: "WARNING: Liquid ingress detected. Operating or charging a wet device will cause permanent motherboard corrosion and short-circuits.",
        warning_ar: "تحذير: تسرب سوائل للجهاز. تشغيل أو شحن جهاز مبلل يؤدي إلى تآكل اللوحة الأم واحتراق الدوائر بشكل دائم."
      }
    ];

    let isCritical = false;
    let hazardSeverity = "low";
    let warningsEn = [];
    let warningsAr = [];

    for (const h of hazards) {
      if (h.keywords.some(k => text.includes(k))) {
        isCritical = true;
        hazardSeverity = "critical";
        warningsEn.push(h.warning_en);
        warningsAr.push(h.warning_ar);
      }
    }

    // 2. Symptom Extraction
    const symptomPatterns = {
      overheating: ["hot", "overheat", "overheating", "thermal", "fan loud", "fan noise", "ساخن", "حرارة", "سخونة", "يسخن", "مروحة"],
      unexpected_shutdown: ["shuts down", "shut down", "turns off", "powers off", "restarts randomly", "ينطفئ", "يطفئ", "إيقاف مفاجئ", "يفصل"],
      no_power: ["won't turn on", "does not turn on", "no power", "completely dead", "no lights", "لا يعمل", "لا يفتح", "قاطع باور"],
      battery_charging_issue: ["battery drains", "won't charge", "not charging", "battery dies fast", "لا يشحن", "البطارية تفرغ", "منفذ الشاحن"],
      screen_display_issue: ["screen flicker", "lines on screen", "cracked screen", "touch not working", "شاشة سوداء", "وميض", "خطوط في الشاشة", "شاشة مكسورة"],
      slow_performance: ["slow", "lagging", "freezing", "sluggish", "بطيء", "تهنيج", "تعليق", "ثقيل جداً"],
      console_error: ["ps5", "ps4", "xbox", "switch", "3 beeps", "beep", "beeps", "stick drift", "صفارات", "بلايستيشن", "إكس بوكس", "دريفت"],
      hdmi_issue: ["hdmi", "no signal", "black screen", "loose port", "منفذ hdmi", "لا توجد إشارة"],
      storage_failure: ["hdd", "ssd", "smart", "bad sector", "clicking", "clicking sound", "hard drive", "تكتكة", "هارد", "قطاع تالف"],
      tv_backlight: ["backlight", "tv sound but no picture", "صوت بدون صورة", "ليدات", "شاشة سوداء مع صوت"]
    };

    let extractedSymptoms = [];
    for (const [code, words] of Object.entries(symptomPatterns)) {
      if (words.some(w => text.includes(w))) {
        extractedSymptoms.push(code);
      }
    }
    if (extractedSymptoms.length === 0) extractedSymptoms.push("overheating");

    // 3. Knowledge Base
    const kb = [
      {
        id: "kb_console",
        symptoms: ["console_error", "hdmi_issue", "overheating"],
        causes: [
          {
            title_en: "Cooling Heatsink Dust Blockage or Liquid Metal Dry Spot",
            title_ar: "انسداد زعانف المبرد بالأتربة أو جفاف سائل التبريد (Liquid Metal)",
            probability: 0.68,
            explanation_en: "PlayStation / Xbox consoles pull massive airflow that cakes heatsink fins in lint, causing 3-beep thermal shutdowns.",
            explanation_ar: "تسحب منصات الألعاب كميات هواء ضخمة تتراكم على هيئة سدادة غبار فوق المبرد مما يجبر الجهاز على الانطفاء لحماية المعالج.",
            is_hardware: true
          },
          {
            title_en: "Damaged HDMI Port Pins",
            title_ar: "تلف أو انثناء أسنان منفذ HDMI الداخلي",
            probability: 0.32,
            explanation_en: "Accidental cable tugging or repeated insertion bends internal pins, causing White Light of Death (no display).",
            explanation_ar: "شد الكابل أو إدخاله بقوة يسبب انثناء الأسنان النحاسية الدقيقة داخل المنفذ مما يقطع نقل إشارة الفيديو.",
            is_hardware: true
          }
        ],
        steps: [
          {
            step_number: 1,
            title_en: "Inspect HDMI Port with Flashlight",
            title_ar: "معاينة منفذ HDMI بالكشاف",
            instruction_en: "Look into port for bent gold pins or loose socket housing.",
            instruction_ar: "سلط ضوءاً داخل منفذ العرض وتأكد من استقامة الأسنان وعدم اهتزاز المنفذ.",
            requires_tools: false
          },
          {
            step_number: 2,
            title_en: "Vacuum Dust Catcher Vents",
            title_ar: "شفط الأتربة من فتحات التهوية",
            instruction_en: "Remove faceplate and use vacuum nozzle on dust collection ports.",
            instruction_ar: "انزع الغطاء الجانبي واستخدم مكنسة لتفريغ فتحات مصيدة الغبار المخصصة.",
            requires_tools: true
          }
        ],
        tools: ["Torx T8 Security Screwdriver", "Vacuum Cleaner", "Flashlight"],
        difficulty: "easy",
        minutes: 20
      },
      {
        id: "kb_storage",
        symptoms: ["storage_failure", "slow_performance"],
        causes: [
          {
            title_en: "Degraded Magnetic Platter Sectors (SMART Reallocated Sectors)",
            title_ar: "تلف قطاعات القراءة السطحية (Bad Sectors بمؤشرات SMART)",
            probability: 0.75,
            explanation_en: "Physical drive degradation detected. Mechanical read heads are repeatedly failing to read weak sectors.",
            explanation_ar: "تدهور فيزيائي في سطح القرص يمنع إبرة القراءة من قراءة البيانات بسلاسة مما يهدد بفقدانها.",
            is_hardware: true
          },
          {
            title_en: "Corrupted File System / Partition Table",
            title_ar: "تلف جدول التقسيم أو نظام الملفات (NTFS / EXT4)",
            probability: 0.25,
            explanation_en: "Improper shutdown or disconnection during write operations scrambled the file index.",
            explanation_ar: "فصل القرص المفاجئ أثناء الكتابة تسبب في تلف فهرس الملفات دون تلف العتاد نفسه.",
            is_hardware: false
          }
        ],
        steps: [
          {
            step_number: 1,
            title_en: "Immediate Emergency Backup",
            title_ar: "عمل نسخة احتياطية فورية للملفات الحيوية",
            instruction_en: "Clone or copy your most irreplaceable files to cloud or external drive before testing.",
            instruction_ar: "انسخ أهم ملفاتك فوراً إلى وسيط خارجي قبل إجراء أي فحص مكثف على القرص.",
            requires_tools: false
          },
          {
            step_number: 2,
            title_en: "Read S.M.A.R.T. Health Attributes",
            title_ar: "قراءة تقرير مستشعرات SMART",
            instruction_en: "Check Reallocated Sectors (05) and Uncorrectable Sectors (C6) with diagnostic tool.",
            instruction_ar: "استخدم أداة فحص SMART للتأكد من عدد القطاعات التالفة.",
            requires_tools: true
          }
        ],
        tools: ["CrystalDiskInfo / SMART Utility", "Backup Storage"],
        difficulty: "easy",
        minutes: 15
      },
      {
        id: "kb_tv",
        symptoms: ["screen_display_issue", "tv_backlight"],
        causes: [
          {
            title_en: "Burnt LED Backlight Strips",
            title_ar: "احتراق شرائط ليدات الإضاءة الخلفية (LED Backlight)",
            probability: 0.80,
            explanation_en: "One or more LED diodes in the series array burned open, cutting power to all display backlights while audio continues.",
            explanation_ar: "احتراق أحد الليدات في الدائرة المتوالية يقطع الإضاءة عن كامل الشاشة بينما يستمر الصوت طبيعياً.",
            is_hardware: true
          },
          {
            title_en: "T-Con Timing Controller Board Failure",
            title_ar: "تلف بوردة معالج التوقيت والعرض (T-Con Board)",
            probability: 0.20,
            explanation_en: "T-Con board power rail failure causes vertical bars, solarized colors, or total panel blackout.",
            explanation_ar: "عطل في تغذية كارت التيكون ينتج خطوطاً طولية أو شاشة سوداء مع عمل الإضاءة الخلفية.",
            is_hardware: true
          }
        ],
        steps: [
          {
            step_number: 1,
            title_en: "Perform Flashlight Test",
            title_ar: "إجراء اختبار الكشاف الضوئي",
            instruction_en: "Shine phone torch on screen to check if image is forming without light.",
            instruction_ar: "سلط كشاف الموبايل على الشاشة لمعاينة خيالات الصورة.",
            requires_tools: false
          }
        ],
        tools: ["LED Flashlight", "Multimeter"],
        difficulty: "hard",
        minutes: 40
      },
      {
        id: "kb_overheat",
        symptoms: ["overheating", "unexpected_shutdown"],
        causes: [
          {
            title_en: "Dried Thermal Paste & Blocked Heat Sink",
            title_ar: "جفاف المعجون الحراري وانسداد فتحات التبريد",
            probability: 0.72,
            explanation_en: "Degraded thermal compound prevents heat dissipation, triggering safety cutoff.",
            explanation_ar: "المعجون الحراري جاف مما يعيق تبديد الحرارة ويؤدي للإغلاق التلقائي لحماية الجهاز.",
            is_hardware: true
          },
          {
            title_en: "Cooling Fan Dust Clogging",
            title_ar: "تراكم الأتربة على شفرات مروحة التبريد",
            probability: 0.28,
            explanation_en: "Restricted airflow forces temperatures above safe thresholds.",
            explanation_ar: "انسداد مجرى الهواء بالأتربة يمنع خروج الهواء الساخن.",
            is_hardware: true
          }
        ],
        steps: [
          {
            step_number: 1,
            title_en: "Inspect Air Vents",
            title_ar: "فحص فتحات التهوية الخارجية",
            instruction_en: "Ensure laptop is on a hard, flat surface to keep intake vents clear.",
            instruction_ar: "تأكد من وضع الجهاز على سطح صلب ومستوٍ لضمان دخول الهواء النقي.",
            requires_tools: false
          },
          {
            step_number: 2,
            title_en: "Clean Vents with Compressed Air",
            title_ar: "تنظيف فتحات المروحة بالهواء المضغوط",
            instruction_en: "Power off and spray compressed air in short bursts through exhaust vents.",
            instruction_ar: "أوقف تشغيل الجهاز واستخدم بخاخ هواء مضغوط لتنظيف الفتحات بلطف.",
            requires_tools: true
          },
          {
            step_number: 3,
            title_en: "Re-apply High Performance Thermal Paste",
            title_ar: "تجديد المعجون الحراري للمعالج",
            instruction_en: "Clean old paste with 99% alcohol and place a small bead in the die center.",
            instruction_ar: "امسح المعجون القديم بكحول طبي نظيف وضع نقطة صغيرة من المعجون الجديد.",
            requires_tools: true
          }
        ],
        tools: ["Precision Screwdriver", "Compressed Air Can", "Thermal Paste", "99% Isopropyl Alcohol"],
        difficulty: "moderate",
        minutes: 35
      },
      {
        id: "kb_battery",
        symptoms: ["battery_charging_issue"],
        causes: [
          {
            title_en: "Degraded Chemical Battery Cells",
            title_ar: "تراجع كفاءة خلايا البطارية الكيميائية",
            probability: 0.65,
            explanation_en: "Lithium-ion cells naturally degrade over charging cycles.",
            explanation_ar: "بطاريات الليثيوم تفقد سعتها تدريجياً مع كثرة دورات الشحن.",
            is_hardware: true
          },
          {
            title_en: "Debris Compressed in Charging Port",
            title_ar: "تراكم الأتربة داخل منفذ الشاحن",
            probability: 0.35,
            explanation_en: "Pocket lint prevents charging cable pins from making direct electrical contact.",
            explanation_ar: "تجمع الأتربة يمنع موصل الكابل من التلامس الصحيح مع الأسنان الداخلية.",
            is_hardware: true
          }
        ],
        steps: [
          {
            step_number: 1,
            title_en: "Test Different Certified Cable and Charger",
            title_ar: "تجربة شاحن وكابل أصليين بديلين",
            instruction_en: "Plug device into a verified official power adapter.",
            instruction_ar: "جرب شاحناً أصلياً آخر للتأكد من سلامة رأس الشاحن والكابل.",
            requires_tools: false
          },
          {
            step_number: 2,
            title_en: "Gently Clean Port with Non-conductive Probe",
            title_ar: "تنظيف المنفذ بأداة خشبية أو بلاستيكية غير معدنية",
            instruction_en: "Under light, use a wooden toothpick to gently sweep lint out.",
            instruction_ar: "استخدم عود أسنان خشبي برفق لإخراج الأتربة المتراكمة دون إيذاء الأسنان.",
            requires_tools: true
          }
        ],
        tools: ["Wooden Toothpick", "Bright Flashlight", "Certified Charger"],
        difficulty: "easy",
        minutes: 15
      }
    ];

    let match = kb.find(k => k.symptoms.some(s => extractedSymptoms.includes(s))) || kb[0];

    const report = {
      report_id: "rep_" + Date.now(),
      device_category: req.device_category || "Laptop",
      brand: req.brand || "General",
      model: req.model || "Standard",
      problem_category: req.problem_category || "Hardware",
      extracted_symptoms: extractedSymptoms,
      severity: isCritical ? "critical" : "medium",
      confidence_score: isCritical ? 0.95 : 0.88,
      possible_causes: match.causes,
      troubleshooting_steps: match.steps,
      required_tools: match.tools,
      estimated_difficulty: match.difficulty,
      estimated_minutes: match.minutes,
      safety_warnings_en: warningsEn,
      safety_warnings_ar: warningsAr,
      requires_technician: isCritical,
      created_at: new Date().toISOString()
    };

    // Save report in local storage
    const reports = JSON.parse(localStorage.getItem("techrepair_reports") || "[]");
    reports.unshift(report);
    localStorage.setItem("techrepair_reports", JSON.stringify(reports));

    return report;
  }

  // ==========================================
  // CLIENT-SIDE ROUTER HANDLER
  // ==========================================
  handleMockRequest(endpoint, options) {
    const method = (options.method || "GET").toUpperCase();
    const body = options.body ? JSON.parse(options.body) : {};

    // Auth
    if (endpoint === "/auth/login") {
      const users = JSON.parse(localStorage.getItem("techrepair_users") || "[]");
      const user = users.find(u => u.email === body.email) || {
        id: Date.now(),
        email: body.email,
        full_name: body.email.split("@")[0],
        role: body.email.includes("admin") ? "admin" : "user"
      };
      const token = "mock_token_" + Date.now();
      this.setSession(token, user);
      return { access_token: token, token_type: "bearer", user };
    }

    if (endpoint === "/auth/register") {
      const user = {
        id: Date.now(),
        email: body.email,
        full_name: body.full_name,
        role: body.role || "user",
        phone: body.phone || null
      };
      const users = JSON.parse(localStorage.getItem("techrepair_users") || "[]");
      users.push(user);
      localStorage.setItem("techrepair_users", JSON.stringify(users));
      const token = "mock_token_" + Date.now();
      this.setSession(token, user);
      return { access_token: token, token_type: "bearer", user };
    }

    if (endpoint === "/auth/me") {
      return this.currentUser || { id: 1, full_name: "Guest", role: "guest" };
    }

    // Diagnosis
    if (endpoint === "/diagnosis/analyze") {
      return this.runClientDiagnosis(body);
    }

    if (endpoint === "/diagnosis/reports") {
      return JSON.parse(localStorage.getItem("techrepair_reports") || "[]");
    }

    if (endpoint.startsWith("/diagnosis/reports/")) {
      const id = endpoint.split("/").pop();
      const reports = JSON.parse(localStorage.getItem("techrepair_reports") || "[]");
      if (method === "DELETE") {
        const filtered = reports.filter(r => r.report_id !== id);
        localStorage.setItem("techrepair_reports", JSON.stringify(filtered));
        return { success: true };
      }
      return reports.find(r => r.report_id === id) || reports[0];
    }

    // Guides (Connected to 18,995 Real MyFixit Dataset Guides)
    if (endpoint.startsWith("/guides")) {
      const allGuides = this.getPreseededGuides();
      const singleMatch = endpoint.match(/^\/guides\/(\d+)/);
      if (singleMatch) {
        const id = parseInt(singleMatch[1]);
        return allGuides.find(g => g.id === id) || allGuides[0];
      }
      const parts = endpoint.split("?");
      if (parts.length > 1) {
        const params = new URLSearchParams(parts[1]);
        const cat = params.get("category");
        const diff = params.get("difficulty");
        const search = params.get("search");
        let filtered = allGuides;
        if (cat) filtered = filtered.filter(g => g.device_category.toLowerCase() === cat.toLowerCase());
        if (diff) filtered = filtered.filter(g => g.difficulty.toLowerCase() === diff.toLowerCase());
        if (search) {
          const q = search.toLowerCase();
          filtered = filtered.filter(g => 
            (g.title_en && g.title_en.toLowerCase().includes(q)) ||
            (g.title_ar && g.title_ar.includes(q)) ||
            (g.summary_en && g.summary_en.toLowerCase().includes(q)) ||
            (g.summary_ar && g.summary_ar.includes(q))
          );
        }
        return filtered;
      }
      return allGuides;
    }

    // Technicians
    if (endpoint.startsWith("/technicians")) {
      return this.getPreseededTechnicians();
    }

    // Bookings / Requests
    if (endpoint === "/bookings/requests") {
      if (method === "POST") {
        const requests = JSON.parse(localStorage.getItem("techrepair_requests") || "[]");
        const req = {
          id: Date.now(),
          ...body,
          status: "pending",
          created_at: new Date().toISOString()
        };
        requests.push(req);
        localStorage.setItem("techrepair_requests", JSON.stringify(requests));
        return req;
      }
      return JSON.parse(localStorage.getItem("techrepair_requests") || "[]");
    }

    // Devices
    if (endpoint === "/devices") {
      if (method === "POST") {
        const devices = JSON.parse(localStorage.getItem("techrepair_devices") || "[]");
        const dev = { id: Date.now(), user_id: this.currentUser ? this.currentUser.id : 1, ...body };
        devices.push(dev);
        localStorage.setItem("techrepair_devices", JSON.stringify(devices));
        return dev;
      }
      return JSON.parse(localStorage.getItem("techrepair_devices") || "[]");
    }

    // Admin
    if (endpoint.startsWith("/admin/stats")) {
      return {
        total_users: 142,
        total_diagnoses: 520,
        active_technicians: 18,
        pending_technicians: 3
      };
    }

    if (endpoint.startsWith("/admin/technicians/pending")) {
      return [];
    }

    if (endpoint.startsWith("/admin/users")) {
      return JSON.parse(localStorage.getItem("techrepair_users") || "[]");
    }

    return { status: "ok" };
  }

  // --- API WRAPPERS ---
  async login(email, password) {
    const data = await this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
    this.setSession(data.access_token, data.user);
    return data;
  }

  async register(full_name, email, password, role = "user", phone = null) {
    const data = await this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ full_name, email, password, role, phone })
    });
    this.setSession(data.access_token, data.user);
    return data;
  }

  async getMe() {
    return await this.request("/auth/me");
  }

  async runDiagnosis(payload) {
    return await this.request("/diagnosis/analyze", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }

  async getMyReports() {
    return await this.request("/diagnosis/reports");
  }

  async getReport(reportId) {
    return await this.request(`/diagnosis/reports/${reportId}`);
  }

  async deleteReport(reportId) {
    return await this.request(`/diagnosis/reports/${reportId}`, {
      method: "DELETE"
    });
  }

  async getGuides(category = null, difficulty = null, search = null) {
    const params = new URLSearchParams();
    if (category) params.append("category", category);
    if (difficulty) params.append("difficulty", difficulty);
    if (search) params.append("search", search);
    return await this.request(`/guides?${params.toString()}`);
  }

  async getGuide(guideId) {
    return await this.request(`/guides/${guideId}`);
  }

  async getTechnicians(city = null, specialization = null) {
    const params = new URLSearchParams();
    if (city) params.append("city", city);
    if (specialization) params.append("specialization", specialization);
    return await this.request(`/technicians?${params.toString()}`);
  }

  async getTechnician(techId) {
    return await this.request(`/technicians/${techId}`);
  }

  async createRepairRequest(payload) {
    return await this.request("/bookings/requests", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }

  async getMyRequests() {
    return await this.request("/bookings/requests");
  }

  async updateRequestStatus(requestId, status, quote = null) {
    return await this.request(`/bookings/requests/${requestId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, estimated_quote: quote })
    });
  }

  async getMyDevices() {
    return await this.request("/devices");
  }

  async addDevice(device) {
    return await this.request("/devices", {
      method: "POST",
      body: JSON.stringify(device)
    });
  }

  async deleteDevice(deviceId) {
    return await this.request(`/devices/${deviceId}`, {
      method: "DELETE"
    });
  }

  async getAdminStats() {
    return await this.request("/admin/stats");
  }

  async getPendingTechnicians() {
    return await this.request("/admin/technicians/pending");
  }

  async approveTechnician(techId) {
    return await this.request(`/admin/technicians/${techId}/approve`, {
      method: "POST"
    });
  }

  async rejectTechnician(techId) {
    return await this.request(`/admin/technicians/${techId}/reject`, {
      method: "POST"
    });
  }

  async getAdminUsers() {
    return await this.request("/admin/users");
  }

  async toggleUserStatus(userId) {
    return await this.request(`/admin/users/${userId}/status`, {
      method: "PATCH"
    });
  }
}

var api = window.api = new ApiClient();
