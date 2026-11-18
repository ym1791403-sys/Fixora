/**
 * TechRepair Bilingual Internationalization (i18n) Engine
 * Supported Languages: English ('en', LTR) & Arabic ('ar', RTL)
 */

const TRANSLATIONS = {
  en: {
    // Navigation
    nav_home: "Home",
    nav_diagnose: "Diagnose Device",
    nav_guides: "Repair Guides",
    nav_technicians: "Technicians",
    nav_dashboard: "Dashboard",
    nav_login: "Log In",
    nav_register: "Get Started",
    nav_logout: "Log Out",
    
    // Hero
    hero_badge: "AI-Powered Technical Diagnostic Engine",
    hero_title: "Your Smart Solution for Every Tech Problem",
    hero_desc: "Identify computer, laptop, and smartphone faults in seconds. Get AI-calibrated troubleshooting guides or connect with verified technicians when safety requires expert hands.",
    hero_cta_diag: "Diagnose Your Device",
    hero_cta_guides: "Explore Repair Guides",
    
    // Quick Demo Card
    demo_title: "Instant Smart Triage",
    demo_placeholder: "e.g., My laptop becomes very hot and shuts down after 10 minutes...",
    demo_btn: "Quick Check",
    demo_devices: "Supported Device Categories",
    
    // Device Categories
    cat_all: "All Devices",
    cat_laptop: "Laptop",
    cat_computer: "Desktop Computer",
    cat_smartphone: "Smartphone",
    cat_tablet: "Tablet",
    cat_other: "Other Electronics",
    
    // How It Works
    how_title: "How TechRepair Works",
    how_desc: "A reliable four-step diagnostic procedure grounded in real repair datasets.",
    how_step1_title: "1. Select Device",
    how_step1_desc: "Choose your hardware category, brand, and model.",
    how_step2_title: "2. Describe Symptoms",
    how_step2_desc: "Tell us what happened in plain natural language.",
    how_step3_title: "3. AI Analysis",
    how_step3_desc: "Our engine checks safety hazards and identifies root causes.",
    how_step4_title: "4. Fix or Hire",
    how_step4_desc: "Follow verified step-by-step DIY steps or book a local specialist.",

    // Diagnosis Wizard
    diag_page_title: "Smart Device Diagnosis Wizard",
    diag_step1: "1. Device Category",
    diag_step2: "2. Brand & Model",
    diag_step3: "3. Problem Category",
    diag_step4: "4. Problem Description",
    diag_step5: "5. Additional Details",
    diag_brand_label: "Device Brand",
    diag_model_label: "Model Name / Number (if known)",
    diag_brand_placeholder: "e.g., Dell, Apple, HP, Samsung, Lenovo",
    diag_model_placeholder: "e.g., XPS 15, iPhone 13, Pavilion 14",
    diag_prob_hardware: "Hardware (Power, Screen, Overheating, Battery, Fan)",
    diag_prob_software: "Software (OS crashes, Slow performance, BSOD, Viruses)",
    diag_prob_network: "Network (Wi-Fi disconnections, DNS errors, Slow internet)",
    diag_prob_unknown: "Not sure / Multiple issues",
    diag_desc_label: "Describe the issue in your own words",
    diag_desc_placeholder: "Explain what happens, how long it has been occurring, and any strange sounds, smells, or physical changes...",
    diag_age_label: "Device Age (approx. years)",
    diag_error_label: "Error Code / Message (if shown)",
    diag_changes_label: "Recent Changes (water spill, dropped, software update)",
    diag_submit_btn: "Run AI Diagnosis",
    diag_analyzing: "Analyzing symptoms against repair datasets...",

    // Diagnosis Results
    results_title: "Diagnostic Report",
    results_severity: "Severity Level",
    results_confidence: "Model Confidence",
    results_symptoms: "Detected Symptoms",
    results_causes_title: "Most Probable Root Causes",
    results_tools_title: "Required Tools",
    results_steps_title: "Recommended Troubleshooting Steps",
    results_safety_alert: "Safety Warning & Precautions",
    results_tech_referral: "Professional Technician Recommended",
    results_tech_referral_desc: "This procedure carries electrical hazard risks or requires micro-soldering beyond amateur safety limits.",
    results_book_btn: "Find Verified Technician",
    results_print_btn: "Print / Save PDF Report",
    results_restart_btn: "Diagnose Another Device",

    // Repair Guides
    guides_title: "Repair Guides & Knowledge Base",
    guides_subtitle: "Step-by-step instructions grounded in Open Repair Alliance & MyFixit datasets.",
    guides_search_placeholder: "Search guides by keyword, device, or symptom...",
    guides_diff_all: "All Difficulties",
    guides_diff_easy: "Easy",
    guides_diff_moderate: "Moderate",
    guides_diff_hard: "Advanced",
    guides_duration: "Estimated Time",
    guides_view_btn: "View Step-by-Step Guide",

    // Technician Marketplace
    tech_title: "Certified Repair Technicians",
    tech_subtitle: "Connect with vetted hardware specialists in your city.",
    tech_city_all: "All Cities",
    tech_filter_spec: "Specialization",
    tech_experience: "Years Exp.",
    tech_book_btn: "Book Repair",
    tech_verified_badge: "Verified Specialist",
    tech_book_modal_title: "Book Repair Service",
    tech_book_notes: "Additional notes for the technician",
    tech_book_date: "Preferred Appointment Date",
    tech_book_confirm: "Confirm Request",

    // Dashboards
    dash_welcome: "Welcome back",
    dash_my_devices: "My Devices",
    dash_add_device: "Add New Device",
    dash_my_reports: "Diagnosis History",
    dash_my_requests: "Active Repair Bookings",
    dash_no_devices: "No devices registered yet.",
    dash_no_reports: "No diagnosis reports saved yet.",
    dash_no_requests: "No repair requests yet.",
    
    // Admin Dashboard
    admin_title: "Administration Control Center",
    admin_stat_users: "Total Users",
    admin_stat_techs: "Total Technicians",
    admin_stat_pending: "Pending Approvals",
    admin_stat_diags: "Total Diagnoses",
    admin_tab_approvals: "Technician Approvals",
    admin_tab_users: "User Accounts",
    admin_approve_btn: "Approve",
    admin_reject_btn: "Reject",

    // Auth
    auth_login_title: "Sign in to TechRepair",
    auth_register_title: "Create Your Account",
    auth_email: "Email Address",
    auth_password: "Password",
    auth_fullname: "Full Name",
    auth_phone: "Phone Number",
    auth_role_label: "Account Type",
    auth_role_user: "Regular Customer (Diagnose & Repair)",
    auth_role_tech: "Repair Technician (Provide Services)",
    auth_login_btn: "Sign In",
    auth_register_btn: "Create Account",
    auth_switch_to_reg: "Don't have an account? Sign up",
    auth_switch_to_login: "Already have an account? Sign in",
    auth_quick_demo: "Quick Demo Logins:"
  },

  ar: {
    // Navigation
    nav_home: "الرئيسية",
    nav_diagnose: "تشخيص جهازك",
    nav_guides: "أدلة الإصلاح",
    nav_technicians: "سوق الفنيين",
    nav_dashboard: "لوحة التحكم",
    nav_login: "تسجيل الدخول",
    nav_register: "إنشاء حساب",
    nav_logout: "تسجيل الخروج",
    
    // Hero
    hero_badge: "محرك التشخيص الفني الذكي بالذكاء الاصطناعي",
    hero_title: "حلك الذكي لكل عطل تقني في أجهزتك",
    hero_desc: "اكتشف أسباب أعطال الحواسيب، اللابتوبات، والهواتف الذكية في ثوانٍ. احصل على أدلة إصلاح عتادية مدروسة أو تواصل مع فنيي صيانة معتمدين عند الحاجة للأمان.",
    hero_cta_diag: "ابدأ تشخيص جهازك الآن",
    hero_cta_guides: "تصفح أدلة الإصلاح",
    
    // Quick Demo Card
    demo_title: "فحص فوري ذكي",
    demo_placeholder: "مثال: اللابتوب يسخن جداً وينطفئ فجأة بعد عشر دقائق...",
    demo_btn: "فحص سريع",
    demo_devices: "الأجهزة المدعومة في المنصة",
    
    // Device Categories
    cat_all: "جميع الأجهزة",
    cat_laptop: "لابتوب",
    cat_computer: "كمبيوتر مكتبي",
    cat_smartphone: "هاتف ذكي",
    cat_tablet: "جهاز لوحي (تابلت)",
    cat_other: "إلكترونيات أخرى",
    
    // How It Works
    how_title: "كيف تعمل منصة TechRepair؟",
    how_desc: "خطوات تشخيص علمية مبنية على قواعد بيانات الصيانة العالمية.",
    how_step1_title: "1. حدد نوع الجهاز",
    how_step1_desc: "اختر فئة الجهاز، والموديل لتشخيص دقيق.",
    how_step2_title: "2. صف المشكلة",
    how_step2_desc: "اكتب وصفاً باللغة العربية أو الإنجليزية لما يحدث في جهازك.",
    how_step3_title: "3. تحليل الذكاء الاصطناعي",
    how_step3_desc: "يقوم النظام بفحص مخاطر الأمان وتحديد الأسباب المحتملة.",
    how_step4_title: "4. أصلح أو استعن بفني",
    how_step4_desc: "اتبع خطوات الإصلاح الذاتي خطوة بخطوة أو احجز موعداً مع فني معتمد.",

    // Diagnosis Wizard
    diag_page_title: "معالج التشخيص الذكي للأجهزة",
    diag_step1: "1. فئة الجهاز",
    diag_step2: "2. الشركة والموديل",
    diag_step3: "3. تصنيف العطل",
    diag_step4: "4. وصف المشكلة",
    diag_step5: "5. تفاصيل إضافية",
    diag_brand_label: "الشركة المصنعة (Brand)",
    diag_model_label: "اسم أو رقم الموديل (إن وُجد)",
    diag_brand_placeholder: "مثال: Apple, Dell, HP, Samsung, Lenovo",
    diag_model_placeholder: "مثال: XPS 15, iPhone 13, Galaxy S22",
    diag_prob_hardware: "مشكلة عتادية (باور، شاشة، سخونة، بطارية، مروحة)",
    diag_prob_software: "مشكلة برمجية (انهيار النظام، بطء شديد، شاشة زرقاء)",
    diag_prob_network: "مشكلة شبكة (انقطاع الوايفاي، خطأ DNS، بطء الاتصال)",
    diag_prob_unknown: "غير متأكد / أعطال متعددة",
    diag_desc_label: "صف المشكلة بكلماتك الخاصة",
    diag_desc_placeholder: "اشرح ما الذي يحدث لجهازك، متى بدأ العطل، وهل توجد أصوات غريبة أو روائح أو تغيرات في السلوك...",
    diag_age_label: "عمر الجهاز تقريباً (بالسنوات)",
    diag_error_label: "رمز أو نص رسالة الخطأ (إن ظهرت)",
    diag_changes_label: "أي حوادث قريبة (سقوط، ماء، تحديث نظام)",
    diag_submit_btn: "بدء فحص الذكاء الاصطناعي",
    diag_analyzing: "جاري تحليل الأعراض ومقارنتها بقواعد بيانات الصيانة...",

    // Diagnosis Results
    results_title: "تقرير التشخيص الفني",
    results_severity: "درجة الخطورة",
    results_confidence: "نسبة دقة التقييم",
    results_symptoms: "الأعراض المكتشفة",
    results_causes_title: "الأسباب الجذرية الأكثر احتمالاً",
    results_tools_title: "الأدوات والمعدات المطلوبة",
    results_steps_title: "خطوات الإصلاح الموصى بها خطوة بخطوة",
    results_safety_alert: "تنبيهات الأمان والوقاية الحتمية",
    results_tech_referral: "يوصى بالاستعانة بفني صيانة معتمد",
    results_tech_referral_desc: "هذا الإجراء يتضمن خطراً كهربائياً أو يتطلب لحام ميكروسكوبي دقيق يتجاوز حدود الأمان للإصلاح الذاتي.",
    results_book_btn: "طلب فني صيانة معتمد",
    results_print_btn: "طباعة / حفظ التقرير PDF",
    results_restart_btn: "تشخيص جهاز آخر",

    // Repair Guides
    guides_title: "مكتبة أدلة الإصلاح والصيانة",
    guides_subtitle: "إرشادات عملية موثقة خطوة بخطوة مبنية على معايير Open Repair Alliance و MyFixit.",
    guides_search_placeholder: "ابحث في الأدلة باسم الجهاز أو العطل...",
    guides_diff_all: "جميع مستويات الصعوبة",
    guides_diff_easy: "سهل",
    guides_diff_moderate: "متوسط",
    guides_diff_hard: "متقدم",
    guides_duration: "الوقت المقدر",
    guides_view_btn: "عرض دليل الإصلاح كاملاً",

    // Technician Marketplace
    tech_title: "دليل فنيي الصيانة المعتمدين",
    tech_subtitle: "تواصل مع مراكز وفنيي صيانة محترفين ومعتمدين في مدينتك.",
    tech_city_all: "جميع المدن",
    tech_filter_spec: "التخصص",
    tech_experience: "سنوات الخبرة",
    tech_book_btn: "طلب صيانة",
    tech_verified_badge: "فني معتمد ومفحوص",
    tech_book_modal_title: "طلب خدمة صيانة عتادية",
    tech_book_notes: "ملاحظات إضافية للفني",
    tech_book_date: "الموعد المفضل لاستلام / فحص الجهاز",
    tech_book_confirm: "تأكيد إرسال الطلب",

    // Dashboards
    dash_welcome: "مرحباً بك",
    dash_my_devices: "أجهزتي المسجلة",
    dash_add_device: "إضافة جهاز جديد",
    dash_my_reports: "سجل تقارير الفحص السابقة",
    dash_my_requests: "طلبات الصيانة النشطة",
    dash_no_devices: "لم تقم بتسجيل أي أجهزة بعد.",
    dash_no_reports: "لا توجد تقارير تشخيص محفوظة حتى الآن.",
    dash_no_requests: "لا توجد طلبات صيانة حالية.",
    
    // Admin Dashboard
    admin_title: "لوحة التحكم الإدارية للمنصة",
    admin_stat_users: "إجمالي المستخدمين",
    admin_stat_techs: "إجمالي الفنيين",
    admin_stat_pending: "طلبات اعتماد فنيين",
    admin_stat_diags: "إجمالي عمليات التشخيص",
    admin_tab_approvals: "مراجعة واعتماد الفنيين",
    admin_tab_users: "إدارة حسابات المستخدمين",
    admin_approve_btn: "اعتماد الفني",
    admin_reject_btn: "رفض الطلب",

    // Auth
    auth_login_title: "تسجيل الدخول إلى TechRepair",
    auth_register_title: "إنشاء حساب جديد",
    auth_email: "البريد الإلكتروني",
    auth_password: "كلمة المرور",
    auth_fullname: "الاسم الكامل",
    auth_phone: "رقم الهاتف",
    auth_role_label: "نوع الحساب",
    auth_role_user: "عميل عادي (تشخيص وإصلاح أجهزتي)",
    auth_role_tech: "فني صيانة (تقديم خدمات الصيانة)",
    auth_login_btn: "دخول",
    auth_register_btn: "إنشاء الحساب",
    auth_switch_to_reg: "ليس لديك حساب؟ سجل الآن",
    auth_switch_to_login: "لديك حساب بالفعل؟ سجل دخولك",
    auth_quick_demo: "حسابات تجريبية سريعة بنقرة واحدة:"
  }
};

class I18n {
  constructor() {
    this.currentLang = localStorage.getItem("techrepair_lang") || "en";
    this.applyLanguage(this.currentLang);
  }

  setLanguage(lang) {
    if (lang !== "en" && lang !== "ar") return;
    this.currentLang = lang;
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
