/**
 * Fixora Core Single Page Application (SPA) Controller
 */

class FixoraApp {
  constructor() {
    this.currentView = "home";
    this.wizardData = {
      device_category: "Laptop",
      brand: "",
      model: "",
      problem_category: "Hardware",
      description: "",
      device_age_years: null,
      error_message: "",
      recent_changes: ""
    };
    this.currentReport = null;
    this.init();
  }

  init() {
    this.bindEvents();
    this.updateNavAuth();
    this.navigate("home");
  }

  bindEvents() {
    // Navigation routing
    document.querySelectorAll("[data-nav]").forEach(el => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        const target = el.getAttribute("data-nav");
        this.navigate(target);
      });
    });

    // Language toggle
    const langBtn = document.getElementById("langToggleBtn");
    if (langBtn) {
      langBtn.addEventListener("click", () => {
        window.i18n.toggleLanguage();
      });
    }

    // Auth modal triggers
    const loginBtn = document.getElementById("navLoginBtn");
    if (loginBtn) {
      loginBtn.addEventListener("click", () => this.showAuthModal("login"));
    }
    const registerBtn = document.getElementById("navRegisterBtn");
    if (registerBtn) {
      registerBtn.addEventListener("click", () => this.showAuthModal("register"));
    }
    const logoutBtn = document.getElementById("navLogoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        window.api.clearSession();
        this.updateNavAuth();
        this.navigate("home");
      });
    }

    // Modal Close
    const modalCloseBtn = document.getElementById("modalCloseBtn");
    if (modalCloseBtn) {
      modalCloseBtn.addEventListener("click", () => this.closeModal());
    }
    const modalOverlay = document.getElementById("appModal");
    if (modalOverlay) {
      modalOverlay.addEventListener("click", (e) => {
        if (e.target === modalOverlay) this.closeModal();
      });
    }
  }

  updateNavAuth() {
    const isLoggedIn = window.api.isLoggedIn();
    const user = window.api.getUser();
    const guestLinks = document.getElementById("navGuestActions");
    const userLinks = document.getElementById("navUserActions");
    const dashLink = document.getElementById("navDashboardLink");
    const adminLink = document.getElementById("navAdminLink");
    const userNameEl = document.getElementById("navUserName");

    if (isLoggedIn && user) {
      if (guestLinks) guestLinks.style.display = "none";
      if (userLinks) userLinks.style.display = "flex";
      if (userNameEl) userNameEl.textContent = user.full_name;
      if (dashLink) dashLink.style.display = "block";
      if (adminLink) {
        adminLink.style.display = user.role === "admin" ? "block" : "none";
      }
    } else {
      if (guestLinks) guestLinks.style.display = "flex";
      if (userLinks) userLinks.style.display = "none";
      if (dashLink) dashLink.style.display = "none";
      if (adminLink) adminLink.style.display = "none";
    }
  }

  navigate(viewName, params = {}) {
    this.currentView = viewName;
    document.querySelectorAll(".nav-link").forEach(l => {
      l.classList.toggle("active", l.getAttribute("data-nav") === viewName);
    });

    const mainContainer = document.getElementById("mainContent");
    if (!mainContainer) return;

    window.scrollTo({ top: 0, behavior: "smooth" });

    switch (viewName) {
      case "home":
        this.renderHome(mainContainer);
        break;
      case "diagnose":
        this.renderDiagnose(mainContainer);
        break;
      case "results":
        this.renderResults(mainContainer);
        break;
      case "guides":
        this.renderGuides(mainContainer);
        break;
      case "technicians":
        this.renderTechnicians(mainContainer);
        break;
      case "dashboard":
        this.renderDashboard(mainContainer);
        break;
      case "admin":
        this.renderAdmin(mainContainer);
        break;
      default:
        this.renderHome(mainContainer);
    }

    window.i18n.applyLanguage(window.i18n.currentLang);
  }

  renderCurrentView() {
    this.navigate(this.currentView);
  }

  // ==========================================
  // VIEW: HOMEPAGE
  // ==========================================
  renderHome(container) {
    const isAr = window.i18n.currentLang === "ar";
    container.innerHTML = `
      <!-- Hero Section -->
      <section class="hero-section">
        <div class="container hero-grid">
          <div>
            <div class="hero-badge">
              <i class="fas fa-microchip"></i>
              <span data-i18n="hero_badge">AI-Powered Technical Diagnostic Engine</span>
            </div>
            <h1 class="hero-title" data-i18n="hero_title">Your Smart Solution for Every Tech Problem</h1>
            <p class="hero-description" data-i18n="hero_desc">
              Identify computer, laptop, and smartphone faults in seconds. Get AI-calibrated troubleshooting guides or connect with verified technicians when safety requires expert hands.
            </p>
            <div class="hero-actions">
              <button class="btn btn-primary btn-lg" onclick="app.navigate('diagnose')">
                <i class="fas fa-stethoscope"></i>
                <span data-i18n="hero_cta_diag">Diagnose Your Device</span>
              </button>
              <button class="btn btn-outline btn-lg" onclick="app.navigate('guides')">
                <i class="fas fa-book-open"></i>
                <span data-i18n="hero_cta_guides">Explore Repair Guides</span>
              </button>
            </div>
          </div>

          <!-- Quick Interactive Triage Card -->
          <div class="hero-card-preview">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
              <h3 style="font-size: 18px;" data-i18n="demo_title">Instant Smart Triage</h3>
              <span class="tag" style="background-color: var(--color-accent-light); color: var(--color-secondary);">AI Active</span>
            </div>
            <p style="font-size: 14px; color: var(--color-text-muted); margin-bottom: 14px;">
              ${isAr ? 'اختر جهازك واكتب المشكلة باختصار لمعاينتها فوراً:' : 'Select your device and describe your problem for instant check:'}
            </p>
            
            <div style="display: flex; gap: 8px; margin-bottom: 14px; overflow-x: auto; padding-bottom: 4px; flex-wrap: wrap;">
              <button class="btn btn-sm btn-outline quick-cat-btn active" data-cat="Smartphone"><i class="fas fa-mobile-alt"></i> Smartphone</button>
              <button class="btn btn-sm btn-outline quick-cat-btn" data-cat="Laptop"><i class="fas fa-laptop"></i> Laptop</button>
              <button class="btn btn-sm btn-outline quick-cat-btn" data-cat="Desktop Computer"><i class="fas fa-desktop"></i> PC</button>
              <button class="btn btn-sm btn-outline quick-cat-btn" data-cat="Gaming Console"><i class="fas fa-gamepad"></i> Console</button>
              <button class="btn btn-sm btn-outline quick-cat-btn" data-cat="Smart TV"><i class="fas fa-tv"></i> TV</button>
              <button class="btn btn-sm btn-outline quick-cat-btn" data-cat="Storage"><i class="fas fa-hard-drive"></i> Drive/SSD</button>
              <button class="btn btn-sm btn-outline quick-cat-btn" data-cat="Tablet"><i class="fas fa-tablet-alt"></i> Tablet</button>
            </div>

            <div class="form-group" style="margin-bottom: 14px;">
              <textarea id="quickDiagInput" class="form-control" style="min-height: 85px;" data-i18n-placeholder="demo_placeholder" placeholder="e.g., My laptop becomes very hot and shuts down after 10 minutes..."></textarea>
            </div>
            
            <button id="quickDiagSubmit" class="btn btn-primary" style="width: 100%;">
              <i class="fas fa-bolt"></i>
              <span data-i18n="demo_btn">Quick Check</span>
            </button>
          </div>
        </div>
      </section>

      <!-- Supported Devices Section -->
      <section style="padding: 60px 0; background-color: #FFFFFF; border-bottom: 1px solid var(--color-border);">
        <div class="container">
          <div style="text-align: center; max-width: 650px; margin: 0 auto 36px;">
            <h2 style="font-size: 28px; margin-bottom: 10px;" data-i18n="demo_devices">Supported Device Categories</h2>
            <p style="color: var(--color-text-muted); font-size: 16px;">
              ${isAr ? 'ندعم جميع الأجهزة الإلكترونية الشائعة عبر معايير تشخيص متقدمة' : 'Comprehensive diagnostic support across all personal computing and mobile hardware.'}
            </p>
          </div>

          <div class="device-categories-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px;">
            ${[
              { cat: "Smartphone", icon: "fa-mobile-alt", key: "cat_smartphone", sub: "cat_smartphone_sub" },
              { cat: "Laptop", icon: "fa-laptop", key: "cat_laptop", sub: "cat_laptop_sub" },
              { cat: "Desktop Computer", icon: "fa-desktop", key: "cat_computer", sub: "cat_computer_sub" },
              { cat: "Gaming Console", icon: "fa-gamepad", key: "cat_console", sub: "cat_console_sub" },
              { cat: "Smart TV", icon: "fa-tv", key: "cat_tv", sub: "cat_tv_sub" },
              { cat: "Storage", icon: "fa-hard-drive", key: "cat_storage", sub: "cat_storage_sub" },
              { cat: "Tablet", icon: "fa-tablet-alt", key: "cat_tablet", sub: "cat_tablet_sub" },
              { cat: "Smartwatch", icon: "fa-clock", key: "cat_smartwatch", sub: "cat_smartwatch_sub" },
              { cat: "Audio", icon: "fa-headphones", key: "cat_audio", sub: "cat_audio_sub" },
              { cat: "Camera", icon: "fa-camera", key: "cat_camera", sub: "cat_camera_sub" },
              { cat: "Printer", icon: "fa-print", key: "cat_printer", sub: "cat_printer_sub" },
              { cat: "Home Appliance", icon: "fa-plug", key: "cat_appliance", sub: "cat_appliance_sub" },
              { cat: "Other", icon: "fa-microchip", key: "cat_other", sub: "cat_other_sub" }
            ].map(item => `
              <div class="device-category-card" onclick="app.startDiagnosisWithCat('${item.cat}')" style="cursor: pointer; padding: 22px 14px; border: 1px solid var(--color-border); border-radius: var(--radius-md); background: #FFFFFF; text-align: center; transition: all 0.2s ease;">
                <i class="fas ${item.icon}" style="font-size: 32px; color: var(--color-primary); margin-bottom: 10px; display: block;"></i>
                <strong style="display: block; font-size: 14px; margin-bottom: 4px;" data-i18n="${item.key}">${window.i18n.t(item.key)}</strong>
                <span style="font-size: 11px; color: var(--color-text-muted); line-height: 1.3; display: block;" data-i18n="${item.sub}">${window.i18n.t(item.sub)}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </section>

      <!-- How It Works Section -->
      <section style="padding: 70px 0;">
        <div class="container">
          <div style="text-align: center; max-width: 650px; margin: 0 auto 48px;">
            <h2 style="font-size: 32px; margin-bottom: 12px;" data-i18n="how_title">How Fixora Works</h2>
            <p style="color: var(--color-text-muted); font-size: 16px;" data-i18n="how_desc">
              A reliable four-step diagnostic procedure grounded in real repair datasets.
            </p>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 24px;">
            <div class="card" style="text-align: center; padding: 32px 20px;">
              <div style="width: 50px; height: 50px; border-radius: 50%; background: rgba(37,99,235,0.1); color: var(--color-secondary); display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 22px;">
                <i class="fas fa-laptop-medical"></i>
              </div>
              <h4 style="margin-bottom: 8px;" data-i18n="how_step1_title">1. Select Device</h4>
              <p style="font-size: 14px; color: var(--color-text-muted);" data-i18n="how_step1_desc">Choose your hardware category, brand, and model.</p>
            </div>

            <div class="card" style="text-align: center; padding: 32px 20px;">
              <div style="width: 50px; height: 50px; border-radius: 50%; background: rgba(6,182,212,0.1); color: var(--color-accent); display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 22px;">
                <i class="fas fa-comment-dots"></i>
              </div>
              <h4 style="margin-bottom: 8px;" data-i18n="how_step2_title">2. Describe Symptoms</h4>
              <p style="font-size: 14px; color: var(--color-text-muted);" data-i18n="how_step2_desc">Tell us what happened in plain natural language.</p>
            </div>

            <div class="card" style="text-align: center; padding: 32px 20px;">
              <div style="width: 50px; height: 50px; border-radius: 50%; background: rgba(37,99,235,0.1); color: var(--color-secondary); display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 22px;">
                <i class="fas fa-brain"></i>
              </div>
              <h4 style="margin-bottom: 8px;" data-i18n="how_step3_title">3. AI Analysis</h4>
              <p style="font-size: 14px; color: var(--color-text-muted);" data-i18n="how_step3_desc">Our engine checks safety hazards and identifies root causes.</p>
            </div>

            <div class="card" style="text-align: center; padding: 32px 20px;">
              <div style="width: 50px; height: 50px; border-radius: 50%; background: rgba(22,163,74,0.1); color: var(--color-success); display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 22px;">
                <i class="fas fa-tools"></i>
              </div>
              <h4 style="margin-bottom: 8px;" data-i18n="how_step4_title">4. Fix or Hire</h4>
              <p style="font-size: 14px; color: var(--color-text-muted);" data-i18n="how_step4_desc">Follow verified step-by-step DIY steps or book a local specialist.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Technician Marketplace Teaser Banner -->
      <section style="padding: 50px 0; background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%); color: #FFFFFF;">
        <div class="container" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 24px;">
          <div>
            <h3 style="color: #FFFFFF; font-size: 26px; margin-bottom: 8px;">
              ${isAr ? 'هل أنت فني أو مركز صيانة محترف؟' : 'Are you a professional repair technician or lab?'}
            </h3>
            <p style="color: #94A3B8; font-size: 15px; max-width: 580px;">
              ${isAr ? 'انضم إلى شبكة Fixora واستقبل طلبات الصيانة الموثقة من العملاء في مدينتك بعد اعتماد حسابك.' : 'Join Fixora to receive verified repair requests from customers in your area after administrative verification.'}
            </p>
          </div>
          <button class="btn btn-accent btn-lg" onclick="app.showAuthModal('register', 'technician')">
            <i class="fas fa-user-plus"></i>
            <span>${isAr ? 'سجل كفني صيانة معتمد' : 'Register as Technician'}</span>
          </button>
        </div>
      </section>
    `;

    // Bind Quick Diag
    let selectedCat = "Laptop";
    container.querySelectorAll(".quick-cat-btn").forEach(b => {
      b.addEventListener("click", () => {
        container.querySelectorAll(".quick-cat-btn").forEach(btn => btn.classList.remove("active"));
        b.classList.add("active");
        selectedCat = b.getAttribute("data-cat");
      });
    });

    const quickSubmit = container.querySelector("#quickDiagSubmit");
    const quickInput = container.querySelector("#quickDiagInput");
    if (quickSubmit && quickInput) {
      quickSubmit.addEventListener("click", () => {
        const text = quickInput.value.trim();
        if (!text) {
          alert(isAr ? "يرجى كتابة وصف المشكلة أولاً" : "Please describe your device problem first.");
          return;
        }
        this.wizardData.device_category = selectedCat;
        this.wizardData.description = text;
        this.submitDiagnosis();
      });
    }
  }

  startDiagnosisWithCat(cat) {
    this.wizardData.device_category = cat;
    this.navigate("diagnose");
  }

  // ==========================================
  // VIEW: DIAGNOSE WIZARD
  // ==========================================
  renderDiagnose(container) {
    const isAr = window.i18n.currentLang === "ar";
    container.innerHTML = `
      <section style="padding: 40px 0 70px;">
        <div class="container" style="max-width: 820px;">
          
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="font-size: 32px; margin-bottom: 10px;" data-i18n="diag_page_title">Smart Device Diagnosis Wizard</h1>
            <p style="color: var(--color-text-muted); font-size: 15px;">
              ${isAr ? 'يرجى تقديم تفاصيل العطل بدقة لمساعدة نظام الذكاء الاصطناعي في تحديد الأسباب وخطوات الإصلاح الآمنة.' : 'Provide details about your hardware or software problem for an AI-calibrated diagnostic report.'}
            </p>
          </div>

          <div class="card" style="padding: 36px;">
            
            <!-- Step 1: Device Category -->
            <div class="form-group">
              <label class="form-label" data-i18n="diag_step1">1. Device Category</label>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(135px, 1fr)); gap: 12px;">
                ${[
                  { cat: "Smartphone", icon: "fa-mobile-alt", key: "cat_smartphone" },
                  { cat: "Laptop", icon: "fa-laptop", key: "cat_laptop" },
                  { cat: "Desktop Computer", icon: "fa-desktop", key: "cat_computer" },
                  { cat: "Gaming Console", icon: "fa-gamepad", key: "cat_console" },
                  { cat: "Smart TV", icon: "fa-tv", key: "cat_tv" },
                  { cat: "Storage", icon: "fa-hard-drive", key: "cat_storage" },
                  { cat: "Tablet", icon: "fa-tablet-alt", key: "cat_tablet" },
                  { cat: "Smartwatch", icon: "fa-clock", key: "cat_smartwatch" },
                  { cat: "Audio", icon: "fa-headphones", key: "cat_audio" },
                  { cat: "Camera", icon: "fa-camera", key: "cat_camera" },
                  { cat: "Printer", icon: "fa-print", key: "cat_printer" },
                  { cat: "Home Appliance", icon: "fa-plug", key: "cat_appliance" },
                  { cat: "Other", icon: "fa-microchip", key: "cat_other" }
                ].map(item => `
                  <div class="device-category-card ${this.wizardData.device_category === item.cat ? 'selected' : ''}" onclick="app.setWizardCat('${item.cat}', this)" style="cursor: pointer; padding: 14px 8px; border: 1px solid var(--color-border); border-radius: var(--radius-md); text-align: center; background: #FFFFFF;">
                    <i class="fas ${item.icon}" style="font-size: 24px; color: ${this.wizardData.device_category === item.cat ? 'var(--color-secondary)' : 'var(--color-primary)'}; margin-bottom: 6px; display: block;"></i>
                    <span style="font-size: 12px; font-weight: 600; display: block;" data-i18n="${item.key}">${window.i18n.t(item.key)}</span>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Step 2: Brand & Model -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <div class="form-group">
                <label class="form-label" data-i18n="diag_brand_label">Device Brand</label>
                <input type="text" id="diagBrand" class="form-control" data-i18n-placeholder="diag_brand_placeholder" placeholder="e.g., Dell, Apple, HP, Samsung" value="${this.wizardData.brand}">
              </div>
              <div class="form-group">
                <label class="form-label" data-i18n="diag_model_label">Model Name / Number (if known)</label>
                <input type="text" id="diagModel" class="form-control" data-i18n-placeholder="diag_model_placeholder" placeholder="e.g., XPS 15, iPhone 13" value="${this.wizardData.model}">
              </div>
            </div>

            <!-- Step 3: Problem Category -->
            <div class="form-group">
              <label class="form-label" data-i18n="diag_step3">3. Problem Category</label>
              <select id="diagProbCat" class="form-control">
                <option value="Hardware" ${this.wizardData.problem_category === 'Hardware' ? 'selected' : ''}>${window.i18n.t('diag_prob_hardware')}</option>
                <option value="Software" ${this.wizardData.problem_category === 'Software' ? 'selected' : ''}>${window.i18n.t('diag_prob_software')}</option>
                <option value="Network" ${this.wizardData.problem_category === 'Network' ? 'selected' : ''}>${window.i18n.t('diag_prob_network')}</option>
                <option value="Unknown" ${this.wizardData.problem_category === 'Unknown' ? 'selected' : ''}>${window.i18n.t('diag_prob_unknown')}</option>
              </select>
            </div>

            <!-- Step 4: Problem Description -->
            <div class="form-group">
              <label class="form-label" style="display: flex; justify-content: space-between;">
                <span data-i18n="diag_desc_label">Describe the issue in your own words</span>
                <span style="font-size: 12px; color: var(--color-secondary); font-weight: normal;">${isAr ? 'عربي أو إنجليزي مدعوم' : 'English & Arabic supported'}</span>
              </label>
              <textarea id="diagDesc" class="form-control" style="min-height: 120px;" data-i18n-placeholder="diag_desc_placeholder" placeholder="Explain what happens, how long it has been occurring, and any strange sounds, smells, or physical changes...">${this.wizardData.description}</textarea>
            </div>

            <!-- Step 5: Optional Details Accordion -->
            <div style="margin-bottom: 24px; padding: 16px; background-color: #F8FAFC; border-radius: var(--radius-md); border: 1px solid var(--color-border);">
              <h5 style="margin-bottom: 12px; font-size: 14px;" data-i18n="diag_step5">5. Additional Details (Optional)</h5>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
                <div>
                  <label style="font-size: 12px; font-weight: 600; color: var(--color-text-muted);" data-i18n="diag_age_label">Device Age</label>
                  <input type="number" id="diagAge" class="form-control" style="padding: 8px 12px; font-size: 13px;" placeholder="e.g., 2" value="${this.wizardData.device_age_years || ''}">
                </div>
                <div>
                  <label style="font-size: 12px; font-weight: 600; color: var(--color-text-muted);" data-i18n="diag_error_label">Error Code</label>
                  <input type="text" id="diagError" class="form-control" style="padding: 8px 12px; font-size: 13px;" placeholder="e.g., 0x000000D1, Beep code" value="${this.wizardData.error_message}">
                </div>
              </div>
            </div>

            <!-- Submit Button -->
            <button id="submitDiagnosisBtn" class="btn btn-primary btn-lg" style="width: 100%;">
              <i class="fas fa-brain"></i>
              <span data-i18n="diag_submit_btn">Run AI Diagnosis</span>
            </button>

          </div>
        </div>
      </section>
    `;

    const submitBtn = container.querySelector("#submitDiagnosisBtn");
    submitBtn.addEventListener("click", () => {
      this.wizardData.brand = container.querySelector("#diagBrand").value.trim();
      this.wizardData.model = container.querySelector("#diagModel").value.trim();
      this.wizardData.problem_category = container.querySelector("#diagProbCat").value;
      this.wizardData.description = container.querySelector("#diagDesc").value.trim();
      const ageVal = container.querySelector("#diagAge").value;
      this.wizardData.device_age_years = ageVal ? parseFloat(ageVal) : null;
      this.wizardData.error_message = container.querySelector("#diagError").value.trim();

      if (!this.wizardData.description) {
        alert(isAr ? "يرجى كتابة وصف للمشكلة للبدء في التشخيص" : "Please provide a problem description to proceed.");
        return;
      }

      this.submitDiagnosis();
    });
  }

  setWizardCat(cat, el) {
    this.wizardData.device_category = cat;
    document.querySelectorAll(".device-category-card").forEach(c => c.classList.remove("selected"));
    el.classList.add("selected");
  }

  async submitDiagnosis() {
    const isAr = window.i18n.currentLang === "ar";
    const mainContainer = document.getElementById("mainContent");
    
    // Show loading state
    mainContainer.innerHTML = `
      <section style="padding: 100px 0; text-align: center;">
        <div class="container" style="max-width: 500px;">
          <div style="font-size: 48px; color: var(--color-secondary); margin-bottom: 24px;">
            <i class="fas fa-circle-notch fa-spin"></i>
          </div>
          <h2 style="font-size: 24px; margin-bottom: 12px;" data-i18n="diag_analyzing">Analyzing symptoms against repair datasets...</h2>
          <p style="color: var(--color-text-muted); font-size: 14px;">
            ${isAr ? 'نقوم بفحص معايير الأمان وتحليل الأعراض ومقارنتها بقواعد بيانات Open Repair Alliance و MyFixit.' : 'Evaluating safety hazards, extracting symptom vectors, and ranking root causes.'}
          </p>
        </div>
      </section>
    `;

    try {
      const response = await window.api.runDiagnosis({
        device_category: this.wizardData.device_category,
        brand: this.wizardData.brand || null,
        model: this.wizardData.model || null,
        problem_category: this.wizardData.problem_category || null,
        description: this.wizardData.description,
        device_age_years: this.wizardData.device_age_years,
        error_message: this.wizardData.error_message || null,
        recent_changes: this.wizardData.recent_changes || null
      });

      this.currentReport = response;
      this.navigate("results");
    } catch (err) {
      alert((isAr ? "حدث خطأ أثناء التشخيص: " : "Diagnosis failed: ") + err.message);
      this.navigate("diagnose");
    }
  }

  // ==========================================
  // VIEW: DIAGNOSIS RESULTS
  // ==========================================
  renderResults(container) {
    if (!this.currentReport) {
      this.navigate("diagnose");
      return;
    }

    const report = this.currentReport;
    const isAr = window.i18n.currentLang === "ar";
    const isCritical = report.severity === "critical";

    container.innerHTML = `
      <section style="padding: 40px 0 80px;">
        <div class="container" style="max-width: 900px;">
          
          <!-- Top Bar Action -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;">
            <div>
              <span class="tag" style="background-color: #E2E8F0; margin-bottom: 6px;">Report #${report.report_id || 'TEMP'}</span>
              <h1 style="font-size: 28px;" data-i18n="results_title">Diagnostic Report</h1>
              <p style="color: var(--color-text-muted); font-size: 14px;">
                ${report.brand || ''} ${report.model || ''} (${report.device_category})
              </p>
            </div>
            <div style="display: flex; gap: 10px;">
              <button class="btn btn-outline btn-sm" onclick="window.print()">
                <i class="fas fa-print"></i>
                <span data-i18n="results_print_btn">Print Report</span>
              </button>
              <button class="btn btn-outline btn-sm" onclick="app.navigate('diagnose')">
                <i class="fas fa-redo"></i>
                <span data-i18n="results_restart_btn">Diagnose Another</span>
              </button>
            </div>
          </div>

          <!-- Safety Hazard Box (if critical or high) -->
          ${(report.safety_warnings_ar.length > 0 || report.safety_warnings_en.length > 0) ? `
            <div class="hazard-box">
              <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                <i class="fas fa-exclamation-triangle" style="font-size: 20px;"></i>
                <strong data-i18n="results_safety_alert">Safety Warning & Precautions</strong>
              </div>
              <ul style="padding-left: 20px; font-size: 14px;">
                ${(isAr ? report.safety_warnings_ar : report.safety_warnings_en).map(w => `<li>${w}</li>`).join('')}
              </ul>
            </div>
          ` : ''}

          <!-- Overview KPI Card -->
          <div class="card" style="margin-bottom: 24px;">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 20px;">
              <div>
                <span style="font-size: 13px; color: var(--color-text-muted);" data-i18n="results_severity">Severity Level</span>
                <div style="margin-top: 6px;">
                  <span class="severity-badge severity-${report.severity}">
                    <i class="fas fa-circle" style="font-size: 8px;"></i>
                    ${report.severity.toUpperCase()}
                  </span>
                </div>
              </div>

              <div>
                <span style="font-size: 13px; color: var(--color-text-muted);" data-i18n="results_confidence">Model Confidence</span>
                <div style="margin-top: 6px; font-size: 20px; font-weight: 700; color: var(--color-primary);">
                  ${Math.round(report.confidence_score * 100)}%
                </div>
              </div>

              <div>
                <span style="font-size: 13px; color: var(--color-text-muted);">${isAr ? 'الصعوبة المقدرة' : 'Estimated Difficulty'}</span>
                <div style="margin-top: 6px; font-size: 16px; font-weight: 600; text-transform: capitalize;">
                  ${report.estimated_difficulty} (~${report.estimated_minutes} min)
                </div>
              </div>

              <div>
                <span style="font-size: 13px; color: var(--color-text-muted);" data-i18n="results_symptoms">Detected Symptoms</span>
                <div style="margin-top: 6px; display: flex; flex-wrap: wrap; gap: 4px;">
                  ${report.extracted_symptoms.map(s => `<span class="tag">${s}</span>`).join('')}
                </div>
              </div>
            </div>
          </div>

          <!-- Possible Root Causes -->
          <div class="card" style="margin-bottom: 24px;">
            <h3 style="font-size: 18px; margin-bottom: 16px;" data-i18n="results_causes_title">Most Probable Root Causes</h3>
            <div style="display: flex; flex-direction: column; gap: 16px;">
              ${report.possible_causes.map(c => `
                <div style="padding: 16px; background-color: #F8FAFC; border-radius: var(--radius-sm); border: 1px solid var(--color-border);">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                    <strong>${isAr ? c.title_ar : c.title_en}</strong>
                    <span style="font-weight: 700; color: var(--color-secondary); font-size: 14px;">${Math.round(c.probability * 100)}%</span>
                  </div>
                  <!-- Progress bar -->
                  <div style="width: 100%; height: 6px; background-color: #E2E8F0; border-radius: var(--radius-full); margin-bottom: 8px; overflow: hidden;">
                    <div style="width: ${Math.round(c.probability * 100)}%; height: 100%; background-color: var(--color-secondary);"></div>
                  </div>
                  <p style="font-size: 13px; color: var(--color-text-muted); margin: 0;">
                    ${isAr ? c.explanation_ar : c.explanation_en}
                  </p>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Required Tools -->
          ${report.required_tools && report.required_tools.length > 0 ? `
            <div class="card" style="margin-bottom: 24px;">
              <h3 style="font-size: 18px; margin-bottom: 14px;" data-i18n="results_tools_title">Required Tools</h3>
              <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                ${report.required_tools.map(tool => `
                  <span class="tag" style="background-color: rgba(37,99,235,0.08); color: var(--color-secondary); font-size: 13px; padding: 6px 14px;">
                    <i class="fas fa-wrench" style="margin-right: 4px;"></i> ${tool}
                  </span>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Troubleshooting Steps -->
          <div class="card" style="margin-bottom: 24px;">
            <h3 style="font-size: 18px; margin-bottom: 16px;" data-i18n="results_steps_title">Recommended Troubleshooting Steps</h3>
            <div>
              ${report.troubleshooting_steps.map(step => `
                <div class="step-card">
                  <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                    <span style="width: 26px; height: 26px; border-radius: 50%; background-color: var(--color-secondary); color: #FFFFFF; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700;">
                      ${step.step_number}
                    </span>
                    <strong style="font-size: 16px;">${isAr ? step.title_ar : step.title_en}</strong>
                  </div>
                  <p style="font-size: 14px; color: var(--color-text-main); margin-bottom: 6px;">
                    ${isAr ? step.instruction_ar : step.instruction_en}
                  </p>
                  ${(step.caution_en || step.caution_ar) ? `
                    <div style="font-size: 12px; color: #B45309; background-color: #FEF3C7; padding: 6px 12px; border-radius: 4px; display: flex; align-items: center; gap: 6px; margin-top: 6px;">
                      <i class="fas fa-shield-alt"></i>
                      <span>${isAr ? step.caution_ar : step.caution_en}</span>
                    </div>
                  ` : ''}
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Professional Technician Recommendation Banner -->
          ${report.requires_technician ? `
            <div class="card" style="background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%); color: #FFFFFF; padding: 28px;">
              <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px;">
                <div>
                  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; color: var(--color-accent);">
                    <i class="fas fa-user-shield"></i>
                    <strong data-i18n="results_tech_referral">Professional Technician Recommended</strong>
                  </div>
                  <p style="font-size: 14px; color: #CBD5E1; max-width: 580px; margin: 0;">
                    ${report.technician_recommendation_reason || (isAr ? 'يتطلب هذا العطل تدخلاً عتادياً بأجهزة فحص مخصصة لضمان عدم تلف الجهاز بشكل نهائي.' : 'This procedure carries electrical risks or requires specialized board-level repair tools.')}
                  </p>
                </div>
                <button class="btn btn-accent btn-lg" onclick="app.bookTechnicianForReport()">
                  <i class="fas fa-calendar-check"></i>
                  <span data-i18n="results_book_btn">Find Verified Technician</span>
                </button>
              </div>
            </div>
          ` : ''}

        </div>
      </section>
    `;
  }

  bookTechnicianForReport() {
    this.navigate("technicians");
  }

  // ==========================================
  // VIEW: REPAIR GUIDES LIBRARY
  // ==========================================
  async renderGuides(container) {
    const isAr = window.i18n.currentLang === "ar";
    container.innerHTML = `
      <section style="padding: 40px 0 80px;">
        <div class="container">
          
          <div style="text-align: center; max-width: 650px; margin: 0 auto 36px;">
            <h1 style="font-size: 32px; margin-bottom: 10px;" data-i18n="guides_title">Repair Guides & Knowledge Base</h1>
            <p style="color: var(--color-text-muted); font-size: 15px;" data-i18n="guides_subtitle">
              Step-by-step instructions grounded in Open Repair Alliance & MyFixit datasets.
            </p>
          </div>

          <!-- Filters & Search -->
          <div class="card" style="margin-bottom: 30px; padding: 20px;">
            <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 14px;">
              <input type="text" id="guideSearchInput" class="form-control" data-i18n-placeholder="guides_search_placeholder" placeholder="Search guides by keyword, device, or symptom...">
              <select id="guideCatFilter" class="form-control">
                <option value="all">${window.i18n.t('cat_all')}</option>
                <option value="Smartphone">${window.i18n.t('cat_smartphone')}</option>
                <option value="Laptop">${window.i18n.t('cat_laptop')}</option>
                <option value="Desktop Computer">${window.i18n.t('cat_computer')}</option>
                <option value="Gaming Console">${window.i18n.t('cat_console')}</option>
                <option value="Smart TV">${window.i18n.t('cat_tv')}</option>
                <option value="Storage">${window.i18n.t('cat_storage')}</option>
                <option value="Tablet">${window.i18n.t('cat_tablet')}</option>
                <option value="Smartwatch">${window.i18n.t('cat_smartwatch')}</option>
                <option value="Audio">${window.i18n.t('cat_audio')}</option>
                <option value="Camera">${window.i18n.t('cat_camera')}</option>
                <option value="Printer">${window.i18n.t('cat_printer')}</option>
                <option value="Home Appliance">${window.i18n.t('cat_appliance')}</option>
                <option value="Other">${window.i18n.t('cat_other')}</option>
              </select>
              <select id="guideDiffFilter" class="form-control">
                <option value="all">${window.i18n.t('guides_diff_all')}</option>
                <option value="easy">${window.i18n.t('guides_diff_easy')}</option>
                <option value="moderate">${window.i18n.t('guides_diff_moderate')}</option>
                <option value="hard">${window.i18n.t('guides_diff_hard')}</option>
              </select>
            </div>
          </div>

          <!-- Guides Grid -->
          <div id="guidesGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px;">
            <div style="text-align: center; grid-column: 1/-1; padding: 40px; color: var(--color-text-muted);">
              <i class="fas fa-spinner fa-spin fa-2x"></i>
            </div>
          </div>

        </div>
      </section>
    `;

    const loadGuides = async () => {
      const search = container.querySelector("#guideSearchInput").value.trim();
      const cat = container.querySelector("#guideCatFilter").value;
      const diff = container.querySelector("#guideDiffFilter").value;
      const grid = container.querySelector("#guidesGrid");

      try {
        const guides = await window.api.getGuides(cat, diff, search);
        if (guides.length === 0) {
          grid.innerHTML = `<div style="text-align: center; grid-column: 1/-1; padding: 40px; color: var(--color-text-muted);">${isAr ? 'لم يتم العثور على أدلة مطابقة' : 'No matching repair guides found.'}</div>`;
          return;
        }

        grid.innerHTML = guides.map(g => `
          <div class="card card-interactive" onclick="app.showGuideModal(${g.id})">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <span class="tag" style="background-color: rgba(37,99,235,0.08); color: var(--color-secondary);">
                ${g.device_category}
              </span>
              <span class="severity-badge severity-${g.difficulty === 'easy' ? 'low' : g.difficulty === 'moderate' ? 'medium' : 'high'}">
                ${g.difficulty}
              </span>
            </div>
            <h4 style="font-size: 17px; margin-bottom: 8px;">${isAr ? g.title_ar : g.title_en}</h4>
            <p style="font-size: 13px; color: var(--color-text-muted); margin-bottom: 16px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">
              ${isAr ? g.summary_ar : g.summary_en}
            </p>
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--color-border); padding-top: 12px; font-size: 12px; color: var(--color-text-muted);">
              <span><i class="far fa-clock"></i> ~${g.estimated_minutes} min</span>
              <span style="color: var(--color-secondary); font-weight: 600;" data-i18n="guides_view_btn">View Guide &rarr;</span>
            </div>
          </div>
        `).join('');
      } catch (err) {
        grid.innerHTML = `<div style="color: var(--color-danger); text-align: center; grid-column: 1/-1;">Failed to load guides: ${err.message}</div>`;
      }
    };

    container.querySelector("#guideSearchInput").addEventListener("input", loadGuides);
    container.querySelector("#guideCatFilter").addEventListener("change", loadGuides);
    container.querySelector("#guideDiffFilter").addEventListener("change", loadGuides);
    loadGuides();
  }

  async showGuideModal(guideId) {
    const isAr = window.i18n.currentLang === "ar";
    try {
      const guide = await window.api.getGuide(guideId);
      const content = `
        <div style="margin-bottom: 20px;">
          <span class="tag" style="background-color: rgba(37,99,235,0.08); color: var(--color-secondary);">${guide.device_category}</span>
          <h2 style="font-size: 22px; margin: 10px 0 6px;">${isAr ? guide.title_ar : guide.title_en}</h2>
          <p style="font-size: 14px; color: var(--color-text-muted);">${isAr ? guide.summary_ar : guide.summary_en}</p>
        </div>

        <div style="display: flex; gap: 10px; margin-bottom: 20px;">
          <span class="tag"><i class="far fa-clock"></i> ~${guide.estimated_minutes} min</span>
          <span class="tag"><i class="fas fa-layer-group"></i> ${guide.difficulty}</span>
        </div>

        ${guide.safety_precautions && guide.safety_precautions.length > 0 ? `
          <div class="hazard-box" style="margin: 16px 0; padding: 12px 16px;">
            <strong style="display: block; margin-bottom: 4px;"><i class="fas fa-shield-alt"></i> ${isAr ? 'إجراءات الأمان' : 'Safety Precautions'}:</strong>
            <ul style="padding-left: 20px; font-size: 13px;">
              ${guide.safety_precautions.map(p => `<li>${p}</li>`).join('')}
            </ul>
          </div>
        ` : ''}

        <h4 style="margin: 16px 0 10px;">${isAr ? 'الخطوات العملية' : 'Step-by-Step Instructions'}</h4>
        <div>
          ${guide.steps.map(step => `
            <div class="step-card" style="padding: 14px;">
              <strong style="font-size: 14px; display: block; margin-bottom: 4px;">Step ${step.step_number}: ${isAr ? step.title_ar : step.title_en}</strong>
              <p style="font-size: 13px; color: var(--color-text-muted); margin: 0;">${isAr ? step.instruction_ar : step.instruction_en}</p>
            </div>
          `).join('')}
        </div>
      `;
      this.openModal(content);
    } catch (err) {
      alert("Error loading guide: " + err.message);
    }
  }

  // ==========================================
  // VIEW: TECHNICIAN MARKETPLACE
  // ==========================================
  async renderTechnicians(container) {
    const isAr = window.i18n.currentLang === "ar";
    container.innerHTML = `
      <section style="padding: 40px 0 80px;">
        <div class="container">
          
          <div style="text-align: center; max-width: 650px; margin: 0 auto 36px;">
            <h1 style="font-size: 32px; margin-bottom: 10px;" data-i18n="tech_title">Certified Repair Technicians</h1>
            <p style="color: var(--color-text-muted); font-size: 15px;" data-i18n="tech_subtitle">
              Connect with vetted hardware specialists in your city.
            </p>
          </div>

          <!-- Filters -->
          <div class="card" style="margin-bottom: 30px; padding: 20px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
              <select id="techCityFilter" class="form-control">
                <option value="all">${window.i18n.t('tech_city_all')}</option>
                <option value="Cairo">Cairo (القاهرة)</option>
                <option value="Alexandria">Alexandria (الإسكندرية)</option>
                <option value="Giza">Giza (الجيزة)</option>
              </select>
              <select id="techSpecFilter" class="form-control">
                <option value="all">${window.i18n.t('tech_filter_spec')} (All)</option>
                <option value="Laptop">Laptops & MacBooks</option>
                <option value="Smartphone">Smartphones & Tablets</option>
                <option value="Motherboard">Motherboards & Soldering</option>
                <option value="Data Recovery">Data Recovery</option>
              </select>
            </div>
          </div>

          <!-- Technicians Grid -->
          <div id="techGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 24px;">
            <div style="text-align: center; grid-column: 1/-1; padding: 40px; color: var(--color-text-muted);">
              <i class="fas fa-spinner fa-spin fa-2x"></i>
            </div>
          </div>

        </div>
      </section>
    `;

    const loadTechs = async () => {
      const city = container.querySelector("#techCityFilter").value;
      const spec = container.querySelector("#techSpecFilter").value;
      const grid = container.querySelector("#techGrid");

      try {
        const techs = await window.api.getTechnicians(city, spec);
        if (techs.length === 0) {
          grid.innerHTML = `<div style="text-align: center; grid-column: 1/-1; padding: 40px; color: var(--color-text-muted);">${isAr ? 'لا يوجد فنيين مطابقين للبحث حالياً' : 'No technicians matched this filter.'}</div>`;
          return;
        }

        grid.innerHTML = techs.map(t => `
          <div class="tech-card">
            <div>
              <div style="display: flex; gap: 14px; align-items: center; margin-bottom: 14px;">
                <div class="tech-avatar">
                  ${t.business_name.charAt(0)}
                </div>
                <div>
                  <h4 style="font-size: 17px; margin-bottom: 2px;">${t.business_name}</h4>
                  <span style="font-size: 13px; color: var(--color-text-muted);"><i class="fas fa-user-check" style="color: var(--color-success);"></i> ${t.technician_name}</span>
                </div>
              </div>

              <div style="display: flex; gap: 12px; font-size: 13px; color: var(--color-text-muted); margin-bottom: 12px;">
                <span><i class="fas fa-map-marker-alt" style="color: var(--color-secondary);"></i> ${t.city}</span>
                <span><i class="fas fa-star" style="color: #F59E0B;"></i> ${t.rating} (${t.total_reviews})</span>
                <span><i class="fas fa-award"></i> ${t.experience_years} ${window.i18n.t('tech_experience')}</span>
              </div>

              <p style="font-size: 13px; color: var(--color-text-main); margin-bottom: 14px; line-height: 1.5;">
                ${t.bio || ''}
              </p>

              <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 18px;">
                ${t.specializations.map(s => `<span class="tag">${s}</span>`).join('')}
              </div>
            </div>

            <button class="btn btn-primary btn-sm" style="width: 100%;" onclick="app.showBookingModal(${t.id}, '${t.business_name.replace(/'/g, "\\'")}')">
              <i class="fas fa-calendar-plus"></i>
              <span data-i18n="tech_book_btn">Book Repair</span>
            </button>
          </div>
        `).join('');
      } catch (err) {
        grid.innerHTML = `<div style="color: var(--color-danger); text-align: center; grid-column: 1/-1;">Error loading technicians: ${err.message}</div>`;
      }
    };

    container.querySelector("#techCityFilter").addEventListener("change", loadTechs);
    container.querySelector("#techSpecFilter").addEventListener("change", loadTechs);
    loadTechs();
  }

  showBookingModal(techId, techName) {
    const isAr = window.i18n.currentLang === "ar";
    if (!window.api.isLoggedIn()) {
      alert(isAr ? "يرجى تسجيل الدخول أولاً لتتمكن من إرسال طلب الصيانة." : "Please log in first to submit a repair request.");
      this.showAuthModal("login");
      return;
    }

    const defaultDevice = this.currentReport ? `${this.currentReport.brand || ''} ${this.currentReport.model || ''} (${this.currentReport.device_category})` : "Laptop";
    const defaultProblem = this.currentReport ? (isAr ? this.currentReport.possible_causes[0]?.title_ar : this.currentReport.possible_causes[0]?.title_en) : "Diagnostic Inspection Needed";

    const content = `
      <div>
        <h3 style="font-size: 20px; margin-bottom: 6px;" data-i18n="tech_book_modal_title">Book Repair Service</h3>
        <p style="font-size: 14px; color: var(--color-text-muted); margin-bottom: 20px;">Technician: <strong>${techName}</strong></p>

        <form id="bookingForm">
          <div class="form-group">
            <label class="form-label">${isAr ? 'معلومات الجهاز' : 'Device Info'}</label>
            <input type="text" id="bookDeviceInfo" class="form-control" required value="${defaultDevice}">
          </div>

          <div class="form-group">
            <label class="form-label">${isAr ? 'ملخص العطل' : 'Problem Summary'}</label>
            <input type="text" id="bookProblemSummary" class="form-control" required value="${defaultProblem}">
          </div>

          <div class="form-group">
            <label class="form-label" data-i18n="tech_book_date">Preferred Date</label>
            <input type="date" id="bookDate" class="form-control">
          </div>

          <div class="form-group">
            <label class="form-label" data-i18n="tech_book_notes">Additional Notes</label>
            <textarea id="bookNotes" class="form-control" style="min-height: 80px;" placeholder="${isAr ? 'أي مواعيد محددة أو ملاحظات إضافية...' : 'Any specific delivery or diagnostic details...'}"></textarea>
          </div>

          <button type="submit" class="btn btn-primary btn-lg" style="width: 100%;">
            <i class="fas fa-check-circle"></i>
            <span data-i18n="tech_book_confirm">Confirm Request</span>
          </button>
        </form>
      </div>
    `;
    this.openModal(content);

    document.getElementById("bookingForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      try {
        await window.api.createRepairRequest({
          technician_id: techId,
          diagnosis_id: this.currentReport ? this.currentReport.report_id : null,
          device_info: document.getElementById("bookDeviceInfo").value,
          problem_summary: document.getElementById("bookProblemSummary").value,
          customer_notes: document.getElementById("bookNotes").value,
          scheduled_date: document.getElementById("bookDate").value ? new Date(document.getElementById("bookDate").value).toISOString() : null
        });
        alert(isAr ? "تم إرسال طلب الصيانة للفني بنجاح!" : "Repair request sent to technician successfully!");
        this.closeModal();
        this.navigate("dashboard");
      } catch (err) {
        alert("Booking failed: " + err.message);
      }
    });
  }

  // ==========================================
  // VIEW: USER / TECHNICIAN DASHBOARD
  // ==========================================
  async renderDashboard(container) {
    const isAr = window.i18n.currentLang === "ar";
    if (!window.api.isLoggedIn()) {
      this.navigate("home");
      this.showAuthModal("login");
      return;
    }

    const user = window.api.getUser();
    container.innerHTML = `
      <section style="padding: 40px 0 80px;">
        <div class="container">
          
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px; flex-wrap: wrap; gap: 14px;">
            <div>
              <span class="tag" style="background-color: rgba(37,99,235,0.08); color: var(--color-secondary);">${user.role.toUpperCase()}</span>
              <h1 style="font-size: 28px; margin-top: 4px;"><span data-i18n="dash_welcome">Welcome back</span>, ${user.full_name}!</h1>
              <p style="color: var(--color-text-muted); font-size: 14px;">${user.email}</p>
            </div>
            <button class="btn btn-primary" onclick="app.navigate('diagnose')">
              <i class="fas fa-plus"></i>
              <span data-i18n="hero_cta_diag">New Diagnosis</span>
            </button>
          </div>

          <!-- Dashboard Tabs Content -->
          <div style="display: grid; grid-template-columns: 1fr; gap: 32px;">
            
            <!-- Active Repair Requests -->
            <div class="card">
              <h3 style="font-size: 18px; margin-bottom: 16px;" data-i18n="dash_my_requests">Active Repair Bookings</h3>
              <div id="dashRequestsList">
                <div style="padding: 20px; text-align: center; color: var(--color-text-muted);"><i class="fas fa-spinner fa-spin"></i></div>
              </div>
            </div>

            <!-- Diagnosis History -->
            <div class="card">
              <h3 style="font-size: 18px; margin-bottom: 16px;" data-i18n="dash_my_reports">Diagnosis History</h3>
              <div id="dashReportsList">
                <div style="padding: 20px; text-align: center; color: var(--color-text-muted);"><i class="fas fa-spinner fa-spin"></i></div>
              </div>
            </div>

            <!-- My Devices -->
            <div class="card">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <h3 style="font-size: 18px; margin: 0;" data-i18n="dash_my_devices">My Devices</h3>
                <button class="btn btn-outline btn-sm" onclick="app.showAddDeviceModal()">
                  <i class="fas fa-plus"></i> <span data-i18n="dash_add_device">Add Device</span>
                </button>
              </div>
              <div id="dashDevicesList">
                <div style="padding: 20px; text-align: center; color: var(--color-text-muted);"><i class="fas fa-spinner fa-spin"></i></div>
              </div>
            </div>

          </div>

        </div>
      </section>
    `;

    // Load Data
    this.loadDashboardData(container);
  }

  async loadDashboardData(container) {
    const isAr = window.i18n.currentLang === "ar";
    const user = window.api.getUser();

    // 1. Load Requests
    try {
      const requests = await window.api.getMyRequests();
      const reqContainer = container.querySelector("#dashRequestsList");
      if (requests.length === 0) {
        reqContainer.innerHTML = `<p style="color: var(--color-text-muted); font-size: 14px;">${window.i18n.t('dash_no_requests')}</p>`;
      } else {
        reqContainer.innerHTML = `
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <thead>
                <tr style="border-bottom: 2px solid var(--color-border); text-align: ${isAr ? 'right' : 'left'}; color: var(--color-text-muted);">
                  <th style="padding: 10px;">ID</th>
                  <th style="padding: 10px;">${isAr ? 'الجهاز' : 'Device'}</th>
                  <th style="padding: 10px;">${isAr ? 'المشكلة' : 'Problem'}</th>
                  <th style="padding: 10px;">${isAr ? 'الطرف الآخر' : 'Party'}</th>
                  <th style="padding: 10px;">${isAr ? 'الحالة' : 'Status'}</th>
                  ${user.role === 'technician' ? `<th style="padding: 10px;">${isAr ? 'الإجراء' : 'Action'}</th>` : ''}
                </tr>
              </thead>
              <tbody>
                ${requests.map(r => `
                  <tr style="border-bottom: 1px solid var(--color-border);">
                    <td style="padding: 12px 10px;">#${r.id}</td>
                    <td style="padding: 12px 10px; font-weight: 600;">${r.device_info}</td>
                    <td style="padding: 12px 10px;">${r.problem_summary}</td>
                    <td style="padding: 12px 10px;">${user.role === 'technician' ? r.customer_name : r.technician_business}</td>
                    <td style="padding: 12px 10px;">
                      <span class="tag" style="background-color: ${r.status === 'completed' ? 'var(--color-success-bg)' : r.status === 'in_progress' ? 'var(--color-warning-bg)' : '#E2E8F0'}; color: ${r.status === 'completed' ? 'var(--color-success)' : r.status === 'in_progress' ? '#D97706' : 'var(--color-text-main)'};">
                        ${r.status.toUpperCase()}
                      </span>
                    </td>
                    ${user.role === 'technician' ? `
                      <td style="padding: 12px 10px;">
                        <select class="form-control" style="padding: 4px 8px; font-size: 12px; width: auto;" onchange="app.changeRequestStatus(${r.id}, this.value)">
                          <option value="pending" ${r.status === 'pending' ? 'selected' : ''}>Pending</option>
                          <option value="accepted" ${r.status === 'accepted' ? 'selected' : ''}>Accepted</option>
                          <option value="in_progress" ${r.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
                          <option value="completed" ${r.status === 'completed' ? 'selected' : ''}>Completed</option>
                          <option value="cancelled" ${r.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                        </select>
                      </td>
                    ` : ''}
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      }
    } catch (err) {
      container.querySelector("#dashRequestsList").innerHTML = `<span style="color: var(--color-danger);">${err.message}</span>`;
    }

    // 2. Load Reports
    try {
      const reports = await window.api.getMyReports();
      const repContainer = container.querySelector("#dashReportsList");
      if (reports.length === 0) {
        repContainer.innerHTML = `<p style="color: var(--color-text-muted); font-size: 14px;">${window.i18n.t('dash_no_reports')}</p>`;
      } else {
        repContainer.innerHTML = `
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px;">
            ${reports.map(rep => `
              <div style="padding: 16px; border: 1px solid var(--color-border); border-radius: var(--radius-sm); background: #F8FAFC;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                  <strong style="font-size: 15px;">${rep.brand || ''} ${rep.model || rep.device_category}</strong>
                  <span class="severity-badge severity-${rep.severity_level}">${rep.severity_level}</span>
                </div>
                <p style="font-size: 13px; color: var(--color-text-muted); margin-bottom: 10px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                  ${rep.raw_description}
                </p>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: 11px; color: var(--color-text-muted);">${new Date(rep.created_at).toLocaleDateString()}</span>
                  <button class="btn btn-outline btn-sm" onclick="app.viewSavedReport(${rep.id})">
                    <i class="fas fa-eye"></i> ${isAr ? 'عرض' : 'View'}
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        `;
      }
    } catch (err) {
      container.querySelector("#dashReportsList").innerHTML = `<span style="color: var(--color-danger);">${err.message}</span>`;
    }

    // 3. Load Devices
    try {
      const devices = await window.api.getMyDevices();
      const devContainer = container.querySelector("#dashDevicesList");
      if (devices.length === 0) {
        devContainer.innerHTML = `<p style="color: var(--color-text-muted); font-size: 14px;">${window.i18n.t('dash_no_devices')}</p>`;
      } else {
        devContainer.innerHTML = `
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px;">
            ${devices.map(d => `
              <div style="padding: 14px; border: 1px solid var(--color-border); border-radius: var(--radius-sm); display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <strong style="font-size: 14px; display: block;">${d.brand || ''} ${d.model || d.category}</strong>
                  <span style="font-size: 12px; color: var(--color-text-muted);">${d.category} - ${d.os_version || ''}</span>
                </div>
                <button style="background: none; border: none; color: var(--color-danger); cursor: pointer;" onclick="app.deleteDevice(${d.id})">
                  <i class="fas fa-trash-alt"></i>
                </button>
              </div>
            `).join('')}
          </div>
        `;
      }
    } catch (err) {
      container.querySelector("#dashDevicesList").innerHTML = `<span style="color: var(--color-danger);">${err.message}</span>`;
    }
  }

  async changeRequestStatus(reqId, status) {
    try {
      await window.api.updateRequestStatus(reqId, status);
      alert("Status updated to: " + status);
      this.navigate("dashboard");
    } catch (err) {
      alert("Failed to update status: " + err.message);
    }
  }

  async viewSavedReport(reportId) {
    try {
      const rep = await window.api.getReport(reportId);
      this.currentReport = {
        report_id: rep.id,
        device_category: rep.device_category,
        brand: rep.brand,
        model: rep.model,
        severity: rep.severity_level,
        confidence_score: rep.confidence_score,
        extracted_symptoms: rep.extracted_symptoms,
        possible_causes: rep.possible_causes,
        troubleshooting_steps: rep.recommended_steps,
        required_tools: rep.required_tools,
        estimated_difficulty: rep.estimated_difficulty,
        estimated_minutes: rep.estimated_minutes,
        safety_warnings_en: rep.safety_warnings,
        safety_warnings_ar: rep.safety_warnings,
        requires_technician: rep.requires_technician
      };
      this.navigate("results");
    } catch (err) {
      alert("Failed to load report: " + err.message);
    }
  }

  showAddDeviceModal() {
    const isAr = window.i18n.currentLang === "ar";
    const content = `
      <div>
        <h3 style="font-size: 20px; margin-bottom: 16px;" data-i18n="dash_add_device">Add New Device</h3>
        <form id="addDeviceForm">
          <div class="form-group">
            <label class="form-label">${isAr ? 'فئة الجهاز' : 'Category'}</label>
            <select id="newDevCat" class="form-control" required>
              <option value="Laptop">Laptop</option>
              <option value="Desktop Computer">Desktop Computer</option>
              <option value="Smartphone">Smartphone</option>
              <option value="Tablet">Tablet</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">${isAr ? 'الشركة المصنعة' : 'Brand'}</label>
            <input type="text" id="newDevBrand" class="form-control" placeholder="e.g. Dell, Apple" required>
          </div>
          <div class="form-group">
            <label class="form-label">${isAr ? 'الموديل' : 'Model'}</label>
            <input type="text" id="newDevModel" class="form-control" placeholder="e.g. XPS 15, iPhone 12" required>
          </div>
          <div class="form-group">
            <label class="form-label">${isAr ? 'نظام التشغيل' : 'OS Version'}</label>
            <input type="text" id="newDevOs" class="form-control" placeholder="e.g. Windows 11, iOS 17">
          </div>
          <button type="submit" class="btn btn-primary" style="width: 100%;">
            <i class="fas fa-plus"></i> ${isAr ? 'حفظ الجهاز' : 'Save Device'}
          </button>
        </form>
      </div>
    `;
    this.openModal(content);

    document.getElementById("addDeviceForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      try {
        await window.api.addDevice({
          category: document.getElementById("newDevCat").value,
          brand: document.getElementById("newDevBrand").value,
          model: document.getElementById("newDevModel").value,
          os_version: document.getElementById("newDevOs").value
        });
        this.closeModal();
        this.navigate("dashboard");
      } catch (err) {
        alert("Failed to add device: " + err.message);
      }
    });
  }

  async deleteDevice(deviceId) {
    if (confirm("Remove this device from your account?")) {
      await window.api.deleteDevice(deviceId);
      this.navigate("dashboard");
    }
  }

  // ==========================================
  // VIEW: ADMIN CONTROL PANEL
  // ==========================================
  async renderAdmin(container) {
    const isAr = window.i18n.currentLang === "ar";
    const user = window.api.getUser();
    if (!user || user.role !== "admin") {
      this.navigate("home");
      return;
    }

    container.innerHTML = `
      <section style="padding: 40px 0 80px;">
        <div class="container">
          
          <div style="margin-bottom: 28px;">
            <span class="tag" style="background-color: #FEE2E2; color: #DC2626;">ADMIN ACCESS ONLY</span>
            <h1 style="font-size: 28px; margin-top: 4px;" data-i18n="admin_title">Administration Control Center</h1>
          </div>

          <!-- KPI Cards -->
          <div id="adminStatsGrid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 18px; margin-bottom: 32px;">
            <div style="padding: 20px; text-align: center; color: var(--color-text-muted);"><i class="fas fa-spinner fa-spin"></i></div>
          </div>

          <!-- Pending Technician Approvals -->
          <div class="card" style="margin-bottom: 30px;">
            <h3 style="font-size: 18px; margin-bottom: 16px;" data-i18n="admin_tab_approvals">Technician Approvals</h3>
            <div id="adminPendingTechs">
              <div style="padding: 20px; text-align: center; color: var(--color-text-muted);"><i class="fas fa-spinner fa-spin"></i></div>
            </div>
          </div>

          <!-- User Management -->
          <div class="card">
            <h3 style="font-size: 18px; margin-bottom: 16px;" data-i18n="admin_tab_users">User Accounts</h3>
            <div id="adminUsersList">
              <div style="padding: 20px; text-align: center; color: var(--color-text-muted);"><i class="fas fa-spinner fa-spin"></i></div>
            </div>
          </div>

        </div>
      </section>
    `;

    // Load Stats
    try {
      const stats = await window.api.getAdminStats();
      container.querySelector("#adminStatsGrid").innerHTML = `
        <div class="card" style="padding: 20px; text-align: center;">
          <span style="font-size: 13px; color: var(--color-text-muted);" data-i18n="admin_stat_users">Total Users</span>
          <div style="font-size: 28px; font-weight: 800; color: var(--color-primary); margin-top: 4px;">${stats.total_users}</div>
        </div>
        <div class="card" style="padding: 20px; text-align: center;">
          <span style="font-size: 13px; color: var(--color-text-muted);" data-i18n="admin_stat_techs">Total Technicians</span>
          <div style="font-size: 28px; font-weight: 800; color: var(--color-secondary); margin-top: 4px;">${stats.total_technicians}</div>
        </div>
        <div class="card" style="padding: 20px; text-align: center;">
          <span style="font-size: 13px; color: var(--color-text-muted);" data-i18n="admin_stat_pending">Pending Approvals</span>
          <div style="font-size: 28px; font-weight: 800; color: #D97706; margin-top: 4px;">${stats.pending_approvals}</div>
        </div>
        <div class="card" style="padding: 20px; text-align: center;">
          <span style="font-size: 13px; color: var(--color-text-muted);" data-i18n="admin_stat_diags">Total Diagnoses</span>
          <div style="font-size: 28px; font-weight: 800; color: var(--color-success); margin-top: 4px;">${stats.total_diagnoses}</div>
        </div>
      `;
    } catch (e) {
      console.error(e);
    }

    // Load Pending Technicians
    try {
      const pending = await window.api.getPendingTechnicians();
      const pContainer = container.querySelector("#adminPendingTechs");
      if (pending.length === 0) {
        pContainer.innerHTML = `<p style="color: var(--color-text-muted); font-size: 14px;">${isAr ? 'لا توجد طلبات اعتماد فنيين معلقة حالياً.' : 'No pending technician applications.'}</p>`;
      } else {
        pContainer.innerHTML = `
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <thead>
                <tr style="border-bottom: 2px solid var(--color-border); text-align: ${isAr ? 'right' : 'left'};">
                  <th style="padding: 8px;">Business</th>
                  <th style="padding: 8px;">Applicant</th>
                  <th style="padding: 8px;">City</th>
                  <th style="padding: 8px;">Specialties</th>
                  <th style="padding: 8px;">Action</th>
                </tr>
              </thead>
              <tbody>
                ${pending.map(t => `
                  <tr style="border-bottom: 1px solid var(--color-border);">
                    <td style="padding: 10px 8px; font-weight: 600;">${t.business_name}</td>
                    <td style="padding: 10px 8px;">${t.full_name} (${t.email})</td>
                    <td style="padding: 10px 8px;">${t.city}</td>
                    <td style="padding: 10px 8px;">${t.specializations}</td>
                    <td style="padding: 10px 8px;">
                      <button class="btn btn-sm btn-primary" onclick="app.approveTech(${t.id})" data-i18n="admin_approve_btn">Approve</button>
                      <button class="btn btn-sm btn-outline" style="color: var(--color-danger);" onclick="app.rejectTech(${t.id})" data-i18n="admin_reject_btn">Reject</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      }
    } catch (e) {
      console.error(e);
    }

    // Load Users
    try {
      const users = await window.api.getAdminUsers();
      container.querySelector("#adminUsersList").innerHTML = `
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <thead>
              <tr style="border-bottom: 2px solid var(--color-border); text-align: ${isAr ? 'right' : 'left'};">
                <th style="padding: 8px;">ID</th>
                <th style="padding: 8px;">Name</th>
                <th style="padding: 8px;">Email</th>
                <th style="padding: 8px;">Role</th>
                <th style="padding: 8px;">Status</th>
                <th style="padding: 8px;">Action</th>
              </tr>
            </thead>
            <tbody>
              ${users.map(u => `
                <tr style="border-bottom: 1px solid var(--color-border);">
                  <td style="padding: 8px;">#${u.id}</td>
                  <td style="padding: 8px; font-weight: 600;">${u.full_name}</td>
                  <td style="padding: 8px;">${u.email}</td>
                  <td style="padding: 8px;"><span class="tag">${u.role}</span></td>
                  <td style="padding: 8px;">
                    <span style="color: ${u.is_active ? 'var(--color-success)' : 'var(--color-danger)'}; font-weight: 600;">
                      ${u.is_active ? 'Active' : 'Deactivated'}
                    </span>
                  </td>
                  <td style="padding: 8px;">
                    <button class="btn btn-sm btn-outline" onclick="app.toggleUser(${u.id})">
                      ${u.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (e) {
      console.error(e);
    }
  }

  async approveTech(id) {
    await window.api.approveTechnician(id);
    alert("Technician approved!");
    this.navigate("admin");
  }

  async rejectTech(id) {
    await window.api.rejectTechnician(id);
    alert("Technician application rejected.");
    this.navigate("admin");
  }

  async toggleUser(id) {
    await window.api.toggleUserStatus(id);
    this.navigate("admin");
  }

  // ==========================================
  // AUTH MODALS (LOGIN & REGISTER)
  // ==========================================
  showAuthModal(mode = "login", defaultRole = "user") {
    const isAr = window.i18n.currentLang === "ar";
    const content = mode === "login" ? `
      <div>
        <h3 style="font-size: 22px; margin-bottom: 6px;" data-i18n="auth_login_title">Sign in to Fixora</h3>
        <p style="font-size: 14px; color: var(--color-text-muted); margin-bottom: 20px;">
          ${isAr ? 'أدخل بريدك الإلكتروني وكلمة المرور للمتابعة' : 'Enter your credentials to access your dashboard'}
        </p>

        <!-- Quick Demo One-Click Login -->
        <div style="background-color: #F1F5F9; padding: 12px; border-radius: var(--radius-sm); margin-bottom: 20px;">
          <span style="font-size: 12px; font-weight: 600; color: var(--color-text-muted); display: block; margin-bottom: 8px;" data-i18n="auth_quick_demo">
            Quick Demo Logins:
          </span>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button class="btn btn-sm btn-outline" style="background: #FFFFFF;" onclick="app.quickFillLogin('admin@fixora.com', 'Admin123456!')">Admin</button>
            <button class="btn btn-sm btn-outline" style="background: #FFFFFF;" onclick="app.quickFillLogin('cairo.fix@fixora.com', 'Tech123456!')">Technician</button>
            <button class="btn btn-sm btn-outline" style="background: #FFFFFF;" onclick="app.quickFillLogin('user@fixora.com', 'User123456!')">Customer</button>
          </div>
        </div>

        <form id="loginForm">
          <div class="form-group">
            <label class="form-label" data-i18n="auth_email">Email Address</label>
            <input type="email" id="loginEmail" class="form-control" required placeholder="name@example.com">
          </div>
          <div class="form-group">
            <label class="form-label" data-i18n="auth_password">Password</label>
            <input type="password" id="loginPassword" class="form-control" required placeholder="••••••••">
          </div>
          <button type="submit" class="btn btn-primary btn-lg" style="width: 100%; margin-top: 10px;">
            <span data-i18n="auth_login_btn">Sign In</span>
          </button>
        </form>

        <div style="text-align: center; margin-top: 18px; font-size: 13px;">
          <a href="#" onclick="app.showAuthModal('register'); return false;" data-i18n="auth_switch_to_reg">Don't have an account? Sign up</a>
        </div>
      </div>
    ` : `
      <div>
        <h3 style="font-size: 22px; margin-bottom: 6px;" data-i18n="auth_register_title">Create Your Account</h3>
        <p style="font-size: 14px; color: var(--color-text-muted); margin-bottom: 20px;">
          ${isAr ? 'انضم إلى مجتمع Fixora لتشخيص الأجهزة والصيانة الذكية' : 'Join Fixora for intelligent device diagnostics and repair assistance'}
        </p>

        <form id="registerForm">
          <div class="form-group">
            <label class="form-label" data-i18n="auth_fullname">Full Name</label>
            <input type="text" id="regName" class="form-control" required placeholder="John Doe">
          </div>
          <div class="form-group">
            <label class="form-label" data-i18n="auth_email">Email Address</label>
            <input type="email" id="regEmail" class="form-control" required placeholder="name@example.com">
          </div>
          <div class="form-group">
            <label class="form-label" data-i18n="auth_password">Password</label>
            <input type="password" id="regPassword" class="form-control" required minlength="6" placeholder="At least 6 characters">
          </div>
          <div class="form-group">
            <label class="form-label" data-i18n="auth_role_label">Account Type</label>
            <select id="regRole" class="form-control">
              <option value="user" ${defaultRole === 'user' ? 'selected' : ''}>${window.i18n.t('auth_role_user')}</option>
              <option value="technician" ${defaultRole === 'technician' ? 'selected' : ''}>${window.i18n.t('auth_role_tech')}</option>
            </select>
          </div>
          <button type="submit" class="btn btn-primary btn-lg" style="width: 100%; margin-top: 10px;">
            <span data-i18n="auth_register_btn">Create Account</span>
          </button>
        </form>

        <div style="text-align: center; margin-top: 18px; font-size: 13px;">
          <a href="#" onclick="app.showAuthModal('login'); return false;" data-i18n="auth_switch_to_login">Already have an account? Sign in</a>
        </div>
      </div>
    `;

    this.openModal(content);

    // Bind submit
    if (mode === "login") {
      document.getElementById("loginForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("loginEmail").value.trim();
        const pwd = document.getElementById("loginPassword").value;
        try {
          await window.api.login(email, pwd);
          this.closeModal();
          this.updateNavAuth();
          this.navigate("dashboard");
        } catch (err) {
          alert((isAr ? "فشل تسجيل الدخول: " : "Login failed: ") + err.message);
        }
      });
    } else {
      document.getElementById("registerForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const name = document.getElementById("regName").value.trim();
        const email = document.getElementById("regEmail").value.trim();
        const pwd = document.getElementById("regPassword").value;
        const role = document.getElementById("regRole").value;
        try {
          await window.api.register(name, email, pwd, role);
          this.closeModal();
          this.updateNavAuth();
          this.navigate("dashboard");
        } catch (err) {
          alert((isAr ? "فشل إنشاء الحساب: " : "Registration failed: ") + err.message);
        }
      });
    }
  }

  quickFillLogin(email, password) {
    const emailInput = document.getElementById("loginEmail");
    const pwdInput = document.getElementById("loginPassword");
    if (emailInput && pwdInput) {
      emailInput.value = email;
      pwdInput.value = password;
    }
  }

  openModal(html) {
    const modal = document.getElementById("appModal");
    const body = document.getElementById("modalBody");
    if (modal && body) {
      body.innerHTML = html;
      modal.style.display = "flex";
      window.i18n.applyLanguage(window.i18n.currentLang);
    }
  }

  closeModal() {
    const modal = document.getElementById("appModal");
    if (modal) modal.style.display = "none";
  }
}

// Instantiate App
document.addEventListener("DOMContentLoaded", () => {
  window.app = new FixoraApp();
});
