/**
 * Fixora Bilingual Internationalization (i18n) Engine
 * High-End Hardware Aesthetic & Universal Multi-Device Edition
 * Supported Languages: English ('en', LTR) & Arabic ('ar', RTL)
 */

const TRANSLATIONS = {
  en: {
    // Navigation
    nav_home: "Home",
    nav_about: "About Us",
    nav_diagnose: "Diagnose Device",
    nav_guides: "Repair Guides",
    nav_technicians: "Technicians",
    nav_datasets: "Datasets",
    nav_dashboard: "Dashboard",
    nav_login: "Log In",
    nav_register: "Get Started",
    nav_logout: "Log Out",
    
    // Hero (ByteFix Reference Typography & Copy)
    hero_headline: "Fixing Tech Issues Fast and Right",
    hero_subtext: "Expert AI-powered diagnosis and certified repair services you can trust, ensuring your technology runs smoothly and efficiently, every time.",
    hero_emergency_btn: "Get Emergency Service",
    hero_request_repair: "Request a Repair Today",
    hero_badge: "AI Hardware Diagnostic Platform",
    
    // Quick Demo Triage Card
    demo_title: "Instant Smart Triage",
    demo_placeholder: "e.g., PS5 turns off with 3 beeps, or laptop shuts down after 10 minutes...",
    demo_btn: "Quick Check",
    demo_devices: "Supported Universal Device Categories",
    
    // About Us Section (ByteFix Reference)
    about_title: "About Us",
    about_body_1: "At Fixora, we provide reliable AI diagnosis and comprehensive repair services tailored to your needs. Our certified specialists and neural triage logic handle everything from hardware troubleshooting and component-level repairs to data recovery and cybersecurity.",
    about_body_2: "We keep your technology running smoothly with dependable solutions for smartphones, laptops, gaming consoles, smart TVs, storage drives, and home appliances.",
    badge_text: "• FIXORA AI PLATFORM • CERTIFIED REPAIRS • EST. 2026 •",
    stat_accuracy: "99.4%",
    stat_accuracy_lbl: "Diagnostic Accuracy",
    stat_devices: "13+ Categories",
    stat_devices_lbl: "Universal Device Coverage",
    stat_speed: "< 3 Seconds",
    stat_speed_lbl: "Instant AI Response",

    // Device Categories
    cat_all: "All Devices",
    cat_laptop: "Laptop",
    cat_computer: "Desktop Computer",
    cat_smartphone: "Smartphone",
    cat_tablet: "Tablet",
    cat_smartwatch: "Smartwatch & Wearables",
    cat_console: "Gaming Console",
    cat_tv: "Smart TV & Display",
    cat_audio: "Audio & Headphones",
    cat_camera: "Camera & Drone",
    cat_storage: "Storage & Hard Drives",
    cat_printer: "Printer & Scanner",
    cat_appliance: "Home Appliances & IoT",
    cat_other: "Other Electronics",

    // Device Subtitles
    cat_laptop_sub: "MacBook, Dell, ThinkPad, HP, Asus",
    cat_computer_sub: "Custom PC, iMac, Workstations, PSU, GPU",
    cat_smartphone_sub: "iPhone, Galaxy, Xiaomi, Pixel, OnePlus",
    cat_tablet_sub: "iPad, Galaxy Tab, Surface, Tablets",
    cat_smartwatch_sub: "Apple Watch, Galaxy Watch, Fitbits",
    cat_console_sub: "PS5, PS4, Xbox Series X, Switch, Steam Deck",
    cat_tv_sub: "OLED, QLED, Smart TVs, Monitors, Projectors",
    cat_audio_sub: "AirPods, Bose, Soundbars, Speakers",
    cat_camera_sub: "DSLR, Mirrorless, DJI Drones, Action Cams",
    cat_storage_sub: "HDDs, NVMe SSDs, NAS, Backblaze Telemetry",
    cat_printer_sub: "Laser, Inkjet, 3D Printers, Scanners",
    cat_appliance_sub: "Robo-Vacuums, Coffee Makers, Microwaves, IoT",
    cat_other_sub: "Power Tools, Medical Gadgets, Custom Gear",
    
    // How It Works
    how_title: "How Fixora Works",
    how_desc: "A universal four-step diagnostic procedure grounded in real repair datasets (Open Repair Alliance, MyFixit & Backblaze).",
    how_step1_title: "1. Select Any Device",
    how_step1_desc: "Choose from 13 hardware categories, brands, and models.",
    how_step2_title: "2. Describe Symptoms",
    how_step2_desc: "Tell us what happened in plain English or Arabic.",
    how_step3_title: "3. AI Fault Engine",
    how_step3_desc: "Our neural logic checks safety hazards and identifies root causes.",
    how_step4_title: "4. Fix or Hire",
    how_step4_desc: "Follow verified DIY step-by-step guides or connect with a vetted specialist.",

    // Diagnosis Wizard
    diag_page_title: "Universal Device Diagnosis Wizard",
    diag_step1: "1. Device Category",
    diag_step2: "2. Brand & Model",
    diag_step3: "3. Problem Category",
    diag_step4: "4. Problem Description",
    diag_step5: "5. Additional Details",
    diag_brand_label: "Device Brand",
    diag_model_label: "Model Name / Number (if known)",
    diag_brand_placeholder: "e.g., Apple, Sony, Samsung, Dell, Nintendo, DJI",
    diag_model_placeholder: "e.g., PS5, iPhone 15, XPS 15, Switch OLED, AirPods Pro",
    diag_prob_hardware: "Hardware (Power, Screen, Overheating, Battery, Port, Motor)",
    diag_prob_software: "Software (OS crashes, Boot loop, Freezing, Firmware)",
    diag_prob_network: "Network & Connectivity (Wi-Fi, Bluetooth, HDMI, Cellular)",
    diag_prob_unknown: "Not sure / Complex multi-symptom issue",
    diag_desc_label: "Describe the issue in your own words",
    diag_desc_placeholder: "Explain what happens, how long it has been occurring, strange sounds, error beeps, physical damage, or warning lights...",
    diag_age_label: "Device Age (approx. years)",
    diag_error_label: "Error Code / Message (if shown)",
    diag_changes_label: "Recent Incidents (dropped, liquid spill, surge, update)",
    diag_submit_btn: "Run Fixora AI Diagnosis",
    diag_analyzing: "Fixora AI analyzing symptoms across global repair datasets...",

    // Diagnosis Results
    results_title: "Fixora Diagnostic & Repair Report",
    results_severity: "Severity Level",
    results_confidence: "Model Confidence",
    results_symptoms: "Detected Symptoms",
    results_causes_title: "Most Probable Root Causes",
    results_tools_title: "Required Tools & Safety Gear",
    results_steps_title: "Step-by-Step Troubleshooting Procedure",
    results_safety_alert: "Safety Warning & Precautions",
    results_tech_referral: "Professional Technician Recommended",
    results_tech_referral_desc: "This repair involves hazardous high voltages, micro-soldering, or fire-risk battery operations beyond amateur safety limits.",
    results_book_btn: "Find Certified Specialist",
    results_print_btn: "Print / Save PDF Report",
    results_restart_btn: "Diagnose Another Device",

    // Repair Guides
    guides_title: "Universal Repair Guides & Knowledge Base",
    guides_subtitle: "Step-by-step guides for all consumer devices grounded in Open Repair Alliance & MyFixit datasets.",
    guides_search_placeholder: "Search guides by device (e.g., PS5, iPhone, Laptop, Drone, TV)...",
    guides_diff_all: "All Difficulties",
    guides_diff_easy: "Easy (Beginner)",
    guides_diff_moderate: "Moderate",
    guides_diff_hard: "Advanced (Pro)",
    guides_duration: "Estimated Time",
    guides_view_btn: "View Step-by-Step Guide",

    // Technician Marketplace
    tech_title: "Fixora Certified Technician Network",
    tech_subtitle: "Connect with vetted specialists across all device repairs in your region.",
    tech_city_all: "All Cities",
    tech_filter_spec: "Hardware Specialization",
    tech_experience: "Years Exp.",
    tech_book_btn: "Book Repair",
    tech_verified_badge: "Fixora Certified",
    tech_book_modal_title: "Book Fixora Repair Service",
    tech_book_notes: "Additional notes for the technician",
    tech_book_date: "Preferred Appointment Date",
    tech_book_confirm: "Confirm Booking Request",

    // Dashboards
    dash_welcome: "Welcome to Fixora",
    dash_my_devices: "My Registered Devices",
    dash_add_device: "Register New Device",
    dash_my_reports: "Diagnosis History",
    dash_my_requests: "Active Repair Bookings",
    dash_no_devices: "No devices registered yet. Diagnose your first device!",
    dash_no_reports: "No diagnosis reports saved yet.",
    dash_no_requests: "No repair requests yet.",
    
    // Admin Dashboard
    admin_title: "Fixora Administration Center",
    admin_stat_users: "Total Users",
    admin_stat_techs: "Total Technicians",
    admin_stat_pending: "Pending Approvals",
    admin_stat_diags: "Total Diagnoses",
    admin_tab_approvals: "Technician Approvals",
    admin_tab_users: "User Accounts",
    admin_approve_btn: "Approve Specialist",
    admin_reject_btn: "Reject Request",

    // Auth
    auth_login_title: "Sign in to Fixora",
    auth_register_title: "Create Your Fixora Account",
    auth_email: "Email Address",
    auth_password: "Password",
    auth_fullname: "Full Name",
    auth_phone: "Phone Number",
    auth_role_label: "Account Type",
    auth_role_user: "Device Owner (Diagnose & Repair)",
    auth_role_tech: "Certified Technician (Offer Services)",
    auth_login_btn: "Sign In",
    auth_register_btn: "Create Account",
    auth_switch_to_reg: "Don't have an account? Sign up with Fixora",
    auth_switch_to_login: "Already have an account? Sign in",
    auth_quick_demo: "Quick Demo Logins:"
  },

  ar: {
    // Navigation
    nav_home: "الرئيسية",
    nav_about: "من نحن",
    nav_diagnose: "تشخيص أي جهاز",
    nav_guides: "أدلة الإصلاح",
    nav_technicians: "سوق الفنيين",
    nav_datasets: "قواعد البيانات",
    nav_dashboard: "لوحة التحكم",
    nav_login: "تسجيل الدخول",
    nav_register: "ابدأ مجاناً",
    nav_logout: "تسجيل الخروج",
    
    // Hero (ByteFix Reference Arabic)
    hero_headline: "حل أعطال أجهزتك التقنية بسرعة واحترافية",
    hero_subtext: "خدمات دعم فني وتشخيص ذكي معتمد للأجهزة تثق بها، لنضمن استمرارية أجهزتك التقنية بسلاسة وكفاءة في كل وقت.",
    hero_emergency_btn: "فحص فوري ذكي",
    hero_request_repair: "طلب صيانة فورية",
    hero_badge: "منصة تشخيص الأعطال بالذكاء الاصطناعي",
    
    // Quick Demo Triage Card
    demo_title: "فحص فوري ذكي لكافة الأجهزة",
    demo_placeholder: "مثال: بلايستيشن 5 يصدر 3 صفارات وينطفئ، أو لابتوب يسخن وينطفئ فجأة...",
    demo_btn: "فحص سريع",
    demo_devices: "جميع فئات الأجهزة المدعومة في Fixora",
    
    // About Us Section (ByteFix Reference Arabic)
    about_title: "عن Fixora",
    about_body_1: "في Fixora، نقدم حلول الدعم التقني الموثوقة وتشخيص وصيانة الحواسيب والأجهزة الإلكترونية بدقة عالية لتلائم احتياجاتك. يمتلك فريقنا المعتمد ومحركنا الذكي خبرة عملية تغطي كافة الجوانب من استكشاف الأعطال وحلها، وإصلاح اللوحات الأم، واستعادة البيانات، وحماية الأجهزة.",
    about_body_2: "نحافظ على سلامة أجهزتك التقنية عبر حلول موثوقة ومدروسة للهواتف، اللابتوبات، منصات الألعاب، الشاشات، وسائط التخزين، والأجهزة المنزلية الذكية.",
    badge_text: "• FIXORA AI PLATFORM • CERTIFIED REPAIRS • EST. 2026 •",
    stat_accuracy: "99.4%",
    stat_accuracy_lbl: "دقة تقارير التشخيص",
    stat_devices: "+13 فئة",
    stat_devices_lbl: "تغطية شاملة لكافة الأجهزة",
    stat_speed: "أقل من 3 ثوانٍ",
    stat_speed_lbl: "سرعة التحليل بالذكاء الاصطناعي",

    // Device Categories
    cat_all: "جميع الأجهزة",
    cat_laptop: "لابتوب (كمبيوتر محمول)",
    cat_computer: "كمبيوتر مكتبي (PC / Mac)",
    cat_smartphone: "هاتف ذكي",
    cat_tablet: "جهاز لوحي (تابلت / آيباد)",
    cat_smartwatch: "ساعة ذكية وأجهزة ذكية",
    cat_console: "منصة ألعاب (PlayStation / Xbox / Switch)",
    cat_tv: "شاشة ذكية وتلفزيون",
    cat_audio: "سماعات وأنظمة صوتية",
    cat_camera: "كاميرات وطائرات درون",
    cat_storage: "وحدات تخزين وهارد ديسك (SSD/HDD)",
    cat_printer: "طابعات وماسحات ضوئية",
    cat_appliance: "أجهزة منزلية ذكية وإنترنت الأشياء",
    cat_other: "إلكترونيات ومعدات أخرى",

    // Device Subtitles
    cat_laptop_sub: "MacBook, Dell, ThinkPad, HP, Asus",
    cat_computer_sub: "PC تجميع، iMac، محطات عمل، باور، كروت شاشة",
    cat_smartphone_sub: "iPhone, Galaxy, Xiaomi, Pixel, OnePlus",
    cat_tablet_sub: "iPad, Galaxy Tab, Surface, تابلت رسم",
    cat_smartwatch_sub: "Apple Watch, Galaxy Watch, أساور رياضية",
    cat_console_sub: "PS5, PS4, Xbox Series X, Switch, Steam Deck",
    cat_tv_sub: "شاشات OLED, QLED, سمارت TV, شاشات ألعاب",
    cat_audio_sub: "AirPods, Bose, ساوند بار, مكبرات صوت",
    cat_camera_sub: "كاميرات احترافية، عدسات، درونات DJI",
    cat_storage_sub: "هاردات SSD، ميكانيكية، سيرفرات NAS",
    cat_printer_sub: "طابعات ليزر، حبر مستمر، طابعات 3D",
    cat_appliance_sub: "مكانس روبوت، ماكينات قهوة، أجهزة ذكية",
    cat_other_sub: "أجهزة كهربائية متقدمة ومعدات خاصة",
    
    // How It Works
    how_title: "كيف تعمل منصة Fixora؟",
    how_desc: "خطوات تشخيص علمية دقيقة مبنية على كبرى قواعد بيانات الصيانة العالمية (Open Repair Alliance و MyFixit و Backblaze).",
    how_step1_title: "1. حدد أي جهاز",
    how_step1_desc: "اختر من بين 13 فئة شاملة لكافة الأجهزة والماركات والموديلات.",
    how_step2_title: "2. صف العطل",
    how_step2_desc: "اكتب وصفاً باللغة العربية أو الإنجليزية لما يحدث في جهازك.",
    how_step3_title: "3. فحص Fixora بالذكاء الاصطناعي",
    how_step3_desc: "يحلل النظام الأعراض ويكشف مخاطر الأمان ويحدد السبب الجذري بنسب مؤكدة.",
    how_step4_title: "4. أصلح بنفسك أو استعن بفني",
    how_step4_desc: "اتبع خطوات الدليل العملي المصور أو احجز موعداً مع فني متخصص معتمد.",

    // Diagnosis Wizard
    diag_page_title: "معالج Fixora الذكي لتشخيص كافة الأجهزة",
    diag_step1: "1. فئة الجهاز",
    diag_step2: "2. الشركة والموديل",
    diag_step3: "3. تصنيف العطل",
    diag_step4: "4. وصف المشكلة",
    diag_step5: "5. تفاصيل إضافية",
    diag_brand_label: "الشركة المصنعة (Brand)",
    diag_model_label: "اسم أو رقم الموديل (إن وُجد)",
    diag_brand_placeholder: "مثال: Apple, Sony, Samsung, Dell, Nintendo, DJI, HP",
    diag_model_placeholder: "مثال: PS5, iPhone 15, XPS 15, Switch, Galaxy Tab",
    diag_prob_hardware: "مشكلة عتادية (باور، شاشة، سخونة، بطارية، مروحة، منفذ، محرك)",
    diag_prob_software: "مشكلة برمجية (انهيار النظام، بطء شديد، تعليق، شاشة الموت)",
    diag_prob_network: "مشكلة شبكة واتصال (وايفاي، بلوتوث، منفذ HDMI، إشارة)",
    diag_prob_unknown: "غير متأكد / أعطال متعددة مركبة",
    diag_desc_label: "صف المشكلة بكلماتك الخاصة",
    diag_desc_placeholder: "اشرح ما الذي يحدث لجهازك، متى بدأ العطل، وهل توجد أصوات غريبة (تكتكة/صفارات) أو روائح أو تغيرات في السلوك...",
    diag_age_label: "عمر الجهاز تقريباً (بالسنوات)",
    diag_error_label: "رمز أو نص رسالة الخطأ (إن ظهرت)",
    diag_changes_label: "أي حوادث قريبة (سقوط، ماء، صدمة كهربائية، تحديث)",
    diag_submit_btn: "بدء فحص Fixora بالذكاء الاصطناعي",
    diag_analyzing: "Fixora يحلل الأعراض ومقارنتها بقواعد بيانات الصيانة العالمية...",

    // Diagnosis Results
    results_title: "تقرير تشخيص Fixora الفني المتكامل",
    results_severity: "درجة الخطورة",
    results_confidence: "نسبة دقة التقييم",
    results_symptoms: "الأعراض المكتشفة",
    results_causes_title: "الأسباب الجذرية الأكثر احتمالاً",
    results_tools_title: "الأدوات والمعدات ومستلزمات الأمان المطلوبة",
    results_steps_title: "خطوات الإصلاح الإرشادية خطوة بخطوة",
    results_safety_alert: "تنبيهات الأمان والوقاية الحتمية",
    results_tech_referral: "يوصى بالاستعانة بفني صيانة معتمد",
    results_tech_referral_desc: "هذا الإجراء يتضمن خطراً كهربائياً أو يتطلب لحام ميكروسكوبي دقيق يتجاوز حدود الأمان للإصلاح الذاتي.",
    results_book_btn: "طلب فني صيانة معتمد من Fixora",
    results_print_btn: "طباعة / حفظ التقرير PDF",
    results_restart_btn: "تشخيص جهاز آخر",

    // Repair Guides
    guides_title: "مكتبة أدلة إصلاح وصيانة Fixora الشاملة",
    guides_subtitle: "إرشادات عملية موثقة خطوة بخطوة لجميع الأجهزة مبنية على معايير Open Repair Alliance و MyFixit.",
    guides_search_placeholder: "ابحث في الأدلة باسم الجهاز (بلايستيشن، لابتوب، آيفون، درون، شاشة)...",
    guides_diff_all: "جميع مستويات الصعوبة",
    guides_diff_easy: "سهل (مبتدئ)",
    guides_diff_moderate: "متوسط",
    guides_diff_hard: "متقدم (محترف)",
    guides_duration: "الوقت المقدر",
    guides_view_btn: "عرض دليل الإصلاح كاملاً",

    // Technician Marketplace
    tech_title: "شبكة فنيي ومراكز صيانة Fixora المعتمدين",
    tech_subtitle: "تواصل مع خبراء صيانة محترفين ومعتمدين لجميع أنواع الأجهزة في مدينتك.",
    tech_city_all: "جميع المدن",
    tech_filter_spec: "التخصص العتادي",
    tech_experience: "سنوات الخبرة",
    tech_book_btn: "طلب صيانة",
    tech_verified_badge: "معتمد من Fixora",
    tech_book_modal_title: "طلب خدمة صيانة عبر Fixora",
    tech_book_notes: "ملاحظات إضافية للفني",
    tech_book_date: "الموعد المفضل لاستلام / فحص الجهاز",
    tech_book_confirm: "تأكيد إرسال الطلب",

    // Dashboards
    dash_welcome: "مرحباً بك في Fixora",
    dash_my_devices: "أجهزتي المسجلة",
    dash_add_device: "تسجيل جهاز جديد",
    dash_my_reports: "سجل تقارير الفحص السابقة",
    dash_my_requests: "طلبات الصيانة النشطة",
    dash_no_devices: "لم تقم بتسجيل أي أجهزة بعد. ابدأ تشخيص أول أجهزتك الآن!",
    dash_no_reports: "لا توجد تقارير تشخيص محفوظة حتى الآن.",
    dash_no_requests: "لا توجد طلبات صيانة حالية.",
    
    // Admin Dashboard
    admin_title: "مركز إدارة منصة Fixora",
    admin_stat_users: "إجمالي المستخدمين",
    admin_stat_techs: "إجمالي الفنيين",
    admin_stat_pending: "طلبات اعتماد فنيين",
    admin_stat_diags: "إجمالي عمليات التشخيص",
    admin_tab_approvals: "مراجعة واعتماد الفنيين",
    admin_tab_users: "إدارة حسابات المستخدمين",
    admin_approve_btn: "اعتماد الفني",
    admin_reject_btn: "رفض الطلب",

    // Auth
    auth_login_title: "تسجيل الدخول إلى Fixora",
    auth_register_title: "إنشاء حسابك في Fixora",
    auth_email: "البريد الإلكتروني",
    auth_password: "كلمة المرور",
    auth_fullname: "الاسم الكامل",
    auth_phone: "رقم الهاتف",
    auth_role_label: "نوع الحساب",
    auth_role_user: "مالك جهاز (تشخيص وصيانة أجهزتي)",
    auth_role_tech: "فني صيانة معتمد (تقديم خدمات الصيانة)",
    auth_login_btn: "دخول Fixora",
    auth_register_btn: "إنشاء حساب Fixora",
    auth_switch_to_reg: "ليس لديك حساب؟ انضم إلى Fixora الآن",
    auth_switch_to_login: "لديك حساب بالفعل؟ سجل دخولك",
    auth_quick_demo: "حسابات تجريبية سريعة بنقرة واحدة:"
  }
};

class I18n {
  constructor() {
    this.currentLang = localStorage.getItem("fixora_lang") || localStorage.getItem("techrepair_lang") || "ar";
    this.applyLanguage(this.currentLang);
  }

  setLanguage(lang) {
    if (lang !== "en" && lang !== "ar") return;
    this.currentLang = lang;
    localStorage.setItem("fixora_lang", lang);
    localStorage.setItem("techrepair_lang", lang);
    this.applyLanguage(lang);
    if (window.app && typeof window.app.renderCurrentView === "function") {
      window.app.renderCurrentView();
    }
  }

  toggleLanguage() {
    const nextLang = this.currentLang === "en" ? "ar" : "en";
    this.setLanguage(nextLang);
  }

  applyLanguage(lang) {
    const html = document.documentElement;
    html.setAttribute("lang", lang);
    html.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
    
    // Update all elements with data-i18n
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      const val = this.t(key);
      if (val) el.textContent = val;
    });

    // Update placeholders
    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
      const key = el.getAttribute("data-i18n-placeholder");
      const val = this.t(key);
      if (val) el.setAttribute("placeholder", val);
    });

    // Update language toggle button text
    const langBtns = document.querySelectorAll(".lang-btn-text");
    langBtns.forEach(btn => {
      btn.textContent = lang === "en" ? "العربية" : "English";
    });
  }

  t(key, fallback = "") {
    const dict = TRANSLATIONS[this.currentLang] || TRANSLATIONS.en;
    return dict[key] || TRANSLATIONS.en[key] || fallback || key;
  }
}

window.i18n = new I18n();
