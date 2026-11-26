
const CITY_COORDS = {
  "Cairo": { lat: 30.0444, lng: 31.2357 },
  "القاهرة": { lat: 30.0444, lng: 31.2357 },
  "Giza": { lat: 30.0131, lng: 31.2089 },
  "الجيزة": { lat: 30.0131, lng: 31.2089 },
  "Fayoum": { lat: 29.3084, lng: 30.8428 },
  "الفيوم": { lat: 29.3084, lng: 30.8428 },
  "Alexandria": { lat: 31.2001, lng: 29.9187 },
  "الإسكندرية": { lat: 31.2001, lng: 29.9187 },
  "6th of October": { lat: 29.9285, lng: 30.9188 },
  "6 أكتوبر": { lat: 29.9285, lng: 30.9188 },
  "السادس من أكتوبر": { lat: 29.9285, lng: 30.9188 },
  "Beni Suef": { lat: 29.0661, lng: 31.0994 },
  "بني سويف": { lat: 29.0661, lng: 31.0994 },
  "Mansoura": { lat: 31.0409, lng: 31.3785 },
  "المنصورة": { lat: 31.0409, lng: 31.3785 },
  "Tanta": { lat: 30.7865, lng: 31.0004 },
  "طنطا": { lat: 30.7865, lng: 31.0004 },
  "Zagazig": { lat: 30.5877, lng: 31.5020 },
  "الزقازيق": { lat: 30.5877, lng: 31.5020 },
  "Ismailia": { lat: 30.5965, lng: 32.2715 },
  "الإسماعيلية": { lat: 30.5965, lng: 32.2715 },
  "Suez": { lat: 29.9668, lng: 32.5498 },
  "السويس": { lat: 29.9668, lng: 32.5498 },
  "Port Said": { lat: 31.2653, lng: 32.3019 },
  "بورسعيد": { lat: 31.2653, lng: 32.3019 },
  "Luxor": { lat: 25.6872, lng: 32.6396 },
  "الأقصر": { lat: 25.6872, lng: 32.6396 },
  "Aswan": { lat: 24.0889, lng: 32.8998 },
  "أسوان": { lat: 24.0889, lng: 32.8998 },
  "Assiut": { lat: 27.1809, lng: 31.1837 },
  "أسيوط": { lat: 27.1809, lng: 31.1837 },
  "Nasr City": { lat: 30.0561, lng: 31.3301 },
  "مدينة نصر": { lat: 30.0561, lng: 31.3301 },
  "Maadi": { lat: 29.9602, lng: 31.2569 },
  "المعادي": { lat: 29.9602, lng: 31.2569 },
  "Heliopolis": { lat: 30.0866, lng: 31.3297 },
  "مصر الجديدة": { lat: 30.0866, lng: 31.3297 },
  "New Cairo": { lat: 30.0074, lng: 31.4913 },
  "القاهرة الجديدة": { lat: 30.0074, lng: 31.4913 }
};

function calculateHaversine(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Math.round(R * c * 10) / 10;
}

/**
 * ByteForce Core Single Page Application (SPA) Controller
 */

class ByteForceApp {
  constructor() {
    this.currentView = "home";
    this.notifications = [];
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
    this.adminActiveTab = "centers";
    this.adminNotice = null;
    this.init();
  }

  isExclusiveAdmin(user = null) {
    const u = user || (window.api ? window.api.getUser() : null);
    if (!u || !u.email) return false;
    return String(u.email).toLowerCase().trim() === "snsr19344@gmail.com";
  }

  _esc(val) {
    return String(val ?? "").replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"
    }[c]));
  }

  applyHomeSectionOrder() {
    const main = document.getElementById("mainContent");
    if (!main) return;
    const deviceCategories = main.querySelector('.devices-section');
    const onboarding = main.querySelector('#intro-showcase');
    const about = main.querySelector('#about');
    if (deviceCategories && onboarding) {
      main.insertBefore(deviceCategories, onboarding);
    }
    if (about) {
      main.appendChild(about);
    }
  }

  async init() {
    try {
      localStorage.removeItem("byteforce_theme");
    } catch (e) {}
    document.documentElement.setAttribute("data-theme", "light");
    this.applyHomeSectionOrder();
    this.bindEvents();
    this.updateNavAuth();
    this.bindHomeTriage();
    this.fetchAndApplyLiveDatasetStats();
    this.initNotifications();

    const wasOAuthCallback = window.location.hash.includes("access_token") || window.location.search.includes("code=");

    // Check for active Supabase session or OAuth redirect callback
    if (window.SupabaseBridge && typeof window.SupabaseBridge.initSession === "function") {
      try {
        const session = await window.SupabaseBridge.initSession();
        if (session) {
          this.updateNavAuth();
          // Keep user / admin cleanly on the Home Page after login redirect
          if (wasOAuthCallback) {
            this.navigate("home");
          }
        }
      } catch (e) {
        console.warn("Session check note:", e);
      }
    }
  }

  // ==========================================
  // NOTIFICATIONS SYSTEM (STRICTLY SUPABASE BACKED)
  // ==========================================
  initNotifications() {
    this.notifications = [];
    this.loadNotifications();
  }

  async loadNotifications() {
    if (!window.api || !window.api.isLoggedIn()) {
      this.notifications = [];
      this.updateNotifBadge();
      return;
    }
    try {
      const rows = await window.api.getNotifications();
      this.notifications = (rows || []).map(n => ({
        id: n.id,
        title: n.title,
        message: n.message,
        time: n.created_at ? new Date(n.created_at).toLocaleString() : "",
        read: !!n.is_read,
        type: n.type || "info"
      }));
    } catch (e) {
      this.notifications = [];
    }
    this.updateNotifBadge();
  }

  updateNotifBadge() {
    const badge = document.getElementById("notifBadge");
    if (!badge) return;
    const unread = (this.notifications || []).filter(n => !n.read).length;
    if (unread > 0) {
      badge.textContent = unread > 9 ? "9+" : unread;
      badge.style.display = "inline-block";
    } else {
      badge.style.display = "none";
    }
  }

  async toggleNotifications() {
    const dropdown = document.getElementById("notifDropdown");
    if (!dropdown) return;
    const isVisible = dropdown.style.display === "block";
    dropdown.style.display = isVisible ? "none" : "block";
    if (!isVisible) {
      await this.loadNotifications();
      this.renderNotifications();
    }
  }

  async markAllNotifsRead() {
    (this.notifications || []).forEach(n => n.read = true);
    try {
      await window.api.markAllNotificationsRead();
    } catch (e) {}
    this.updateNotifBadge();
    this.renderNotifications();
  }

  async markNotifRead(id) {
    const n = (this.notifications || []).find(item => String(item.id) === String(id));
    if (n) {
      n.read = true;
      try {
        await window.api.markNotificationRead(id);
      } catch (e) {}
      this.updateNotifBadge();
      this.renderNotifications();
    }
  }

  addNotification(title, message, type = "info") {
    const isAr = window.i18n.currentLang === "ar";
    this.notifications.unshift({
      id: Date.now(),
      title: title,
      message: message,
      time: isAr ? "الآن" : "Just now",
      read: false,
      type: type
    });
    if (this.notifications.length > 30) this.notifications.pop();
    this.updateNotifBadge();
  }

  renderNotifications() {
    const list = document.getElementById("notifList");
    if (!list) return;
    const isAr = window.i18n.currentLang === "ar";
    if (!this.notifications || this.notifications.length === 0) {
      list.innerHTML = `<div style="text-align: center; padding: 24px 10px; color: #64748B; font-size: 13px;">${isAr ? 'لا توجد إشعارات بعد' : 'No notifications yet'}</div>`;
      return;
    }
    list.innerHTML = this.notifications.map(n => `
      <div class="notif-item ${n.read ? '' : 'unread'}" style="cursor: pointer;" onclick="app.markNotifRead('${n.id}')">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
          <strong style="color: var(--color-text-main); font-size: 13px;">${n.title}</strong>
          ${!n.read ? '<span style="width: 8px; height: 8px; border-radius: 50%; background: #38BDF8; flex-shrink: 0; margin-top: 4px;"></span>' : ''}
        </div>
        <p style="color: #94A3B8; font-size: 12px; margin-top: 4px; line-height: 1.4;">${n.message}</p>
        <div class="notif-time">${n.time}</div>
      </div>
    `).join("");
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
      logoutBtn.addEventListener("click", async () => {
        if (window.SupabaseBridge && typeof window.SupabaseBridge.signOut === "function") {
          try { await window.SupabaseBridge.signOut(); } catch(e) {}
        }
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
    const mobileDashLink = document.getElementById("mobileNavDashboardLink");
    const mobileAdminLink = document.getElementById("mobileNavAdminLink");
    const userNameEl = document.getElementById("navUserName");
    const isAr = window.i18n.currentLang === "ar";

    const userAvatarEl = document.getElementById("navUserAvatar");
    if (isLoggedIn && user) {
      if (guestLinks) guestLinks.style.display = "none";
      if (userLinks) userLinks.style.display = "flex";
      if (userNameEl) userNameEl.textContent = user.full_name || user.email;
      if (userAvatarEl) {
        if (user.avatar_url) {
          userAvatarEl.innerHTML = `<img src="${user.avatar_url}" alt="${user.full_name || 'User'}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover; display: block;" onerror="this.parentElement.textContent='${user.avatar_initial || 'U'}'">`;
        } else {
          userAvatarEl.textContent = user.avatar_initial || (user.full_name ? user.full_name.charAt(0).toUpperCase() : "U");
        }
      }
      const isAdmin = this.isExclusiveAdmin(user);
      if (dashLink) dashLink.style.display = "block";
      const adminDirectBtn = document.getElementById("navAdminDirectBtn");
      if (adminDirectBtn) adminDirectBtn.style.display = isAdmin ? "inline-flex" : "none";
      if (mobileDashLink) mobileDashLink.style.display = "block";
      if (mobileAdminLink) mobileAdminLink.style.display = isAdmin ? "block" : "none";
    } else {
      if (guestLinks) guestLinks.style.display = "flex";
      if (userLinks) userLinks.style.display = "none";
      if (dashLink) dashLink.style.display = "none";
      const adminDirectBtn = document.getElementById("navAdminDirectBtn");
      if (adminDirectBtn) adminDirectBtn.style.display = "none";
      if (mobileDashLink) mobileDashLink.style.display = "none";
      if (mobileAdminLink) mobileAdminLink.style.display = "none";
    }

    // Dynamic update for Onboarding Showcase Auth Card if present on page
    const obBadge = document.getElementById("onboardingAuthBadge");
    const obTitle = document.getElementById("onboardingAuthTitle");
    const obDesc = document.getElementById("onboardingAuthDesc");
    const obActions = document.getElementById("onboardingAuthActions");

    if (obBadge && obTitle && obDesc && obActions) {
      if (isLoggedIn && user) {
        const isAdminUser = this.isExclusiveAdmin(user);
        obBadge.innerHTML = `<span class="badge" style="background: rgba(16, 185, 129, 0.15); color: #10B981; border: 1px solid rgba(16, 185, 129, 0.3); font-size: 12px; padding: 4px 10px;"><i class="fas fa-check-circle"></i> ${isAr ? 'حساب نشط' : 'Account Active'}</span>${isAdminUser ? `<span class="badge" style="background: rgba(239, 68, 68, 0.16); color: var(--color-danger); border: 1px solid rgba(239, 68, 68, 0.35); font-size: 12px; padding: 4px 10px;"><i class="fas fa-shield-alt"></i> ${isAr ? 'مدير النظام' : 'System Admin'}</span>` : ''}<span style="color: #94A3B8; font-size: 13px;">${this._esc(user.email || '')}</span>`;
        obTitle.textContent = isAr ? `أهلاً ${user.full_name || user.email}` : `Welcome, ${user.full_name || user.email}`;
        obDesc.textContent = isAr ? "حسابك مفعّل ويمكنك استخدام الفحص وتقديم طلبات الصيانة." : "Your account is ready for diagnostics and repair requests.";
        obActions.innerHTML = `
          ${isAdminUser ? `
            <button class="btn btn-md" onclick="app.navigate('admin')" style="background: rgba(239, 68, 68, 0.18); color: var(--color-danger); border: 1px solid rgba(239, 68, 68, 0.45); display: inline-flex; align-items: center; gap: 8px; font-weight: 700;">
              <i class="fas fa-shield-alt" style="color: #EF4444;"></i>
              <span>${isAr ? 'فتح لوحة الإدارة' : 'Open Admin Panel'}</span>
            </button>
          ` : ''}
          <button class="btn btn-primary btn-md" onclick="app.navigate('diagnose')" style="display: inline-flex; align-items: center; gap: 8px;">
            <i class="fas fa-wrench"></i>
            <span>${isAr ? 'ابدأ فحص جهاز' : 'Start Diagnosis'}</span>
          </button>
        `;
      } else {
        obBadge.innerHTML = `<span class="badge" style="background: rgba(239, 68, 68, 0.15); color: var(--color-danger); border: 1px solid rgba(239, 68, 68, 0.3); font-size: 12px; padding: 4px 10px;"><i class="fas fa-lock"></i> ${isAr ? 'تسجيل الدخول مطلوب' : 'Sign In Required'}</span>`;
        obTitle.textContent = isAr ? 'سجّل دخولك لاستخدام خدمات المنصة' : 'Sign in to use platform services';
        obDesc.textContent = isAr ? 'يرجى تسجيل الدخول لتقديم طلب صيانة أو فحص جهاز أو عرض الأدلة.' : 'Please sign in to submit a repair request, run diagnostics, or view guides.';
        obActions.innerHTML = `
          <button class="btn btn-primary btn-md" onclick="app.showAuthModal('login')" style="display: inline-flex; align-items: center; gap: 8px;">
            <i class="fas fa-sign-in-alt"></i>
            <span>${isAr ? 'تسجيل الدخول' : 'Sign In'}</span>
          </button>
          <button class="btn btn-outline btn-md" onclick="app.showAuthModal('register')" style="display: inline-flex; align-items: center; gap: 8px;">
            <i class="fas fa-user-plus"></i>
            <span>${isAr ? 'إنشاء حساب جديد' : 'Register Account'}</span>
          </button>
        `;
      }
    }
  }

  toggleMobileMenu() {
    const drawer = document.getElementById("mobileNavDrawer");
    const toggleBtn = document.getElementById("navMobileToggleBtn");
    if (!drawer) return;
    const isVisible = drawer.style.display === "block";
    drawer.style.display = isVisible ? "none" : "block";
    if (toggleBtn) {
      toggleBtn.innerHTML = isVisible ? '<i class="fas fa-bars"></i>' : '<i class="fas fa-times"></i>';
    }
  }

  closeMobileMenu() {
    const drawer = document.getElementById("mobileNavDrawer");
    const toggleBtn = document.getElementById("navMobileToggleBtn");
    if (drawer) drawer.style.display = "none";
    if (toggleBtn) toggleBtn.innerHTML = '<i class="fas fa-bars"></i>';
  }

  _requireAuth(destView = null, msgAr = "يرجى تسجيل الدخول للمتابعة.", msgEn = "Please sign in to continue.") {
    if (window.api && window.api.isLoggedIn()) return true;
    if (destView) this.pendingNavigation = destView;
    const isAr = window.i18n.currentLang === "ar";
    this.showAuthModal("login", "user", isAr ? msgAr : msgEn);
    return false;
  }

  navigate(viewName, params = {}) {
    const protectedViews = new Set(["diagnose", "results", "guides", "technicians", "dashboard"]);
    if (protectedViews.has(viewName)) {
      const msgAr = viewName === "technicians" ? "سجّل دخولك أولاً لتقديم طلب صيانة." : "يرجى تسجيل الدخول للمتابعة.";
      const msgEn = viewName === "technicians" ? "Please sign in first to submit a repair request." : "Please sign in to continue.";
      if (!this._requireAuth(viewName, msgAr, msgEn)) {
        if (!document.getElementById("mainContent")?.innerHTML.trim()) {
          this.renderHome(document.getElementById("mainContent"));
        }
        return;
      }
    }

    this.currentView = viewName;
    document.querySelectorAll(".nav-link").forEach(l => {
      l.classList.toggle("active", l.getAttribute("data-nav") === viewName);
    });

    const mainContainer = document.getElementById("mainContent");
    if (!mainContainer) return;

    if (this._techLeafMap) {
      try { this._techLeafMap.remove(); } catch (e) {}
      this._techLeafMap = null;
    }

    window.scrollTo({ top: 0, behavior: "smooth" });

    switch (viewName) {
      case "home":
        this.renderHome(mainContainer);
        break;
      case "about":
        this.renderHome(mainContainer);
        setTimeout(() => {
          const aboutEl = document.getElementById("about");
          if (aboutEl) aboutEl.scrollIntoView({ behavior: "smooth" });
        }, 60);
        break;
      case "diagnose":
        if (!this._requireAuth("diagnose")) return;
        this.renderDiagnose(mainContainer);
        break;
      case "results":
        if (!this._requireAuth("results")) return;
        this.renderResults(mainContainer);
        break;
      case "guides":
        if (!this._requireAuth("guides")) return;
        this.renderGuides(mainContainer);
        break;
      case "technicians":
        if (!this._requireAuth("technicians", "سجّل دخولك أولاً لتقديم طلب صيانة.", "Please sign in first to submit a repair request.")) return;
        this.renderTechnicians(mainContainer);
        break;
      case "dashboard":
        if (!this._requireAuth("dashboard")) return;
        this.renderDashboard(mainContainer);
        break;
      case "admin":
        const adminUser = window.api.getUser();
        const isAuthorizedAdmin = window.api.isLoggedIn() && this.isExclusiveAdmin(adminUser);
        if (!isAuthorizedAdmin) {
          const isAr = window.i18n.currentLang === "ar";
          alert(isAr ? "قسم الإدارة مخصص حصرياً لمدير النظام (snsr19344@gmail.com)" : "Admin dashboard is exclusively restricted to the system administrator (snsr19344@gmail.com)");
          this.navigate("home");
          return;
        }
        this.renderAdmin(mainContainer);
        break;
      case "privacy":
        this.renderPrivacy(mainContainer);
        break;
      case "terms":
        this.renderTerms(mainContainer);
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
  bindHomeTriage() {
    let selectedCat = "Smartphone";
    const pills = document.querySelectorAll(".triage-pill-btn");
    pills.forEach(b => {
      b.onclick = () => {
        pills.forEach(btn => btn.classList.remove("active"));
        b.classList.add("active");
        selectedCat = b.getAttribute("data-cat");
      };
    });

    const submitBtn = document.getElementById("homeQuickDiagSubmit");
    const inputEl = document.getElementById("homeQuickDiagInput");
    if (submitBtn && inputEl) {
      submitBtn.onclick = () => {
        const text = inputEl.value.trim();
        const isAr = window.i18n.currentLang === "ar";
        if (!text) {
          alert(isAr ? "يرجى كتابة وصف مختصر للمشكلة" : "Please enter a brief problem description.");
          return;
        }
        this.wizardData.device_category = selectedCat;
        this.wizardData.description = text;
        this.wizardData.problem_category = "Hardware";

        // STRICT AUTH GATE: Do not allow guest diagnosis
        if (!window.api.isLoggedIn()) {
          this.pendingQuickDiagnosis = {
            category: selectedCat,
            description: text
          };
          this.pendingNavigation = "diagnose";
          this.showAuthModal("login", "user", isAr ? "يرجى تسجيل الدخول للمتابعة." : "Please sign in to continue.");
          return;
        }

        this.navigate("diagnose");
      };
    }
  }

  renderHome(container) {
    const isAr = window.i18n.currentLang === "ar";
    container.innerHTML = `
    <!-- ByteFix Exact Hero Layout -->
    <section class="hero-wrapper">
      <!-- Vertical Social Bar -->
      <div class="hero-social-bar">
        <a href="#" class="hero-social-link" title="Facebook"><i class="fab fa-facebook-f"></i></a>
        <a href="#" class="hero-social-link" title="Instagram"><i class="fab fa-instagram"></i></a>
        <a href="#" class="hero-social-link" title="Twitter / X"><i class="fab fa-twitter"></i></a>
        <a href="#" class="hero-social-link" title="LinkedIn"><i class="fab fa-linkedin-in"></i></a>
      </div>

      <div class="container">
        <div class="hero-content-col">
          <div class="hero-badge" style="display: inline-flex; align-items: center; gap: 8px; padding: 6px 14px; background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: var(--radius-full); font-size: 12px; font-weight: 600; color: var(--color-accent); margin-bottom: 18px;">
            <i class="fas fa-microchip"></i>
            <span data-i18n="hero_badge">${window.i18n.t('hero_badge')}</span>
          </div>

          <h1 class="hero-headline" data-i18n="hero_headline">
            ${window.i18n.t('hero_headline')}
          </h1>

          <p class="hero-subtext" data-i18n="hero_subtext">
            ${window.i18n.t('hero_subtext')}
          </p>

          <div style="display: flex; gap: 14px; align-items: center; flex-wrap: wrap;">
            <!-- Request Repair Button (White Pill) -->
            <button class="btn btn-emergency" onclick="app.navigate('technicians')" data-i18n="hero_request_repair">
              ${window.i18n.t('hero_request_repair')}
            </button>
            <button class="btn btn-outline" onclick="app.navigate('guides')" style="border-radius: var(--radius-full); padding: 10px 22px; font-size: 14px; font-weight: 600;" data-i18n="nav_guides">
              ${window.i18n.t('nav_guides')}
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Platform Onboarding & Introductory Showcase Section (الواجهة التعريفية لمنصة ByteForce) -->
    <section class="onboarding-intro-section" id="intro-showcase">
      <div class="container">
        
        <!-- Onboarding Header -->
        <div style="text-align: center; max-width: 820px; margin: 0 auto 46px;">
          <div style="display: inline-flex; align-items: center; gap: 8px; padding: 6px 16px; background: rgba(37, 99, 235, 0.12); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 9999px; font-size: 13px; font-weight: 600; color: var(--color-accent); margin-bottom: 16px;">
            <i class="fas fa-certificate"></i>
            <span data-i18n="onboarding_badge">${window.i18n.t('onboarding_badge')}</span>
          </div>
          <h2 style="font-size: 34px; font-weight: 800; color: var(--color-text-main); line-height: 1.3; margin-bottom: 16px;" data-i18n="onboarding_title">
            ${window.i18n.t('onboarding_title')}
          </h2>
          <p style="font-size: 15px; color: #94A3B8; line-height: 1.7;" data-i18n="onboarding_subtitle">
            ${window.i18n.t('onboarding_subtitle')}
          </p>
        </div>

        <!-- 3-Step Guided Workflow Cards -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; margin-bottom: 40px;">
          
          <!-- Step 1 Card -->
          <div class="card onboarding-card" style="padding: 28px 24px; border: 1px solid var(--color-border); background: var(--color-card); border-radius: 14px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
              <div style="width: 50px; height: 50px; border-radius: 12px; background: rgba(56, 189, 248, 0.12); color: var(--color-accent); display: flex; align-items: center; justify-content: center; font-size: 22px;">
                <i class="fas fa-layer-group"></i>
              </div>
              <span style="font-size: 12px; font-weight: 700; color: var(--color-accent); background: rgba(56, 189, 248, 0.1); padding: 4px 10px; border-radius: 20px;">${isAr ? 'الخطوة 01' : 'Step 01'}</span>
            </div>
            <h3 style="font-size: 18px; font-weight: 700; color: var(--color-text-main); margin-bottom: 10px;" data-i18n="onboarding_step1_h">
              ${window.i18n.t('onboarding_step1_h')}
            </h3>
            <p style="font-size: 14px; color: #94A3B8; line-height: 1.6;" data-i18n="onboarding_step1_p">
              ${window.i18n.t('onboarding_step1_p')}
            </p>
            <div style="margin-top: 18px; padding-top: 14px; border-top: 1px solid var(--color-border); font-size: 12px; color: #64748B; display: flex; align-items: center; gap: 6px;">
              <i class="fas fa-shield-alt" style="color: #10B981;"></i>
              <span>${isAr ? 'فحص الأمان الفوري وتفادي مخاطر البطاريات' : 'Instant safety triage & battery hazard check'}</span>
            </div>
          </div>

          <!-- Step 2 Card -->
          <div class="card onboarding-card" style="padding: 28px 24px; border: 1px solid rgba(37, 99, 235, 0.35); background: var(--color-card); border-radius: 14px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
              <div style="width: 50px; height: 50px; border-radius: 12px; background: rgba(37, 99, 235, 0.15); color: #60A5FA; display: flex; align-items: center; justify-content: center; font-size: 22px;">
                <i class="fas fa-brain"></i>
              </div>
              <span style="font-size: 12px; font-weight: 700; color: #60A5FA; background: rgba(37, 99, 235, 0.15); padding: 4px 10px; border-radius: 20px;">${isAr ? 'الخطوة 02' : 'Step 02'}</span>
            </div>
            <h3 style="font-size: 18px; font-weight: 700; color: var(--color-text-main); margin-bottom: 10px;" data-i18n="onboarding_step2_h">
              ${window.i18n.t('onboarding_step2_h')}
            </h3>
            <p style="font-size: 14px; color: #94A3B8; line-height: 1.6;" data-i18n="onboarding_step2_p">
              ${window.i18n.t('onboarding_step2_p')}
            </p>
            <div style="margin-top: 18px; padding-top: 14px; border-top: 1px solid var(--color-border); font-size: 12px; color: #64748B; display: flex; align-items: center; gap: 6px;">
              <i class="fas fa-check-circle" style="color: #10B981;"></i>
              <span>${isAr ? 'دقة تنبؤ SMART للأقراص ROC-AUC = 0.912' : 'SMART Drive failure ML test ROC-AUC = 0.912'}</span>
            </div>
          </div>

          <!-- Step 3 Card -->
          <div class="card onboarding-card" style="padding: 28px 24px; border: 1px solid var(--color-border); background: var(--color-card); border-radius: 14px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
              <div style="width: 50px; height: 50px; border-radius: 12px; background: rgba(16, 185, 129, 0.12); color: #10B981; display: flex; align-items: center; justify-content: center; font-size: 22px;">
                <i class="fas fa-tools"></i>
              </div>
              <span style="font-size: 12px; font-weight: 700; color: #10B981; background: rgba(16, 185, 129, 0.1); padding: 4px 10px; border-radius: 20px;">${isAr ? 'الخطوة 03' : 'Step 03'}</span>
            </div>
            <h3 style="font-size: 18px; font-weight: 700; color: var(--color-text-main); margin-bottom: 10px;" data-i18n="onboarding_step3_h">
              ${window.i18n.t('onboarding_step3_h')}
            </h3>
            <p style="font-size: 14px; color: #94A3B8; line-height: 1.6;" data-i18n="onboarding_step3_p">
              ${window.i18n.t('onboarding_step3_p')}
            </p>
            <div style="margin-top: 18px; padding-top: 14px; border-top: 1px solid var(--color-border); font-size: 12px; color: #64748B; display: flex; align-items: center; gap: 6px;">
              <i class="fas fa-file-pdf" style="color: var(--color-accent);"></i>
              <span>${isAr ? 'توليد تقرير فني معتمد قابل للطباعة PDF' : 'Downloadable PDF technical diagnosis reports'}</span>
            </div>
          </div>

        </div>

        <!-- Protected Diagnostic Access Gate Card -->
        <div class="onboarding-auth-gate-card" id="onboardingAuthCard" style="background: var(--auth-gate-bg); border: 1px solid rgba(56,189,248,0.25); border-radius: 16px; padding: 28px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 24px;">
          <div style="max-width: 620px;">
            <div id="onboardingAuthBadge" style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <span class="badge" style="background: rgba(239, 68, 68, 0.15); color: var(--color-danger); border: 1px solid rgba(239, 68, 68, 0.3); font-size: 12px; padding: 4px 10px;">
                <i class="fas fa-lock"></i> ${window.i18n.t('auth_gate_locked_badge')}
              </span>
              <span style="color: #94A3B8; font-size: 13px;">${isAr ? 'حماية البيانات وتوثيق تاريخ الأجهزة' : 'Device history & data protection'}</span>
            </div>
            <h3 id="onboardingAuthTitle" style="font-size: 20px; font-weight: 700; color: var(--color-text-main); margin-bottom: 8px;" data-i18n="auth_gate_title">
              ${window.i18n.t('auth_gate_title')}
            </h3>
            <p id="onboardingAuthDesc" style="font-size: 14px; color: #94A3B8; line-height: 1.6;" data-i18n="auth_gate_desc">
              ${window.i18n.t('auth_gate_desc')}
            </p>
          </div>

          <div id="onboardingAuthActions" style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
            <button class="btn btn-primary btn-md" onclick="app.showAuthModal('login')" style="display: inline-flex; align-items: center; gap: 8px;">
              <i class="fas fa-sign-in-alt"></i>
              <span data-i18n="nav_login">${window.i18n.t('nav_login')}</span>
            </button>
            <button class="btn btn-outline btn-md" onclick="app.showAuthModal('register')" style="display: inline-flex; align-items: center; gap: 8px;">
              <i class="fas fa-user-plus"></i>
              <span data-i18n="nav_register">${window.i18n.t('nav_register')}</span>
            </button>
          </div>
        </div>

      </div>
    </section>

    <!-- ByteFix Exact About Us Section with Circular Badge & Stats -->
    <section class="about-section" id="about">
      <div class="container about-grid">
        
        <!-- Circular Rotating Badge -->
        <div>
          <div class="experience-badge" dir="ltr" style="direction: ltr;">
            <svg viewBox="0 0 160 160" class="badge-svg" direction="ltr" style="direction: ltr;">
              <defs>
                <path id="badge-circle" d="M 80, 80 m -60, 0 a 60,60 0 1,1 120,0 a 60,60 0 1,1 -120,0" fill="none" />
              </defs>
              <text class="badge-text" direction="ltr" text-anchor="start" style="direction: ltr; unicode-bidi: bidi-override;">
                <textPath href="#badge-circle" xlink:href="#badge-circle" startOffset="0%" direction="ltr" text-anchor="start">
                  • BYTEFORCE PLATFORM • CERTIFIED REPAIRS • EST. 2026 •
                </textPath>
              </text>
            </svg>
            <div class="badge-center-icon">
              <i class="fas fa-asterisk"></i>
            </div>
          </div>
        </div>

        <!-- Editorial Copy & Stats -->
        <div>
          <h2 class="about-heading" data-i18n="about_title">${window.i18n.t('about_title')}</h2>
          <p class="about-body" style="margin-bottom: 14px;" data-i18n="about_body_1">
            ${window.i18n.t('about_body_1')}
          </p>
          <p class="about-body" data-i18n="about_body_2">
            ${window.i18n.t('about_body_2')}
          </p>

          <div class="about-stats-row">
            <div class="about-stat-box">
              <div id="homeStatIncidents" class="about-stat-num" style="color: var(--color-accent);">${this._liveStats?.incidents || '...'}</div>
              <div class="about-stat-lbl" data-i18n="stat_records_lbl">${window.i18n.t('stat_records_lbl')}</div>
            </div>
            <div class="about-stat-box">
              <div id="homeStatGuides" class="about-stat-num" style="color: #10B981;">${this._liveStats?.guides || '...'}</div>
              <div class="about-stat-lbl" data-i18n="stat_guides_lbl">${window.i18n.t('stat_guides_lbl')}</div>
            </div>
            <div class="about-stat-box">
              <div id="homeStatAuc" class="about-stat-num" style="color: #F59E0B;">${this._liveStats?.auc || '...'}</div>
              <div class="about-stat-lbl" data-i18n="stat_ml_auc_lbl">${window.i18n.t('stat_ml_auc_lbl')}</div>
            </div>
          </div>
        </div>

      </div>
    </section>

    <!-- Supported Universal Devices Section (13 Categories) -->
    <section class="devices-section">
      <div class="container">
        <div style="text-align: center; max-width: 720px; margin: 0 auto 36px;">
          <div style="display: inline-block; padding: 4px 14px; background: rgba(56, 189, 248, 0.1); border-radius: var(--radius-full); font-size: 12px; font-weight: 700; color: var(--color-accent); text-transform: uppercase; margin-bottom: 12px; letter-spacing: 1px;">
            Universal Hardware Coverage
          </div>
          <h2 style="font-size: 34px; margin-bottom: 12px; color: var(--color-text-main);" data-i18n="demo_devices">${window.i18n.t('demo_devices')}</h2>
          <p style="color: var(--color-text-muted); font-size: 15px;">
            ${isAr ? 'تغطية شاملة ومدروسة لكافة الأجهزة الاستهلاكية والمنزلية والتقنية عبر نماذج تشخيص مبنية على قواعد بيانات الصيانة العالمية.' : 'Comprehensive diagnostic support across all personal computing, mobile, entertainment, storage, and home electronics.'}
          </p>
        </div>

        <div class="device-categories-grid">
          ${[
            { cat: 'Smartphone', icon: 'fa-mobile-alt', key: 'cat_smartphone', sub: 'cat_smartphone_sub' },
            { cat: 'Laptop', icon: 'fa-laptop', key: 'cat_laptop', sub: 'cat_laptop_sub' },
            { cat: 'Desktop Computer', icon: 'fa-desktop', key: 'cat_computer', sub: 'cat_computer_sub' },
            { cat: 'Gaming Console', icon: 'fa-gamepad', key: 'cat_console', sub: 'cat_console_sub' },
            { cat: 'Smart TV', icon: 'fa-tv', key: 'cat_tv', sub: 'cat_tv_sub' },
            { cat: 'Storage', icon: 'fa-hard-drive', key: 'cat_storage', sub: 'cat_storage_sub' },
            { cat: 'Tablet', icon: 'fa-tablet-alt', key: 'cat_tablet', sub: 'cat_tablet_sub' },
            { cat: 'Smartwatch', icon: 'fa-clock', key: 'cat_smartwatch', sub: 'cat_smartwatch_sub' },
            { cat: 'Audio', icon: 'fa-headphones', key: 'cat_audio', sub: 'cat_audio_sub' },
            { cat: 'Camera', icon: 'fa-camera', key: 'cat_camera', sub: 'cat_camera_sub' },
            { cat: 'Printer', icon: 'fa-print', key: 'cat_printer', sub: 'cat_printer_sub' },
            { cat: 'Home Appliance', icon: 'fa-plug', key: 'cat_appliance', sub: 'cat_appliance_sub' },
            { cat: 'Other', icon: 'fa-microchip', key: 'cat_other', sub: 'cat_other_sub' }
          ].map(item => `
            <div class="device-category-card" onclick="app.filterGuidesByCategory('${item.cat}')">
              <i class="fas ${item.icon}"></i>
              <strong data-i18n="${item.key}">${window.i18n.t(item.key)}</strong>
              <span data-i18n="${item.sub}">${window.i18n.t(item.sub)}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </section>

    <!-- How ByteForce Works Section -->
    <section style="padding: 85px 0; background-color: var(--color-bg); border-bottom: none;">
      <div class="container">
        <div style="text-align: center; max-width: 650px; margin: 0 auto 52px;">
          <h2 style="font-size: 34px; margin-bottom: 14px; color: var(--color-text-main);" data-i18n="how_title">${window.i18n.t('how_title')}</h2>
          <p style="color: var(--color-text-muted); font-size: 15px;" data-i18n="how_desc">
            ${window.i18n.t('how_desc')}
          </p>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 24px;">
          <div class="card" style="text-align: center; padding: 32px 20px;">
            <div style="width: 50px; height: 50px; border-radius: 50%; background: rgba(37,99,235,0.15); color: var(--color-accent); display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 22px;">
              <i class="fas fa-laptop-medical"></i>
            </div>
            <h4 style="margin-bottom: 8px; color: var(--color-text-main); font-size: 16px;" data-i18n="how_step1_title">${window.i18n.t('how_step1_title')}</h4>
            <p style="font-size: 13px; color: var(--color-text-muted);">${window.i18n.t('how_step1_desc')}</p>
          </div>

          <div class="card" style="text-align: center; padding: 32px 20px;">
            <div style="width: 50px; height: 50px; border-radius: 50%; background: rgba(56,189,248,0.15); color: var(--color-accent); display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 22px;">
              <i class="fas fa-comment-dots"></i>
            </div>
            <h4 style="margin-bottom: 8px; color: var(--color-text-main); font-size: 16px;" data-i18n="how_step2_title">${window.i18n.t('how_step2_title')}</h4>
            <p style="font-size: 13px; color: var(--color-text-muted);">${window.i18n.t('how_step2_desc')}</p>
          </div>

          <div class="card" style="text-align: center; padding: 32px 20px;">
            <div style="width: 50px; height: 50px; border-radius: 50%; background: rgba(37,99,235,0.15); color: #1D64F2; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 22px;">
              <i class="fas fa-brain"></i>
            </div>
            <h4 style="margin-bottom: 8px; color: var(--color-text-main); font-size: 16px;" data-i18n="how_step3_title">${window.i18n.t('how_step3_title')}</h4>
            <p style="font-size: 13px; color: var(--color-text-muted);">${window.i18n.t('how_step3_desc')}</p>
          </div>

          <div class="card" style="text-align: center; padding: 32px 20px;">
            <div style="width: 50px; height: 50px; border-radius: 50%; background: rgba(16,185,129,0.15); color: #10B981; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 22px;">
              <i class="fas fa-tools"></i>
            </div>
            <h4 style="margin-bottom: 8px; color: var(--color-text-main); font-size: 16px;" data-i18n="how_step4_title">${window.i18n.t('how_step4_title')}</h4>
            <p style="font-size: 13px; color: var(--color-text-muted);">${window.i18n.t('how_step4_desc')}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Certified Technician Marketplace Teaser Banner -->
    <section style="padding: 60px 0; background: var(--color-card); border-bottom: 1px solid var(--color-border);">
      <div class="container" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 24px;">
        <div>
          <h3 style="color: var(--color-text-main); font-size: 26px; margin-bottom: 8px;">
            ${isAr ? 'هل أنت فني أو مركز صيانة محترف؟' : 'Are you a professional repair technician or lab?'}
          </h3>
          <p style="color: #94A3B8; font-size: 14px; max-width: 580px;">
            ${isAr ? 'انضم إلى شبكة فنيي ByteForce المعتمدين واستقبل طلبات الصيانة الموثقة من العملاء في مدينتك بعد مراجعة ملفك واعتماده.' : 'Join ByteForce to receive verified repair requests from customers in your area after administrative verification.'}
          </p>
        </div>
        <button class="btn btn-primary btn-lg" onclick="app.showAuthModal('register', 'technician')">
          <i class="fas fa-user-plus"></i>
          <span>${isAr ? 'سجل كفني صيانة معتمد' : 'Register as Technician'}</span>
        </button>
      </div>
    </section>
    `;

    this.applyHomeSectionOrder();
    this.updateNavAuth();
    this.fetchAndApplyLiveDatasetStats();
    this.initNotifications();
  }

  async fetchAndApplyLiveDatasetStats(retryCount = 0) {
    const guidesEl = document.getElementById("homeStatGuides");
    const incidentsEl = document.getElementById("homeStatIncidents");
    const aucEl = document.getElementById("homeStatAuc");

    try {
      const res = await window.api.getDatasetStatus();
      if (res && res.database_storage && res.database_storage.live_tables) {
        const tables = res.database_storage.live_tables;
        const datasetsMap = res.datasets || res.certified_datasets || {};
        this._liveStats = this._liveStats || {};
        if (tables.repair_guides != null) {
          this._liveStats.guides = Number(tables.repair_guides).toLocaleString();
          if (guidesEl) guidesEl.textContent = this._liveStats.guides;
        }
        if (tables.repair_incidents != null) {
          const oraCertTotal = datasetsMap.open_repair_alliance?.total_records;
          this._liveStats.incidents = oraCertTotal ? Number(oraCertTotal).toLocaleString() : Number(tables.repair_incidents).toLocaleString();
          if (incidentsEl) incidentsEl.textContent = this._liveStats.incidents;
        }
        const directAuc = res.backblaze_metrics?.roc_auc;
        const roc = datasetsMap.backblaze_telemetry?.verification_notes?.match(/ROC-AUC:\s*([0-9.]+)/i);
        this._liveStats.auc = directAuc ? Number(directAuc).toFixed(3) : (roc ? Number(roc[1]).toFixed(3) : "—");
        if (aucEl) aucEl.textContent = this._liveStats.auc;
        return;
      }
    } catch (e) {
      if (retryCount < 1) {
        await new Promise(r => setTimeout(r, 700));
        return this.fetchAndApplyLiveDatasetStats(retryCount + 1);
      }
      console.warn("Primary dataset status API unavailable, checking Supabase client:", e.message);
    }

    // Live Supabase table count fallback (never hardcoded)
    try {
      if (window.SupabaseBridge && window.SupabaseBridge.isReady()) {
        const sb = window.SupabaseBridge.getClient();
        const [gRes, oraRes, bbRes] = await Promise.all([
          sb.from("repair_guides").select("*", { count: "exact", head: true }),
          sb.from("certified_datasets").select("total_records").eq("dataset_key", "open_repair_alliance").maybeSingle(),
          sb.from("backblaze_models").select("metrics").eq("model_id", "backblaze_rf_v1").maybeSingle()
        ]);
        this._liveStats = this._liveStats || {};
        if (gRes.count != null) {
          this._liveStats.guides = Number(gRes.count).toLocaleString();
          if (guidesEl) guidesEl.textContent = this._liveStats.guides;
        }
        if (oraRes.data?.total_records) {
          this._liveStats.incidents = Number(oraRes.data.total_records).toLocaleString();
          if (incidentsEl) incidentsEl.textContent = this._liveStats.incidents;
        }
        if (bbRes.data?.metrics?.roc_auc) {
          this._liveStats.auc = Number(bbRes.data.metrics.roc_auc).toFixed(3);
          if (aucEl) aucEl.textContent = this._liveStats.auc;
        }
      }
    } catch (sbErr) {}
  }

  filterGuidesByCategory(cat) {
    if (!this._requireAuth("guides")) return;
    this.navigate("guides");
    setTimeout(() => {
      const catSelect = document.getElementById("guideCatFilter");
      if (catSelect) {
        catSelect.value = cat;
        catSelect.dispatchEvent(new Event("change"));
      }
    }, 120);
  }

  startDiagnosisWithCat(cat) {
    this.wizardData.device_category = cat;
    if (!this._requireAuth("diagnose")) return;
    this.navigate("diagnose");
  }

  // ==========================================
  // VIEW: DIAGNOSE WIZARD
  // ==========================================
  renderDiagnose(container) {
    const isAr = window.i18n.currentLang === "ar";
    if (!this._requireAuth("diagnose")) {
      this.navigate("home");
      return;
    }
    container.innerHTML = `
      <section style="padding: 40px 0 70px;">
        <div class="container" style="max-width: 820px;">
          
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="font-size: 32px; margin-bottom: 10px;" data-i18n="diag_page_title">Smart Device Diagnosis Wizard</h1>
            <p style="color: var(--color-text-muted); font-size: 15px;">
              ${isAr ? 'يرجى تقديم تفاصيل العطل بدقة ليقوم محرك ByteForce بتحديد الأسباب الجذرية وخطوات الإصلاح العملية.' : 'Provide precise hardware or software fault details for ByteForce diagnostic analysis.'}
            </p>
          </div>

          <div class="card" style="padding: 36px;">

            <!-- Zero-Token Wired USB / Serial Cable Hardware Diagnostics Panel -->
            <div style="margin-bottom: 26px; padding: 18px 20px; border-radius: 12px; background: linear-gradient(135deg, #EFF6FF 0%, #F8FAFC 100%); border: 1px solid #BFDBFE;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px; margin-bottom: 10px;">
                <div>
                  <h4 style="margin: 0 0 4px 0; font-size: 15.5px; color: var(--color-primary); display: flex; align-items: center; gap: 8px;">
                    <i class="fab fa-usb" style="color: var(--color-secondary); font-size: 17px;"></i>
                    <span>${isAr ? 'فحص الجهاز عبر وصلة كابل USB / Serial (فوري بدون استهلاك رصيد)' : 'Direct Wired USB / Serial Diagnostics (Zero Token Usage)'}</span>
                  </h4>
                  <p style="margin: 0; font-size: 12.5px; color: var(--color-text-muted); line-height: 1.55;">
                    ${isAr
                      ? 'قم بتوصيل الجهاز المعطل بجهازك عبر كابل USB (يدعم هواتف Android/iPhone في أوضاع الطوارئ EDL/DFU/Recovery/Fastboot/ADB وأقراص التخزين ومنافذ UART) لقراءة بيانات الهاردوير وتحديد العطل فوراً.'
                      : 'Plug the broken device via USB/Serial cable to inspect hardware descriptors (VID/PID, EDL/DFU/Recovery/Fastboot/ADB, Storage, UART logs) and diagnose instantly with zero token usage.'}
                  </p>
                </div>
              </div>
              <div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center;">
                <button type="button" id="scanUsbCableBtn" class="btn btn-primary btn-sm" onclick="app.scanUsbCableDevice()">
                  <i class="fab fa-usb"></i>
                  <span>${isAr ? 'ربط وفحص عبر كابل USB' : 'Connect & Scan USB Cable'}</span>
                </button>
                <button type="button" id="scanSerialPortBtn" class="btn btn-outline btn-sm" onclick="app.scanSerialCablePort()">
                  <i class="fas fa-terminal"></i>
                  <span>${isAr ? 'قراءة منفذ السيريال (UART)' : 'Read Serial / UART Port'}</span>
                </button>
              </div>
              <p style="margin: 10px 0 0 0; font-size: 12px; color: var(--color-text-muted); line-height: 1.6;">
                ${isAr ? 'لو جهازك مش ظاهر في القايمة: افصل الجهاز ووصّله تاني قبل ما تدوس على الزرار، واستخدم كابل بينقل بيانات مش شحن بس، ولو موبايل أندرويد اختار "نقل الملفات" من إشعار الـ USB.' : 'If your device is missing from the list: unplug it and plug it back in before clicking the button, use a data cable (not charge-only), and on Android choose "File transfer" from the USB notification.'}
              </p>
              <div id="usbCableStatusBox" style="display: ${this.wizardData?.usb_telemetry || this.wizardData?.serial_logs ? 'block' : 'none'}; margin-top: 12px; padding: 12px 14px; border-radius: 8px; background: #FFFFFF; border: 1px solid #CBD5E1; font-size: 13px;">
                ${this._renderUsbStatusMarkup(isAr)}
              </div>
            </div>

            <!-- Step 1: Device Category -->
            <div class="form-group" style="margin-bottom: 28px;">
              <label class="form-label" style="font-size: 15px; font-weight: 700; color: var(--color-text-main); margin-bottom: 12px; display: block;" data-i18n="diag_step1">1. فئة ونوع الجهاز</label>
              <div class="wizard-cat-grid">
                ${[
                  { cat: "Smartphone", icon: "fa-mobile-screen-button", key: "cat_smartphone", sub: isAr ? "آيفون / أندرويد" : "iPhone / Android" },
                  { cat: "Laptop", icon: "fa-laptop", key: "cat_laptop", sub: isAr ? "ماك بوك / ويندوز" : "MacBook / Windows" },
                  { cat: "Desktop Computer", icon: "fa-desktop", key: "cat_computer", sub: isAr ? "بي سي / تجميعات" : "PC / Mac / Workstation" },
                  { cat: "Gaming Console", icon: "fa-gamepad", key: "cat_console", sub: isAr ? "بلايستيشن / إكس بوكس" : "PlayStation / Xbox / Switch" },
                  { cat: "Smart TV", icon: "fa-tv", key: "cat_tv", sub: isAr ? "شاشات وتلفزيونات" : "Smart TV / Monitors" },
                  { cat: "Storage", icon: "fa-hard-drive", key: "cat_storage", sub: isAr ? "هارد ديسك / SSD" : "SSD / HDD / NVMe" },
                  { cat: "Tablet", icon: "fa-tablet-screen-button", key: "cat_tablet", sub: isAr ? "آيباد / تابلت" : "iPad / Android Tablet" },
                  { cat: "Smartwatch", icon: "fa-clock", key: "cat_smartwatch", sub: isAr ? "ساعات ذكية" : "Apple Watch / Smartwatch" },
                  { cat: "Audio", icon: "fa-headphones", key: "cat_audio", sub: isAr ? "سماعات وأنظمة صوت" : "Headphones / Audio" },
                  { cat: "Camera", icon: "fa-camera", key: "cat_camera", sub: isAr ? "كاميرات ودرون" : "Cameras / Drones" },
                  { cat: "Printer", icon: "fa-print", key: "cat_printer", sub: isAr ? "طابعات وسكانر" : "Printers / Scanners" },
                  { cat: "Home Appliance", icon: "fa-plug", key: "cat_appliance", sub: isAr ? "أجهزة منزلية ذكية" : "Smart Home Appliances" },
                  { cat: "Other", icon: "fa-microchip", key: "cat_other", sub: isAr ? "معدات وإلكترونيات أخرى" : "Other Electronics" }
                ].map(item => `
                  <div class="wizard-cat-item ${this.wizardData.device_category === item.cat ? 'selected' : ''}" onclick="app.setWizardCat('${item.cat}', this)">
                    <div class="wizard-cat-icon">
                      <i class="fas ${item.icon}"></i>
                    </div>
                    <strong class="wizard-cat-title" data-i18n="${item.key}">${window.i18n.t(item.key)}</strong>
                    <span class="wizard-cat-sub">${item.sub}</span>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Step 2: Brand & Model -->
            <div class="form-row-2">
              <div class="form-group">
                <label class="form-label" data-i18n="diag_brand_label">Device Brand</label>
                <input type="text" id="diagBrand" class="form-control" data-i18n-placeholder="diag_brand_placeholder" placeholder="e.g., Dell, Apple, HP, Samsung" value="${this.wizardData.brand}">
              </div>
              <div class="form-group">
                <label class="form-label" data-i18n="diag_model_label">Model Name / Number (if known)</label>
                <input type="text" id="diagModel" class="form-control" data-i18n-placeholder="diag_model_placeholder" placeholder="e.g., XPS 15, iPhone 13" value="${this.wizardData.model}">
              </div>
            </div>

            <!-- Step 3: Problem Category (Real Fault Subsystems) -->
            <div class="form-group">
              <label class="form-label" data-i18n="diag_step3">3. Problem Category</label>
              <select id="diagProbCat" class="form-control">
                <option value="Hardware" ${this.wizardData.problem_category === 'Hardware' ? 'selected' : ''}>${window.i18n.t('diag_prob_hardware')}</option>
                <option value="Battery">${isAr ? 'البطارية وضعف الشحن' : 'Battery & Charging'}</option>
                <option value="Screen">${isAr ? 'الشاشة وكسر العرض / اللمس' : 'Screen & Display / Touch'}</option>
                <option value="Power">${isAr ? 'انقطاع الطاقة / الجهاز لا يفتح' : 'Power & Boot Failure'}</option>
                <option value="Overheating">${isAr ? 'سخونة زائدة وصوت المروحة' : 'Overheating & Cooling Fan'}</option>
                <option value="Charging Port">${isAr ? 'منفذ الشحن أو HDMI / الكابلات' : 'Charging Port / HDMI / Cables'}</option>
                <option value="Speaker">${isAr ? 'السماعة أو الميكروفون' : 'Speaker & Audio'}</option>
                <option value="Camera">${isAr ? 'الكاميرا أو العدسة' : 'Camera & Optics'}</option>
                <option value="Keyboard">${isAr ? 'لوحة المفاتيح أو الأزرار' : 'Keyboard & Mechanical Buttons'}</option>
                <option value="Storage">${isAr ? 'وسيط التخزين HDD / SSD' : 'Hard Drive / SSD Storage'}</option>
                <option value="Paper Feed">${isAr ? 'بكرات وسحب الورق (للطابعات)' : 'Printer Paper Feed / Ink'}</option>
                <option value="Software" ${this.wizardData.problem_category === 'Software' ? 'selected' : ''}>${window.i18n.t('diag_prob_software')}</option>
                <option value="Network" ${this.wizardData.problem_category === 'Network' ? 'selected' : ''}>${window.i18n.t('diag_prob_network')}</option>
                <option value="Unknown" ${this.wizardData.problem_category === 'Unknown' ? 'selected' : ''}>${window.i18n.t('diag_prob_unknown')}</option>
              </select>
            </div>

            <!-- Live Device Visual Match Preview (resolved automatically from iFixit/Wikimedia) -->
            <div id="diagDevicePreview" style="display: none; margin-bottom: 18px; padding: 12px 14px; background: var(--color-card); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 10px; align-items: center; gap: 14px;">
              <img id="diagPreviewImg" src="" alt="Device Preview" style="width: 64px; height: 64px; border-radius: 10px; object-fit: cover; border: 1px solid var(--color-border);" />
              <div>
                <div style="font-size: 12px; color: var(--color-accent); font-weight: 700;" id="diagPreviewSource"></div>
                <div style="font-size: 14px; color: var(--color-text-main); font-weight: 600;" id="diagPreviewTitle"></div>
              </div>
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
            <div style="margin-bottom: 24px; padding: 16px; background-color: var(--color-card); border-radius: var(--radius-md); border: 1px solid var(--color-border);">
              <h5 style="margin-bottom: 12px; font-size: 14px; color: var(--color-text-main);" data-i18n="diag_step5">5. Additional Details (Optional)</h5>
              <div class="form-row-2">
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

            <!-- Conditional Storage SMART Telemetry Panel (Backblaze ML Model - Storage ONLY) -->
            <div id="storageSmartSection" style="display: ${this.wizardData.device_category === 'Storage' ? 'block' : 'none'}; margin-bottom: 24px; padding: 16px; background-color: rgba(16, 185, 129, 0.06); border-radius: var(--radius-md); border: 1px solid rgba(16, 185, 129, 0.25);">
              <h5 style="margin-bottom: 6px; font-size: 14px; color: var(--color-success); display: flex; align-items: center; gap: 8px;">
                <i class="fas fa-hdd"></i>
                <span>${isAr ? 'قياسات S.M.A.R.T للأقراص (لتشغيل نموذج Backblaze التنبؤي - اختياري)' : 'Storage S.M.A.R.T Telemetry (Backblaze ML Prediction - Optional)'}</span>
              </h5>
              <p style="font-size: 12px; color: #94A3B8; margin-bottom: 12px;">
                ${isAr ? 'أدخل قراءات SMART لوسيط التخزين (HDD/SSD) لحساب احتمالية التلف بدقة من نموذج Random Forest.' : 'Supply SMART raw attributes from CrystalDiskInfo / smartctl for drive failure risk scoring.'}
              </p>
              <div class="form-row-2">
                <div>
                  <label style="font-size: 12px; color: var(--color-text-body);">SMART 5 (Reallocated Sectors)</label>
                  <input type="number" id="smart5Raw" class="form-control" min="0" placeholder="0" value="${this.wizardData.smart_telemetry?.smart_5_raw ?? ''}">
                </div>
                <div>
                  <label style="font-size: 12px; color: var(--color-text-body);">SMART 187 (Uncorrectable Errors)</label>
                  <input type="number" id="smart187Raw" class="form-control" min="0" placeholder="0" value="${this.wizardData.smart_telemetry?.smart_187_raw ?? ''}">
                </div>
                <div>
                  <label style="font-size: 12px; color: var(--color-text-body);">SMART 188 (Command Timeout)</label>
                  <input type="number" id="smart188Raw" class="form-control" min="0" placeholder="0" value="${this.wizardData.smart_telemetry?.smart_188_raw ?? ''}">
                </div>
                <div>
                  <label style="font-size: 12px; color: var(--color-text-body);">SMART 197 (Current Pending Sectors)</label>
                  <input type="number" id="smart197Raw" class="form-control" min="0" placeholder="0" value="${this.wizardData.smart_telemetry?.smart_197_raw ?? ''}">
                </div>
                <div>
                  <label style="font-size: 12px; color: var(--color-text-body);">SMART 198 (Offline Uncorrectable)</label>
                  <input type="number" id="smart198Raw" class="form-control" min="0" placeholder="0" value="${this.wizardData.smart_telemetry?.smart_198_raw ?? ''}">
                </div>
                <div>
                  <label style="font-size: 12px; color: var(--color-text-body);">${isAr ? 'سعة القرص (تيرابايت TB)' : 'Drive Capacity (TB)'}</label>
                  <input type="number" id="smartCapacityTb" class="form-control" step="0.1" min="0.1" placeholder="e.g. 2.0" value="${this.wizardData.smart_telemetry?.capacity_tb ?? ''}">
                </div>
              </div>
            </div>

            <!-- Submit Button -->
            <button id="submitDiagnosisBtn" class="btn btn-primary btn-lg" style="width: 100%;">
              <i class="fas fa-wrench"></i>
              <span data-i18n="diag_submit_btn">Run Device Diagnosis</span>
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

      if (this.wizardData.device_category === "Storage") {
        const smartFields = {
          smart_5_raw: container.querySelector("#smart5Raw")?.value,
          smart_187_raw: container.querySelector("#smart187Raw")?.value,
          smart_188_raw: container.querySelector("#smart188Raw")?.value,
          smart_197_raw: container.querySelector("#smart197Raw")?.value,
          smart_198_raw: container.querySelector("#smart198Raw")?.value,
          capacity_tb: container.querySelector("#smartCapacityTb")?.value
        };
        const cleanSmart = {};
        Object.entries(smartFields).forEach(([k, v]) => {
          if (v !== "" && v !== undefined && v !== null && !isNaN(Number(v))) {
            cleanSmart[k] = Number(v);
          }
        });
        this.wizardData.smart_telemetry = Object.keys(cleanSmart).length > 0 ? cleanSmart : null;
      } else {
        this.wizardData.smart_telemetry = null;
      }

      if (!this.wizardData.description) {
        alert(isAr ? "يرجى كتابة وصف للمشكلة للبدء في التشخيص" : "Please provide a problem description to proceed.");
        return;
      }

      this.submitDiagnosis();
    });

    const refreshPreview = async () => {
      const b = container.querySelector("#diagBrand")?.value.trim() || "";
      const m = container.querySelector("#diagModel")?.value.trim() || "";
      const q = `${b} ${m}`.trim();
      const box = container.querySelector("#diagDevicePreview");
      if (!box || q.length < 3) return;
      const res = await window.api.getDeviceImage(q, this.wizardData.device_category || "");
      if (res && res.image_url) {
        const imgEl = container.querySelector("#diagPreviewImg");
        const titEl = container.querySelector("#diagPreviewTitle");
        const srcEl = container.querySelector("#diagPreviewSource");
        if (imgEl) imgEl.src = res.image_url;
        if (titEl) titEl.textContent = res.title || q;
        if (srcEl) srcEl.textContent = isAr ? `صورة الجهاز المطابقة (${res.source || 'iFixit'})` : `Verified Device Image (${res.source || 'iFixit'})`;
        box.style.display = "flex";
      }
    };
    container.querySelector("#diagModel")?.addEventListener("change", refreshPreview);
    container.querySelector("#diagBrand")?.addEventListener("change", refreshPreview);
  }

  setWizardCat(cat, el) {
    this.wizardData.device_category = cat;
    document.querySelectorAll(".wizard-cat-item").forEach(c => c.classList.remove("selected"));
    if (el) el.classList.add("selected");
    const smartBox = document.getElementById("storageSmartSection");
    if (smartBox) {
      smartBox.style.display = cat === "Storage" ? "block" : "none";
    }
  }

  _renderUsbStatusMarkup(isAr = window.i18n.currentLang === "ar") {
    const u = this.wizardData?.usb_telemetry;
    const logs = this.wizardData?.serial_logs;
    if (!u && !logs) return "";
    const parts = [];
    if (u) {
      const vidHex = u.vendorId != null ? `0x${Number(u.vendorId).toString(16).toUpperCase().padStart(4, "0")}` : "";
      const pidHex = u.productId != null ? `0x${Number(u.productId).toString(16).toUpperCase().padStart(4, "0")}` : "";
      parts.push(`<div><strong style="color: var(--color-success);"><i class="fas fa-check-circle"></i> ${isAr ? 'تم التقاط بيانات الكابل بنجاح:' : 'USB Device Captured:'}</strong> ${this._esc(u.manufacturerName || '')} ${this._esc(u.productName || (isAr ? 'جهاز USB' : 'USB Device'))} <span dir="ltr" style="color: var(--color-text-muted);">(${vidHex}:${pidHex})</span></div>`);
      if (u.openError) {
        parts.push(`<div style="font-size: 12px; color: var(--color-text-muted); margin-top: 4px;">${isAr ? 'تمت قراءة بصمة الهاردوير مباشرة رغم قفل تعريف الويندوز (مؤكد أن خطوط الداتا تعمل).' : 'Hardware descriptors read directly.'}</div>`);
      }
    }
    if (logs) {
      parts.push(`<div style="margin-top: 6px; font-size: 12px;"><strong>${isAr ? 'سجلات السيريال الملتقطة:' : 'Captured Serial Logs:'}</strong> <code dir="ltr">${this._esc(logs.slice(0, 140))}${logs.length > 140 ? '...' : ''}</code></div>`);
    }
    parts.push(`
      <div style="margin-top: 10px; display: flex; gap: 8px; flex-wrap: wrap;">
        <button type="button" class="btn btn-primary btn-sm" style="background: var(--color-success); border-color: var(--color-success);" onclick="app.runWiredZeroTokenDiagnosis()">
          <i class="fas fa-bolt"></i>
          <span>${isAr ? 'تحديد العطل فوراً من الوصلة (بدون استهلاك رصيد)' : 'Detect Cable Fault Instantly (0 Token)'}</span>
        </button>
        <button type="button" class="btn btn-outline btn-sm" onclick="app.clearCableTelemetry()">
          <i class="fas fa-times"></i> <span>${isAr ? 'مسح' : 'Clear'}</span>
        </button>
      </div>
    `);
    return parts.join("");
  }

  clearCableTelemetry() {
    this.wizardData.usb_telemetry = null;
    this.wizardData.serial_logs = null;
    const box = document.getElementById("usbCableStatusBox");
    if (box) {
      box.innerHTML = "";
      box.style.display = "none";
    }
  }

  async scanUsbCableDevice() {
    if (!this._requireAuth("diagnose")) return;
    const isAr = window.i18n.currentLang === "ar";
    if (!navigator.usb || typeof navigator.usb.requestDevice !== "function") {
      alert(isAr
        ? "ميزة فحص كابل WebUSB تتطلب متصفح Chrome أو Edge حديث على كمبيوتر أو هاتف Android عبر رابط HTTPS."
        : "WebUSB inspection requires modern Chrome or Edge over HTTPS.");
      return;
    }
    try {
      const dev = await navigator.usb.requestDevice({ filters: [] });
      if (!dev) return;
      const interfaces = [];
      (dev.configurations || []).forEach(cfg => {
        (cfg.interfaces || []).forEach(iface => {
          (iface.alternates || []).forEach(alt => {
            interfaces.push({
              interfaceClass: alt.interfaceClass,
              interfaceSubclass: alt.interfaceSubclass,
              interfaceProtocol: alt.interfaceProtocol
            });
          });
        });
      });
      let openError = "";
      try {
        await dev.open();
        if (dev.configuration === null && dev.configurations?.length) {
          await dev.selectConfiguration(dev.configurations[0].configurationValue);
        }
        await dev.close();
      } catch (e) {
        openError = e?.message || String(e || "");
      }

      const telemetry = {
        vendorId: dev.vendorId,
        productId: dev.productId,
        manufacturerName: dev.manufacturerName || "",
        productName: dev.productName || "",
        serialNumber: dev.serialNumber || "",
        deviceClass: dev.deviceClass,
        deviceSubclass: dev.deviceSubclass,
        deviceProtocol: dev.deviceProtocol,
        usbVersionMajor: dev.usbVersionMajor,
        interfaces,
        openError
      };
      this.wizardData.usb_telemetry = telemetry;

      // Auto-detect the device category from the USB scan so a connected
      // phone is never diagnosed as the wizard default (Laptop): the cable
      // evidence wins over the pre-selected category, and the user can still
      // change it manually afterwards.
      const phoneVids = [0x05AC, 0x04E8, 0x18D1, 0x2717, 0x12D1, 0x22D9, 0x2A70, 0x22B8, 0x0FCE, 0x1004, 0x0421];
      const hasIface = (cls, sub, proto) => interfaces.some(i => i.interfaceClass === cls && (sub === undefined || i.interfaceSubclass === sub) && (proto === undefined || i.interfaceProtocol === proto));
      let detectedCat = "";
      if (phoneVids.includes(dev.vendorId) || hasIface(255, 66, 1) || hasIface(255, 66, 3) || interfaces.some(i => i.interfaceClass === 6)) detectedCat = "Smartphone";
      else if (interfaces.some(i => i.interfaceClass === 8)) detectedCat = "Storage";
      else if (interfaces.some(i => i.interfaceClass === 7)) detectedCat = "Printer";
      else if (interfaces.some(i => i.interfaceClass === 14)) detectedCat = "Camera";
      else if (interfaces.some(i => i.interfaceClass === 1)) detectedCat = "Audio";
      if (detectedCat) {
        const catEl = document.querySelector(`.wizard-cat-item[onclick*="'${detectedCat}'"]`);
        this.setWizardCat(detectedCat, catEl || undefined);
      }

      const brandEl = document.getElementById("diagBrand");
      const modelEl = document.getElementById("diagModel");
      const errEl = document.getElementById("diagError");
      const descEl = document.getElementById("diagDesc");
      const vidHex = `0x${Number(dev.vendorId).toString(16).toUpperCase().padStart(4, "0")}`;
      const pidHex = `0x${Number(dev.productId).toString(16).toUpperCase().padStart(4, "0")}`;

      if (brandEl && !brandEl.value && telemetry.manufacturerName) brandEl.value = telemetry.manufacturerName;
      if (modelEl && !modelEl.value && telemetry.productName) modelEl.value = telemetry.productName;
      if (errEl && !errEl.value) errEl.value = `USB ${vidHex}:${pidHex}`;
      if (descEl && !descEl.value) {
        descEl.value = isAr
          ? `فحص جهاز موصل عبر كابل USB (${telemetry.manufacturerName || ''} ${telemetry.productName || vidHex + ':' + pidHex})`
          : `Wired USB device inspection (${telemetry.manufacturerName || ''} ${telemetry.productName || vidHex + ':' + pidHex})`;
      }

      const box = document.getElementById("usbCableStatusBox");
      if (box) {
        box.innerHTML = this._renderUsbStatusMarkup(isAr);
        box.style.display = "block";
      }
    } catch (err) {
      if (err?.name === "NotFoundError") return; // User closed picker cleanly
      alert(isAr
        ? "تعذر قراءة الجهاز عبر كابل USB. جرّب: افصل الجهاز ووصّله تاني، واستخدم كابل بينقل بيانات مش شحن بس ومنفذ USB تاني، ولو موبايل أندرويد اختار \"نقل الملفات\" من إشعار الـ USB. ولو لسه مش شغال، اكتب الماركة والموديل يدوي وكمل التشخيص."
        : "Could not read the device over the USB cable. Try unplugging it and plugging it back in, using a data cable (not charge-only) and another USB port, and on Android choose \"File transfer\" from the USB notification. If it still does not work, enter the brand and model manually and continue the diagnosis.");
    }
  }

  async scanSerialCablePort() {
    if (!this._requireAuth("diagnose")) return;
    const isAr = window.i18n.currentLang === "ar";
    if (!("serial" in navigator) || typeof navigator.serial.requestPort !== "function") {
      alert(isAr
        ? "قراءة منفذ السيريال (Web Serial) متاحة في Chrome و Edge على سطح المكتب فقط."
        : "Web Serial UART reader is supported in desktop Chrome and Edge browsers.");
      return;
    }
    let port = null;
    let opened = false;
    try {
      port = await navigator.serial.requestPort();
      const info = typeof port.getInfo === "function" ? port.getInfo() : {};
      if (info.usbVendorId && !this.wizardData.usb_telemetry) {
        this.wizardData.usb_telemetry = {
          vendorId: info.usbVendorId,
          productId: info.usbProductId || 0,
          productName: "UART / Serial Cable Bridge",
          interfaces: []
        };
      }
      await port.open({ baudRate: 115200 });
      opened = true;
      const reader = port.readable?.getReader();
      let captured = "";
      if (reader) {
        const decoder = new TextDecoder();
        const deadline = Date.now() + 2200;
        try {
          while (Date.now() < deadline && captured.length < 1500) {
            const timeoutPromise = new Promise(res => setTimeout(() => res({ timeout: true }), 700));
            const res = await Promise.race([reader.read(), timeoutPromise]);
            if (res.timeout || res.done) break;
            if (res.value) captured += decoder.decode(res.value, { stream: true });
          }
        } finally {
          try { reader.releaseLock(); } catch (e) {}
        }
      }
      try { await port.close(); } catch (e) {}
      this.wizardData.serial_logs = captured.trim() || "Serial port opened (no active console panic output within 2.2s)";
      const descEl = document.getElementById("diagDesc");
      if (descEl && !descEl.value) {
        descEl.value = isAr ? "فحص الجهاز عبر منفذ السيريال UART بالكابل" : "Wired UART Serial console diagnostic inspection";
      }
      const box = document.getElementById("usbCableStatusBox");
      if (box) {
        box.innerHTML = this._renderUsbStatusMarkup(isAr);
        box.style.display = "block";
      }
    } catch (err) {
      try { if (port) await port.close(); } catch (e) {}
      if (err?.name === "NotFoundError") return;
      if (!opened) {
        alert(isAr
          ? "تعذر فتح منفذ السيريال. غالباً المنفذ مشغول في برنامج آخر (مثل Arduino أو PuTTY)، أو الجهاز مفصول، أو الجهاز لا يوفّر منفذ سيريال (الموبايلات العادية لا توفّر منفذ سيريال). جرّب: اقفل أي برنامج آخر يستخدم المنفذ، افصل الجهاز ووصّله تاني، أو استخدم زر فحص كابل USB بدل السيريال."
          : "Could not open the serial port. It is probably busy in another program (e.g. Arduino or PuTTY), the device is unplugged, or the device does not offer a serial port (regular phones do not). Try closing other programs using the port, replugging the device, or use the USB cable scan button instead.");
        return;
      }
      alert((isAr ? "انقطع الاتصال بمنفذ السيريال أثناء القراءة: " : "Serial connection dropped while reading: ") + (err?.message || err));
    }
  }

  runWiredZeroTokenDiagnosis() {
    this.wizardData.brand = document.getElementById("diagBrand")?.value.trim() || "";
    this.wizardData.model = document.getElementById("diagModel")?.value.trim() || "";
    this.wizardData.problem_category = document.getElementById("diagProbCat")?.value || "Hardware";
    this.wizardData.description = document.getElementById("diagDesc")?.value.trim() || "فحص عبر الوصلة المباشرة";
    this.wizardData.error_message = document.getElementById("diagError")?.value.trim() || "";
    this.submitDiagnosis({ skipAi: true });
  }

  async submitDiagnosis(options = {}) {
    if (!this._requireAuth("diagnose")) return;
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
            ${isAr ? 'نقوم بفحص معايير الأمان وتحليل الأعراض ومقارنتها بقواعد بيانات الصيانة الموثقة.' : 'Evaluating safety hazards, extracting symptom vectors, and ranking root causes.'}
          </p>
        </div>
      </section>
    `;

    try {
      this._diagAttemptNumber = 1;
      this._diagExcludedGuideIds = [];
      this._diagFailedSolutions = [];
      const hasCableData = !!(this.wizardData.usb_telemetry || this.wizardData.serial_logs);
      const response = await window.api.runDiagnosis({
        device_category: this.wizardData.device_category,
        brand: this.wizardData.brand || null,
        model: this.wizardData.model || null,
        problem_category: this.wizardData.problem_category || null,
        description: this.wizardData.description,
        device_age_years: this.wizardData.device_age_years,
        error_message: this.wizardData.error_message || null,
        recent_changes: this.wizardData.recent_changes || null,
        smart_telemetry: this.wizardData.smart_telemetry || null,
        usb_telemetry: this.wizardData.usb_telemetry || null,
        serial_logs: this.wizardData.serial_logs || null,
        skip_ai: Boolean(options.skipAi || hasCableData),
        attempt_number: 1
      });

      this.currentReport = response;
      this._diagFeedbackSaved = false;
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
    const severity = report.severity || "moderate";
    const isCritical = severity === "critical";
    const isInsufficient = report.status === "insufficient_evidence";
    const safetyList = (isAr ? report.safety_warnings_ar : report.safety_warnings_en) || [];
    const symptomsList = Array.isArray(report.extracted_symptoms) ? report.extracted_symptoms : [];
    const causesList = Array.isArray(report.possible_causes) ? report.possible_causes : [];
    const estDiff = report.estimated_difficulty || (isInsufficient ? (isAr ? "غير محدد" : "N/A") : "moderate");
    const estMins = report.estimated_minutes || null;

    container.innerHTML = `
      <section style="padding: 40px 0 80px;">
        <div class="container" style="max-width: 900px;">
          
          <!-- Top Bar Action with Verified Device Photo -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 16px;">
            <div class="report-device-hero">
              ${(report.device_image_url || report.guide_image_url) ? `
                <img src="${this._esc(report.device_image_url || report.guide_image_url)}" alt="${this._esc(report.model || report.device_category)}" class="report-device-thumb" onerror="this.style.display='none'" />
              ` : ''}
              <div>
                <span class="tag" style="background-color: rgba(56, 189, 248, 0.15); color: var(--color-accent); border: 1px solid rgba(56, 189, 248, 0.3); margin-bottom: 6px;">Report #${this._esc(report.report_id || 'TEMP')}</span>
                <h1 style="font-size: 28px;" data-i18n="results_title">Diagnostic Report</h1>
                <p style="color: var(--color-text-muted); font-size: 14px;">
                  ${this._esc(report.brand || '')} ${this._esc(report.model || '')} (${this._esc(report.device_category || '')})
                </p>
              </div>
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

          ${(report.attempt_number && report.attempt_number > 1) ? `
            <div style="margin-bottom: 18px; padding: 12px 18px; border-radius: 10px; background: rgba(37, 99, 235, 0.08); border: 1px solid rgba(37, 99, 235, 0.25); display: flex; align-items: center; gap: 10px; font-size: 13.5px; color: var(--color-secondary); font-weight: 600;">
              <i class="fas fa-sync-alt"></i>
              <span>${isAr ? `الحل البديل المقترح — المحاولة رقم ${report.attempt_number} (بعد استبعاد الخيارات السابقة التي لم تحل المشكلة)` : `Alternative Diagnostic Path — Attempt #${report.attempt_number} (excluding prior unconfirmed solutions)`}</span>
            </div>
          ` : ''}

          ${report.cable_diagnostics ? `
            <div class="card" style="margin-bottom: 20px; background: #EFF6FF; border: 1px solid #BFDBFE;">
              <div style="display: flex; align-items: center; gap: 8px; color: var(--color-secondary); font-weight: 700; margin-bottom: 6px; font-size: 14px;">
                <i class="fab fa-usb"></i>
                <span>${isAr ? 'نتيجة الفحص المباشر عبر الوصلة (USB / Cable):' : 'Wired Cable Hardware Readout:'}</span>
                ${report.cable_diagnostics.vid_hex ? `<span class="tag" dir="ltr" style="font-size: 11px;">${this._esc(report.cable_diagnostics.vid_hex)}:${this._esc(report.cable_diagnostics.pid_hex || '')}</span>` : ''}
              </div>
              <p style="margin: 0; font-size: 13.5px; color: var(--color-text-main); line-height: 1.6;">
                ${this._esc(isAr ? report.cable_diagnostics.summary_ar : report.cable_diagnostics.summary_en)}
              </p>
            </div>
          ` : ''}

          ${report.ai_analysis && report.ai_analysis.status === 'completed' ? `
            <div class="card" style="margin-bottom: 24px; background: var(--ai-card-bg); border: 1px solid rgba(16, 185, 129, 0.3);">
              <p style="color: var(--color-text-main); font-size: 14.5px; line-height: 1.75; margin: 0 0 12px 0; font-weight: 500;">
                ${this._esc(isAr ? (report.ai_analysis.diagnosis_summary_ar || report.ai_analysis.diagnosis_summary_en) : (report.ai_analysis.diagnosis_summary_en || report.ai_analysis.diagnosis_summary_ar))}
              </p>
              ${((isAr ? report.ai_analysis.repair_steps_ar : report.ai_analysis.repair_steps_en) || []).length > 0 ? `
                <div style="padding-top: 10px; border-top: 1px solid var(--color-border);">
                  <strong style="display: block; font-size: 13px; color: var(--color-accent); margin-bottom: 6px;">${isAr ? 'خطة الإصلاح العملية المعتمدة:' : 'Recommended Repair Sequence:'}</strong>
                  <ol style="margin: 0; padding-inline-start: 20px; font-size: 13px; color: var(--color-text-body); line-height: 1.7;">
                    ${((isAr ? report.ai_analysis.repair_steps_ar : report.ai_analysis.repair_steps_en) || []).slice(0, 6).map(st => `<li>${this._esc(st)}</li>`).join('')}
                  </ol>
                </div>
              ` : ''}
            </div>
          ` : ''}

          ${isInsufficient ? `
            <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.35); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
              <h3 style="color: var(--color-warning); font-size: 17px; margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
                <i class="fas fa-info-circle"></i>
                <span>${isAr ? 'تنبيه: أدلة تجريبية غير كافية لهذا الجهاز' : 'Insufficient Empirical Evidence'}</span>
              </h3>
              <p style="color: var(--color-text-main); font-size: 14px; line-height: 1.6; margin: 0;">
                ${report.message || (isAr ? 'لم يتم العثور على سجلات موثقة مطابقة تماماً لهذه الفئة أو الأعراض؛ لذلك ترفض المنصة تخمين أو اختلاق خطوات غير موثقة.' : 'No verified matching manual or empirical record exists for this exact device/symptom combination.')}
              </p>
            </div>
          ` : ''}

          <!-- Safety Hazard Box -->
          ${safetyList.length > 0 ? `
            <div class="hazard-box">
              <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                <i class="fas fa-exclamation-triangle" style="font-size: 20px;"></i>
                <strong data-i18n="results_safety_alert">Safety Warning & Precautions</strong>
              </div>
              <ul style="padding-inline-start: 20px; font-size: 14px;">
                ${safetyList.map(w => `<li>${w}</li>`).join('')}
              </ul>
            </div>
          ` : ''}

          <!-- Overview KPI Card -->
          <div class="card" style="margin-bottom: 24px;">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 20px;">
              <div>
                <span style="font-size: 13px; color: var(--color-text-muted);" data-i18n="results_severity">Severity Level</span>
                <div style="margin-top: 6px;">
                  <span class="severity-badge severity-${severity}">
                    <i class="fas fa-circle" style="font-size: 8px;"></i>
                    ${severity.toUpperCase()}
                  </span>
                </div>
              </div>

              <div>
                <span style="font-size: 13px; color: var(--color-text-muted);" data-i18n="results_confidence">${isAr ? 'السجلات المرجعية للفئة' : 'Verified Reference Records'}</span>
                <div style="margin-top: 6px; font-size: 18px; font-weight: 700; color: var(--color-primary);">
                  ${report.empirical_statistics?.sample_size ? `${report.empirical_statistics.sample_size.toLocaleString()} ${isAr ? 'حالة موثقة' : 'cases'}` : `${(report.troubleshooting_steps || []).length} ${isAr ? 'خطوات' : 'steps'}`}
                </div>
              </div>

              <div>
                <span style="font-size: 13px; color: var(--color-text-muted);">${isAr ? 'الصعوبة المقدرة' : 'Estimated Difficulty'}</span>
                <div style="margin-top: 6px; font-size: 16px; font-weight: 600; text-transform: capitalize;">
                  ${estDiff}${estMins ? ` (~${estMins} min)` : ''}
                </div>
              </div>

              <div>
                <span style="font-size: 13px; color: var(--color-text-muted);" data-i18n="results_symptoms">Detected Symptoms</span>
                <div style="margin-top: 6px; display: flex; flex-wrap: wrap; gap: 4px;">
                  ${symptomsList.length > 0 ? symptomsList.map(s => `<span class="tag">${s}</span>`).join('') : `<span style="color: var(--color-text-muted); font-size: 13px;">—</span>`}
                </div>
              </div>
            </div>
          </div>

          <!-- Authentic Dataset Sources Badge -->
          ${report.empirical_statistics ? `
            <div class="card" style="margin-bottom: 24px; background: var(--dataset-card-bg); border: 1px solid rgba(56, 189, 248, 0.2);">
              <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 12px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <i class="fas fa-database" style="color: var(--color-accent); font-size: 18px;"></i>
                  <h4 style="margin: 0; font-size: 16px; color: var(--color-text-main);">
                    ${isAr ? 'بيانات معتمدة من المصادر المفتوحة العالمية' : 'Verified Open Dataset Diagnostics'}
                  </h4>
                </div>
                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                  <span class="tag" style="background: rgba(56, 189, 248, 0.15); color: var(--color-accent); font-size: 11px;">
                    <i class="fas fa-check-circle"></i> Open Repair Alliance (416k)
                  </span>
                  <span class="tag" style="background: rgba(168, 85, 247, 0.15); color: var(--color-purple); font-size: 11px;">
                    <i class="fas fa-check-circle"></i> MyFixit (Verified Guides)
                  </span>
                  ${report.hard_drive_ml_prediction && report.hard_drive_ml_prediction.applicable ? `
                    <span class="tag" style="background: rgba(34, 197, 94, 0.15); color: var(--color-success); font-size: 11px;">
                      <i class="fas fa-microchip"></i> Backblaze Q2 2026 ML
                    </span>
                  ` : ''}
                </div>
              </div>

              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; font-size: 13px;">
                <div style="padding: 10px; background: var(--color-surface-alt); border-radius: 6px;">
                  <div style="color: var(--color-text-muted); font-size: 12px; margin-bottom: 4px;">
                    ${isAr ? 'إجمالي السجلات الموثقة لهذه الفئة:' : 'Verified Historical Dataset Sample:'}
                  </div>
                  <div style="font-size: 18px; font-weight: 700; color: var(--color-accent);">
                    ${report.empirical_statistics.sample_size.toLocaleString()} <span style="font-size: 12px; font-weight: normal; color: var(--color-text-muted);">${isAr ? 'سجل حقيقي موثق' : 'verified records'}</span>
                  </div>
                </div>

                ${report.verified_guide && report.verified_guide.url ? `
                  <div style="padding: 10px; background: var(--color-surface-alt); border-radius: 6px;">
                    <div style="color: var(--color-text-muted); font-size: 12px; margin-bottom: 4px;">
                      ${isAr ? 'دليل الصيانة المعتمد:' : 'Verified Service Guide:'}
                    </div>
                    <a href="${report.verified_guide.url}" target="_blank" rel="noopener noreferrer" style="color: var(--color-accent); font-weight: 600; text-decoration: underline; font-size: 13px; display: inline-block;">
                      ${this._esc(isAr ? (report.verified_guide.title_ar || report.verified_guide.title) : report.verified_guide.title)} <i class="fas fa-external-link-alt" style="font-size: 10px;"></i>
                    </a>
                  </div>
                ` : ''}

                ${report.hard_drive_ml_prediction && report.hard_drive_ml_prediction.applicable ? `
                  <div style="padding: 10px; background: var(--color-surface-alt); border-radius: 6px;">
                    <div style="color: var(--color-text-muted); font-size: 12px; margin-bottom: 4px;">
                      ${isAr ? 'تحليل مؤشرات سلامة القرص (Backblaze):' : 'Storage SMART Diagnostics (Backblaze):'}
                    </div>
                    ${report.hard_drive_ml_prediction.status === 'awaiting_telemetry' || report.hard_drive_ml_prediction.failure_probability == null ? `
                      <div style="font-size: 13px; font-weight: 600; color: var(--color-accent);">
                        ${isAr ? 'أدخل قياسات SMART لتشغيل التنبؤ الرقمي' : 'Supply SMART telemetry for failure probability'}
                      </div>
                    ` : `
                      <div style="font-size: 15px; font-weight: 700; color: ${report.hard_drive_ml_prediction.risk_level === 'CRITICAL' ? '#EF4444' : report.hard_drive_ml_prediction.risk_level === 'WARNING' ? '#F59E0B' : '#10B981'};">
                        ${report.hard_drive_ml_prediction.risk_level} (${Math.round((report.hard_drive_ml_prediction.failure_probability || 0) * 100)}% Risk)
                      </div>
                    `}
                  </div>
                ` : ''}
              </div>
            </div>
          ` : ''}

          <!-- Possible Root Causes + Direct Visual Repair Photos Underneath -->
          <div class="card" style="margin-bottom: 24px;">
            <h3 style="font-size: 18px; margin-bottom: 16px;" data-i18n="results_causes_title">Most Probable Root Causes</h3>
            ${causesList.length > 0 ? `
              <div style="display: flex; flex-direction: column; gap: 18px;">
                ${causesList.map((c, idx) => {
                const causeImages = (Array.isArray(c.repair_images) && c.repair_images.length > 0)
                  ? c.repair_images
                  : (idx === 0 && Array.isArray(report.visual_solution_steps) ? report.visual_solution_steps.slice(0, 4).map(v => v.image_url) : []);
                return `
                <div style="padding: 18px; background-color: var(--color-card); border-radius: var(--radius-sm); border: 1px solid var(--color-border);">
                  <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 8px;">
                    <div>
                      <strong style="color: var(--color-text-main); font-size: 15.5px; display: block;">${this._esc(isAr ? c.title_ar : c.title_en)}</strong>
                      ${c.source_dataset ? `<span style="font-size: 11px; color: var(--color-text-muted);"><i class="fas fa-database" style="color: var(--color-accent);"></i> ${this._esc(c.source_dataset)}</span>` : ''}
                    </div>
                  </div>
                  <p style="font-size: 13.5px; color: var(--color-text-muted); margin: 0 0 10px 0; line-height: 1.6;">
                    ${this._esc(isAr ? c.explanation_ar : c.explanation_en)}
                  </p>
                  
                  <!-- Dedicated Instant Repair Method Banner -->
                  ${(c.repair_method_ar || c.repair_method_en) ? `
                    <div style="margin-top: 10px; padding: 12px 14px; background: rgba(56, 189, 248, 0.08); border-left: 3px solid #38BDF8; border-right: ${isAr ? '3px solid #38BDF8' : 'none'}; border-radius: 6px; font-size: 13px; line-height: 1.6;">
                      <div style="display: flex; align-items: center; gap: 6px; color: var(--color-accent); font-weight: 700; margin-bottom: 4px;">
                        <i class="fas fa-tools"></i>
                        <span>${isAr ? 'طريقة التصليح المعتمدة:' : 'Verified Repair Solution:'}</span>
                      </div>
                      <div style="color: var(--color-text-main); font-weight: 500;">
                        ${this._esc((isAr ? (c.repair_method_ar || c.repair_method_en) : (c.repair_method_en || c.repair_method_ar)).replace(/^(طريقة التصليح المعتمدة:\s*|Repair Method:\s*)/i, ''))}
                      </div>
                    </div>
                  ` : ''}

                  <!-- Real Illustrated Fix Photos Directly Under the Cause -->
                  ${causeImages.length > 0 ? `
                    <div style="margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--color-border);">
                      <div style="font-size: 12.5px; font-weight: 700; color: var(--color-accent); margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
                        <i class="fas fa-images"></i>
                        <span data-i18n="results_visual_solution_title">${isAr ? 'صور خطوات الإصلاح التوضيحية لهذا العطل' : 'Illustrated Fix & Disassembly Photos'}</span>
                      </div>
                      <div class="visual-solution-grid">
                        ${causeImages.slice(0, 4).map((imgUrl, imgIdx) => {
                          const stepMatch = (report.visual_solution_steps || [])[imgIdx];
                          const cap = stepMatch ? (isAr ? (stepMatch.title_ar || `خطوة ${stepMatch.step_number}`) : (stepMatch.title_en || `Step ${stepMatch.step_number}`)) : (isAr ? `صورة حل ${imgIdx + 1}` : `Fix Photo ${imgIdx + 1}`);
                          return `
                            <div class="visual-step-card" style="cursor: pointer;" onclick="app.showImagePreview('${this._esc(imgUrl)}', '${this._esc(cap)}')">
                              <img src="${this._esc(imgUrl)}" alt="${this._esc(cap)}" class="visual-step-thumb" loading="lazy" onerror="this.parentElement.style.display='none'" />
                              <div style="padding: 7px 10px; font-size: 11.5px; color: var(--color-text-body); line-height: 1.4;">
                                <strong style="color: var(--color-accent);">${this._esc(cap)}</strong>
                              </div>
                            </div>
                          `;
                        }).join('')}
                      </div>
                    </div>
                  ` : ''}
                </div>
              `}).join('')}
              </div>
            ` : `<p style="color: var(--color-text-muted); font-size: 14px;">${isAr ? 'لم يتم العثور على مسببات جذرية مطابقة بقدر كافٍ من الأدلة لهذه الحالة.' : 'No statistically backed root causes met the evidence threshold.'}</p>`}
          </div>

          <!-- Matching Real Historical Incidents (Arabic localized) -->
          ${(report.empirical_statistics?.matching_incidents && report.empirical_statistics.matching_incidents.length > 0) ? `
            <div class="card" style="margin-bottom: 24px;">
              <h3 style="font-size: 18px; margin-bottom: 14px; display: flex; align-items: center; gap: 8px;">
                <i class="fas fa-history" style="color: var(--color-accent);"></i>
                <span data-i18n="results_ora_incidents_title">${isAr ? 'حالات أعطال حقيقية مطابقة موثقة' : 'Matching Real-World Cases (Open Repair Alliance)'}</span>
              </h3>
              <div style="display: flex; flex-direction: column; gap: 10px;">
                ${report.empirical_statistics.matching_incidents.map(inc => {
                  const incText = isAr ? (inc.problem_ar || inc.problem || '-') : (inc.problem || '-');
                  const incStatus = isAr ? (inc.repair_status_ar || inc.repair_status || 'مسجل') : (inc.repair_status || 'Recorded');
                  const incCluster = isAr ? (inc.problem_cluster_ar || inc.problem_cluster || '') : (inc.problem_cluster || '');
                  const isCommunity = inc.data_provider === 'ByteForce Verified Community';
                  return `
                  <div class="ora-incident-row" style="${isCommunity ? 'border-color: rgba(16,185,129,0.4); background: rgba(16,185,129,0.04);' : ''}">
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 6px;">
                      <strong style="color: var(--color-text-main);">
                        ${this._esc(inc.brand || report.device_category)} · ${this._esc(inc.normalized_category || '')}
                        ${isCommunity ? `<span class="tag" style="margin-inline-start: 6px; font-size: 10.5px; background: rgba(16,185,129,0.16); color: var(--color-success);">${isAr ? 'حل مجرب من المجتمع' : 'Community Verified'}</span>` : ''}
                      </strong>
                      <div style="display: flex; gap: 6px; align-items: center;">
                        ${incCluster ? `<span class="tag" style="font-size: 11px;">${this._esc(incCluster)}</span>` : ''}
                        <span class="tag" style="font-size: 11px; background: ${inc.repair_status === 'Fixed' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)'}; color: ${inc.repair_status === 'Fixed' ? 'var(--color-success)' : 'var(--color-warning)'};">${this._esc(incStatus)}</span>
                      </div>
                    </div>
                    <p style="color: var(--color-text-body); margin: 0; line-height: 1.65;" dir="${isAr ? 'rtl' : 'ltr'}">${this._esc(incText)}</p>
                  </div>
                `;
                }).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Required Tools -->
          ${((isAr ? (report.required_tools_ar || report.required_tools) : report.required_tools) || []).length > 0 ? `
            <div class="card" style="margin-bottom: 24px;">
              <h3 style="font-size: 18px; margin-bottom: 14px;" data-i18n="results_tools_title">Required Tools</h3>
              <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                ${((isAr && report.required_tools_ar && report.required_tools_ar.length) ? report.required_tools_ar : report.required_tools).map(tool => `
                  <span class="tag" style="background-color: rgba(37,99,235,0.08); color: var(--color-secondary); font-size: 13px; padding: 6px 14px;">
                    <i class="fas fa-wrench" style="margin-inline-end: 6px;"></i> ${this._esc(tool)}
                  </span>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Troubleshooting & Disassembly / Reassembly Steps -->
          <div class="card" style="margin-bottom: 24px;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 16px;">
              <h3 style="font-size: 18px; margin: 0;" data-i18n="results_steps_title">Recommended Troubleshooting Steps</h3>
              ${report.verified_guide && report.verified_guide.guide_id ? `
                <button class="btn btn-outline btn-sm" onclick="app.showGuideModal(${report.verified_guide.guide_id})">
                  <i class="fas fa-book-open"></i> ${isAr ? 'فتح الدليل الكامل بالصور' : 'Open Full Illustrated Manual'}
                </button>
              ` : ''}
            </div>
            ${report.troubleshooting_steps && report.troubleshooting_steps.length > 0 ? `
              <div style="display: flex; flex-direction: column; gap: 14px;">
                ${report.troubleshooting_steps.map(step => {
                  const instr = (isAr ? (step.instruction_ar || step.instruction_en) : (step.instruction_en || step.instruction_ar)) || '';
                  const isLtrText = !isAr && /[A-Za-z]{4,}/.test(instr) && !/[\u0600-\u06FF]/.test(instr);
                  return `
                  <div class="step-card">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                      <span style="width: 26px; height: 26px; border-radius: 50%; background-color: var(--color-secondary); color: #FFFFFF; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0;">
                        ${step.step_number}
                      </span>
                      <strong style="font-size: 16px; color: var(--color-text-main);">${isAr ? step.title_ar : step.title_en}</strong>
                    </div>
                    <p style="font-size: 14px; color: var(--color-text-main); margin-bottom: 8px; line-height: 1.65;" ${isLtrText ? 'dir="ltr"' : ''}>
                      ${this._esc(instr)}
                    </p>
                    ${step.images && step.images.length > 0 ? `
                      <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-top: 8px;">
                        ${step.images.slice(0, 3).map(imgUrl => `
                          <img src="${imgUrl}" alt="${step.title_en || 'Step diagram'}" style="max-width: 260px; width: 100%; max-height: 180px; border-radius: 8px; object-fit: cover; border: 1px solid var(--color-border);" loading="lazy" onerror="this.style.display='none'" />
                        `).join('')}
                      </div>
                    ` : ''}
                    ${(step.caution_en || step.caution_ar) ? `
                      <div style="font-size: 12px; color: var(--color-warning); background-color: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.25); padding: 6px 12px; border-radius: 6px; display: flex; align-items: center; gap: 6px; margin-top: 8px;">
                        <i class="fas fa-shield-alt"></i>
                        <span>${isAr ? step.caution_ar : step.caution_en}</span>
                      </div>
                    ` : ''}
                  </div>
                `;
                }).join('')}
              </div>

              <!-- Reassembly & Post-Repair Installation Sequence -->
              <div style="margin-top: 18px; padding: 16px; background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 10px;">
                <h4 style="font-size: 15px; color: var(--color-success); margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
                  <i class="fas fa-sync-alt"></i>
                  <span>${isAr ? 'خطوات إعادة التركيب والتجميع بعد الإصلاح (Installation & Reassembly)' : 'Post-Repair Installation & Reassembly Steps'}</span>
                </h4>
                <ul style="margin: 0; padding-inline-start: 20px; font-size: 13px; color: var(--color-text-main); line-height: 1.75;">
                  <li>${isAr
                    ? `بعد تركيب القطعة البديلة أو تنظيف المكون، أعد تجميع الجهاز باتباع الخطوات من <b>الخطوة ${report.troubleshooting_steps[report.troubleshooting_steps.length - 1]?.step_number || report.troubleshooting_steps.length} وصولاً إلى الخطوة 1</b> بالترتيب العكسي.`
                    : `After installing the replacement component, reassemble the device in reverse order from <b>Step ${report.troubleshooting_steps[report.troubleshooting_steps.length - 1]?.step_number || report.troubleshooting_steps.length} back to Step 1</b>.`}</li>
                  <li>${isAr
                    ? 'تأكد من توصيل جميع كابلات الشريط (Ribbon Cables) وكيبل البطارية بإحكام قبل إغلاق الغطاء الخلفي وتثبيت المسامير بنفس أماكنها.'
                    : 'Ensure all ribbon cables, antenna connectors, and battery terminals click firmly into place and return each screw to its exact original hole.'}</li>
                </ul>
              </div>
            ` : `<p style="color: var(--color-text-muted); font-size: 14px;">${isAr ? 'لا توجد خطوات متاحة في السجل لهذه الحالة.' : 'No verified procedural steps available for this record.'}</p>`}
          </div>

          <!-- Interactive Closed-Loop Outcome Check & Dataset Learning Card -->
          ${!isInsufficient ? `
            <div id="repairOutcomeCard" class="card" style="margin-bottom: 24px; background: linear-gradient(135deg, #F8FAFC 0%, #FFFFFF 100%); border: 1.5px solid #CBD5E1;">
              ${this._diagFeedbackSaved ? `
                <div style="display: flex; align-items: center; gap: 12px; color: var(--color-success);">
                  <i class="fas fa-check-circle" style="font-size: 26px;"></i>
                  <div>
                    <strong style="display: block; font-size: 15.5px; margin-bottom: 2px;">${isAr ? 'تم توثيق نجاح الإصلاح وإثراء قاعدة البيانات بنجاح!' : 'Confirmed fix recorded in ByteForce verified dataset!'}</strong>
                    <span style="font-size: 13px; color: var(--color-text-muted);">${isAr ? 'شكراً لك — سيساعد هذا الحل في تسريع تشخيص أجهزة مشابهة مستقبلاً.' : 'Thank you — this solution will now assist future repairs for matching devices.'}</span>
                  </div>
                </div>
              ` : `
                <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 14px; margin-bottom: 14px;">
                  <div>
                    <h3 style="font-size: 17px; margin: 0 0 4px 0; color: var(--color-text-main); display: flex; align-items: center; gap: 8px;">
                      <i class="fas fa-check-double" style="color: var(--color-secondary);"></i>
                      <span>${isAr ? 'هل تم إصلاح الجهاز بعد اتباع الخطوات؟' : 'Did this solution fix your device?'}</span>
                    </h3>
                    <p style="font-size: 13px; color: var(--color-text-muted); margin: 0;">
                      ${isAr
                        ? 'تقييمك يحسّن دقة قاعدة البيانات تلقائياً أو يولّد لك حلاً بديلاً فوراً إذا استمرت المشكلة.'
                        : 'Confirming a fix adds it to our verified knowledge base; if not fixed, ByteForce generates an alternative solution path.'}
                    </p>
                  </div>
                </div>
                <div style="margin-bottom: 12px;">
                  <input type="text" id="repairOutcomeNote" class="form-control" style="font-size: 13px;" placeholder="${isAr ? 'ملاحظة اختيارية: ما الذي نجح معك أو ما زال معطلاً؟' : 'Optional note: what worked or what symptom still persists?'}" />
                </div>
                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                  <button id="btnOutcomeFixed" type="button" class="btn btn-primary" style="background: var(--color-success); border-color: var(--color-success);" onclick="app.submitRepairOutcome(true)">
                    <i class="fas fa-check-circle"></i>
                    <span>${isAr ? 'نعم، تم إصلاح الجهاز!' : 'Yes, Device Fixed!'}</span>
                  </button>
                  <button id="btnOutcomeRetry" type="button" class="btn btn-outline" style="border-color: var(--color-secondary); color: var(--color-secondary);" onclick="app.submitRepairOutcome(false)">
                    <i class="fas fa-sync-alt"></i>
                    <span>${isAr ? 'لا، لم يُصلح — اقترح حلاً جديداً' : 'No, Still Broken — Try Another Solution'}</span>
                  </button>
                </div>
              `}
            </div>
          ` : ''}

          <!-- Professional Technician Recommendation Banner -->
          ${report.requires_technician ? `
            <div class="card" style="background: var(--callout-card-bg); border: 1px solid var(--callout-card-border); color: var(--color-text-main); padding: 28px;">
              <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px;">
                <div>
                  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; color: var(--color-accent);">
                    <i class="fas fa-user-shield"></i>
                    <strong data-i18n="results_tech_referral">Professional Technician Recommended</strong>
                  </div>
                  <p style="font-size: 14px; color: var(--color-text-body); max-width: 580px; margin: 0;">
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

  showImagePreview(imgUrl, caption = "") {
    if (!imgUrl) return;
    this.openModal(`
      <div style="text-align: center;">
        <h4 style="color: var(--color-text-main); margin-bottom: 12px;">${this._esc(caption)}</h4>
        <img src="${this._esc(imgUrl)}" alt="${this._esc(caption)}" style="max-width: 100%; max-height: 70vh; border-radius: 10px; border: 1px solid var(--color-border);" />
      </div>
    `);
  }

  bookTechnicianForReport() {
    if (!this._requireAuth("technicians", "سجّل دخولك أولاً لتقديم طلب صيانة.", "Please sign in first to submit a repair request.")) return;
    this.navigate("technicians");
  }

  async submitRepairOutcome(fixed) {
    if (!this._requireAuth()) return;
    if (!this.currentReport) return;
    const isAr = window.i18n.currentLang === "ar";
    const report = this.currentReport;
    const notesEl = document.getElementById("repairOutcomeNote");
    const userNotes = notesEl ? notesEl.value.trim() : "";
    const btnFixed = document.getElementById("btnOutcomeFixed");
    const btnRetry = document.getElementById("btnOutcomeRetry");
    if (btnFixed) btnFixed.disabled = true;
    if (btnRetry) btnRetry.disabled = true;

    const primaryCause = (report.possible_causes || [])[0] || {};
    const appliedSol = (isAr ? (primaryCause.repair_method_ar || primaryCause.title_ar) : (primaryCause.repair_method_en || primaryCause.title_en))
      || (report.verified_guide?.title_ar || report.verified_guide?.title || "");

    try {
      if (fixed) {
        if (btnFixed) btnFixed.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${isAr ? 'جاري حفظ الحل...' : 'Saving to dataset...'}`;
        await window.api.submitDiagnosisFeedback({
          report_id: report.report_id,
          device_category: report.device_category,
          brand: report.brand,
          model: report.model,
          problem_category: report.problem_category,
          problem_cluster: report.problem_cluster,
          description: report.description || this.wizardData?.description || "",
          applied_solution: appliedSol,
          user_notes: userNotes,
          device_age_years: this.wizardData?.device_age_years || null,
          fixed: true,
          request_alternative: false
        });
        this._diagFeedbackSaved = true;
        this.renderResults(document.getElementById("mainContent"));
      } else {
        if (btnRetry) btnRetry.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${isAr ? 'جاري البحث عن حل بديل...' : 'Finding alternative solution...'}`;
        this._diagExcludedGuideIds = Array.isArray(this._diagExcludedGuideIds) ? this._diagExcludedGuideIds : [];
        if (report.verified_guide?.guide_id && !this._diagExcludedGuideIds.includes(report.verified_guide.guide_id)) {
          this._diagExcludedGuideIds.push(report.verified_guide.guide_id);
        }
        this._diagFailedSolutions = Array.isArray(this._diagFailedSolutions) ? this._diagFailedSolutions : [];
        if (appliedSol) this._diagFailedSolutions.push(appliedSol);
        const curAttempt = Number(this._diagAttemptNumber || report.attempt_number || 1);

        const res = await window.api.submitDiagnosisFeedback({
          report_id: report.report_id,
          device_category: report.device_category,
          brand: report.brand,
          model: report.model,
          problem_category: report.problem_category,
          problem_cluster: report.problem_cluster,
          description: userNotes ? `${report.description || this.wizardData?.description || ""} (${userNotes})` : (report.description || this.wizardData?.description || ""),
          applied_solution: appliedSol,
          user_notes: userNotes,
          device_age_years: this.wizardData?.device_age_years || null,
          fixed: false,
          request_alternative: true,
          exclude_guide_ids: this._diagExcludedGuideIds,
          failed_solutions: this._diagFailedSolutions,
          attempt_number: curAttempt
        });

        if (res && res.alternative_report) {
          this._diagAttemptNumber = curAttempt + 1;
          this._diagFeedbackSaved = false;
          this.currentReport = res.alternative_report;
          this.renderResults(document.getElementById("mainContent"));
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
          throw new Error(isAr ? "لم يتم إرجاع مسار بديل." : "No alternative solution returned.");
        }
      }
    } catch (err) {
      alert((isAr ? "تعذر تحديث نتيجة الإصلاح: " : "Feedback update error: ") + (err.message || ""));
      if (btnFixed) {
        btnFixed.disabled = false;
        btnFixed.innerHTML = `<i class="fas fa-check-circle"></i> <span>${isAr ? 'نعم، تم إصلاح الجهاز!' : 'Yes, Device Fixed!'}</span>`;
      }
      if (btnRetry) {
        btnRetry.disabled = false;
        btnRetry.innerHTML = `<i class="fas fa-sync-alt"></i> <span>${isAr ? 'لا، لم يُصلح — اقترح حلاً جديداً' : 'No, Still Broken — Try Another Solution'}</span>`;
      }
    }
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
            <div class="filter-grid">
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

        grid.innerHTML = guides.map(g => {
          const title = (isAr ? (g.title_ar || g.title) : (g.title_en || g.title)) || 'Repair Manual';
          const summary = (isAr ? (g.summary_ar || g.summary) : (g.summary_en || g.summary)) || 'Verified step-by-step disassembly and hardware repair procedure.';
          const duration = g.estimated_minutes || (g.time_required ? (String(g.time_required).match(/\d+/) ? String(g.time_required).match(/\d+/)[0] : '25') : '25');
          const difficulty = g.difficulty || 'Moderate';
          const diffClass = difficulty.toLowerCase().includes('easy') ? 'low' : (difficulty.toLowerCase().includes('mod') ? 'medium' : 'high');
          let thumb = g.thumbnail_url || null;
          if (!thumb && Array.isArray(g.steps)) {
            for (const st of g.steps) {
              const imgs = st && (st.Images || st.images);
              if (Array.isArray(imgs) && imgs.length > 0) { thumb = imgs[0]; break; }
            }
          }

          return `
          <div class="card card-interactive" onclick="app.showGuideModal(${g.id || g.guide_id})">
            ${thumb ? `<img src="${this._esc(thumb)}" alt="${this._esc(title)}" class="guide-card-thumb" loading="lazy" onerror="this.style.display='none'" />` : ''}
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <span class="tag" style="background-color: rgba(37,99,235,0.08); color: var(--color-secondary);">
                ${g.device_category || 'Hardware'}
              </span>
              <span class="severity-badge severity-${diffClass}">
                ${difficulty}
              </span>
            </div>
            <h4 style="font-size: 17px; margin-bottom: 8px;">${title}</h4>
            <p style="font-size: 13px; color: var(--color-text-muted); margin-bottom: 16px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">
              ${summary}
            </p>
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--color-border); padding-top: 12px; font-size: 12px; color: var(--color-text-muted);">
              <span><i class="far fa-clock"></i> ~${duration} min</span>
              <span style="color: var(--color-secondary); font-weight: 600;" data-i18n="guides_view_btn">${isAr ? 'عرض الدليل ←' : 'View Guide &rarr;'}</span>
            </div>
          </div>
        `;
        }).join('');
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
    if (!this._requireAuth("guides")) return;
    const isAr = window.i18n.currentLang === "ar";
    try {
      let guide = await window.api.getGuide(guideId);
      if (!guide) throw new Error("Guide not found");
      
      const title = (isAr ? (guide.title_ar || guide.title) : (guide.title_en || guide.title)) || 'Repair Manual';
      const summary = (isAr ? (guide.summary_ar || guide.summary) : (guide.summary_en || guide.summary)) || '';
      const duration = guide.estimated_minutes || (guide.time_required ? (String(guide.time_required).match(/\d+/) ? String(guide.time_required).match(/\d+/)[0] : '25') : '25');
      const difficulty = guide.difficulty || 'Moderate';
      
      // Normalize steps (prefer localized Arabic instruction when in Arabic mode)
      let steps = [];
      if (Array.isArray(guide.steps)) {
        steps = guide.steps.map((s, idx) => {
          if (typeof s === 'string') return { step_number: idx + 1, instruction: s, title: isAr ? `الخطوة ${idx + 1}` : `Step ${idx + 1}`, images: [] };
          const lineTxt = Array.isArray(s.Lines)
            ? s.Lines.map(l => (typeof l === 'object' ? (l.Text || l.text || '') : l)).join(" ").replace(/ \./g, ".").trim()
            : (Array.isArray(s.lines) ? s.lines.map(l => (typeof l === 'object' ? (l.Text || l.text || '') : l)).join(" ").replace(/ \./g, ".").trim() : "");
          const txtEn = s.Text_raw || s.text_raw || lineTxt || s.instruction_en || "";
          const txt = isAr ? (s.instruction_ar || txtEn) : (txtEn || s.instruction_ar || "");
          const num = s.step_number || (s.Order !== undefined ? s.Order + 1 : (s.order !== undefined ? s.order : idx + 1));
          const t = isAr ? (s.title_ar || `الخطوة ${num}`) : (s.Title || s.title || s.title_en || `Step ${num}`);
          const imgs = s.Images || s.images || [];
          return {
            step_number: num,
            title: t,
            instruction: txt || (imgs.length ? (isAr ? "راجع الصورة التوضيحية المرفقة لهذه الخطوة." : "Inspect the attached diagram for this step.") : ""),
            images: imgs
          };
        }).filter(st => st.instruction || (st.images && st.images.length > 0));
      }

      // Normalize tools
      let tools = [];
      const rawToolsSource = isAr && Array.isArray(guide.tools_ar) && guide.tools_ar.length > 0
        ? guide.tools_ar
        : ((Array.isArray(guide.required_tools) && guide.required_tools.length > 0) ? guide.required_tools : guide.tools);
      if (Array.isArray(rawToolsSource)) {
        tools = rawToolsSource.map(t => typeof t === 'string' ? t.trim() : (t.Name || t.name || '').trim()).filter(Boolean);
      }

      const content = `
        <div style="margin-bottom: 20px;">
          <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 8px;">
            <span class="tag" style="background-color: rgba(37,99,235,0.08); color: var(--color-secondary);">${guide.device_category || 'Hardware'}</span>
            ${guide.device_model ? `<span class="tag" style="background: var(--color-surface-hover);">${guide.device_model}</span>` : ''}
          </div>
          <h2 style="font-size: 22px; margin: 10px 0 6px;">${title}</h2>
          <p style="font-size: 14px; color: var(--color-text-muted);">${summary}</p>
        </div>

        <div style="display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap;">
          <span class="tag"><i class="far fa-clock"></i> ~${duration} min</span>
          <span class="tag"><i class="fas fa-layer-group"></i> ${difficulty}</span>
          ${guide.url ? `<a href="${guide.url}" target="_blank" rel="noopener" class="tag" style="color: var(--color-secondary); text-decoration: none; padding: 4px 12px; white-space: nowrap;"><i class="fas fa-external-link-alt"></i> ${isAr ? 'المصدر الأصلي <span dir="ltr">(iFixit)</span>' : 'Original Source (iFixit)'}</a>` : ''}
        </div>

        ${tools && tools.length > 0 ? `
          <div style="margin: 16px 0; padding: 14px; background: rgba(37,99,235,0.04); border: 1px solid var(--color-border); border-radius: 8px;">
            <strong style="display: block; margin-bottom: 6px; font-size: 13px;"><i class="fas fa-wrench"></i> ${isAr ? 'الأدوات المطلوبة' : 'Required Tools'}:</strong>
            <div style="display: flex; flex-wrap: wrap; gap: 6px;">
              ${tools.map(tl => `<span class="tag" style="background: var(--color-surface);">${tl}</span>`).join('')}
            </div>
          </div>
        ` : ''}

        ${guide.safety_precautions && guide.safety_precautions.length > 0 ? `
          <div class="hazard-box" style="margin: 16px 0; padding: 12px 16px;">
            <strong style="display: block; margin-bottom: 6px;"><i class="fas fa-shield-alt"></i> ${isAr ? 'إجراءات الأمان والسلامة:' : 'Safety Precautions:'}</strong>
            <ul style="padding-inline-start: 20px; font-size: 13px; margin: 0; line-height: 1.65;">
              ${guide.safety_precautions.map(p => {
                const arMap = {
                  "Disconnect all power cables and remove batteries before disassembly.": "افصل جميع كابلات الطاقة وافصل البطارية تماماً قبل بدء التفكيك.",
                  "Wear an ESD wrist strap to protect delicate microchips from electrostatic discharge.": "ارتدِ سوار التفريغ الكهروستاتيكي (ESD) لحماية الشرائح الدقيقة من الشحنات الساكنة.",
                  "Organize screws by size and thread length to avoid logic board damage.": "رتب المسامير حسب المقاس والطول لتفادي تلف اللوحة الأم عند إعادة التركيب."
                };
                const txt = isAr ? (arMap[p] || p) : p;
                const ltr = isAr && !/[\u0600-\u06FF]/.test(txt);
                return `<li ${ltr ? 'dir="ltr" style="text-align: left;"' : ''}>${txt}</li>`;
              }).join('')}
            </ul>
          </div>
        ` : ''}

        <h4 style="margin: 20px 0 12px;"><i class="fas fa-list-ol"></i> ${isAr ? 'الخطوات العملية المعتمدة' : 'Verified Step-by-Step Instructions'} (${steps.length})</h4>
        <div style="display: flex; flex-direction: column; gap: 12px; max-height: 480px; overflow-y: auto; padding-right: 6px;">
          ${steps.map(step => `
            <div class="step-card" style="padding: 14px; border: 1px solid var(--color-border); border-radius: 8px; background: var(--color-surface);">
              <strong style="font-size: 14px; display: block; margin-bottom: 6px; color: var(--color-secondary);">
                ${step.title}
              </strong>
              <p style="font-size: 13px; color: var(--color-text-main); margin: 0; line-height: 1.6;" ${/[A-Za-z]{4,}/.test(step.instruction) && !/[\u0600-\u06FF]/.test(step.instruction) ? 'dir="ltr"' : ''}>${step.instruction}</p>
              ${step.images && step.images.length > 0 ? `
                <div style="margin-top: 10px; display: flex; gap: 8px; flex-wrap: wrap;">
                  ${step.images.slice(0, 3).map(imgUrl => `<img src="${imgUrl}" alt="${step.title}" style="max-width: 100%; max-height: 220px; border-radius: 6px; object-fit: cover; border: 1px solid var(--color-border);" loading="lazy" onerror="this.style.display='none'" />`).join('')}
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
        ${steps.length > 0 ? `
          <div style="margin-top: 14px; padding: 12px 14px; background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.25); border-radius: 8px; font-size: 12.5px; color: var(--color-text-main); line-height: 1.6;">
            <strong style="color: var(--color-success);"><i class="fas fa-sync-alt"></i> ${isAr ? 'إعادة التركيب والتجميع:' : 'Reassembly & Installation:'}</strong>
            <span>${isAr ? `لإعادة تجميع الجهاز بعد انتهاء الإصلاح، نفذ الخطوات من ${steps.length} إلى 1 بالترتيب العكسي.` : `To reassemble your device after replacement, follow Steps ${steps.length} down to 1 in reverse order.`}</span>
          </div>
        ` : ''}
      `;
      this.openModal(content);
    } catch (err) {
      alert("Error loading guide: " + err.message);
    }
  }

  // ==========================================
  // VIEW: TECHNICIAN MARKETPLACE
  _lookupCityCoords(city) {
    const raw = String(city || "").trim();
    if (!raw) return null;
    if (CITY_COORDS[raw]) return CITY_COORDS[raw];
    const lower = raw.toLowerCase();
    for (const [key, coords] of Object.entries(CITY_COORDS)) {
      const kl = key.toLowerCase();
      if (lower === kl || lower.includes(kl) || kl.includes(lower)) return coords;
    }
    return null;
  }

  // ==========================================
  async renderTechnicians(container) {
    const isAr = window.i18n.currentLang === "ar";
    const renderToken = (this._techRenderToken = (this._techRenderToken || 0) + 1);
    if (this._techLeafMap) {
      try { this._techLeafMap.remove(); } catch (e) {}
      this._techLeafMap = null;
    }
    container.innerHTML = `
      <section style="padding: 40px 0 80px;">
        <div class="container">
          
          <div style="text-align: center; max-width: 650px; margin: 0 auto 36px;">
            <h1 style="font-size: 32px; margin-bottom: 10px;" data-i18n="tech_title">سوق الفنيين ومراكز الصيانة المعتمدة</h1>
            <p style="color: var(--color-text-muted); font-size: 15px;" data-i18n="tech_subtitle">
              تواصل مع نخبة من الفنيين المعتمدين والموثقين في مختلف المحافظات مع تقدير المسافة والتقييمات الحقيقية.
            </p>
          </div>

         <!-- Enhanced Filter Bar (City, Specialty & Home Service) -->
          <div class="card" style="margin-bottom: 30px; padding: 20px; background: var(--color-card); border: 1px solid var(--color-border); border-radius: 12px;">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; align-items: center;">
              <div>
                <label style="font-size: 12px; color: #94A3B8; margin-bottom: 4px; display: block;">${isAr ? 'المدينة / المحافظة' : 'City / Governorate'}</label>
                <select id="techCityFilter" class="form-control">
                  <option value="all">${isAr ? 'جميع المدن (الكل)' : 'All Cities'}</option>
                  <option value="Cairo">${isAr ? 'القاهرة' : 'Cairo'}</option>
                  <option value="Giza">${isAr ? 'الجيزة' : 'Giza'}</option>
                  <option value="Alexandria">${isAr ? 'الإسكندرية' : 'Alexandria'}</option>
                  <option value="6th of October">${isAr ? '6 أكتوبر / الشيخ زايد' : '6th of October / Zayed'}</option>
                  <option value="Fayoum">${isAr ? 'الفيوم' : 'Fayoum'}</option>
                  <option value="Beni Suef">${isAr ? 'بني سويف' : 'Beni Suef'}</option>
                  <option value="Mansoura">${isAr ? 'المنصورة' : 'Mansoura'}</option>
                  <option value="Tanta">${isAr ? 'طنطا' : 'Tanta'}</option>
                  <option value="Zagazig">${isAr ? 'الزقازيق' : 'Zagazig'}</option>
                  <option value="Ismailia">${isAr ? 'الإسماعيلية' : 'Ismailia'}</option>
                  <option value="Suez">${isAr ? 'السويس' : 'Suez'}</option>
                  <option value="Port Said">${isAr ? 'بورسعيد' : 'Port Said'}</option>
                  <option value="Luxor">${isAr ? 'الأقصر' : 'Luxor'}</option>
                  <option value="Aswan">${isAr ? 'أسوان' : 'Aswan'}</option>
                  <option value="Assiut">${isAr ? 'أسيوط' : 'Assiut'}</option>
                </select>
              </div>

              <div>
                <label style="font-size: 12px; color: #94A3B8; margin-bottom: 4px; display: block;">${isAr ? 'التخصص / نوع الجهاز' : 'Specialty / Device'}</label>
                <select id="techSpecFilter" class="form-control">
                  <option value="all">${isAr ? 'جميع الأجهزة والتخصصات' : 'All Devices & Specialties'}</option>
                  <option value="Smartphone">${window.i18n.t('cat_smartphone')}</option>
                  <option value="Laptop">${window.i18n.t('cat_laptop')}</option>
                  <option value="Desktop Computer">${window.i18n.t('cat_computer')}</option>
                  <option value="Tablet">${window.i18n.t('cat_tablet')}</option>
                  <option value="Gaming Console">${window.i18n.t('cat_console')}</option>
                  <option value="Smart TV">${window.i18n.t('cat_tv')}</option>
                  <option value="Storage">${window.i18n.t('cat_storage')}</option>
                  <option value="Printer">${window.i18n.t('cat_printer')}</option>
                  <option value="Audio">${window.i18n.t('cat_audio')}</option>
                  <option value="Smartwatch">${window.i18n.t('cat_smartwatch')}</option>
                  <option value="Camera">${window.i18n.t('cat_camera')}</option>
                  <option value="Home Appliance">${window.i18n.t('cat_appliance')}</option>
                  <option value="Motherboard">${isAr ? 'صيانة ماذربورد ولحام دقيق' : 'Motherboards & Micro-soldering'}</option>
                  <option value="Data Recovery">${isAr ? 'استعادة بيانات وتخزين' : 'Data Recovery'}</option>
                </select>
              </div>

              <div>
                <label style="font-size: 12px; color: #94A3B8; margin-bottom: 4px; display: block;">${isAr ? 'نوع المزود' : 'Provider Type'}</label>
                <select id="techTypeFilter" class="form-control">
                  <option value="all">${isAr ? 'الكل (فنيين ومراكز صيانة)' : 'All (Technicians & Centers)'}</option>
                  <option value="CENTER">${isAr ? 'مراكز صيانة معتمدة فقط' : 'Verified Centers Only'}</option>
                  <option value="TECHNICIAN">${isAr ? 'فنيون مستقلون فقط' : 'Independent Technicians Only'}</option>
                </select>
              </div>

              <div>
                <label style="font-size: 12px; color: #94A3B8; margin-bottom: 4px; display: block;">${isAr ? 'نطاق المسافة' : 'Radius Distance'}</label>
                <select id="techRadiusFilter" class="form-control">
                  <option value="all">${isAr ? 'أي مسافة' : 'Any Distance'}</option>
                  <option value="5">5 ${isAr ? 'كم' : 'km'}</option>
                  <option value="10">10 ${isAr ? 'كم' : 'km'}</option>
                  <option value="20">20 ${isAr ? 'كم' : 'km'}</option>
                  <option value="50">50 ${isAr ? 'كم' : 'km'}</option>
                </select>
              </div>

              <div style="padding-top: 18px;">
                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; color: var(--color-text-main); font-size: 13px;">
                  <input type="checkbox" id="techHomeOnly" style="width: auto; cursor: pointer;">
                  <span><i class="fas fa-home" style="color: #10B981;"></i> ${isAr ? 'خدمة منزلية فقط' : 'Home Service Only'}</span>
                </label>
              </div>
            </div>
          </div>

          <!-- Interactive Centers, Public Map Shops & Google Maps -->
          <div class="card" style="margin-bottom: 24px; padding: 14px; background: var(--color-card); border: 1px solid var(--color-border); border-radius: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
              <span style="font-size: 14px; font-weight: 700; color: var(--color-text-main);">
                <i class="fas fa-map-marked-alt" style="color: var(--color-accent); margin-inline-end: 6px;"></i>${isAr ? 'خريطة المراكز المعتمدة ومحلات الصيانة القريبة (Google Maps)' : 'Verified Centers & Nearby Repair Shops (Google Maps)'}
              </span>
              <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
                <button id="useLocationBtn" class="btn btn-primary btn-sm" style="display: inline-flex; align-items: center; gap: 6px; font-size: 12px;">
                  <i class="fas fa-crosshairs"></i>
                  <span>${isAr ? 'تحديد موقعي وجلب المحلات القريبة' : 'Locate Me & Nearby Shops'}</span>
                </button>
                <button id="toggleGoogleMapsBtn" type="button" class="btn btn-outline btn-sm" style="display: inline-flex; align-items: center; gap: 6px; font-size: 12px;">
                  <i class="fab fa-google" style="color: #EA4335;"></i>
                  <span>${isAr ? 'عرض خرائط جوجل (Google Maps)' : 'Switch to Google Maps'}</span>
                </button>
                <a id="openGoogleMapsDirectLink" href="https://www.google.com/maps/search/%D8%B5%D9%8A%D8%A7%D9%86%D8%A9+%D9%85%D9%88%D8%A8%D8%A7%D9%8A%D9%84+%D9%88%D9%84%D8%A7%D8%A8%D8%AA%D9%88%D8%A8+%D9%88%D8%A7%D9%84%D9%83%D8%AA%D8%B1%D9%88%D9%86%D9%8A%D8%A7%D8%AA/@30.0444,31.2357,13z" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm" style="display: inline-flex; align-items: center; gap: 6px; font-size: 12px;">
                  <i class="fas fa-external-link-alt"></i>
                  <span>${isAr ? 'فتح في Google Maps' : 'Open Google Maps'}</span>
                </a>
              </div>
            </div>
            <div id="techMap" style="height: 300px; border-radius: 8px; border: 1px solid var(--color-border); z-index: 1;"></div>
            <div id="googleMapsEmbedContainer" style="display: none; height: 320px; border-radius: 8px; overflow: hidden; border: 1px solid var(--color-border);">
              <iframe id="googleMapsEmbedFrame" title="Google Maps Nearby Repair Shops" style="width: 100%; height: 100%; border: 0;" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src=""></iframe>
            </div>
          </div>

          <!-- Technicians Grid (Platform Verified Centers) -->
          <div id="techGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(310px, 1fr)); gap: 24px;">
            <div style="text-align: center; grid-column: 1/-1; padding: 40px; color: var(--color-text-muted);">
              <i class="fas fa-spinner fa-spin fa-2x"></i>
            </div>
          </div>

          <!-- Nearby Public Repair Shops from Maps (Not Necessarily Registered on ByteForce) -->
          <div id="nearbyPublicShopsSection" style="margin-top: 40px;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 16px;">
              <div>
                <h2 style="font-size: 21px; margin: 0 0 4px 0; color: var(--color-text-main); display: flex; align-items: center; gap: 8px;">
                  <i class="fas fa-map-pin" style="color: #EA580C;"></i>
                  <span>${isAr ? 'محلات الصيانة القريبة منك على الخريطة (غير مسجلة بالموقع)' : 'Nearby Public Repair Shops on Maps (All Local Shops)'}</span>
                </h2>
                <p id="nearbyShopsSubtitle" style="font-size: 13px; color: var(--color-text-muted); margin: 0;">
                  ${isAr ? 'يتم جلب محلات تصليح الهواتف والإلكترونيات والكمبيوتر الحقيقية حول موقعك أو المدينة المختارة مع رابط مباشر لخرائط جوجل.' : 'Real public electronics, phone, and computer repair shops around your location with direct Google Maps links.'}
                </p>
              </div>
            </div>
            <div id="nearbyShopsGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px;"></div>
          </div>

        </div>
      </section>
    `;

    let leafMap = null;
    let mapMarkers = [];
    let currentUserLoc = null;
    let showingGoogleMap = false;

    const getActiveMapCoords = () => {
      if (currentUserLoc) return currentUserLoc;
      const cityVal = container.querySelector("#techCityFilter")?.value;
      if (cityVal && cityVal !== "all") {
        const c = this._lookupCityCoords(cityVal);
        if (c) return c;
      }
      return { lat: 30.0444, lng: 31.2357 }; // Default Cairo center
    };

    const syncGoogleMapsUrls = (coords) => {
      const linkEl = container.querySelector("#openGoogleMapsDirectLink");
      const iframeEl = container.querySelector("#googleMapsEmbedFrame");
      const qTerm = encodeURIComponent(isAr ? "صيانة موبايل ولابتوب والالكترونيات" : "electronics mobile laptop repair shop");
      const directUrl = `https://www.google.com/maps/search/${qTerm}/@${coords.lat},${coords.lng},14z`;
      const embedUrl = `https://maps.google.com/maps?q=${qTerm}&ll=${coords.lat},${coords.lng}&z=14&output=embed`;
      if (linkEl) linkEl.href = directUrl;
      if (iframeEl && showingGoogleMap) iframeEl.src = embedUrl;
    };

    const updateMapMarkers = (techList, userLoc = null, publicShops = []) => {
      const mapEl = container.querySelector("#techMap");
      if (!mapEl || typeof L === "undefined") return;

      if (!leafMap) {
        if (this._techLeafMap && this._techLeafMap !== leafMap) {
          try { this._techLeafMap.remove(); } catch (e) {}
          this._techLeafMap = null;
        }
        if (mapEl._leaflet_id) {
          try { mapEl._leaflet_id = null; mapEl.innerHTML = ""; } catch (e) {}
        }
        leafMap = L.map(mapEl).setView([30.0444, 31.2357], 6);
        this._techLeafMap = leafMap;
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 18,
          attribution: "&copy; OpenStreetMap"
        }).addTo(leafMap);
      }

      mapMarkers.forEach(m => { try { leafMap.removeLayer(m); } catch (e) {} });
      mapMarkers = [];

      if (userLoc) {
        const userIcon = L.circleMarker([userLoc.lat, userLoc.lng], {
          radius: 9,
          fillColor: "#10B981",
          color: "#FFFFFF",
          weight: 2,
          opacity: 1,
          fillOpacity: 0.9
        }).addTo(leafMap).bindPopup(isAr ? "<b>موقعك الحالي</b>" : "<b>Your Current Location</b>").openPopup();
        mapMarkers.push(userIcon);
        leafMap.setView([userLoc.lat, userLoc.lng], 13);
      }

      techList.forEach(t => {
        const coords = (t.lat && t.lng) ? { lat: t.lat, lng: t.lng } : this._lookupCityCoords(t.city);
        if (!coords) return;
        const bName = t.business_name || t.name || "";
        const safeName = bName.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/"/g, "&quot;");
        const ratingTxt = t.reviews_count > 0 ? `★ ${Number(t.rating || 0).toFixed(1)} (${t.reviews_count})` : (isAr ? "جديد" : "New");
        const marker = L.marker([coords.lat, coords.lng]).addTo(leafMap);
        marker.bindPopup(`
          <div style="font-family: inherit; font-size: 13px; min-width: 170px;">
            <b style="color: #0F172A; font-size: 14px;">${this._esc(bName)}</b>
            <div style="color: #64748B; font-size: 12px; margin: 3px 0;">${this._esc(t.city || '')}${t.city ? ' · ' : ''}${ratingTxt}</div>
            <button class="btn btn-primary btn-sm" style="width: 100%; margin-top: 6px; padding: 4px 8px; font-size: 12px;" onclick="app.showBookTechnicianModal('${this._esc(t.id)}', '${safeName}')">
              ${isAr ? 'طلب صيانة' : 'Request Repair'}
            </button>
          </div>
        `);
        mapMarkers.push(marker);
      });

      (publicShops || []).forEach(shop => {
        if (shop.lat == null || shop.lng == null) return;
        const pMarker = L.circleMarker([shop.lat, shop.lng], {
          radius: 7,
          fillColor: "#EA580C",
          color: "#FFFFFF",
          weight: 2,
          opacity: 1,
          fillOpacity: 0.92
        }).addTo(leafMap);
        pMarker.bindPopup(`
          <div style="font-family: inherit; font-size: 12.5px; min-width: 165px;">
            <b style="color: #0F172A;">${this._esc(shop.name)}</b>
            <div style="color: #EA580C; font-size: 11px; margin: 2px 0;">${this._esc(shop.category_ar || '')} · ${shop.distance_km} ${isAr ? 'كم' : 'km'}</div>
            <a href="${this._esc(shop.google_maps_url)}" target="_blank" rel="noopener noreferrer" style="display: inline-block; margin-top: 5px; color: #2563EB; font-weight: 700; text-decoration: underline;">
              ${isAr ? 'فتح على خرائط جوجل ↗' : 'Open in Google Maps ↗'}
            </a>
          </div>
        `);
        mapMarkers.push(pMarker);
      });
    };

    let lastLoadedTechs = [];
    const loadNearbyPublicShops = async () => {
      const shopsGrid = container.querySelector("#nearbyShopsGrid");
      if (!shopsGrid) return;
      const coords = getActiveMapCoords();
      syncGoogleMapsUrls(coords);
      const radiusVal = container.querySelector("#techRadiusFilter")?.value;
      const radiusKm = (radiusVal && radiusVal !== "all") ? Math.min(25, Number(radiusVal)) : 6;
      shopsGrid.innerHTML = `<div style="grid-column: 1/-1; padding: 18px; text-align: center; color: var(--color-text-muted); font-size: 13px;"><i class="fas fa-spinner fa-spin"></i> ${isAr ? 'جاري البحث عن محلات الصيانة الحقيقية القريبة على الخرائط...' : 'Fetching nearby public repair shops...'}</div>`;

      try {
        const res = await window.api.getNearbyRepairShops(coords.lat, coords.lng, radiusKm);
        if (renderToken !== this._techRenderToken || !document.body.contains(shopsGrid)) return;
        const shops = Array.isArray(res?.shops) ? res.shops : [];
        updateMapMarkers(lastLoadedTechs, currentUserLoc, shops);

        if (shops.length === 0) {
          shopsGrid.innerHTML = `
            <div class="card" style="grid-column: 1/-1; padding: 20px; text-align: center; background: var(--color-card);">
              <p style="margin: 0 0 12px 0; font-size: 13.5px; color: var(--color-text-muted);">
                ${isAr ? 'يمكنك تصفح كافة ورش ومراكز الصيانة المحيطة بك مباشرة عبر خرائط Google Maps:' : 'Browse all nearby repair shops directly on Google Maps:'}
              </p>
              <a href="${this._esc(res?.google_maps_search_url || '#')}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">
                <i class="fab fa-google"></i>
                <span>${isAr ? 'فتح كل محلات الصيانة القريبة في Google Maps ↗' : 'Open All Nearby Shops in Google Maps ↗'}</span>
              </a>
            </div>
          `;
          return;
        }

        shopsGrid.innerHTML = shops.map(shop => `
          <div class="card" style="padding: 16px; display: flex; flex-direction: column; justify-content: space-between; gap: 10px;">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 6px;">
                <strong style="font-size: 15px; color: var(--color-text-main);">${this._esc(shop.name)}</strong>
                <span class="tag" style="background: rgba(234, 88, 12, 0.1); color: #EA580C; font-size: 11px; white-space: nowrap;">${shop.distance_km} ${isAr ? 'كم' : 'km'}</span>
              </div>
              <div style="font-size: 12px; color: var(--color-secondary); margin-bottom: 6px; font-weight: 600;">${this._esc(shop.category_ar)}</div>
              ${shop.address ? `<div style="font-size: 12px; color: var(--color-text-muted); margin-bottom: 4px;"><i class="fas fa-location-dot" style="margin-inline-end: 5px;"></i>${this._esc(shop.address)}</div>` : ''}
              ${shop.phone ? `<div style="font-size: 12px; color: var(--color-text-muted);" dir="ltr"><i class="fas fa-phone" style="margin-inline-end: 5px;"></i>${this._esc(shop.phone)}</div>` : ''}
            </div>
            <a href="${this._esc(shop.google_maps_url)}" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm" style="justify-content: center; border-color: #CBD5E1;">
              <i class="fab fa-google" style="color: #EA4335;"></i>
              <span>${isAr ? 'الاتجاه على خرائط Google Maps ↗' : 'Directions in Google Maps ↗'}</span>
            </a>
          </div>
        `).join('');
      } catch (e) {
        const gmUrl = `https://www.google.com/maps/search/${encodeURIComponent(isAr ? 'صيانة موبايل ولابتوب والالكترونيات' : 'electronics repair shop')}/@${coords.lat},${coords.lng},14z`;
        shopsGrid.innerHTML = `
          <div class="card" style="grid-column: 1/-1; padding: 18px; text-align: center;">
            <a href="${gmUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">
              <i class="fab fa-google"></i>
              <span>${isAr ? 'عرض محلات الصيانة القريبة في Google Maps ↗' : 'Open Nearby Repair Shops in Google Maps ↗'}</span>
            </a>
          </div>
        `;
      }
    };

    const loadTechs = async () => {
      if (renderToken !== this._techRenderToken) return;
      const cityEl = container.querySelector("#techCityFilter");
      const grid = container.querySelector("#techGrid");
      if (!cityEl || !grid) return;
      const city = cityEl.value;
      const spec = container.querySelector("#techSpecFilter").value;
      const provType = container.querySelector("#techTypeFilter").value;
      const radiusVal = container.querySelector("#techRadiusFilter").value;
      const homeOnly = container.querySelector("#techHomeOnly").checked;

      try {
        let techs = await window.api.getTechnicians(city, spec);
        if (renderToken !== this._techRenderToken || !document.body.contains(grid)) return;
        if (provType !== "all") {
          techs = techs.filter(t => (t.kind || "TECHNICIAN").toUpperCase() === provType);
        }
        if (homeOnly) {
          techs = techs.filter(t => t.home_service_available || t.home_service);
        }
        if (currentUserLoc) {
          techs.forEach(t => {
            const coords = (t.lat && t.lng) ? { lat: t.lat, lng: t.lng } : this._lookupCityCoords(t.city);
            if (coords) {
              t.distance_km = calculateHaversine(currentUserLoc.lat, currentUserLoc.lng, coords.lat, coords.lng);
            }
          });
          if (radiusVal !== "all") {
            const maxKm = parseFloat(radiusVal);
            techs = techs.filter(t => t.distance_km != null && t.distance_km <= maxKm);
          }
          techs.sort((a, b) => (a.distance_km ?? 9999) - (b.distance_km ?? 9999));
        }

        lastLoadedTechs = techs;
        updateMapMarkers(techs, currentUserLoc);
        loadNearbyPublicShops();

        if (techs.length === 0) {
          grid.innerHTML = `
            <div class="card" style="text-align: center; grid-column: 1/-1; padding: 48px 24px; background: var(--color-card); border: 1px solid var(--color-border);">
              <i class="fas fa-tools" style="font-size: 34px; color: var(--color-accent); margin-bottom: 14px;"></i>
              <h3 style="color: var(--color-text-main); font-size: 18px; margin-bottom: 8px;">${isAr ? 'لا توجد مراكز أو فنيون معتمدون مطابقون لهذا البحث حالياً' : 'No verified technicians or repair centers match right now'}</h3>
              <p style="color: #94A3B8; font-size: 13.5px; max-width: 520px; margin: 0 auto 20px;">
                ${isAr ? 'نحن نعرض فقط الفنيين ومراكز الصيانة الحقيقية التي تم التحقق منها واعتمادها من قِبل الإدارة (بدون أي بيانات افتراضية).' : 'Only authentic repair centers and certified technicians verified and approved by administration appear here.'}
              </p>
              <button class="btn btn-primary btn-sm" onclick="app.showAuthModal('register', 'technician')">
                <i class="fas fa-user-plus"></i> ${isAr ? 'سجل كفني أو مركز صيانة معتمد' : 'Register as a Technician or Repair Center'}
              </button>
            </div>
          `;
          return;
        }

        grid.innerHTML = techs.map(t => {
          const bName = t.business_name || t.name || "";
          const tName = t.technician_name || t.name || "";
          const safeName = (bName || "").replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/"/g, "&quot;");
          const rating = Number(t.rating) || 0;
          const reviews = Number(t.reviews_count || t.total_reviews || 0);
          const expYears = t.experience_years;
          const specs = Array.isArray(t.specializations) ? t.specializations : (typeof t.specializations === 'string' ? t.specializations.split(',').map(x => x.trim()).filter(Boolean) : []);
          const hasHome = !!(t.home_service_available || t.home_service);

          return `
          <div class="tech-card" style="display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; margin-bottom: 12px;">
                <div style="display: flex; gap: 12px; align-items: center;">
                  <div class="tech-avatar">${this._esc((bName || 'T').charAt(0).toUpperCase())}</div>
                  <div>
                    <h4 style="font-size: 16px; margin-bottom: 3px; color: var(--color-text-main);">${this._esc(bName)}</h4>
                    <span style="font-size: 12px; color: var(--color-text-muted); display: inline-flex; align-items: center; gap: 5px;">
                      <i class="fas fa-check-circle" style="color: var(--color-success);"></i>
                      ${this._esc(tName)} · ${t.is_verified_center ? (isAr ? 'مركز صيانة معتمد' : 'Verified Center') : (isAr ? 'فني معتمد' : 'Certified Tech')}
                    </span>
                  </div>
                </div>
                ${hasHome ? `<span class="tech-home-badge"><i class="fas fa-home"></i> ${isAr ? 'خدمة منزلية' : 'Home'}</span>` : ''}
              </div>

              <div style="display: flex; gap: 12px; font-size: 12px; color: var(--color-text-muted); margin-bottom: 12px; flex-wrap: wrap;">
                ${t.city ? `<span><i class="fas fa-map-marker-alt" style="color: var(--color-accent);"></i> ${this._esc(t.city)}${t.address ? ` - ${this._esc(t.address)}` : ''}</span>` : ''}
                ${t.distance_km != null ? `<span><i class="fas fa-route" style="color: var(--color-success);"></i> ${Number(t.distance_km).toFixed(1)} ${isAr ? 'كم' : 'km'}</span>` : ''}
                <button type="button" onclick="app.showTechReviewsModal('${this._esc(t.id)}', '${safeName}')" style="background: none; border: none; padding: 0; color: inherit; cursor: pointer; font: inherit; display: inline-flex; align-items: center; gap: 4px; text-decoration: underline dotted;">
                  ${reviews > 0
                    ? `<i class="fas fa-star" style="color: #F59E0B;"></i> <b style="color: var(--color-warning);">${rating.toFixed(1)}</b> (${reviews})`
                    : `<i class="fas fa-star" style="color: #64748B;"></i> ${isAr ? 'جديد · التقييمات' : 'New · Reviews'}`
                  }
                </button>
                ${expYears ? `<span><i class="fas fa-award" style="color: #60A5FA;"></i> ${this._esc(expYears)} ${isAr ? 'سنوات خبرة' : 'yrs exp'}</span>` : ''}
                ${t.working_hours ? `<span><i class="fas fa-clock" style="color: #94A3B8;"></i> ${this._esc(t.working_hours)}</span>` : ''}
                ${t.phone ? `<span dir="ltr"><i class="fas fa-phone-alt" style="color: var(--color-success);"></i> ${this._esc(t.phone)}</span>` : ''}
              </div>

              ${t.bio ? `<p style="font-size: 13px; color: #94A3B8; margin-bottom: 14px; line-height: 1.5;">${this._esc(t.bio)}</p>` : ''}

              ${specs.length > 0 ? `
                <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 18px;">
                  ${specs.map(s => `<span class="tag">${this._esc(s)}</span>`).join('')}
                </div>
              ` : ''}
            </div>

            <div style="display: flex; gap: 8px; align-items: stretch;">
              <button class="btn btn-primary btn-sm" style="flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px;" onclick="app.showBookTechnicianModal('${this._esc(t.id)}', '${safeName}')">
                <i class="fas fa-paper-plane"></i>
                <span>${isAr ? 'طلب صيانة فوري' : 'Request Repair'}</span>
              </button>
              <button type="button" class="btn btn-outline btn-sm" style="display: inline-flex; align-items: center; gap: 6px;" onclick="app.showTechReviewsModal('${this._esc(t.id)}', '${safeName}')">
                <i class="fas fa-star" style="color: #F59E0B;"></i>
                <span data-i18n="tech_view_reviews_btn">${isAr ? 'التقييمات' : 'Reviews'}</span>${reviews > 0 ? ` (${reviews})` : ''}
              </button>
            </div>
          </div>
        `;
        }).join('');
      } catch (err) {
        grid.innerHTML = `<div style="color: var(--color-danger); text-align: center; grid-column: 1/-1;">Error loading technicians: ${this._esc(err.message)}</div>`;
      }
    };

    container.querySelector("#techCityFilter").addEventListener("change", loadTechs);
    container.querySelector("#techSpecFilter").addEventListener("change", loadTechs);
    container.querySelector("#techTypeFilter").addEventListener("change", loadTechs);
    container.querySelector("#techRadiusFilter").addEventListener("change", loadTechs);
    container.querySelector("#techHomeOnly").addEventListener("change", loadTechs);

    const gmToggleBtn = container.querySelector("#toggleGoogleMapsBtn");
    if (gmToggleBtn) {
      gmToggleBtn.addEventListener("click", () => {
        showingGoogleMap = !showingGoogleMap;
        const leafEl = container.querySelector("#techMap");
        const gmWrap = container.querySelector("#googleMapsEmbedContainer");
        if (leafEl && gmWrap) {
          leafEl.style.display = showingGoogleMap ? "none" : "block";
          gmWrap.style.display = showingGoogleMap ? "block" : "none";
        }
        gmToggleBtn.innerHTML = showingGoogleMap
          ? `<i class="fas fa-map"></i> <span>${isAr ? 'العودة لخريطة المنصة' : 'Back to Platform Map'}</span>`
          : `<i class="fab fa-google" style="color: #EA4335;"></i> <span>${isAr ? 'عرض خرائط جوجل (Google Maps)' : 'Switch to Google Maps'}</span>`;
        if (showingGoogleMap) {
          syncGoogleMapsUrls(getActiveMapCoords());
        } else if (leafMap) {
          setTimeout(() => { try { leafMap.invalidateSize(); } catch (e) {} }, 100);
        }
      });
    }

    const locBtn = container.querySelector("#useLocationBtn");
    if (locBtn) {
      locBtn.addEventListener("click", () => {
        if (!navigator.geolocation) {
          alert(isAr ? "متصفحك لا يدعم تحديد الموقع الجغرافي." : "Geolocation is not supported by your browser.");
          return;
        }
        locBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${isAr ? 'جاري التحديد...' : 'Locating...'}`;
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            locBtn.innerHTML = `<i class="fas fa-check"></i> ${isAr ? 'تم تحديد موقعك الفعلي' : 'Real Location Active'}`;
            currentUserLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            loadTechs();
          },
          () => {
            locBtn.innerHTML = `<i class="fas fa-exclamation-triangle" style="color: #F59E0B;"></i> ${isAr ? 'تعذر الوصول للموقع (اختر المدينة يدوياً)' : 'Location Denied (Select City)'}`;
          }
        );
      });
    }

    loadTechs();
  }

  showBookingModal(techId, techName) {
    return this.showBookTechnicianModal(techId, techName);
  }

  // ==========================================
  // VIEW: PRIVACY POLICY & DATA PROTECTION
  // ==========================================
  renderPrivacy(container) {
    const isAr = window.i18n.currentLang === "ar";
    container.innerHTML = `
      <section style="padding: 40px 0 80px;">
        <div class="container" style="max-width: 860px;">
          <div style="margin-bottom: 24px;">
            <button class="btn btn-outline btn-sm" onclick="app.navigate('home')">
              <i class="fas fa-arrow-right"></i> ${isAr ? 'العودة للرئيسية' : 'Back to Home'}
            </button>
          </div>
          
          <div style="background: var(--color-card); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 36px; box-shadow: 0 8px 32px rgba(0,0,0,0.4);">
            <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 24px; border-bottom: 1px solid var(--color-border); padding-bottom: 20px;">
              <div style="width: 52px; height: 52px; border-radius: 50%; background: rgba(16, 185, 129, 0.15); color: #10B981; display: flex; align-items: center; justify-content: center; font-size: 24px;">
                <i class="fas fa-user-shield"></i>
              </div>
              <div>
                <h1 style="font-size: 26px; color: var(--color-text-main); margin-bottom: 4px;">
                  ${isAr ? 'سياسة الخصوصية وحماية بيانات المستخدم' : 'Privacy & Data Protection Policy'}
                </h1>
                <p style="font-size: 13px; color: #94A3B8;">
                  ${isAr ? 'وثيقة الحماية الرسمية لمنصة ByteForce — الالتزام بالشفافية الكاملة وتشفير البيانات والامتثال لأخلاقيات الذكاء الاصطناعي.' : 'Official ByteForce Privacy Document — Total Transparency, Encryption & Ethical AI Standards.'}
                </p>
              </div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 20px; font-size: 14px; color: var(--color-text-body); line-height: 1.8;">
              <div style="background: var(--color-surface-alt); border-radius: var(--radius-md); padding: 18px; border: 1px solid var(--color-border);">
                <h3 style="color: var(--color-accent); font-size: 16px; margin-bottom: 8px;">
                  <i class="fas fa-lock"></i> ${isAr ? '1. التشفير التام للبيانات (TLS 1.3)' : '1. End-to-End Encryption'}
                </h3>
                <p>
                  ${isAr ? 'تتم جميع طلبات التشخيص واستعلامات فحص الأعطال عبر قنوات مشفرة بمعايير TLS 1.3 العالية. لا يمكن لأي طرف وسيط الاطلاع على تفاصيل أجهزتك أو قراءات التليميتري.' : 'All diagnostic triage calls operate over strict TLS 1.3 encrypted tunnels, guaranteeing zero tampering or snooping.'}
                </p>
              </div>

              <div style="background: var(--color-surface-alt); border-radius: var(--radius-md); padding: 18px; border: 1px solid var(--color-border);">
                <h3 style="color: #10B981; font-size: 16px; margin-bottom: 8px;">
                  <i class="fas fa-ban"></i> ${isAr ? '2. حظر جمع الصور الشخصية أو البيانات الحساسة' : '2. Zero Personal Files or Photos Retention'}
                </h3>
                <p>
                  ${isAr ? 'محرك ByteForce مصمم هندسياً لتشخيص الأعطال العتادية والبرمجية فقط. لا نطلب ولا نقوم بتخزين صور شخصية، أو محتويات الأقراص، أو ملفات النظام، أو كلمات المرور.' : 'ByteForce never requests or stores personal media, filesystem contents, credentials, or private identity records.'}
                </p>
              </div>

              <div style="background: var(--color-surface-alt); border-radius: var(--radius-md); padding: 18px; border: 1px solid var(--color-border);">
                <h3 style="color: #F59E0B; font-size: 16px; margin-bottom: 8px;">
                  <i class="fas fa-trash-alt"></i> ${isAr ? '3. حق المستخدم في حذف كافة البيانات فوراً' : '3. Immediate Data Purge & User Sovereignty'}
                </h3>
                <p>
                  ${isAr ? 'يحق لكل مستخدم حذف تقارير التشخيص وسجل أجهزته بالكامل في أي وقت بضغطة زر واحدة، ويتم مسح السجلات المرتبطة نهائياً من قاعدة البيانات والتخزين المؤقت.' : 'Users maintain unrestricted rights to permanently purge diagnosis histories and registered devices from the database anytime.'}
                </p>
              </div>

              <div style="background: var(--color-surface-alt); border-radius: var(--radius-md); padding: 18px; border: 1px solid var(--color-border);">
                <h3 style="color: #A855F7; font-size: 16px; margin-bottom: 8px;">
                  <i class="fas fa-hand-holding-heart"></i> ${isAr ? '4. الالتزام بحق الإصلاح ودعم الاستدامة' : '4. Supporting the Right to Repair & E-Waste Reduction'}
                </h3>
                <p>
                  ${isAr ? 'الهدف الأساسي لمنصة ByteForce هو تمكين المستهلكين والفنيين من استكشاف الأعطال وحلها استناداً إلى بيانات موثوقة من Open Repair Alliance و MyFixit لتقليل النفايات الإلكترونية وإطالة العمر الافتراضي للأجهزة.' : 'ByteForce champions consumer empowerment through verified repair open data, striving to minimize worldwide electronic waste.'}
                </p>
              </div>
            </div>

            <div style="margin-top: 28px; text-align: center;">
              <button class="btn btn-primary" onclick="app.navigate('diagnose')">
                <i class="fas fa-stethoscope"></i> ${isAr ? 'بدء الفحص والتشخيص الآن' : 'Start Diagnostic Triage Now'}
              </button>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  // ==========================================
  // VIEW: TERMS OF SERVICE & ENGINEERING SAFETY
  // ==========================================
  renderTerms(container) {
    const isAr = window.i18n.currentLang === "ar";
    container.innerHTML = `
      <section style="padding: 40px 0 80px;">
        <div class="container" style="max-width: 860px;">
          <div style="margin-bottom: 24px;">
            <button class="btn btn-outline btn-sm" onclick="app.navigate('home')">
              <i class="fas fa-arrow-right"></i> ${isAr ? 'العودة للرئيسية' : 'Back to Home'}
            </button>
          </div>

          <div style="background: var(--color-card); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 36px; box-shadow: 0 8px 32px rgba(0,0,0,0.4);">
            <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 24px; border-bottom: 1px solid var(--color-border); padding-bottom: 20px;">
              <div style="width: 52px; height: 52px; border-radius: 50%; background: rgba(56, 189, 248, 0.15); color: var(--color-accent); display: flex; align-items: center; justify-content: center; font-size: 24px;">
                <i class="fas fa-file-contract"></i>
              </div>
              <div>
                <h1 style="font-size: 26px; color: var(--color-text-main); margin-bottom: 4px;">
                  ${isAr ? 'شروط الاستخدام وإخلاء المسؤولية الهندسية' : 'Terms of Service & Safety Protocols'}
                </h1>
                <p style="font-size: 13px; color: #94A3B8;">
                  ${isAr ? 'المحددات التنظيمية والبروتوكولات الوقائية لإجراءات الفحص والتفكيك.' : 'Regulatory constraints, safety requirements and open-source attributions.'}
                </p>
              </div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 20px; font-size: 14px; color: var(--color-text-body); line-height: 1.8;">
              <div style="background: var(--color-surface-alt); border-radius: var(--radius-md); padding: 18px; border: 1px solid var(--color-border);">
                <h3 style="color: #EF4444; font-size: 16px; margin-bottom: 8px;">
                  <i class="fas fa-exclamation-triangle"></i> ${isAr ? '1. إخلاء المسؤولية الفنية وبروتوكولات الأمان' : '1. Technical Disclaimer & Mandatory Safety'}
                </h3>
                <p>
                  ${isAr ? 'التقارير الصادرة عن ByteForce استرشادية مبنية على بيانات واقعية. يجب دائماً فصل مصادر التيار الكهربائي وفصل كابلات البطارية تماماً واستخدام أساور تفريغ الشحنات (ESD) قبل فتح أي جهاز.' : 'ByteForce reports provide empirical guidance. Disconnect power supplies and detach batteries before disassembly, wearing ESD protection.'}
                </p>
              </div>

              <div style="background: var(--color-surface-alt); border-radius: var(--radius-md); padding: 18px; border: 1px solid var(--color-border);">
                <h3 style="color: #F59E0B; font-size: 16px; margin-bottom: 8px;">
                  <i class="fas fa-fire"></i> ${isAr ? '2. بروتوكول الحالات الحرجة وبطاريات الليثيوم' : '2. Critical Hazards Protocol'}
                </h3>
                <p>
                  ${isAr ? 'في حال وجود انتفاخ ببطارية الليثيوم، أو انبعاث حرارة شديدة، أو اشتباه بتلف في دوائر الجهد المرتفع، يحظر فك الجهاز منزلياً ويجب تسليمه فوراً لفني معتمد أو مركز صيانة متخصص.' : 'Swollen lithium batteries or high-voltage circuits pose combustion hazards. Home repairs are strictly prohibited; hand over to certified specialists.'}
                </p>
              </div>

              <div style="background: var(--color-surface-alt); border-radius: var(--radius-md); padding: 18px; border: 1px solid var(--color-border);">
                <h3 style="color: var(--color-accent); font-size: 16px; margin-bottom: 8px;">
                  <i class="fas fa-balance-scale"></i> ${isAr ? '3. رخص المصادر المفتوحة والنسب العلمي' : '3. Open Source Licenses & Dataset Attributions'}
                </h3>
                <p>
                  ${isAr ? 'تعتمد المنصة على: سجلات Open Repair Alliance بموجب رخصة ODbL، وأدلة MyFixit بموجب رخصة CC BY-NC-SA 3.0، وبيانات Backblaze Telemetry المفتوحة. جميع الحقوق الفكرية محفوظة لمطوري ومسجلي هذه المصادر العالمية المعتمدة.' : 'ByteForce utilizes ORA (ODbL), MyFixit (CC BY-NC-SA 3.0), and Backblaze telemetry under open research licenses, strictly honoring source attributions.'}
                </p>
              </div>
            </div>

            <div style="margin-top: 28px; text-align: center;">
              <button class="btn btn-outline" onclick="app.navigate('home')">
                ${isAr ? 'العودة للرئيسية' : 'Back to Home'}
              </button>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  // ==========================================
  // VIEW: USER / TECHNICIAN DASHBOARD
  // ==========================================

  // ==========================================
  // REQUEST LIFECYCLE & APPOINTMENTS (BYTEFORCE SUITE)
  // ==========================================
  async techAcceptRequest(reqId) {
    const isAr = window.i18n.currentLang === "ar";
    const estInput = document.getElementById(`estInput_${reqId}`);
    const estimate = estInput ? parseFloat(estInput.value) : null;
    if (estimate === null || isNaN(estimate) || estimate <= 0) {
      alert(isAr ? "يرجى تحديد التكلفة التقديرية المبدئية للإصلاح" : "Please provide an estimated cost");
      return;
    }
    await window.api.updateRequestStatus(reqId, "ACCEPTED", {
      estimate: estimate,
      actor: "Technician",
      note: isAr ? `تم قبول الطلب بتقدير مبدئي: ${estimate} ج.م` : `Accepted with estimate: ${estimate} EGP`
    });
    this.addNotification(
      isAr ? "تم قبول طلب الصيانة" : "Repair Request Accepted",
      isAr ? `تم قبول الطلب #${reqId} وتحديد التكلفة التقديرية (${estimate} ج.م)` : `Request #${reqId} accepted with estimate (${estimate} EGP)`,
      "success"
    );
    this.renderDashboard(document.getElementById("mainContent"));
  }

  async techRejectRequest(reqId) {
    const isAr = window.i18n.currentLang === "ar";
    if (!confirm(isAr ? "هل أنت متأكد من الاعتذار عن هذا الطلب؟" : "Are you sure you want to decline this request?")) return;
    await window.api.updateRequestStatus(reqId, "CANCELED", {
      actor: "Technician",
      note: isAr ? "تم الاعتذار عن الطلب من قِبل الفني" : "Declined by technician"
    });
    this.addNotification(
      isAr ? "تم الاعتذار عن الطلب" : "Request Declined",
      isAr ? `تم الاعتذار عن طلب الصيانة #${reqId}` : `Request #${reqId} was declined`,
      "warning"
    );
    this.renderDashboard(document.getElementById("mainContent"));
  }

  async custBookAppointment(reqId) {
    const isAr = window.i18n.currentLang === "ar";
    const apptInput = document.getElementById(`apptInput_${reqId}`);
    const apptVal = apptInput ? apptInput.value : "";
    if (!apptVal) {
      alert(isAr ? "يرجى اختيار تاريخ ووقت مناسب للموعد" : "Please select appointment date and time");
      return;
    }
    await window.api.updateRequestStatus(reqId, "APPOINTMENT_CONFIRMED", {
      appointment: apptVal,
      actor: "Customer",
      note: isAr ? `تم تأكيد موعد الصيانة: ${apptVal}` : `Appointment booked for ${apptVal}`
    });
    this.addNotification(
      isAr ? "تم تأكيد موعد الصيانة" : "Appointment Confirmed",
      isAr ? `تم تأكيد الموعد للطلب #${reqId} بتاريخ ${apptVal}` : `Appointment confirmed for #${reqId} at ${apptVal}`,
      "success"
    );
    this.renderDashboard(document.getElementById("mainContent"));
  }

  async custCancelRequest(reqId) {
    const isAr = window.i18n.currentLang === "ar";
    if (!confirm(isAr ? "هل أنت متأكد من إلغاء هذا الطلب؟" : "Are you sure you want to cancel this request?")) return;
    await window.api.updateRequestStatus(reqId, "CANCELED", {
      actor: "Customer",
      note: isAr ? "تم إلغاء الطلب من قِبل العميل" : "Cancelled by customer"
    });
    this.renderDashboard(document.getElementById("mainContent"));
  }

  async techReceiveDevice(reqId) {
    const isAr = window.i18n.currentLang === "ar";
    await window.api.updateRequestStatus(reqId, "DEVICE_RECEIVED", {
      actor: "Technician",
      note: isAr ? "تم استلام الجهاز فعلياً في مركز الصيانة" : "Device physically received"
    });
    this.addNotification(
      isAr ? "تم استلام الجهاز" : "Device Received",
      isAr ? `تم توثيق استلام جهاز الطلب #${reqId} في المركز` : `Device for #${reqId} received at lab`,
      "info"
    );
    this.renderDashboard(document.getElementById("mainContent"));
  }

  async techStartDiagnosis(reqId) {
    const isAr = window.i18n.currentLang === "ar";
    await window.api.updateRequestStatus(reqId, "DIAGNOSIS_IN_PROGRESS", {
      actor: "Technician",
      note: isAr ? "بدء الفحص المخبري والتشخيص الفعلي" : "Hardware diagnostic inspection started"
    });
    this.renderDashboard(document.getElementById("mainContent"));
  }

  async techStartRepair(reqId) {
    const isAr = window.i18n.currentLang === "ar";
    await window.api.updateRequestStatus(reqId, "REPAIR_IN_PROGRESS", {
      actor: "Technician",
      note: isAr ? "بدء عملية الإصلاح وتغيير القطع" : "Repair and soldering in progress"
    });
    this.renderDashboard(document.getElementById("mainContent"));
  }

  async techRequestApproval(reqId) {
    const isAr = window.i18n.currentLang === "ar";
    const extraInput = document.getElementById(`extraEstInput_${reqId}`);
    const extra = extraInput ? parseFloat(extraInput.value) : null;
    if (extra === null || isNaN(extra) || extra <= 0) {
      alert(isAr ? "يرجى كتابة التكلفة الإضافية المطلوبة" : "Please provide the additional required cost");
      return;
    }
    await window.api.updateRequestStatus(reqId, "WAITING_FOR_CUSTOMER_APPROVAL", {
      extra_cost: extra,
      actor: "Technician",
      note: isAr ? `مطلوب موافقة العميل على تكلفة إضافية: ${extra} ج.م` : `Approval requested for additional ${extra} EGP`
    });
    this.addNotification(
      isAr ? "مطلوب موافقة العميل" : "Approval Requested",
      isAr ? `تم طلب موافقة العميل للطلب #${reqId} على تكلفة إضافية (${extra} ج.م)` : `Approval requested for #${reqId} (${extra} EGP)`,
      "warning"
    );
    this.renderDashboard(document.getElementById("mainContent"));
  }

  async custApproveExtra(reqId) {
    const isAr = window.i18n.currentLang === "ar";
    await window.api.updateRequestStatus(reqId, "REPAIR_IN_PROGRESS", {
      actor: "Customer",
      note: isAr ? "وافق العميل على التكلفة وبدء الإصلاح فوراً" : "Customer approved additional cost"
    });
    this.addNotification(
      isAr ? "تمت موافقة العميل" : "Customer Approved",
      isAr ? `وافق العميل على تكلفة الطلب #${reqId}` : `Customer approved cost for #${reqId}`,
      "success"
    );
    this.renderDashboard(document.getElementById("mainContent"));
  }

  async techCompleteRepair(reqId) {
    const isAr = window.i18n.currentLang === "ar";
    const costInput = document.getElementById(`finalCostInput_${reqId}`);
    const faultInput = document.getElementById(`actualFaultInput_${reqId}`);
    const finalCost = costInput ? parseFloat(costInput.value) : null;
    const actualFault = faultInput ? faultInput.value.trim() : "";
    if (finalCost === null || isNaN(finalCost) || finalCost < 0) {
      alert(isAr ? "يرجى تحديد التكلفة النهائية الفعلية" : "Please enter the final actual cost");
      return;
    }
    await window.api.updateRequestStatus(reqId, "COMPLETED", {
      final_cost: finalCost,
      actual_fault: actualFault || (isAr ? "تم الإصلاح بنجاح" : "Repaired successfully"),
      actor: "Technician",
      note: isAr ? `اكتمل الإصلاح بنجاح. التكلفة: ${finalCost} ج.م` : `Repair completed. Final cost: ${finalCost} EGP`
    });
    this.addNotification(
      isAr ? "اكتمل الإصلاح بنجاح! 🎉" : "Repair Completed! 🎉",
      isAr ? `جهازك للطلب #${reqId} جاهز للاستلام. التكلفة النهائية: ${finalCost} ج.م` : `Device for #${reqId} is ready. Final cost: ${finalCost} EGP`,
      "success"
    );
    this.renderDashboard(document.getElementById("mainContent"));
  }

  setReviewStar(reqId, stars) {
    const val = Math.max(1, Math.min(5, parseInt(stars, 10) || 5));
    const hidden = document.getElementById(`ratingSelect_${reqId}`);
    if (hidden) hidden.value = String(val);
    const row = document.getElementById(`starRow_${reqId}`);
    if (row) {
      row.querySelectorAll("[data-star]").forEach(btn => {
        const s = parseInt(btn.getAttribute("data-star"), 10);
        const active = s <= val;
        btn.style.color = active ? "#F59E0B" : "#475569";
        btn.classList.toggle("active", active);
      });
    }
  }

  async custSubmitReview(reqId) {
    const isAr = window.i18n.currentLang === "ar";
    const starSelect = document.getElementById(`ratingSelect_${reqId}`);
    const commentInput = document.getElementById(`reviewComment_${reqId}`);
    const rating = starSelect ? Math.max(1, Math.min(5, parseInt(starSelect.value, 10) || 5)) : 5;
    const comment = commentInput ? commentInput.value.trim() : "";
    try {
      await window.api.submitRepairReview(reqId, rating, comment);
      this.addNotification(
        isAr ? "شكراً لتقييمك" : "Thank you for reviewing",
        isAr ? `تم تسجيل تقييمك (${rating} نجوم) للطلب #${reqId}` : `Review recorded for #${reqId}`,
        "info"
      );
      this.renderDashboard(document.getElementById("mainContent"));
    } catch (err) {
      alert((isAr ? "تعذر حفظ التقييم: " : "Failed to save review: ") + (err?.message || err));
    }
  }

  async showTechReviewsModal(techId, techName = "") {
    if (!this._requireAuth("technicians")) return;
    const isAr = window.i18n.currentLang === "ar";
    this.openModal(`
      <div style="text-align: center; padding: 28px 10px;">
        <div class="spinner" style="margin: 0 auto 12px;"></div>
        <p style="color: #94A3B8; font-size: 14px;">${isAr ? 'جاري تحميل التقييمات المعتمدة...' : 'Loading verified reviews...'}</p>
      </div>
    `);

    const data = await window.api.getTechnicianReviews(techId);
    const avg = Number(data?.average_rating || 0);
    const total = Number(data?.reviews_count || 0);
    const breakdown = data?.rating_breakdown || { "5": 0, "4": 0, "3": 0, "2": 0, "1": 0 };
    const reviews = Array.isArray(data?.reviews) ? data.reviews : [];

    const barsHtml = [5, 4, 3, 2, 1].map(star => {
      const cnt = Number(breakdown[String(star)] || 0);
      const pct = total > 0 ? Math.round((cnt / total) * 100) : 0;
      return `
        <div style="display: flex; align-items: center; gap: 10px; font-size: 12px;">
          <span style="width: 36px; color: var(--color-warning); font-weight: 700;">${star} ★</span>
          <div style="flex: 1; height: 8px; background: var(--color-surface-alt); border-radius: 99px; overflow: hidden;">
            <div style="width: ${pct}%; height: 100%; background: linear-gradient(90deg, #F59E0B, #FBBF24);"></div>
          </div>
          <span style="width: 28px; text-align: end; color: #94A3B8;">${cnt}</span>
        </div>
      `;
    }).join("");

    const listHtml = reviews.length === 0
      ? `<div style="padding: 24px; text-align: center; color: #94A3B8; background: var(--color-surface-alt); border-radius: 10px; border: 1px dashed rgba(255,255,255,0.1);">
           <i class="fas fa-comment-slash" style="font-size: 24px; color: #64748B; margin-bottom: 8px; display: block;"></i>
           ${isAr ? 'لا توجد تقييمات معتمدة لهذا المركز حتى الآن — كن أول من يقيّم بعد إتمام الصيانة.' : 'No verified customer reviews yet for this center.'}
         </div>`
      : reviews.map(rev => {
          const stars = Math.max(0, Math.min(5, Math.round(Number(rev.rating || 0))));
          const starsStr = "★".repeat(stars) + "☆".repeat(5 - stars);
          const dateStr = rev.created_at ? String(rev.created_at).slice(0, 10) : "";
          return `
            <div style="padding: 14px; background: var(--color-card); border: 1px solid var(--color-border); border-radius: 10px;">
              <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 6px;">
                <strong style="color: var(--color-text-main); font-size: 14px;">${this._esc(rev.reviewer_name || (isAr ? 'عميل موثق' : 'Verified Customer'))}</strong>
                <span style="color: #F59E0B; font-size: 14px; letter-spacing: 1px;">${starsStr} <small style="color:#94A3B8;">(${Number(rev.rating || 0).toFixed(1)})</small></span>
              </div>
              ${rev.device_info ? `<div style="font-size: 12px; color: var(--color-accent); margin-bottom: 6px;"><i class="fas fa-microchip"></i> ${this._esc(rev.device_info)}</div>` : ''}
              ${rev.review_comment ? `<p style="font-size: 13px; color: var(--color-text-body); margin: 0 0 6px; line-height: 1.5;">${this._esc(rev.review_comment)}</p>` : ''}
              ${dateStr ? `<div style="font-size: 11px; color: #64748B;">${this._esc(dateStr)}</div>` : ''}
            </div>
          `;
        }).join("");

    this.openModal(`
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <div>
            <h3 style="margin: 0 0 4px; font-size: 18px;" data-i18n="reviews_modal_title">${isAr ? 'تقييمات العملاء الموثقة' : 'Verified Customer Reviews'}</h3>
            <div style="font-size: 13px; color: var(--color-accent); font-weight: 600;">${this._esc(techName || `#${techId}`)}</div>
          </div>
          <button type="button" class="btn btn-outline btn-sm" onclick="app.closeModal()">&times;</button>
        </div>

        <div style="display: grid; grid-template-columns: auto 1fr; gap: 18px; align-items: center; padding: 16px; background: rgba(245, 158, 11, 0.06); border: 1px solid rgba(245, 158, 11, 0.22); border-radius: 12px; margin-bottom: 16px;">
          <div style="text-align: center; min-width: 90px;">
            <div style="font-size: 32px; font-weight: 800; color: var(--color-warning); line-height: 1;">${avg.toFixed(1)}</div>
            <div style="font-size: 12px; color: #94A3B8; margin-top: 6px;">${total} ${isAr ? 'تقييم موثق' : 'verified reviews'}</div>
          </div>
          <div style="display: flex; flex-direction: column; gap: 5px;">
            ${barsHtml}
          </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 10px; max-height: 360px; overflow-y: auto;">
          ${listHtml}
        </div>
      </div>
    `);
  }

  showBookTechnicianModal(techId, techName) {
    const isAr = window.i18n.currentLang === "ar";
    if (!this._requireAuth("technicians", "سجّل دخولك أولاً لتقديم طلب صيانة.", "Please sign in first to submit a repair request.")) {
      return;
    }
    const user = window.api.getUser();
    const defaultDevice = this.currentReport ? `${this.currentReport.brand || ''} ${this.currentReport.model || ''} (${this.currentReport.device_category})`.trim() : "";
    const defaultCat = this.currentReport?.device_category || "Other";
    const content = `
      <div>
        <h3 style="font-size: 20px; color: var(--color-text-main); margin-bottom: 6px;">
          ${isAr ? `طلب صيانة لدى: ${techName}` : `Request Repair: ${techName}`}
        </h3>
        <p style="font-size: 13px; color: #94A3B8; margin-bottom: 18px;">
          ${isAr ? 'حدد جهازك واكتب وصف العطل وسيقوم الفني بتقديم التكلفة التقديرية فوراً.' : 'Describe the fault to receive an estimated quote directly from the technician.'}
        </p>

        <form id="directBookForm">
          <div class="form-group">
            <label class="form-label">${isAr ? 'نوع الجهاز وموديله' : 'Device Category & Model'}</label>
            <input type="text" id="directBookDevice" class="form-control" required value="${defaultDevice}" placeholder="${isAr ? 'مثال: iPhone 14 Pro أو Dell XPS 15' : 'e.g. iPhone 14 Pro or Dell XPS 15'}">
          </div>
          <div class="form-group">
            <label class="form-label">${isAr ? 'وصف المشكلة أو العطل' : 'Problem Description'}</label>
            <textarea id="directBookProblem" class="form-control" rows="3" required placeholder="${isAr ? 'صف ما حدث للجهاز أو الأعراض الظاهرة...' : 'Describe what happened or symptoms...'}"></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">${isAr ? 'رقم هاتفك للتواصل' : 'Contact Phone'}</label>
            <input type="tel" id="directBookPhone" class="form-control" placeholder="+20 10 ...">
          </div>
          <button type="submit" class="btn btn-primary btn-lg" style="width: 100%; margin-top: 10px;">
            <i class="fas fa-paper-plane"></i>
            <span>${isAr ? 'إرسال طلب الصيانة للفني' : 'Submit Repair Request'}</span>
          </button>
        </form>
      </div>
    `;

    this.openModal(content);

    document.getElementById("directBookForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const dev = document.getElementById("directBookDevice").value.trim();
      const prob = document.getElementById("directBookProblem").value.trim();
      const phone = document.getElementById("directBookPhone").value.trim();
      const submitBtn = e.target.querySelector("button[type='submit']");
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${isAr ? 'جاري إرسال الطلب...' : 'Submitting...'}`;

      try {
        await window.api.createRepairRequest({
          tech_profile_id: Number(techId) || null,
          technician_name: techName,
          technician_business: techName,
          device_category: defaultCat,
          device_info: dev,
          problem_summary: prob,
          customer_name: user.full_name || user.email,
          customer_phone: phone,
          diagnosis_id: this.currentReport?.report_id || null,
          status: "NEW"
        });
        this.closeModal();
        this.addNotification(
          isAr ? "تم إرسال طلب الصيانة" : "Repair Request Sent",
          isAr ? `تم إرسال طلب صيانة لجهازك (${dev}) إلى ${techName}` : `Request for ${dev} sent to ${techName}`,
          "success"
        );
        this.navigate("dashboard");
      } catch(err) {
        alert((isAr ? "فشل إرسال الطلب: " : "Failed to submit request: ") + err.message);
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i class="fas fa-paper-plane"></i> ${isAr ? 'إرسال طلب الصيانة للفني' : 'Submit Repair Request'}`;
      }
    });
  }

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
            <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
              ${this.isExclusiveAdmin(user) ? `
                <button class="btn btn-sm" onclick="app.navigate('admin')" style="background: rgba(239, 68, 68, 0.18); color: var(--color-danger); border: 1px solid rgba(239, 68, 68, 0.45); border-radius: 8px; font-weight: 700; padding: 8px 16px; font-size: 13px; display: inline-flex; align-items: center; gap: 8px; cursor: pointer;" title="لوحة تحكم الإدارة">
                  <i class="fas fa-shield-alt" style="color: #EF4444; font-size: 15px;"></i>
                  <span>${isAr ? 'فتح لوحة تحكم الإدارة (Admin Panel)' : 'Open Admin Control Center'}</span>
                </button>
              ` : ''}
              <button class="btn btn-primary" onclick="app.navigate('diagnose')">
                <i class="fas fa-plus"></i>
                <span data-i18n="hero_cta_diag">New Diagnosis</span>
              </button>
            </div>
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

    // 1. Load Requests (ByteForce Lifecycle Engine)
    try {
      const _allDashboardRequests = await window.api.getMyRequests();
      // Technicians only see the repair requests assigned to them.
      const requests = user.role === "technician"
        ? _allDashboardRequests.filter(r => r.technician_id && r.technician_id === user.id)
        : _allDashboardRequests;
      const reqContainer = container.querySelector("#dashRequestsList");
      if (requests.length === 0) {
        reqContainer.innerHTML = `<p style="color: var(--color-text-muted); font-size: 14px;">${window.i18n.t('dash_no_requests')}</p>`;
      } else {
        reqContainer.innerHTML = `
          <div style="display: flex; flex-direction: column; gap: 16px;">
            ${requests.map(r => {
              const isTech = (r.technician_id && r.technician_id === user.id) || (user.role === 'technician' && r.user_id !== user.id);
              const st = (r.status || 'NEW').toUpperCase();
              let badgeColor = '#64748B';
              let badgeBg = 'rgba(100, 116, 139, 0.15)';
              let statusLabel = st;

              if (st === 'NEW' || st === 'PENDING') {
                statusLabel = isAr ? 'طلب جديد / بانتظار الموافقة' : 'New / Awaiting Review';
                badgeColor = 'var(--color-accent)'; badgeBg = 'rgba(2, 132, 199, 0.12)';
              } else if (st === 'ACCEPTED') {
                statusLabel = isAr ? 'تم القبول (بانتظار تحديد الموعد)' : 'Accepted (Awaiting Appointment)';
                badgeColor = 'var(--color-secondary)'; badgeBg = 'rgba(37, 99, 235, 0.12)';
              } else if (st === 'APPOINTMENT_CONFIRMED') {
                statusLabel = isAr ? 'موعد الصيانة مؤكد' : 'Appointment Confirmed';
                badgeColor = 'var(--color-success)'; badgeBg = 'rgba(5, 150, 105, 0.12)';
              } else if (st === 'DEVICE_RECEIVED') {
                statusLabel = isAr ? 'تم استلام الجهاز بالورشة' : 'Device Received';
                badgeColor = 'var(--color-purple)'; badgeBg = 'rgba(124, 58, 237, 0.12)';
              } else if (st === 'DIAGNOSIS_IN_PROGRESS') {
                statusLabel = isAr ? 'جاري الفحص المخبري والتشخيص' : 'Diagnosis In Progress';
                badgeColor = 'var(--color-warning)'; badgeBg = 'rgba(217, 119, 6, 0.12)';
              } else if (st === 'WAITING_FOR_CUSTOMER_APPROVAL') {
                statusLabel = isAr ? 'بانتظار موافقة العميل على تكلفة إضافية' : 'Waiting Customer Approval';
                badgeColor = 'var(--color-danger)'; badgeBg = 'rgba(220, 38, 38, 0.12)';
              } else if (st === 'REPAIR_IN_PROGRESS') {
                statusLabel = isAr ? 'جاري الإصلاح واللحام' : 'Repair In Progress';
                badgeColor = 'var(--color-secondary)'; badgeBg = 'rgba(37, 99, 235, 0.12)';
              } else if (st === 'COMPLETED') {
                statusLabel = isAr ? 'اكتمل الإصلاح بنجاح ✓' : 'Completed ✓';
                badgeColor = 'var(--color-success)'; badgeBg = 'rgba(5, 150, 105, 0.15)';
              } else if (st === 'CANCELED' || st === 'CANCELLED') {
                statusLabel = isAr ? 'ملغي' : 'Canceled';
                badgeColor = 'var(--color-text-muted)'; badgeBg = 'rgba(100, 116, 139, 0.12)';
              }

              return `
                <div class="card" style="padding: 18px; border: 1px solid var(--color-border); background: var(--color-card); border-radius: 10px;">
                  <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 12px;">
                    <div>
                      <span style="font-weight: 700; color: var(--color-text-main); font-size: 16px;">#${this._esc(r.id)} · ${this._esc(r.device_info || 'Device')}</span>
                      <span style="color: #64748B; font-size: 13px; margin-inline-start: 8px;">(${this._esc(isTech ? (r.customer_name || 'Customer') : (r.technician_business || r.technician_name || 'Technician'))})</span>
                    </div>
                    <span class="tag" style="background: ${badgeBg}; color: ${badgeColor}; border: 1px solid ${badgeColor}40; font-weight: 600; font-size: 12px;">
                      ${this._esc(statusLabel)}
                    </span>
                  </div>

                  <p style="color: #94A3B8; font-size: 13px; margin-bottom: 10px; line-height: 1.5;">
                    <i class="fas fa-info-circle" style="color: var(--color-accent); margin-inline-end: 6px;"></i>${this._esc(r.problem_summary || '')}
                  </p>

                  <div style="display: flex; gap: 16px; flex-wrap: wrap; font-size: 13px; color: var(--color-text-body); margin-bottom: 12px; background: var(--color-surface-alt); padding: 8px 12px; border-radius: 6px;">
                    ${r.estimate ? `<div><span style="color: #64748B;">${isAr ? 'التقدير المبدئي: ' : 'Estimate: '}</span><b>${this._esc(r.estimate)} ج.م</b></div>` : ''}
                    ${r.extra_cost ? `<div><span style="color: var(--color-danger);">${isAr ? 'تكلفة إضافية مطلوبة: ' : 'Extra Cost: '}</span><b>${this._esc(r.extra_cost)} ج.م</b></div>` : ''}
                    ${r.final_cost ? `<div><span style="color: #10B981;">${isAr ? 'التكلفة النهائية: ' : 'Final Cost: '}</span><b>${this._esc(r.final_cost)} ج.م</b></div>` : ''}
                    ${r.actual_fault ? `<div><span style="color: #64748B;">${isAr ? 'العطل الفعلي: ' : 'Actual Fault: '}</span><b>${this._esc(r.actual_fault)}</b></div>` : ''}
                    ${r.appointment ? `<div><span style="color: var(--color-accent);"><i class="fas fa-calendar-alt"></i> ${isAr ? 'الموعد: ' : 'Appointment: '}</span><b dir="ltr">${this._esc(r.appointment)}</b></div>` : ''}
                  </div>

                  <!-- Dynamic Action Boxes based on role & status -->
                  ${isTech && (st === 'NEW' || st === 'PENDING') ? `
                    <div class="req-action-box" style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                      <input type="number" id="estInput_${r.id}" placeholder="${isAr ? 'التكلفة التقديرية (ج.م)' : 'Estimated Cost (EGP)'}" class="form-control" style="max-width: 200px;">
                      <button class="btn btn-primary btn-sm" onclick="app.techAcceptRequest('${r.id}')">
                        <i class="fas fa-check"></i> ${isAr ? 'قبول وتحديد التكلفة' : 'Accept with Estimate'}
                      </button>
                      <button class="btn btn-outline btn-sm" style="color: #EF4444; border-color: rgba(239,68,68,0.3);" onclick="app.techRejectRequest('${r.id}')">
                        ${isAr ? 'اعتذار عن الطلب' : 'Decline'}
                      </button>
                    </div>
                  ` : ''}

                  ${!isTech && st === 'ACCEPTED' ? `
                    <div class="req-action-box" style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                      <span style="font-size: 13px; color: var(--color-text-main);">${isAr ? 'اختر موعد الصيانة:' : 'Select Appointment Slot:'}</span>
                      <input type="datetime-local" id="apptInput_${r.id}" class="form-control" style="max-width: 240px;" dir="ltr">
                      <button class="btn btn-primary btn-sm" onclick="app.custBookAppointment('${r.id}')">
                        <i class="fas fa-calendar-check"></i> ${isAr ? 'تأكيد حجز الموعد' : 'Confirm Slot'}
                      </button>
                      <button class="btn btn-outline btn-sm" style="color: #EF4444; border-color: rgba(239,68,68,0.3);" onclick="app.custCancelRequest('${r.id}')">
                        ${isAr ? 'إلغاء' : 'Cancel'}
                      </button>
                    </div>
                  ` : ''}

                  ${isTech && st === 'APPOINTMENT_CONFIRMED' ? `
                    <div class="req-action-box">
                      <button class="btn btn-primary btn-sm" onclick="app.techReceiveDevice('${r.id}')">
                        <i class="fas fa-box"></i> ${isAr ? 'تأكيد استلام الجهاز في المركز' : 'Confirm Device Received'}
                      </button>
                    </div>
                  ` : ''}

                  ${isTech && st === 'DEVICE_RECEIVED' ? `
                    <div class="req-action-box">
                      <button class="btn btn-primary btn-sm" onclick="app.techStartDiagnosis('${r.id}')">
                        <i class="fas fa-microscope"></i> ${isAr ? 'بدء الفحص والتشخيص الفعلي' : 'Start Diagnostic Inspection'}
                      </button>
                    </div>
                  ` : ''}

                  ${isTech && st === 'DIAGNOSIS_IN_PROGRESS' ? `
                    <div class="req-action-box" style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                      <button class="btn btn-primary btn-sm" onclick="app.techStartRepair('${r.id}')">
                        <i class="fas fa-tools"></i> ${isAr ? 'بدء الصيانة والإصلاح' : 'Start Repair'}
                      </button>
                      <input type="number" id="extraEstInput_${r.id}" placeholder="${isAr ? 'تكلفة إضافية مطلوبة (ج.م)' : 'Extra Cost (EGP)'}" class="form-control" style="max-width: 180px;">
                      <button class="btn btn-outline btn-sm" style="color: #F59E0B; border-color: rgba(245,158,11,0.4);" onclick="app.techRequestApproval('${r.id}')">
                        ${isAr ? 'طلب موافقة العميل على تكلفة إضافية' : 'Request Customer Approval'}
                      </button>
                    </div>
                  ` : ''}

                  ${!isTech && st === 'WAITING_FOR_CUSTOMER_APPROVAL' ? `
                    <div class="req-action-box" style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                      <span style="font-size: 13px; color: var(--color-danger);">${isAr ? 'طلب الفني تكلفة إضافية لمتابعة الإصلاح:' : 'Technician requested extra cost:'}</span>
                      <button class="btn btn-primary btn-sm" onclick="app.custApproveExtra('${r.id}')">
                        <i class="fas fa-check"></i> ${isAr ? 'الموافقة على التكلفة ومتابعة الصيانة' : 'Approve & Proceed'}
                      </button>
                      <button class="btn btn-outline btn-sm" style="color: #EF4444; border-color: rgba(239,68,68,0.3);" onclick="app.custCancelRequest('${r.id}')">
                        ${isAr ? 'رفض واستلام الجهاز' : 'Reject & Cancel'}
                      </button>
                    </div>
                  ` : ''}

                  ${isTech && st === 'REPAIR_IN_PROGRESS' ? `
                    <div class="req-action-box" style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                      <input type="number" id="finalCostInput_${r.id}" placeholder="${isAr ? 'التكلفة النهائية (ج.م)' : 'Final Cost (EGP)'}" class="form-control" style="max-width: 170px;">
                      <input type="text" id="actualFaultInput_${r.id}" placeholder="${isAr ? 'العطل الفعلي والقطع المستبدلة' : 'Actual Fault & Parts'}" class="form-control" style="flex: 1; min-width: 200px;">
                      <button class="btn btn-primary btn-sm" onclick="app.techCompleteRepair('${r.id}')">
                        <i class="fas fa-check-circle"></i> ${isAr ? 'إتمام الإصلاح وتوثيق التكلفة' : 'Complete Repair'}
                      </button>
                    </div>
                  ` : ''}

                  ${!isTech && st === 'COMPLETED' ? `
                    <div class="req-action-box">
                      ${r.reviewed ? `
                        <div style="color: #10B981; font-size: 13px; display: flex; flex-direction: column; gap: 6px;">
                          <div style="display: flex; align-items: center; gap: 8px;">
                            <i class="fas fa-star" style="color: #F59E0B;"></i>
                            <span>${isAr ? `تم تقييم هذه الخدمة (${this._esc(r.rating || 5)} من 5 نجوم). شكراً لمشاركتنا تجربتك!` : `You reviewed this repair (${this._esc(r.rating || 5)}/5 stars). Thank you!`}</span>
                          </div>
                          ${r.review_comment ? `<div style="font-size: 12.5px; color: var(--color-text-body); padding: 6px 10px; border-inline-start: 2px solid #F59E0B; background: var(--color-surface-alt); border-radius: 4px;">&ldquo;${this._esc(r.review_comment)}&rdquo;</div>` : ''}
                        </div>
                      ` : `
                        <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                          <span style="font-size: 13px; color: var(--color-text-main);">${isAr ? 'تقييم الفني والخدمة:' : 'Rate this repair:'}</span>
                          <div id="starRow_${this._esc(r.id)}" class="star-rating-row" style="display: inline-flex; gap: 4px; align-items: center;">
                            ${[1, 2, 3, 4, 5].map(s => `
                              <button type="button" data-star="${s}" onclick="app.setReviewStar('${this._esc(r.id)}', ${s})" style="background: none; border: none; cursor: pointer; font-size: 18px; color: #F59E0B; padding: 2px; line-height: 1;" title="${s}/5">
                                <i class="fas fa-star"></i>
                              </button>
                            `).join('')}
                          </div>
                          <input type="hidden" id="ratingSelect_${this._esc(r.id)}" value="5" />
                          <input type="text" id="reviewComment_${this._esc(r.id)}" placeholder="${isAr ? 'اكتب رأيك أو تعليقك على جودة الصيانة...' : 'Review comment...'}" class="form-control" style="flex: 1; min-width: 180px;">
                          <button type="button" class="btn btn-primary btn-sm" onclick="app.custSubmitReview('${this._esc(r.id)}')">
                            <i class="fas fa-star"></i> ${isAr ? 'إرسال التقييم' : 'Submit Review'}
                          </button>
                        </div>
                      `}
                    </div>
                  ` : ''}

                  <!-- Audit History Timeline -->
                  <details style="margin-top: 10px; font-size: 12px; color: #64748B;">
                    <summary style="cursor: pointer; color: var(--color-accent); outline: none;">
                      <i class="fas fa-history"></i> ${isAr ? 'سجل العمليات والجدول الزمني للطلب' : 'Audit Log & History Timeline'}
                    </summary>
                    <div style="padding: 8px 0; border-top: 1px solid var(--color-border); margin-top: 6px; display: flex; flex-direction: column; gap: 4px;">
                      ${(r.history || [{ at: r.created_at || 'Recently', new: st, actor: 'System', note: 'Created' }]).map(h => `
                        <div style="color: #94A3B8;">• <span dir="ltr">${h.at || ''}</span> — <b>${h.new || h.status}</b> ${h.note ? `(${h.note})` : ''} <span style="color: #64748B;">[${h.actor || 'System'}]</span></div>
                      `).join('')}
                    </div>
                  </details>

                  <!-- Chat between the customer and the technician of this request -->
                  <details style="margin-top: 10px; font-size: 13px;" ontoggle="if (this.open) app.loadRequestChat('${r.id}', this.querySelector('.req-chat-body'))">
                    <summary style="cursor: pointer; color: var(--color-accent); outline: none;">
                      <i class="fas fa-comments"></i> ${isAr ? 'المحادثة مع ' + (isTech ? 'العميل' : 'الفني') : 'Chat with ' + (isTech ? 'the customer' : 'the technician')}
                    </summary>
                    <div class="req-chat-body" style="padding: 10px 0; border-top: 1px solid var(--color-border); margin-top: 6px;">
                      <div style="color: #64748B; text-align: center; padding: 8px;"><i class="fas fa-spinner fa-spin"></i></div>
                    </div>
                    <div style="display: flex; gap: 8px; margin-top: 8px;">
                      <input type="text" id="chatInput_${r.id}" placeholder="${isAr ? 'اكتب رسالتك...' : 'Type your message...'}" class="form-control" style="flex: 1;">
                      <button class="btn btn-primary btn-sm" onclick="app.sendRequestChat('${r.id}')"><i class="fas fa-paper-plane"></i> ${isAr ? 'إرسال' : 'Send'}</button>
                    </div>
                  </details>
                </div>
              `;
            }).join('')}
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
            ${reports.map(rep => {
              const sev = rep.severity || rep.severity_level || "moderate";
              const desc = rep.description || rep.symptoms || rep.raw_description || rep.problem_category || "";
              return `
              <div style="padding: 16px; border: 1px solid var(--color-border); border-radius: var(--radius-sm); background: var(--color-card);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; gap: 8px;">
                  <strong style="font-size: 15px; color: var(--color-text-main);">${rep.brand || ''} ${rep.model || rep.device_category || ''}</strong>
                  <span class="severity-badge severity-${sev}">${sev}</span>
                </div>
                <p style="font-size: 13px; color: var(--color-text-muted); margin-bottom: 10px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                  ${desc}
                </p>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: 11px; color: var(--color-text-muted);">${new Date(rep.created_at).toLocaleDateString()}</span>
                  <button class="btn btn-outline btn-sm" onclick="app.viewSavedReport('${rep.id}')">
                    <i class="fas fa-eye"></i> ${isAr ? 'عرض' : 'View'}
                  </button>
                </div>
              </div>
            `;
            }).join('')}
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
            ${devices.map(d => {
              const cat = d.device_category || d.category || "";
              return `
              <div style="padding: 14px; border: 1px solid var(--color-border); background: var(--color-card); border-radius: var(--radius-sm); display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <strong style="font-size: 14px; display: block; color: var(--color-text-main);">${d.brand || ''} ${d.model || cat}</strong>
                  <span style="font-size: 12px; color: var(--color-text-muted);">${cat}${d.os_version ? ' · ' + d.os_version : ''}</span>
                </div>
                <button style="background: none; border: none; color: var(--color-danger); cursor: pointer;" onclick="app.deleteDevice('${d.id}')" title="${isAr ? 'حذف الجهاز' : 'Remove Device'}">
                  <i class="fas fa-trash-alt"></i>
                </button>
              </div>
            `;
            }).join('')}
          </div>
        `;
      }
    } catch (err) {
      container.querySelector("#dashDevicesList").innerHTML = `<span style="color: var(--color-danger);">${err.message}</span>`;
    }
  }


  // Per-request chat between the customer and the assigned technician.
  async loadRequestChat(reqId, bodyEl) {
    const isAr = window.i18n.currentLang === "ar";
    try {
      const messages = await window.api.getRequestMessages(reqId);
      const me = window.api.getUser();
      if (!bodyEl) return;
      if (!messages || messages.length === 0) {
        bodyEl.innerHTML = `<div style="color: #64748B; text-align: center; padding: 8px; font-size: 13px;">${isAr ? 'لا توجد رسائل بعد — ابدأ المحادثة.' : 'No messages yet — start the conversation.'}</div>`;
        return;
      }
      bodyEl.innerHTML = messages.map(m => {
        const mine = me && m.sender_id && String(m.sender_id) === String(me.id);
        const who = mine ? (isAr ? 'أنت' : 'You') : (m.sender_name || (m.sender_role === 'technician' ? (isAr ? 'الفني' : 'Technician') : (isAr ? 'العميل' : 'Customer')));
        return `<div style="display: flex; justify-content: ${mine ? 'flex-start' : 'flex-end'}; margin-bottom: 6px;">
          <div style="max-width: 85%; padding: 8px 12px; border-radius: 10px; font-size: 13px; line-height: 1.5; background: ${mine ? 'var(--color-accent)' : 'var(--color-surface-alt)'}; color: ${mine ? '#fff' : 'var(--color-text-main)'};">
            <div style="font-size: 11px; opacity: 0.8; margin-bottom: 2px;">${this._esc(who)}</div>
            ${this._esc(m.body || '')}
          </div>
        </div>`;
      }).join('');
    } catch (err) {
      if (bodyEl) bodyEl.innerHTML = `<div style="color: var(--color-danger); font-size: 13px; text-align: center; padding: 8px;">${this._esc(err.message || '')}</div>`;
    }
  }

  async sendRequestChat(reqId) {
    const input = document.getElementById(`chatInput_${reqId}`);
    const body = (input && input.value || "").trim();
    if (!body) return;
    try {
      await window.api.sendRequestMessage(reqId, body);
      if (input) input.value = "";
      const details = input ? input.closest("details") : null;
      const bodyEl = details ? details.querySelector(".req-chat-body") : null;
      await this.loadRequestChat(reqId, bodyEl);
    } catch (err) {
      alert(err.message || "Failed to send message.");
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
        report_id: rep.report_id || rep.report_code || rep.id,
        status: rep.status || "completed",
        device_category: rep.device_category,
        brand: rep.brand,
        model: rep.model,
        severity: rep.severity || rep.severity_level || "moderate",
        confidence_score: rep.confidence_score ?? 0.7,
        empirical_statistics: rep.empirical_statistics || rep.empirical_evidence || null,
        verified_guide: rep.verified_guide || null,
        extracted_symptoms: rep.extracted_symptoms || [],
        possible_causes: rep.possible_causes || [],
        troubleshooting_steps: rep.troubleshooting_steps || rep.recommended_steps || [],
        required_tools: rep.required_tools || [],
        estimated_difficulty: rep.estimated_difficulty || "moderate",
        estimated_minutes: rep.estimated_minutes || 30,
        safety_warnings_en: rep.safety_warnings || ["Always disconnect power sources before servicing."],
        safety_warnings_ar: rep.safety_warnings || ["تأكد دائماً من فصل مصدر الطاقة قبل الصيانة."],
        requires_technician: !!rep.requires_technician
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
              <option value="Smartphone">${window.i18n.t('cat_smartphone')}</option>
              <option value="Laptop">${window.i18n.t('cat_laptop')}</option>
              <option value="Desktop Computer">${window.i18n.t('cat_computer')}</option>
              <option value="Tablet">${window.i18n.t('cat_tablet')}</option>
              <option value="Gaming Console">${window.i18n.t('cat_console')}</option>
              <option value="Smart TV">${window.i18n.t('cat_tv')}</option>
              <option value="Storage">${window.i18n.t('cat_storage')}</option>
              <option value="Printer">${window.i18n.t('cat_printer')}</option>
              <option value="Audio">${window.i18n.t('cat_audio')}</option>
              <option value="Smartwatch">${window.i18n.t('cat_smartwatch')}</option>
              <option value="Camera">${window.i18n.t('cat_camera')}</option>
              <option value="Home Appliance">${window.i18n.t('cat_appliance')}</option>
              <option value="Other">${window.i18n.t('cat_other')}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">${isAr ? 'الشركة المصنعة' : 'Brand'}</label>
            <input type="text" id="newDevBrand" class="form-control" placeholder="e.g. Dell, Apple, Samsung" required>
          </div>
          <div class="form-group">
            <label class="form-label">${isAr ? 'الموديل' : 'Model'}</label>
            <input type="text" id="newDevModel" class="form-control" placeholder="e.g. XPS 15, iPhone 15" required>
          </div>
          <div class="form-group">
            <label class="form-label">${isAr ? 'نظام التشغيل / المواصفات' : 'OS Version'}</label>
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
          device_category: document.getElementById("newDevCat").value,
          brand: document.getElementById("newDevBrand").value.trim(),
          model: document.getElementById("newDevModel").value.trim(),
          os_version: document.getElementById("newDevOs").value.trim()
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
  // VIEW: ADMIN CONTROL PANEL (EXCLUSIVE SYSTEM MANAGEMENT)
  // ==========================================
  switchAdminTab(tab) {
    this.adminActiveTab = tab;
    const panel = document.getElementById("adminTabBody");
    document.querySelectorAll(".admin-tab-btn").forEach(btn => {
      btn.classList.toggle("active", btn.getAttribute("data-tab") === tab);
    });
    if (panel) this._renderAdminTabContent(panel);
  }

  _setAdminNotice(type, text) {
    this.adminNotice = { type, text };
  }

  async renderAdmin(container) {
    const isAr = window.i18n.currentLang === "ar";
    const user = window.api.getUser();
    if (!window.api.isLoggedIn() || !this.isExclusiveAdmin(user)) {
      alert(isAr ? "قسم الإدارة مخصص حصرياً لمدير النظام (snsr19344@gmail.com)" : "Admin panel is exclusively restricted to the system administrator (snsr19344@gmail.com)");
      this.navigate("home");
      return;
    }

    const activeTab = this.adminActiveTab || "centers";
    const noticeHtml = this.adminNotice ? `
      <div id="adminFeedbackBanner" style="margin-bottom: 20px; padding: 12px 16px; border-radius: 10px; font-size: 14px; font-weight: 600; display: flex; justify-content: space-between; align-items: center; gap: 10px; background: ${this.adminNotice.type === 'error' ? 'rgba(239,68,68,0.14)' : 'rgba(16,185,129,0.14)'}; color: ${this.adminNotice.type === 'error' ? 'var(--color-danger)' : 'var(--color-success)'}; border: 1px solid ${this.adminNotice.type === 'error' ? 'rgba(239,68,68,0.35)' : 'rgba(16,185,129,0.35)'};">
        <span><i class="fas ${this.adminNotice.type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'}"></i> ${this._esc(this.adminNotice.text)}</span>
        <button type="button" onclick="app.adminNotice=null; this.parentElement.remove();" style="background:none;border:0;color:inherit;cursor:pointer;font-size:16px;">&times;</button>
      </div>
    ` : "";

    container.innerHTML = `
      <section style="padding: 40px 0 80px;">
        <div class="container">

          <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 14px; margin-bottom: 24px;">
            <div>
              <span class="tag" style="background: rgba(239, 68, 68, 0.16); color: var(--color-danger); border-color: rgba(239, 68, 68, 0.35);">
                <i class="fas fa-shield-alt"></i>
                ${isAr ? 'وصول إداري حصري: snsr19344@gmail.com' : 'EXCLUSIVE ADMIN: snsr19344@gmail.com'}
              </span>
              <h1 style="font-size: 28px; margin-top: 8px;" data-i18n="admin_title">ByteForce Administration Center</h1>
              <p style="font-size: 13.5px; color: var(--color-text-muted); margin-top: 4px;">
                ${isAr ? 'إدارة واعتماد مراكز الصيانة والفنيين، التحكم بحسابات المستخدمين، مراقبة طلبات الصيانة، وسجل التدقيق الإداري.' : 'Manage maintenance center approvals, user access controls, platform-wide repair requests, and the audit log.'}
              </p>
            </div>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              <button class="btn btn-outline btn-sm" onclick="app.navigate('admin')">
                <i class="fas fa-sync-alt"></i> ${isAr ? 'تحديث البيانات' : 'Refresh'}
              </button>
              <button class="btn btn-outline btn-sm" onclick="app.navigate('dashboard')">
                <i class="fas fa-user"></i> ${isAr ? 'لوحة حسابي' : 'My Dashboard'}
              </button>
            </div>
          </div>

          ${noticeHtml}

          <!-- 6 Admin KPI Cards -->
          <div id="adminStatsGrid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(175px, 1fr)); gap: 14px; margin-bottom: 26px;">
            <div style="padding: 20px; text-align: center; color: var(--color-text-muted);"><i class="fas fa-spinner fa-spin"></i></div>
          </div>

          <!-- Monthly requests chart + completion rate (real data only) -->
          <div id="adminMonthlyWrap" style="margin-bottom: 26px;"></div>

          <!-- Admin Navigation Tabs -->
          <div class="admin-tabs">
            <button type="button" class="admin-tab-btn ${activeTab === 'centers' ? 'active' : ''}" data-tab="centers" onclick="app.switchAdminTab('centers')">
              <i class="fas fa-store-alt"></i>
              <span data-i18n="admin_tab_centers">المراكز والفنيون</span>
              <span class="admin-count-pill" id="tabCountCenters">0</span>
            </button>
            <button type="button" class="admin-tab-btn ${activeTab === 'users' ? 'active' : ''}" data-tab="users" onclick="app.switchAdminTab('users')">
              <i class="fas fa-users"></i>
              <span data-i18n="admin_tab_users">حسابات المستخدمين</span>
              <span class="admin-count-pill" id="tabCountUsers">0</span>
            </button>
            <button type="button" class="admin-tab-btn ${activeTab === 'requests' ? 'active' : ''}" data-tab="requests" onclick="app.switchAdminTab('requests')">
              <i class="fas fa-clipboard-list"></i>
              <span data-i18n="admin_tab_requests">جميع طلبات الصيانة</span>
              <span class="admin-count-pill" id="tabCountRequests">0</span>
            </button>
            <button type="button" class="admin-tab-btn ${activeTab === 'audit' ? 'active' : ''}" data-tab="audit" onclick="app.switchAdminTab('audit')">
              <i class="fas fa-history"></i>
              <span data-i18n="admin_tab_audit">سجل تدقيق الإدارة</span>
              <span class="admin-count-pill" id="tabCountAudit">0</span>
            </button>
            <button type="button" class="admin-tab-btn ${activeTab === 'ai' ? 'active' : ''}" data-tab="ai" onclick="app.switchAdminTab('ai')">
              <i class="fas fa-robot"></i>
              <span data-i18n="admin_tab_ai">نموذج الذكاء الاصطناعي</span>
            </button>
          </div>

          <!-- Active Tab Card -->
          <div class="card" id="adminTabBody" style="min-height: 240px;">
            <div style="padding: 32px; text-align: center; color: var(--color-text-muted);"><i class="fas fa-spinner fa-spin"></i></div>
          </div>

        </div>
      </section>
    `;

    // Load Stats + All Admin Datasets in Parallel
    const [statsRes, centersRes, usersRes, reqsRes, auditRes, aiRes] = await Promise.allSettled([
      window.api.getAdminStats(),
      window.api.getAllAdminCenters("all"),
      window.api.getAdminUsers(),
      window.api.getAdminRequests(),
      window.api.getAdminAuditLogs(),
      window.api.getAdminAiStatus()
    ]);

    const stats = statsRes.status === "fulfilled" ? statsRes.value : {};
    this._adminCache = {
      centers: centersRes.status === "fulfilled" ? (centersRes.value || []) : [],
      users: usersRes.status === "fulfilled" ? (usersRes.value || []) : [],
      requests: reqsRes.status === "fulfilled" ? (reqsRes.value || []) : [],
      audit: auditRes.status === "fulfilled" ? (auditRes.value || []) : [],
      aiStatus: aiRes.status === "fulfilled" ? (aiRes.value || {}) : { configured: false },
      errors: {
        stats: statsRes.status === "rejected" ? statsRes.reason?.message : null,
        centers: centersRes.status === "rejected" ? centersRes.reason?.message : null,
        users: usersRes.status === "rejected" ? usersRes.reason?.message : null,
        requests: reqsRes.status === "rejected" ? reqsRes.reason?.message : null,
        audit: auditRes.status === "rejected" ? auditRes.reason?.message : null,
        aiStatus: aiRes.status === "rejected" ? aiRes.reason?.message : null
      }
    };

    // Update KPI Cards
    const statsGrid = container.querySelector("#adminStatsGrid");
    if (statsGrid) {
      statsGrid.innerHTML = `
        <div class="card" style="padding: 18px; text-align: center;">
          <span style="font-size: 12.5px; color: var(--color-text-muted);" data-i18n="admin_stat_users">Total Users</span>
          <div style="font-size: 28px; font-weight: 800; color: var(--color-accent); margin-top: 6px;">${stats.total_users ?? this._adminCache.users.length ?? 0}</div>
        </div>
        <div class="card" style="padding: 18px; text-align: center;">
          <span style="font-size: 12.5px; color: var(--color-text-muted);" data-i18n="admin_stat_techs">Approved Centers</span>
          <div style="font-size: 28px; font-weight: 800; color: #10B981; margin-top: 6px;">${stats.total_technicians ?? 0}</div>
        </div>
        <div class="card" style="padding: 18px; text-align: center;">
          <span style="font-size: 12.5px; color: var(--color-text-muted);" data-i18n="admin_stat_pending">Pending Approvals</span>
          <div style="font-size: 28px; font-weight: 800; color: #F59E0B; margin-top: 6px;">${stats.pending_approvals ?? 0}</div>
        </div>
        <div class="card" style="padding: 18px; text-align: center;">
          <span style="font-size: 12.5px; color: var(--color-text-muted);" data-i18n="admin_stat_active_req">Active Requests</span>
          <div style="font-size: 28px; font-weight: 800; color: #60A5FA; margin-top: 6px;">${stats.active_requests ?? 0}</div>
        </div>
        <div class="card" style="padding: 18px; text-align: center;">
          <span style="font-size: 12.5px; color: var(--color-text-muted);" data-i18n="admin_stat_completed_req">Completed Repairs</span>
          <div style="font-size: 28px; font-weight: 800; color: var(--color-success); margin-top: 6px;">${stats.completed_requests ?? 0}</div>
        </div>
        <div class="card" style="padding: 18px; text-align: center;">
          <span style="font-size: 12.5px; color: var(--color-text-muted);" data-i18n="admin_stat_diags">Total Diagnoses</span>
          <div style="font-size: 28px; font-weight: 800; color: var(--color-purple); margin-top: 6px;">${stats.total_diagnoses ?? 0}</div>
        </div>
      `;
    }

    // Monthly requests chart + completion ring (real data from /api/admin/stats only)
    const monthlyWrap = container.querySelector("#adminMonthlyWrap");
    if (monthlyWrap) {
      const monthly = Array.isArray(stats.monthly_requests) ? stats.monthly_requests : [];
      const rate = typeof stats.completion_rate === "number" ? stats.completion_rate : null;
      if (monthly.length > 0 || rate !== null) {
        const maxCount = Math.max(1, ...monthly.map(m => m.count || 0));
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const monthLabel = (mm) => {
          const parts = String(mm.month || "").split("-");
          const mi = parseInt(parts[1], 10) - 1;
          return (monthNames[mi] || parts[1] || "") + " " + String(parts[0] || "").slice(2);
        };
        monthlyWrap.innerHTML = `
          <div style="display: grid; grid-template-columns: 1fr 260px; gap: 14px;">
            <div class="card" style="padding: 18px;">
              <h3 style="font-size: 16px; margin: 0 0 4px;">${isAr ? 'طلبات الصيانة الشهرية (آخر 12 شهراً)' : 'Monthly Repair Requests (last 12 months)'}</h3>
              <p style="font-size: 12.5px; color: var(--color-text-muted); margin: 0 0 14px;">${isAr ? 'عدد حقيقي من قاعدة البيانات — بدون أي أرقام افتراضية.' : 'Real counts from the database — no synthetic numbers.'}</p>
              <div style="display: flex; align-items: flex-end; gap: 6px; height: 140px;">
                ${monthly.map(m => `
                  <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; height: 100%; justify-content: flex-end;">
                    <span style="font-size: 11px; font-weight: 700; color: var(--color-text-main);">${m.count || 0}</span>
                    <div title="${monthLabel(m)}: ${m.count || 0}" style="width: 100%; max-width: 34px; height: ${Math.max(3, Math.round(((m.count || 0) / maxCount) * 100))}%; background: var(--color-accent); border-radius: 4px 4px 0 0;"></div>
                    <span style="font-size: 10.5px; color: var(--color-text-muted);">${monthLabel(m)}</span>
                  </div>
                `).join('')}
              </div>
            </div>
            <div class="card" style="padding: 18px; text-align: center;">
              <h3 style="font-size: 16px; margin: 0 0 4px;">${isAr ? 'نسبة الإصلاحات المكتملة' : 'Completed Repairs Rate'}</h3>
              <p style="font-size: 12.5px; color: var(--color-text-muted); margin: 0 0 14px;">${isAr ? 'المكتملة من إجمالي طلبات الصيانة.' : 'Completed out of all repair requests.'}</p>
              <div style="width: 120px; height: 120px; margin: 0 auto; border-radius: 50%; background: conic-gradient(#10B981 ${rate !== null ? rate * 3.6 : 0}deg, rgba(100,116,139,0.2) 0deg); display: flex; align-items: center; justify-content: center;">
                <div style="width: 88px; height: 88px; border-radius: 50%; background: var(--color-card); display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 800; color: var(--color-text-main);">${rate !== null ? rate + '%' : '—'}</div>
              </div>
              <p style="font-size: 12.5px; color: var(--color-text-muted); margin: 12px 0 0;">${isAr ? 'المكتملة: ' : 'Completed: '} ${stats.completed_requests ?? 0} / ${stats.repair_requests_count ?? 0}</p>
            </div>
          </div>
        `;
      }
    }

    const setCount = (id, count) => {
      const el = container.querySelector("#" + id);
      if (el) el.textContent = String(count);
    };
    setCount("tabCountCenters", this._adminCache.centers.length);
    setCount("tabCountUsers", this._adminCache.users.length);
    setCount("tabCountRequests", this._adminCache.requests.length);
    setCount("tabCountAudit", this._adminCache.audit.length);

    const tabBody = container.querySelector("#adminTabBody");
    if (tabBody) this._renderAdminTabContent(tabBody);
    window.i18n.applyLanguage(window.i18n.currentLang);
  }

  _renderAdminTabContent(panel) {
    const isAr = window.i18n.currentLang === "ar";
    const tab = this.adminActiveTab || "centers";
    const cache = this._adminCache || { centers: [], users: [], requests: [], audit: [], errors: {} };
    const align = isAr ? "right" : "left";

    if (tab === "centers") {
      if (cache.errors.centers) {
        panel.innerHTML = `<p style="color: var(--color-danger);">${this._esc(cache.errors.centers)}</p>`;
        return;
      }
      const list = cache.centers || [];
      const toolbarHtml = `
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 16px;">
          <h3 style="font-size: 18px; margin: 0;" data-i18n="admin_tab_approvals">${isAr ? 'إدارة المراكز والفنيين والاعتمادات' : 'Maintenance Centers & Technicians'}</h3>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button type="button" class="btn btn-primary btn-sm" onclick="app.showCenterFormModal()">
              <i class="fas fa-plus"></i> <span data-i18n="admin_add_center_btn">${isAr ? 'إضافة مركز / فني جديد' : 'Add Center / Tech'}</span>
            </button>
            <button type="button" class="btn btn-outline btn-sm" onclick="app.showBulkCentersModal()">
              <i class="fas fa-file-import"></i> <span data-i18n="admin_bulk_centers_btn">${isAr ? 'رفع مجموعة مراكز' : 'Bulk Import Centers'}</span>
            </button>
          </div>
        </div>
      `;
      if (list.length === 0) {
        panel.innerHTML = `
          ${toolbarHtml}
          <p style="color: var(--color-text-muted); font-size: 14px;">${isAr ? 'لا توجد طلبات أو مراكز صيانة مسجلة بعد. يمكنك إضافة مركز جديد أو رفع قائمة مراكز من الأزرار أعلاه.' : 'No maintenance centers or technician applications yet. Use Add Center or Bulk Import above.'}</p>
        `;
        return;
      }
      panel.innerHTML = `
        ${toolbarHtml}
        <div style="overflow-x: auto;">
          <table class="admin-table">
            <thead>
              <tr style="text-align: ${align};">
                <th>${isAr ? 'المركز / الفني' : 'Center / Tech'}</th>
                <th>${isAr ? 'مقدم الطلب والاتصال' : 'Applicant & Contact'}</th>
                <th>${isAr ? 'المدينة والعنوان' : 'City & Address'}</th>
                <th>${isAr ? 'التخصصات' : 'Specialties'}</th>
                <th>${isAr ? 'التقييم' : 'Rating'}</th>
                <th>${isAr ? 'الحالة' : 'Status'}</th>
                <th>${isAr ? 'الإجراء' : 'Action'}</th>
              </tr>
            </thead>
            <tbody>
              ${list.map(t => {
                const st = String(t.status || "pending").toLowerCase();
                let stBadge = `<span class="tag" style="background: rgba(245, 158, 11, 0.16); color: var(--color-warning); border-color: rgba(245, 158, 11, 0.35);">${isAr ? 'بانتظار الموافقة' : 'Pending'}</span>`;
                if (st === "approved") {
                  stBadge = `<span class="tag" style="background: rgba(16, 185, 129, 0.16); color: var(--color-success); border-color: rgba(16, 185, 129, 0.35);">${isAr ? 'معتمد ومفعل' : 'Approved'}</span>`;
                } else if (st === "suspended") {
                  stBadge = `<span class="tag" style="background: rgba(148, 163, 184, 0.16); color: var(--color-text-body); border-color: rgba(148, 163, 184, 0.35);">${isAr ? 'موقوف مؤقتاً' : 'Suspended'}</span>`;
                } else if (st === "rejected") {
                  stBadge = `<span class="tag" style="background: rgba(239, 68, 68, 0.16); color: var(--color-danger); border-color: rgba(239, 68, 68, 0.35);">${isAr ? 'مرفوض' : 'Rejected'}</span>`;
                }
                const kindLbl = String(t.kind || "").toUpperCase() === "CENTER" ? (isAr ? "مركز صيانة" : "Center") : (isAr ? "فني مستقل" : "Tech");
                const specs = Array.isArray(t.specializations) ? (t.specializations.join(", ") || "-") : (t.specializations || "-");
                const safeName = String(t.business_name || t.name || "").replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/"/g, "&quot;");
                const avgRating = Number(t.rating || 0).toFixed(1);
                const revCount = Number(t.reviews_count || t.total_reviews || 0);
                return `
                  <tr>
                    <td>
                      <strong style="color: var(--color-text-main);">${this._esc(t.business_name || t.name)}</strong>
                      <div style="margin-top: 4px; display: flex; gap: 6px; flex-wrap: wrap;">
                        <span class="tag" style="font-size: 11px;">${kindLbl}</span>
                        ${t.home_service || t.home_service_available ? `<span class="tech-home-badge">${isAr ? 'خدمة منزلية' : 'Home Service'}</span>` : ''}
                      </div>
                    </td>
                    <td>
                      <div>${this._esc(t.technician_name || t.name || "-")}</div>
                      <div style="font-size: 12px; color: #94A3B8;" dir="ltr">${this._esc(t.email || "")} ${t.phone ? "· " + this._esc(t.phone) : ""}</div>
                    </td>
                    <td>${this._esc(t.city || "-")}${t.address ? " · " + this._esc(t.address) : ""}</td>
                    <td style="max-width: 190px;">${this._esc(specs)}</td>
                    <td>
                      <button type="button" class="tag" style="cursor: pointer; border-color: rgba(245, 158, 11, 0.35); background: rgba(245, 158, 11, 0.1);" onclick="app.showTechReviewsModal('${this._esc(t.id)}', '${safeName}')">
                        <i class="fas fa-star" style="color: #F59E0B;"></i> ${avgRating} (${revCount})
                      </button>
                    </td>
                    <td>${stBadge}</td>
                    <td>
                      <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                        ${st !== "approved" ? `<button class="btn btn-sm btn-primary" onclick="app.approveTech('${this._esc(t.id)}')">${isAr ? (st === "pending" ? "موافقة واعتماد" : "إعادة تفعيل") : (st === "pending" ? "Approve" : "Reactivate")}</button>` : ''}
                        ${st === "approved" ? `<button class="btn btn-sm btn-outline" style="color: var(--color-warning); border-color: rgba(245, 158, 11, 0.4);" onclick="app.suspendTech('${this._esc(t.id)}')">${isAr ? 'إيقاف مؤقت' : 'Suspend'}</button>` : ''}
                        ${st === "pending" ? `<button class="btn btn-sm btn-outline" style="color: var(--color-danger); border-color: rgba(239, 68, 68, 0.35);" onclick="app.rejectTech('${this._esc(t.id)}')">${isAr ? 'رفض' : 'Reject'}</button>` : ''}
                        <button type="button" class="btn btn-sm btn-outline" onclick="app.editAdminCenter('${this._esc(t.id)}')">
                          <i class="fas fa-edit"></i> <span data-i18n="admin_edit_btn">${isAr ? 'تعديل' : 'Edit'}</span>
                        </button>
                        <button type="button" class="btn btn-sm btn-outline" style="color: var(--color-danger); border-color: rgba(239, 68, 68, 0.35);" onclick="app.deleteAdminCenter('${this._esc(t.id)}')">
                          <i class="fas fa-trash"></i> <span data-i18n="admin_delete_btn">${isAr ? 'حذف' : 'Delete'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>
        </div>
      `;
      return;
    }

    if (tab === "users") {
      if (cache.errors.users) {
        panel.innerHTML = `<p style="color: var(--color-danger);">${this._esc(cache.errors.users)}</p>`;
        return;
      }
      const users = cache.users || [];
      panel.innerHTML = `
        <h3 style="font-size: 18px; margin-bottom: 16px;" data-i18n="admin_tab_users">${isAr ? 'إدارة حسابات المستخدمين' : 'User Accounts'}</h3>
        <div style="overflow-x: auto;">
          <table class="admin-table">
            <thead>
              <tr style="text-align: ${align};">
                <th>${isAr ? 'المعرّف' : 'ID'}</th>
                <th>${isAr ? 'الاسم' : 'Name'}</th>
                <th>${isAr ? 'البريد الإلكتروني' : 'Email'}</th>
                <th>${isAr ? 'الدور' : 'Role'}</th>
                <th>${isAr ? 'الحالة' : 'Status'}</th>
                <th>${isAr ? 'الإجراء' : 'Action'}</th>
              </tr>
            </thead>
            <tbody>
              ${users.map(u => {
                const isActive = u.is_active !== false;
                const isSelfAdmin = String(u.email || "").toLowerCase().trim() === "snsr19344@gmail.com";
                const rawRole = isSelfAdmin ? "admin" : (u.role || "user");
                const roleLabel = rawRole === "admin"
                  ? (isAr ? "مدير النظام" : "Admin")
                  : rawRole === "technician"
                    ? (isAr ? "صيانة / فني" : "Maintenance")
                    : (isAr ? "مستخدم" : "User");
                return `
                  <tr>
                    <td style="font-family: monospace; font-size: 12px; color: #94A3B8;">${this._esc(String(u.id).slice(0, 8))}</td>
                    <td style="font-weight: 600; color: var(--color-text-main);">${this._esc(u.full_name || "-")}</td>
                    <td dir="ltr">${this._esc(u.email || "-")}</td>
                    <td><span class="tag">${roleLabel}</span></td>
                    <td>
                      <span style="color: ${isActive ? 'var(--color-success)' : 'var(--color-danger)'}; font-weight: 700;">
                        ${isActive ? (isAr ? 'نشط' : 'Active') : (isAr ? 'معطل' : 'Suspended')}
                      </span>
                    </td>
                    <td>
                      ${isSelfAdmin
                        ? `<span style="font-size: 12px; color: var(--color-accent); font-weight: 600;">${isAr ? 'المدير الرئيسي (محمي)' : 'Primary Admin (Protected)'}</span>`
                        : `<button class="btn btn-sm btn-outline" style="color: ${isActive ? 'var(--color-danger)' : 'var(--color-success)'}; border-color: ${isActive ? 'rgba(239,68,68,0.4)' : 'rgba(16,185,129,0.4)'};" onclick="app.toggleUser('${this._esc(u.id)}')">${isActive ? (isAr ? 'إيقاف الحساب' : 'Suspend') : (isAr ? 'تفعيل الحساب' : 'Reactivate')}</button>`
                      }
                    </td>
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>
        </div>
      `;
      return;
    }

    if (tab === "requests") {
      if (cache.errors.requests) {
        panel.innerHTML = `<p style="color: var(--color-danger);">${this._esc(cache.errors.requests)}</p>`;
        return;
      }
      const reqs = cache.requests || [];
      if (reqs.length === 0) {
        panel.innerHTML = `
          <h3 style="font-size: 18px; margin-bottom: 12px;" data-i18n="admin_tab_requests">${isAr ? 'جميع طلبات الصيانة' : 'All Repair Requests'}</h3>
          <p style="color: var(--color-text-muted); font-size: 14px;">${isAr ? 'لا توجد طلبات صيانة مسجلة على المنصة حتى الآن.' : 'No repair requests have been submitted yet.'}</p>
        `;
        return;
      }
      panel.innerHTML = `
        <h3 style="font-size: 18px; margin-bottom: 16px;" data-i18n="admin_tab_requests">${isAr ? 'جميع طلبات الصيانة' : 'All Repair Requests'}</h3>
        <div style="display: flex; flex-direction: column; gap: 12px;">
          ${reqs.map(r => `
            <div style="padding: 14px 16px; background: var(--color-card); border: 1px solid var(--color-border); border-radius: 10px;">
              <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
                <strong style="color: var(--color-text-main);">#${this._esc(String(r.id).slice(0, 8))} · ${this._esc(r.device_info || r.device_model || 'Device')}</strong>
                <span class="tag">${this._esc(r.status || 'NEW')}</span>
              </div>
              <div style="font-size: 13px; color: #94A3B8; margin-top: 6px; display: flex; flex-wrap: wrap; gap: 14px;">
                <span><b>${isAr ? 'العميل:' : 'Customer:'}</b> ${this._esc(r.customer_name || r.user_name || '-')} (<span dir="ltr">${this._esc(r.user_email || '-')}</span>)</span>
                <span><b>${isAr ? 'المركز / الفني:' : 'Center / Tech:'}</b> ${this._esc(r.technician_business || r.technician_name || '-')}</span>
                ${r.estimate != null ? `<span><b>${isAr ? 'التقدير:' : 'Estimate:'}</b> ${this._esc(r.estimate)}</span>` : ''}
                ${r.final_cost != null ? `<span><b>${isAr ? 'النهائي:' : 'Final:'}</b> ${this._esc(r.final_cost)}</span>` : ''}
              </div>
              <p style="font-size: 13px; color: var(--color-text-body); margin-top: 6px;">${this._esc(r.problem_summary || r.issue_description || '')}</p>
              ${r.reviewed ? `
                <div style="margin-top: 8px; padding: 8px 10px; border-radius: 8px; background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.22); display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap;">
                  <div style="font-size: 12.5px; color: var(--color-warning);">
                    <i class="fas fa-star" style="color: #F59E0B;"></i>
                    <b>${this._esc(r.rating || 5)}/5</b>
                    ${r.review_comment ? ` · &ldquo;${this._esc(r.review_comment)}&rdquo;` : ''}
                  </div>
                  <button type="button" class="btn btn-sm btn-outline" style="color: var(--color-danger); border-color: rgba(239, 68, 68, 0.35);" onclick="app.clearAdminReview('${this._esc(r.id)}')">
                    <i class="fas fa-eraser"></i> <span data-i18n="admin_clear_review_btn">${isAr ? 'إزالة التقييم' : 'Clear Review'}</span>
                  </button>
                </div>
              ` : ''}
            </div>
          `).join("")}
        </div>
      `;
      return;
    }

    // Tab 5: AI Model Status & Diagnostics Test
    if (tab === "ai") {
      const aiSt = cache.aiStatus || { configured: false };
      panel.innerHTML = `
        <h3 style="font-size: 18px; margin-bottom: 12px;" data-i18n="admin_tab_ai">${isAr ? 'نموذج الذكاء الاصطناعي' : 'AI Model Integration'}</h3>
        <div style="padding: 16px; border-radius: 10px; margin-bottom: 16px; background: ${aiSt.configured ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)'}; border: 1px solid ${aiSt.configured ? 'rgba(16,185,129,0.32)' : 'rgba(245,158,11,0.32)'}; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          <div style="font-weight: 700; color: ${aiSt.configured ? 'var(--color-success)' : 'var(--color-warning)'};">
            <i class="fas ${aiSt.configured ? 'fa-check-circle' : 'fa-exclamation-triangle'}"></i>
            ${aiSt.configured
              ? (isAr ? `الذكاء الاصطناعي مفعل ومتصل عبر ${String(aiSt.provider || '').toUpperCase()} (${this._esc(aiSt.masked_key || '')})` : `AI Engine Active via ${String(aiSt.provider || '').toUpperCase()} (${this._esc(aiSt.masked_key || '')})`)
              : (isAr ? 'نموذج الذكاء الاصطناعي غير مفعل حالياً — اضغط لإدخال مفتاح أو اختبر الاتصال' : 'AI Engine currently inactive')}
          </div>
          <button type="button" class="btn btn-primary btn-sm" onclick="app.testAdminAiConnection()">
            <i class="fas fa-vial"></i> ${isAr ? 'اختبار اتصال الذكاء الاصطناعي' : 'Test AI Connection'}
          </button>
        </div>

        <details style="background: var(--color-surface-alt); border: 1px solid var(--color-border); border-radius: 10px; padding: 12px 16px;">
          <summary style="cursor: pointer; font-weight: 600; font-size: 13.5px; color: var(--color-text-body);">
            <i class="fas fa-key" style="color: var(--color-accent); margin-inline-end: 6px;"></i>
            ${isAr ? 'تحديث أو تغيير مفتاح الذكاء الاصطناعي (اختياري)' : 'Update / Rotate AI API Key (Optional)'}
          </summary>
          <div style="margin-top: 14px;">
            <div class="form-row-2" style="margin-bottom: 12px;">
              <div class="form-group">
                <label class="form-label">${isAr ? 'مزود الذكاء الاصطناعي' : 'AI Provider'}</label>
                <select id="adminAiProvider" class="form-control">
                  <option value="gemini">Google Gemini</option>
                  <option value="openai">OpenAI GPT</option>
                  <option value="groq">Groq Llama</option>
                  <option value="openrouter">OpenRouter</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">${isAr ? 'مفتاح الـ API' : 'Secret API Key'}</label>
                <input type="password" id="adminAiKeyInput" class="form-control" dir="ltr" placeholder="AIza... / AQ.... / sk-... / gsk_..." />
              </div>
            </div>
            <button type="button" class="btn btn-outline btn-sm" onclick="app.saveAdminAiKey()">
              <i class="fas fa-save"></i> ${isAr ? 'حفظ وتفعيل المفتاح' : 'Save & Activate Key'}
            </button>
          </div>
        </details>
      `;
      return;
    }

    // Tab 4: Audit Log
    if (cache.errors.audit) {
      panel.innerHTML = `<p style="color: var(--color-danger);">${this._esc(cache.errors.audit)}</p>`;
      return;
    }
    const logs = cache.audit || [];
    panel.innerHTML = `
      <h3 style="font-size: 18px; margin-bottom: 16px;" data-i18n="admin_tab_audit">${isAr ? 'سجل تدقيق الإدارة' : 'Admin Audit Log'}</h3>
      ${logs.length === 0 ? `<p style="color: var(--color-text-muted); font-size: 14px;">${isAr ? 'لا توجد عمليات إدارية مسجلة في السجل بعد.' : 'No administrative actions recorded yet.'}</p>` : `
        <div style="display: flex; flex-direction: column; gap: 10px;">
          ${logs.map(l => `
            <div style="padding: 12px 14px; background: var(--color-card); border: 1px solid var(--color-border); border-radius: 8px; display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 8px;">
              <div>
                <strong style="color: var(--color-text-main); font-size: 13.5px;">${this._esc(l.title)}</strong>
                <div style="color: #94A3B8; font-size: 12.5px; margin-top: 2px;">${this._esc(l.message)}</div>
              </div>
              <span style="color: #64748B; font-size: 12px;" dir="ltr">${l.created_at ? new Date(l.created_at).toLocaleString() : ''}</span>
            </div>
          `).join("")}
        </div>
      `}
    `;
  }

  async saveAdminAiKey() {
    const isAr = window.i18n.currentLang === "ar";
    const provider = document.getElementById("adminAiProvider")?.value || "gemini";
    const apiKey = document.getElementById("adminAiKeyInput")?.value.trim() || "";
    if (!apiKey) {
      this._setAdminNotice("error", isAr ? "يرجى إدخال مفتاح API صحيح أولاً." : "Please enter a valid API key.");
      this.navigate("admin");
      return;
    }
    try {
      const res = await window.api.saveAdminAiConfig(provider, apiKey);
      this._setAdminNotice("success", isAr ? `تم حفظ وتفعيل ${res.provider} بنجاح (${res.masked_key}).` : `Saved ${res.provider} key (${res.masked_key}).`);
    } catch (e) {
      this._setAdminNotice("error", (isAr ? "تعذر حفظ المفتاح: " : "Failed to save key: ") + (e.message || ""));
    }
    this.navigate("admin");
  }

  async testAdminAiConnection() {
    const isAr = window.i18n.currentLang === "ar";
    try {
      const res = await window.api.testAdminAi();
      if (res.status === "completed") {
        this._setAdminNotice("success", isAr ? `اتصال AI ناجح عبر ${res.provider}! (${res.diagnosis_summary_ar || res.diagnosis_summary_en || 'OK'})` : `AI Test Passed via ${res.provider}!`);
      } else {
        this._setAdminNotice("error", isAr ? `حالة AI: ${res.status} ${res.error ? '(' + res.error + ')' : ''}` : `AI Status: ${res.status} ${res.error || ''}`);
      }
    } catch (e) {
      this._setAdminNotice("error", (isAr ? "فشل اختبار الذكاء الاصطناعي: " : "AI test failed: ") + (e.message || ""));
    }
    this.navigate("admin");
  }

  async approveTech(id) {
    const isAr = window.i18n.currentLang === "ar";
    try {
      await window.api.approveTechnician(id);
      this._setAdminNotice("success", isAr ? "تم اعتماد المركز/الفني وتفعيله للظهور في المنصة." : "Technician/center approved and activated.");
    } catch (e) {
      this._setAdminNotice("error", (isAr ? "تعذر الاعتماد: " : "Approval failed: ") + (e.message || ""));
    }
    this.navigate("admin");
  }

  async suspendTech(id) {
    const isAr = window.i18n.currentLang === "ar";
    try {
      await window.api.suspendTechnician(id);
      this._setAdminNotice("success", isAr ? "تم إيقاف ظهور المركز/الفني مؤقتاً وتسجيل العملية." : "Technician/center suspended and audit logged.");
    } catch (e) {
      this._setAdminNotice("error", (isAr ? "تعذر الإيقاف: " : "Suspension failed: ") + (e.message || ""));
    }
    this.navigate("admin");
  }

  async rejectTech(id) {
    const isAr = window.i18n.currentLang === "ar";
    try {
      await window.api.rejectTechnician(id);
      this._setAdminNotice("success", isAr ? "تم رفض طلب الانضمام وإشعار المتقدم." : "Technician application rejected.");
    } catch (e) {
      this._setAdminNotice("error", (isAr ? "تعذر الرفض: " : "Rejection failed: ") + (e.message || ""));
    }
    this.navigate("admin");
  }

  async toggleUser(id) {
    const isAr = window.i18n.currentLang === "ar";
    try {
      await window.api.toggleUserStatus(id);
      this._setAdminNotice("success", isAr ? "تم تحديث حالة الحساب وتسجيل العملية في سجل التدقيق." : "User account status updated.");
    } catch (e) {
      this._setAdminNotice("error", (isAr ? "تعذر تعديل حالة المستخدم: " : "User update failed: ") + (e.message || ""));
    }
    this.navigate("admin");
  }

  // ==========================================
  // AUTH MODALS & GOOGLE SIGN-IN
  // ==========================================
  async triggerGoogleSignIn(btn) {
    const isAr = window.i18n.currentLang === "ar";
    const originalHtml = btn ? btn.innerHTML : "";
    if (btn) {
      btn.disabled = true;
      btn.style.opacity = "0.8";
      btn.style.cursor = "wait";
      btn.innerHTML = `
        <div style="width: 18px; height: 18px; border: 2px solid #4285F4; border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite; display: inline-block; vertical-align: middle; margin-inline-end: 8px;"></div>
        <span>${isAr ? 'جاري الاتصال بـ Google...' : 'Connecting to Google...'}</span>
      `;
    }

    try {
      if (!window.SupabaseBridge || !window.SupabaseBridge.isReady()) {
        throw new Error(isAr 
          ? "خدمة المصادقة السحابية Supabase قيد التهيئة. يرجى المحاولة مجدداً." 
          : "Supabase client is initializing. Please try again.");
      }

      await window.SupabaseBridge.signInWithGoogle();
      // Supabase automatically performs page redirect
    } catch (err) {
      console.error("Supabase Google Sign-In error:", err);
      if (btn) {
        btn.disabled = false;
        btn.style.opacity = "1";
        btn.style.cursor = "pointer";
        btn.innerHTML = originalHtml;
      }
      let msg = err.message || (isAr ? "تعذر إتمام تسجيل الدخول عبر Google" : "Google Sign-In failed");
      if (msg.includes("provider is not enabled")) {
        msg = isAr 
          ? "يرجى تفعيل زر (Enable Google provider) داخل لوحة تحكم Supabase للمشروع في صفحة: Authentication -> Providers -> Google وحفظ التعديل." 
          : "Please enable the Google provider toggle inside Supabase: Authentication -> Providers -> Google and save.";
      }
      alert((isAr ? "فشل تسجيل الدخول عبر Google: " : "Google Sign-In Error: ") + msg);
    }
  }

  showDatasetsModal() {
    const isAr = window.i18n.currentLang === "ar";
    const html = `
      <div>
        <div style="text-align: center; margin-bottom: 22px;">
          <div style="width: 52px; height: 52px; border-radius: 50%; background: rgba(56, 189, 248, 0.12); color: var(--color-accent); display: flex; align-items: center; justify-content: center; font-size: 24px; margin: 0 auto 14px;">
            <i class="fas fa-database"></i>
          </div>
          <h3 style="font-size: 22px; color: var(--color-text-main); margin-bottom: 6px;">
            ${isAr ? 'قواعد البيانات المعتمدة في ByteForce' : 'ByteForce Certified Datasets'}
          </h3>
          <p style="font-size: 13px; color: #94A3B8;">
            ${isAr ? 'محرك التشخيص الذكي يعمل استناداً إلى مصادر البيانات العالمية المفتوحة المعتمدة عبر Supabase PostgreSQL.' : 'Empirical AI diagnostic engine powered by global open repair datasets via Supabase PostgreSQL.'}
          </p>
        </div>

        <div style="display: flex; flex-direction: column; gap: 14px; margin-bottom: 24px;">
          <div style="background: var(--color-surface-alt); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <strong style="color: var(--color-text-main); font-size: 15px;">1. Open Repair Alliance (ORA)</strong>
              <span class="tag" style="background: rgba(16,185,129,0.15); color: #10B981; border: 1px solid rgba(16,185,129,0.3); font-size: 11px;">
                <i class="fas fa-check-circle"></i> ${isAr ? 'بيانات معتمدة ومفهرسة' : 'Verified & Indexed'}
              </span>
            </div>
            <p style="font-size: 12px; color: #94A3B8; margin-bottom: 6px;">
              ${isAr ? 'سجلات صيانة واقعية موثقة تغطي فئات الأجهزة المتنوعة، ونسب نجاح الإصلاح الفعلية وموانع الصيانة الشائعة.' : 'Empirical repair outcomes, success rates, and barrier statistics across standardized equipment categories.'}
            </p>
            <div style="font-size: 11px; color: var(--color-accent);">
              <i class="fas fa-certificate"></i> Open Data Commons Open Database License (ODbL)
            </div>
          </div>

          <div style="background: var(--color-surface-alt); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <strong style="color: var(--color-text-main); font-size: 15px;">2. MyFixit Repair Manuals</strong>
              <span class="tag" style="background: rgba(16,185,129,0.15); color: #10B981; border: 1px solid rgba(16,185,129,0.3); font-size: 11px;">
                <i class="fas fa-check-circle"></i> ${isAr ? 'أدلة إصلاح موثقة' : 'Verified Guides'}
              </span>
            </div>
            <p style="font-size: 12px; color: #94A3B8; margin-bottom: 6px;">
              ${isAr ? 'أدلة التفكيك والإصلاح خطوة بخطوة، الأدوات المطلوبة، خطوات الفك والتركيب، وصور إرشادية عالية الدقة.' : 'Step-by-step disassembly manuals, required tools, difficulty ratings, and official guidance.'}
            </p>
            <div style="font-size: 11px; color: var(--color-accent);">
              <i class="fas fa-book-open"></i> Creative Commons Attribution-NonCommercial-ShareAlike (CC BY-NC-SA 3.0)
            </div>
          </div>

          <div style="background: var(--color-surface-alt); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <strong style="color: var(--color-text-main); font-size: 15px;">3. Backblaze SMART Telemetry ML</strong>
              <span class="tag" style="background: rgba(16,185,129,0.15); color: #10B981; border: 1px solid rgba(16,185,129,0.3); font-size: 11px;">
                <i class="fas fa-check-circle"></i> ${isAr ? 'نموذج تعلم آلة معتمد' : 'Verified ML Model'}
              </span>
            </div>
            <p style="font-size: 12px; color: #94A3B8; margin-bottom: 6px;">
              ${isAr ? 'نموذج تصنيف احصائي مدرب على مؤشرات SMART الحقيقية مع عزل السيريال الزمني للتنبؤ بأعطال وحدات التخزين فقط.' : 'Binary classification Random Forest model trained on SMART telemetry for storage devices only.'}
            </p>
            <div style="font-size: 11px; color: var(--color-accent);">
              <i class="fas fa-microchip"></i> SMART 5, 9, 187, 188, 194, 197, 198 — Strictly Storage Scoped
            </div>
          </div>
        </div>

        <div style="text-align: center;">
          <button class="btn btn-primary btn-sm" onclick="app.closeModal()">
            ${isAr ? 'إغلاق النافذة' : 'Close'}
          </button>
        </div>
      </div>
    `;

    this.openModal(html);
  }

  showPrivacyModal() {
    const isAr = window.i18n.currentLang === "ar";
    const html = `
      <div style="max-height: 80vh; overflow-y: auto; padding-right: 6px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="width: 52px; height: 52px; border-radius: 50%; background: rgba(16, 185, 129, 0.12); color: #10B981; display: flex; align-items: center; justify-content: center; font-size: 24px; margin: 0 auto 12px;">
            <i class="fas fa-user-shield"></i>
          </div>
          <h3 style="font-size: 22px; color: var(--color-text-main); margin-bottom: 6px;">
            ${isAr ? 'سياسة الخصوصية وحماية البيانات' : 'Privacy & Data Protection Policy'}
          </h3>
          <p style="font-size: 13px; color: #94A3B8;">
            ${isAr ? 'التزام ByteForce التام بحماية سرية وأمان بيانات المستخدمين والامتثال للمعايير العالمية.' : 'ByteForce commitment to total confidentiality, data security, and ethical AI standards.'}
          </p>
        </div>

        <div style="display: flex; flex-direction: column; gap: 14px; margin-bottom: 24px; font-size: 13px; color: var(--color-text-body); line-height: 1.7;">
          <div style="background: var(--color-surface-alt); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 14px;">
            <strong style="color: var(--color-accent); font-size: 14px; display: block; margin-bottom: 4px;">
              <i class="fas fa-lock"></i> ${isAr ? '1. التشفير التام والاتصال الآمن' : '1. End-to-End Encryption'}
            </strong>
            <p>
              ${isAr ? 'تتم جميع الاتصالات واستدعاءات فحص وتشخيص الأعطال عبر قنوات مشفرة وفق بروتوكول TLS 1.3 المعتمد، مما يمنع أي اعتراض أو استراق للبيانات أثناء النقل.' : 'All diagnostic interactions and API calls are secured using TLS 1.3 encryption, ensuring total protection during transmission.'}
            </p>
          </div>

          <div style="background: var(--color-surface-alt); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 14px;">
            <strong style="color: #10B981; font-size: 14px; display: block; margin-bottom: 4px;">
              <i class="fas fa-eye-slash"></i> ${isAr ? '2. عدم جمع البيانات الشخصية الحساسة' : '2. Zero Sensitive Personal Data Collection'}
            </strong>
            <p>
              ${isAr ? 'لا يطلب نظام ByteForce أو يخزن أي ملفات خاصة، أو صور شخصية، أو كلمات مرور، أو وثائق هوية. يتم حصر المدخلات في مواصفات العتاد الفنية (الفئة، الطراز، والأعراض المشاهدة ومؤشرات S.M.A.R.T).' : 'ByteForce strictly avoids collecting personal photos, private files, passwords, or personal credentials. Ingestion is strictly scoped to technical hardware parameters.'}
            </p>
          </div>

          <div style="background: var(--color-surface-alt); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 14px;">
            <strong style="color: #F59E0B; font-size: 14px; display: block; margin-bottom: 4px;">
              <i class="fas fa-user-check"></i> ${isAr ? '3. سيطرة المستخدم الكاملة وحق الحذف' : '3. Complete User Control & Deletion Rights'}
            </strong>
            <p>
              ${isAr ? 'يمتلك المستخدم الحق الكامل في مسح أي تقرير فحص أو سجل محفوظ بنقرة واحدة من لوحة التحكم، كما يُمكن استخدام ميزة التشخيص الفوري دون الحاجة لتسجيل أي بيانات تعريفية.' : 'Users retain the absolute right to purge any saved diagnosis report from local storage and database at any time without restriction.'}
            </p>
          </div>

          <div style="background: var(--color-surface-alt); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 14px;">
            <strong style="color: #A855F7; font-size: 14px; display: block; margin-bottom: 4px;">
              <i class="fas fa-shield-alt"></i> ${isAr ? '4. حظر مشاركة البيانات مع معلنين' : '4. No Third-Party Data Monetization'}
            </strong>
            <p>
              ${isAr ? 'لا نقوم ببيع أو تداول أي بيانات فنية أو إحصائيات استخدام مع شبكات الإعلانات أو الوسطاء التجاريين، والمنصة تعمل بنموذج هندسي مفتوح يهدف لتعزيز حق الإصلاح وتقليل النفايات الإلكترونية.' : 'We never sell, broker, or monetize telemetry or user diagnostics to advertisers. Our mission is strictly supporting sustainable repairability and e-waste reduction.'}
            </p>
          </div>
        </div>

        <div style="text-align: center;">
          <button class="btn btn-primary btn-sm" onclick="app.closeModal()">
            ${isAr ? 'فهمت وأوافق' : 'I Understand & Agree'}
          </button>
        </div>
      </div>
    `;
    this.openModal(html);
  }

  showTermsModal() {
    const isAr = window.i18n.currentLang === "ar";
    const html = `
      <div style="max-height: 80vh; overflow-y: auto; padding-right: 6px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="width: 52px; height: 52px; border-radius: 50%; background: rgba(56, 189, 248, 0.12); color: var(--color-accent); display: flex; align-items: center; justify-content: center; font-size: 24px; margin: 0 auto 12px;">
            <i class="fas fa-file-contract"></i>
          </div>
          <h3 style="font-size: 22px; color: var(--color-text-main); margin-bottom: 6px;">
            ${isAr ? 'شروط الاستخدام وإخلاء المسؤولية الهندسية' : 'Terms of Service & Engineering Safety'}
          </h3>
          <p style="font-size: 13px; color: #94A3B8;">
            ${isAr ? 'الشروط المنظمة لاستخدام تقارير التشخيص، بروتوكولات الأمان، وحقوق المصادر المفتوحة.' : 'Guidelines governing diagnostic reports, safety measures, and open-source attributions.'}
          </p>
        </div>

        <div style="display: flex; flex-direction: column; gap: 14px; margin-bottom: 24px; font-size: 13px; color: var(--color-text-body); line-height: 1.7;">
          <div style="background: var(--color-surface-alt); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 14px;">
            <strong style="color: #EF4444; font-size: 14px; display: block; margin-bottom: 4px;">
              <i class="fas fa-exclamation-triangle"></i> ${isAr ? '1. إخلاء المسؤولية وإجراءات السلامة الحيوية' : '1. Engineering Safety Disclaimer'}
            </strong>
            <p>
              ${isAr ? 'التشخيص الصادر هو تحليل فني استرشادي مستند إلى بيانات إحصائية وأدلة صيانة معتمدة. يتعين على المستخدم فصل التيار الكهربائي والبطارية تماماً قبل فك أي جهاز، واستخدام أساور تفريغ الشحنات الكهروستاتيكية (ESD) لحماية الدوائر الحساسة.' : 'Diagnostic outputs are evidence-based recommendations. Users must completely disconnect power and detach battery connectors before disassembly, wearing ESD protection.'}
            </p>
          </div>

          <div style="background: var(--color-surface-alt); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 14px;">
            <strong style="color: #F59E0B; font-size: 14px; display: block; margin-bottom: 4px;">
              <i class="fas fa-battery-quarter"></i> ${isAr ? '2. التعامل مع الحالات الخطرة (بطاريات الليثيوم والجهد العالي)' : '2. Critical Hazard Protocol (Lithium & High-Voltage)'}
            </strong>
            <p>
              ${isAr ? 'في حال وجود انتفاخ في بطارية الليثيوم، أو انبعاث حرارة غير طبيعية، أو أعطال في دوائر مزود الطاقة (Power Supply)، يُحظر محاولة ثقب البطارية أو فحصها بدون عوازل، ويجب فوراً إحالة الجهاز لفني مختص أو مركز صيانة معتمد.' : 'If lithium batteries show swelling or puncture damage, home repair is strictly prohibited. The device must be handed over to a certified professional technician.'}
            </p>
          </div>

          <div style="background: var(--color-surface-alt); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 14px;">
            <strong style="color: #10B981; font-size: 14px; display: block; margin-bottom: 4px;">
              <i class="fas fa-balance-scale"></i> ${isAr ? '3. تراخيص البيانات المفتوحة والنسب العلمي' : '3. Open Data Licensing & Attribution'}
            </strong>
            <p>
              ${isAr ? 'يعتمد نظام ByteForce على قواعد بيانات مفتوحة ومعترف بها دولياً: Open Repair Alliance بموجب رخصة ODbL، و MyFixit بموجب Creative Commons (CC BY-NC-SA 3.0)، وبيانات Backblaze المفتوحة للأبحاث. نلتزم بنسب الفضل وحفظ حقوق النشر لجميع مصادر البيانات الأصلية دون أي تلفيق.' : 'ByteForce proudly leverages open datasets under verified licenses: ORA under ODbL, MyFixit under CC BY-NC-SA 3.0, and Backblaze telemetry under open research terms.'}
            </p>
          </div>
        </div>

        <div style="text-align: center;">
          <button class="btn btn-primary btn-sm" onclick="app.closeModal()">
            ${isAr ? 'موافق وإغلاق' : 'Accept & Close'}
          </button>
        </div>
      </div>
    `;
    this.openModal(html);
  }

  showSafetyModal() {
    const isAr = window.i18n.currentLang === "ar";
    const html = `
      <div style="max-height: 80vh; overflow-y: auto; padding-right: 6px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="width: 52px; height: 52px; border-radius: 50%; background: rgba(245, 158, 11, 0.12); color: #F59E0B; display: flex; align-items: center; justify-content: center; font-size: 24px; margin: 0 auto 12px;">
            <i class="fas fa-shield-virus"></i>
          </div>
          <h3 style="font-size: 22px; color: var(--color-text-main); margin-bottom: 6px;" data-i18n="safety_modal_title">
            ${window.i18n.t('safety_modal_title')}
          </h3>
          <p style="font-size: 13px; color: #94A3B8;" data-i18n="safety_modal_subtitle">
            ${window.i18n.t('safety_modal_subtitle')}
          </p>
        </div>

        <div style="display: flex; flex-direction: column; gap: 14px; margin-bottom: 24px; font-size: 13px; color: var(--color-text-body); line-height: 1.7;">
          <div style="background: var(--color-surface-alt); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 14px;">
            <strong style="color: #EF4444; font-size: 14px; display: block; margin-bottom: 4px;">
              <i class="fas fa-power-off"></i> ${isAr ? '1. فصل مصادر الطاقة وفصل موصل البطارية فوراً' : '1. Power Isolation & Immediate Battery Disconnect'}
            </strong>
            <p>
              ${isAr ? 'قبل فك أي مسمار أو لمس المكونات الداخلية، يجب فصل الشاحن وإزالة موصل البطارية عن اللوحة الأم (Motherboard) لتفريغ الشحنات وتجنب حدوث قصر كهربائي (Short Circuit) قد يتلف المعالج أو دوائر الطاقة الحساسة.' : 'Prior to disassembly or touching internal components, remove external power and disconnect the battery cable from the logic board to prevent catastrophic short-circuits.'}
            </p>
          </div>

          <div style="background: var(--color-surface-alt); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 14px;">
            <strong style="color: #F59E0B; font-size: 14px; display: block; margin-bottom: 4px;">
              <i class="fas fa-battery-three-quarters"></i> ${isAr ? '2. بروتوكول التعامل مع بطاريات الليثيوم والانتفاخ' : '2. Critical Lithium Battery Safety & Swelling Protocol'}
            </strong>
            <p>
              ${isAr ? 'بطاريات الليثيوم القابلة لإعادة الشحن (Li-Ion / Li-Po) حساسة جداً للثقب أو الانحناء. في حال ملاحظة انتفاخ، لا تستخدم أي أدوات معدنية حادة، ولا تحاول شحن الجهاز، وضع الجهاز في بيئة غير قابلة للاشتعال وتوجه فوراً لفني معتمد.' : 'Lithium batteries are hazardous if punctured or bent. If swelling is observed, avoid metal prying tools, disconnect charging, store in a fireproof enclosure, and consult a technician.'}
            </p>
          </div>

          <div style="background: var(--color-surface-alt); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 14px;">
            <strong style="color: var(--color-accent); font-size: 14px; display: block; margin-bottom: 4px;">
              <i class="fas fa-bolt"></i> ${isAr ? '3. الحماية من التفريغ الكهروستاتيكي (ESD Protection)' : '3. Electrostatic Discharge (ESD) Protection'}
            </strong>
            <p>
              ${isAr ? 'تفرغ الشحنات الساكنة من جسمك بارتداء سوار تأريض (ESD wrist strap) أو ملامسة سطح معدني مؤرض قبل التعامل مع شرائح الذاكرة، وبطاقات الرسوميات، ومسارات الدوائر المطبوعة.' : 'Always ground yourself with an ESD wrist strap or by touching an unpainted metal surface before touching RAM, GPU silicon, or delicate PCB traces.'}
            </p>
          </div>

          <div style="background: var(--color-surface-alt); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 14px;">
            <strong style="color: #A855F7; font-size: 14px; display: block; margin-bottom: 4px;">
              <i class="fas fa-exclamation-triangle"></i> ${isAr ? '4. تحذير الجهد العالي (High-Voltage Capacitors)' : '4. High-Voltage Capacitors & Power Supplies'}
            </strong>
            <p>
              ${isAr ? 'تحتوي مزودات الطاقة (PSU) وشاشات التلفزيون ومضخمات الصوت على مكثفات تخزن جهداً خطيراً قد يستمر لساعات حتى بعد فصل التيار. يُحظر فتح وحدات الطاقة المغلقة لمن لا يمتلك شهادة هندسية معتمدة.' : 'Power supplies, monitors, and amplifiers contain capacitors that store lethal voltages long after disconnection. Do not open internal power supplies without certification.'}
            </p>
          </div>
        </div>

        <div style="text-align: center;">
          <button class="btn btn-primary btn-sm" onclick="app.closeModal()">
            ${isAr ? 'فهمت بروتوكول السلامة' : 'I Understand & Acknowledge'}
          </button>
        </div>
      </div>
    `;
    this.openModal(html);
  }

  setRegisterRole(role) {
    const roleInput = document.getElementById("regRole");
    const techFields = document.getElementById("techExtraFields");
    const btnUser = document.getElementById("roleBtnUser");
    const btnTech = document.getElementById("roleBtnTech");
    if (roleInput) roleInput.value = role;
    if (techFields) techFields.style.display = role === "technician" ? "block" : "none";
    if (btnUser && btnTech) {
      if (role === "technician") {
        btnTech.className = "btn btn-sm btn-primary";
        btnUser.className = "btn btn-sm btn-outline";
      } else {
        btnUser.className = "btn btn-sm btn-primary";
        btnTech.className = "btn btn-sm btn-outline";
      }
    }
  }

  showAuthModal(mode = "login", defaultRole = "user", noticeMessage = "") {
    const isAr = window.i18n.currentLang === "ar";
    const content = mode === "login" ? `
      <div>
        <h3 style="font-size: 22px; margin-bottom: 6px; color: var(--color-text-main);" data-i18n="auth_login_title">تسجيل الدخول إلى ByteForce</h3>
        <p style="font-size: 13px; color: var(--color-text-muted); margin-bottom: ${noticeMessage ? '14px' : '20px'};">
          ${isAr ? 'اختر طريقة تسجيل الدخول للمتابعة' : 'Choose how you want to sign in to ByteForce'}
        </p>

        ${noticeMessage ? `
        <div style="background: rgba(37, 99, 235, 0.12); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 8px; padding: 12px 14px; margin-bottom: 18px; font-size: 13px; color: var(--color-accent); display: flex; align-items: center; gap: 10px;">
          <i class="fas fa-lock" style="font-size: 16px; flex-shrink: 0;"></i>
          <span style="line-height: 1.5;">${noticeMessage}</span>
        </div>
        ` : ''}

        <!-- Official Google Sign-In Button -->
        <button class="btn-google" id="googleSignInBtn" type="button" onclick="app.triggerGoogleSignIn(this)">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          <span>${isAr ? 'المتابعة بحساب Google' : 'Continue with Google'}</span>
        </button>

        <div style="display: flex; align-items: center; gap: 12px; margin: 18px 0; color: #64748B; font-size: 13px;">
          <div style="flex: 1; height: 1px; background: rgba(255,255,255,0.1);"></div>
          <span>${isAr ? 'أو بالبريد الإلكتروني' : 'or continue with email'}</span>
          <div style="flex: 1; height: 1px; background: rgba(255,255,255,0.1);"></div>
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
            <span data-i18n="auth_login_btn">تسجيل الدخول</span>
          </button>
        </form>

        <div style="text-align: center; margin-top: 18px; font-size: 13px;">
          <a href="#" onclick="app.showAuthModal('register'); return false;">${isAr ? 'ليس لديك حساب؟ إنشاء حساب جديد' : "Don't have an account? Sign up"}</a>
        </div>
      </div>
    ` : `
      <div>
        <h3 style="font-size: 22px; margin-bottom: 6px; color: var(--color-text-main);" data-i18n="auth_register_title">إنشاء حسابك في ByteForce</h3>
        <p style="font-size: 13px; color: var(--color-text-muted); margin-bottom: ${noticeMessage ? '14px' : '20px'};">
          ${isAr ? 'اختر طريقة إنشاء الحساب للمتابعة' : 'Choose how you want to create your account'}
        </p>

        ${noticeMessage ? `
        <div style="background: rgba(37, 99, 235, 0.12); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 8px; padding: 12px 14px; margin-bottom: 18px; font-size: 13px; color: var(--color-accent); display: flex; align-items: center; gap: 10px;">
          <i class="fas fa-lock" style="font-size: 16px; flex-shrink: 0;"></i>
          <span style="line-height: 1.5;">${noticeMessage}</span>
        </div>
        ` : ''}

        <!-- Official Google Sign-In Button -->
        <button class="btn-google" id="googleSignUpBtn" type="button" onclick="app.triggerGoogleSignIn(this)">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          <span>${isAr ? 'التسجيل الفوري عبر Google' : 'Sign up with Google'}</span>
        </button>

        <div style="display: flex; align-items: center; gap: 12px; margin: 18px 0; color: #64748B; font-size: 13px;">
          <div style="flex: 1; height: 1px; background: rgba(255,255,255,0.1);"></div>
          <span>${isAr ? 'أو عبر البريد الإلكتروني' : 'or continue with email'}</span>
          <div style="flex: 1; height: 1px; background: rgba(255,255,255,0.1);"></div>
        </div>

        <!-- Role Selection Tabs -->
        <div style="display: flex; gap: 8px; margin-bottom: 16px;">
          <button type="button" id="roleBtnUser" class="btn btn-sm ${defaultRole === 'user' ? 'btn-primary' : 'btn-outline'}" style="flex: 1; border-radius: 8px;" onclick="app.setRegisterRole('user')">
            <i class="fas fa-user"></i> <span>${isAr ? 'مالك جهاز' : 'Device Owner'}</span>
          </button>
          <button type="button" id="roleBtnTech" class="btn btn-sm ${defaultRole === 'technician' ? 'btn-primary' : 'btn-outline'}" style="flex: 1; border-radius: 8px;" onclick="app.setRegisterRole('technician')">
            <i class="fas fa-tools"></i> <span>${isAr ? 'فني صيانة معتمد' : 'Certified Tech'}</span>
          </button>
        </div>

        <form id="registerForm">
          <input type="hidden" id="regRole" value="${defaultRole}">
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

          <!-- Dynamic Technician / Center Profile Fields -->
          <div id="techExtraFields" style="display: ${defaultRole === 'technician' ? 'block' : 'none'}; border-top: 1px solid var(--color-border); padding-top: 14px; margin-top: 14px;">
            <div class="form-group">
              <label class="form-label">${isAr ? 'نوع الحساب المهني' : 'Provider Account Type'}</label>
              <select id="regTechKind" class="form-control">
                <option value="TECHNICIAN">${isAr ? 'فني صيانة مستقل' : 'Independent Certified Technician'}</option>
                <option value="CENTER">${isAr ? 'مركز صيانة معتمد / معمل إلكترونيات' : 'Verified Repair Center / Lab'}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">${isAr ? 'اسم مركز / ورشة الصيانة' : 'Business / Lab Name'}</label>
              <input type="text" id="regTechBusiness" class="form-control" placeholder="${isAr ? 'مثال: مركز النخبة للصيانة' : 'e.g. Apex Repair Lab'}">
            </div>
            <div class="form-row-2">
              <div class="form-group">
                <label class="form-label">${isAr ? 'رقم الهاتف للتواصل' : 'Direct Phone'}</label>
                <input type="tel" id="regTechPhone" class="form-control" placeholder="+20 10 ...">
              </div>
              <div class="form-group">
                <label class="form-label">${isAr ? 'المحافظة / المدينة' : 'City'}</label>
                <input type="text" id="regTechCity" class="form-control" placeholder="${isAr ? 'القاهرة / الجيزة / الإسكندرية' : 'Cairo / Giza / Alexandria'}">
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">${isAr ? 'العنوان التفصيلي' : 'Street Address'}</label>
              <input type="text" id="regTechAddress" class="form-control" placeholder="${isAr ? 'وسط البلد، شارع...' : 'Street / District'}">
            </div>
            <div class="form-group">
              <label class="form-label">${isAr ? 'التخصصات (مفصولة بفاصلة)' : 'Specializations (comma-separated)'}</label>
              <input type="text" id="regTechSpec" class="form-control" placeholder="Smartphone, Laptop, Storage, Gaming Console, Smart TV">
            </div>
            <div class="form-row-2">
              <div class="form-group">
                <label class="form-label">${isAr ? 'ساعات العمل' : 'Working Hours'}</label>
                <input type="text" id="regTechHours" class="form-control" placeholder="10:00 AM - 9:00 PM">
              </div>
              <div class="form-group">
                <label class="form-label">${isAr ? 'سنوات الخبرة' : 'Years Experience'}</label>
                <input type="number" id="regTechExp" class="form-control" min="0" placeholder="5">
              </div>
            </div>
            <div class="form-group" style="margin-top: 8px;">
              <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 13px; color: var(--color-text-main);">
                <input type="checkbox" id="regTechHome" style="width: auto; cursor: pointer;">
                <span>${isAr ? 'أقدم خدمة الصيانة المنزلية (Home Service)' : 'Offer Home Visit Service'}</span>
              </label>
            </div>
          </div>

          <button type="submit" class="btn btn-primary btn-lg" style="width: 100%; margin-top: 10px;">
            <span data-i18n="auth_register_btn">إنشاء الحساب</span>
          </button>
        </form>

        <div style="text-align: center; margin-top: 18px; font-size: 13px;">
          <a href="#" onclick="app.showAuthModal('login'); return false;">${isAr ? 'لديك حساب بالفعل؟ تسجيل الدخول' : "Already have an account? Sign in"}</a>
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
        const submitBtn = e.target.querySelector("button[type='submit']");
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${isAr ? 'جاري التحقق...' : 'Signing in...'}`;

        try {
          const userProfile = await window.api.login(email, pwd);
          window.api.setSession(userProfile.access_token || "", userProfile);
          this.closeModal();
          this.updateNavAuth();
          this.loadNotifications();

          if (this.pendingQuickDiagnosis) {
            this.wizardData.device_category = this.pendingQuickDiagnosis.category;
            this.wizardData.description = this.pendingQuickDiagnosis.description;
            this.wizardData.problem_category = "Hardware";
            this.pendingQuickDiagnosis = null;
            this.pendingNavigation = null;
            this.navigate("diagnose");
          } else if (this.pendingNavigation) {
            const dest = this.pendingNavigation;
            this.pendingNavigation = null;
            this.navigate(dest);
          } else {
            this.navigate("home");
          }
        } catch (err) {
          let msg = err.message || "";
          if (msg.includes("Invalid login credentials") || err.code === "invalid_credentials") {
            msg = isAr ? "البريد الإلكتروني أو كلمة المرور غير صحيحة" : "Invalid email or password";
          } else if (msg.includes("Email not confirmed") || err.code === "email_not_confirmed") {
            msg = isAr ? "يرجى تأكيد حسابك عبر البريد الإلكتروني أولاً" : "Please confirm your email address first";
          }
          alert((isAr ? "فشل تسجيل الدخول: " : "Login failed: ") + msg);
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalText;
        }
      });
    } else {
      document.getElementById("registerForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const name = document.getElementById("regName").value.trim();
        const email = document.getElementById("regEmail").value.trim();
        const pwd = document.getElementById("regPassword").value;
        const role = document.getElementById("regRole").value;

        let techDetails = null;
        if (role === "technician") {
          const bName = document.getElementById("regTechBusiness")?.value.trim();
          const tCity = document.getElementById("regTechCity")?.value.trim();
          const tPhone = document.getElementById("regTechPhone")?.value.trim();
          if (!bName || !tCity || !tPhone) {
            alert(isAr ? "يرجى إدخال اسم المركز والمدينة ورقم الهاتف للتسجيل كفني أو مركز صيانة" : "Please enter Business Name, City, and Phone for technician/center registration.");
            return;
          }
          const cityCoords = CITY_COORDS[tCity] || null;
          techDetails = {
            kind: document.getElementById("regTechKind")?.value || "TECHNICIAN",
            business_name: bName,
            phone: tPhone,
            city: tCity,
            address: document.getElementById("regTechAddress")?.value.trim() || "",
            specializations: document.getElementById("regTechSpec")?.value.trim() || "Hardware Repair",
            working_hours: document.getElementById("regTechHours")?.value.trim() || null,
            experience_years: document.getElementById("regTechExp")?.value || null,
            home_service: !!document.getElementById("regTechHome")?.checked,
            lat: cityCoords ? cityCoords.lat : null,
            lng: cityCoords ? cityCoords.lng : null
          };
        }

        const submitBtn = e.target.querySelector("button[type='submit']");
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${isAr ? 'جاري إنشاء الحساب...' : 'Creating account...'}`;

        try {
          const userProfile = await window.api.register(name, email, pwd, role, techDetails);
          if (role === "technician") {
            alert(isAr
              ? "تم استلام طلب تسجيلك كفني/مركز صيانة بنجاح وهو الآن قيد المراجعة من قِبل الإدارة."
              : "Your technician/center application has been submitted and is pending administrator approval.");
          } else if (userProfile && !userProfile.session) {
            alert(isAr
              ? "تم إنشاء الحساب بنجاح! إذا كانت خاصية تأكيد البريد مفعلة، يرجى مراجعة صندوق الوارد."
              : "Account created successfully! Please check your inbox if email confirmation is required.");
          }

          if (userProfile?.access_token) {
            window.api.setSession(userProfile.access_token, userProfile);
          }
          this.closeModal();
          this.updateNavAuth();
          this.loadNotifications();

          if (this.pendingQuickDiagnosis) {
            this.wizardData.device_category = this.pendingQuickDiagnosis.category;
            this.wizardData.description = this.pendingQuickDiagnosis.description;
            this.wizardData.problem_category = "Hardware";
            this.pendingQuickDiagnosis = null;
            this.pendingNavigation = null;
            this.navigate("diagnose");
          } else if (this.pendingNavigation) {
            const dest = this.pendingNavigation;
            this.pendingNavigation = null;
            this.navigate(dest);
          } else {
            this.navigate("home");
          }
        } catch (err) {
          let msg = err.message || "";
          if (msg.includes("already registered") || msg.includes("already in use") || err.code === "user_already_exists") {
            msg = isAr ? "هذا البريد مسجل بالفعل في Supabase، يرجى تسجيل الدخول" : "Email already registered in Supabase. Please sign in";
          } else if (msg.includes("at least 6 characters") || msg.includes("weak")) {
            msg = isAr ? "كلمة المرور ضعيفة، يجب ألا تقل عن 6 أحرف" : "Password should be at least 6 characters";
          }
          alert((isAr ? "فشل إنشاء الحساب: " : "Registration failed: ") + msg);
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalText;
        }
      });
    }
  }

  editAdminCenter(techId) {
    const centers = this._adminCache?.centers || [];
    const target = centers.find(c => String(c.id) === String(techId));
    if (!target) return;
    this.showCenterFormModal(target);
  }

  async deleteAdminCenter(techId) {
    const isAr = window.i18n.currentLang === "ar";
    if (!confirm(isAr ? "هل تريد حذف هذا المركز نهائياً من قاعدة البيانات؟" : "Permanently delete this center from the database?")) return;
    try {
      await window.api.deleteAdminCenter(techId);
      this.adminActiveTab = "centers";
      this.renderAdmin(document.getElementById("mainContent"));
    } catch (err) {
      alert((isAr ? "تعذر حذف المركز: " : "Failed to delete center: ") + (err?.message || err));
    }
  }

  async clearAdminReview(reqId) {
    const isAr = window.i18n.currentLang === "ar";
    if (!confirm(isAr ? "هل تريد إزالة تقييم العميل عن هذا الطلب وإعادة حساب تقييم المركز؟" : "Clear this customer review and recalculate center rating?")) return;
    try {
      await window.api.clearAdminRequestReview(reqId);
      this.adminActiveTab = "requests";
      this.renderAdmin(document.getElementById("mainContent"));
    } catch (err) {
      alert((isAr ? "تعذر إزالة التقييم: " : "Failed to clear review: ") + (err?.message || err));
    }
  }

  showCenterFormModal(existing = null) {
    const isAr = window.i18n.currentLang === "ar";
    const isEdit = !!(existing && existing.id);
    const specsVal = existing
      ? (Array.isArray(existing.specializations) ? existing.specializations.join(", ") : (existing.specializations || ""))
      : "";

    this.openModal(`
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h3 style="margin: 0;">${isEdit ? (isAr ? 'تعديل بيانات مركز الصيانة' : 'Edit Maintenance Center') : (isAr ? 'إضافة مركز صيانة / فني جديد' : 'Add Maintenance Center / Tech')}</h3>
          <button type="button" class="btn btn-outline btn-sm" onclick="app.closeModal()">&times;</button>
        </div>

        <form id="adminCenterForm" style="display: flex; flex-direction: column; gap: 12px;">
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">${isAr ? 'اسم المركز / الورشة *' : 'Center / Business Name *'}</label>
              <input type="text" id="cfBusinessName" class="form-control" required value="${this._esc(existing?.business_name || existing?.name || '')}" placeholder="${isAr ? 'مثال: مركز تك فيكس للصيانة' : 'e.g. TechFix Repair Center'}" />
            </div>
            <div class="form-group">
              <label class="form-label">${isAr ? 'اسم المسؤول / الفني' : 'Manager / Technician Name'}</label>
              <input type="text" id="cfName" class="form-control" value="${this._esc(existing?.technician_name || existing?.name || '')}" />
            </div>
          </div>

          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">${isAr ? 'النوع' : 'Kind'}</label>
              <select id="cfKind" class="form-control">
                <option value="CENTER" ${(String(existing?.kind || 'CENTER').toUpperCase() === 'CENTER') ? 'selected' : ''}>${isAr ? 'مركز صيانة معتمد (CENTER)' : 'Verified Center (CENTER)'}</option>
                <option value="TECHNICIAN" ${(String(existing?.kind || '').toUpperCase() === 'TECHNICIAN') ? 'selected' : ''}>${isAr ? 'فني مستقل (TECHNICIAN)' : 'Independent Tech (TECHNICIAN)'}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">${isAr ? 'الحالة' : 'Status'}</label>
              <select id="cfStatus" class="form-control">
                <option value="approved" ${(existing?.status || 'approved') === 'approved' ? 'selected' : ''}>${isAr ? 'معتمد وظاهر للعملاء (Approved)' : 'Approved'}</option>
                <option value="pending" ${existing?.status === 'pending' ? 'selected' : ''}>${isAr ? 'بانتظار الموافقة (Pending)' : 'Pending'}</option>
                <option value="suspended" ${existing?.status === 'suspended' ? 'selected' : ''}>${isAr ? 'موقوف مؤقتاً (Suspended)' : 'Suspended'}</option>
              </select>
            </div>
          </div>

          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">${isAr ? 'المدينة / المحافظة *' : 'City / Governorate *'}</label>
              <input type="text" id="cfCity" class="form-control" required value="${this._esc(existing?.city || '')}" placeholder="${isAr ? 'القاهرة / الجيزة / الإسكندرية...' : 'Cairo / Giza / Alexandria...'}" />
            </div>
            <div class="form-group">
              <label class="form-label">${isAr ? 'رقم الهاتف / واتساب' : 'Phone Number'}</label>
              <input type="text" id="cfPhone" class="form-control" dir="ltr" value="${this._esc(existing?.phone || '')}" placeholder="010..." />
            </div>
          </div>

          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">${isAr ? 'العنوان بالتفصيل' : 'Street Address'}</label>
              <input type="text" id="cfAddress" class="form-control" value="${this._esc(existing?.address || '')}" />
            </div>
            <div class="form-group">
              <label class="form-label">${isAr ? 'البريد الإلكتروني' : 'Email'}</label>
              <input type="email" id="cfEmail" class="form-control" dir="ltr" value="${this._esc(existing?.email || '')}" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">${isAr ? 'التخصصات (افصل بفاصلة)' : 'Specializations (comma-separated)'}</label>
            <input type="text" id="cfSpecs" class="form-control" value="${this._esc(specsVal)}" placeholder="${isAr ? 'مثال: Smartphone, Laptop, iPhone, Samsung' : 'Smartphone, Laptop, Motherboard...'}" />
          </div>

          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">${isAr ? 'مواعيد العمل' : 'Working Hours'}</label>
              <input type="text" id="cfHours" class="form-control" value="${this._esc(existing?.working_hours || '')}" placeholder="${isAr ? 'يومياً 10 ص - 10 م' : 'Daily 10 AM - 10 PM'}" />
            </div>
            <div class="form-group">
              <label class="form-label">${isAr ? 'سنوات الخبرة' : 'Experience (Years)'}</label>
              <input type="number" id="cfExp" class="form-control" min="0" value="${existing?.experience_years ?? ''}" />
            </div>
          </div>

          <div class="form-group">
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 13.5px;">
              <input type="checkbox" id="cfHomeService" ${(existing?.home_service || existing?.home_service_available) ? 'checked' : ''} />
              <span>${isAr ? 'يوفر المركز خدمة صيانة منزلية' : 'Home Repair Service Available'}</span>
            </label>
          </div>

          <div class="form-group">
            <label class="form-label">${isAr ? 'نبذة عن المركز والخدمات' : 'Center Bio & Services'}</label>
            <textarea id="cfBio" class="form-control" rows="2">${this._esc(existing?.bio || '')}</textarea>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 6px;">
            <button type="button" class="btn btn-outline btn-sm" onclick="app.closeModal()">${isAr ? 'إلغاء' : 'Cancel'}</button>
            <button type="submit" id="cfSubmitBtn" class="btn btn-primary btn-sm">
              <i class="fas fa-save"></i> ${isEdit ? (isAr ? 'حفظ التعديلات' : 'Save Changes') : (isAr ? 'إضافة واعتماد المركز' : 'Add & Publish Center')}
            </button>
          </div>
        </form>
      </div>
    `);

    const form = document.getElementById("adminCenterForm");
    if (form) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const btn = document.getElementById("cfSubmitBtn");
        btn.disabled = true;
        try {
          const payload = {
            business_name: document.getElementById("cfBusinessName").value.trim(),
            name: document.getElementById("cfName").value.trim() || document.getElementById("cfBusinessName").value.trim(),
            kind: document.getElementById("cfKind").value,
            status: document.getElementById("cfStatus").value,
            city: document.getElementById("cfCity").value.trim(),
            phone: document.getElementById("cfPhone").value.trim(),
            address: document.getElementById("cfAddress").value.trim(),
            email: document.getElementById("cfEmail").value.trim(),
            specializations: document.getElementById("cfSpecs").value.trim(),
            working_hours: document.getElementById("cfHours").value.trim(),
            experience_years: document.getElementById("cfExp").value,
            home_service: document.getElementById("cfHomeService").checked,
            bio: document.getElementById("cfBio").value.trim()
          };
          if (isEdit) {
            await window.api.updateAdminCenter(existing.id, payload);
          } else {
            await window.api.createAdminCenter(payload);
          }
          this.closeModal();
          this.adminActiveTab = "centers";
          this.renderAdmin(document.getElementById("mainContent"));
        } catch (err) {
          alert((isAr ? "تعذر حفظ بيانات المركز: " : "Error saving center: ") + (err?.message || err));
          btn.disabled = false;
        }
      });
    }
  }

  _parseBulkCentersText(rawText) {
    const txt = String(rawText || "").trim();
    if (!txt) return [];
    if (txt.startsWith("[") || txt.startsWith("{")) {
      const parsed = JSON.parse(txt);
      const arr = Array.isArray(parsed) ? parsed : (Array.isArray(parsed?.centers) ? parsed.centers : []);
      return arr;
    }
    const lines = txt.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    return lines.map(line => {
      const parts = line.includes("|") ? line.split("|").map(p => p.trim()) : line.split("\t").map(p => p.trim());
      return {
        business_name: parts[0] || "",
        name: parts[0] || "",
        city: parts[1] || "Cairo",
        phone: parts[2] || "",
        specializations: parts[3] || "Smartphone, Laptop",
        address: parts[4] || "",
        kind: (parts[5] || "CENTER").toUpperCase(),
        working_hours: parts[6] || "",
        status: "approved"
      };
    }).filter(row => row.business_name);
  }

  showBulkCentersModal() {
    const isAr = window.i18n.currentLang === "ar";
    this.openModal(`
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
          <h3 style="margin: 0;" data-i18n="admin_bulk_centers_btn">${isAr ? 'رفع مجموعة مراكز صيانة' : 'Bulk Import Centers'}</h3>
          <button type="button" class="btn btn-outline btn-sm" onclick="app.closeModal()">&times;</button>
        </div>

        <p style="font-size: 13px; color: #94A3B8; margin-bottom: 12px; line-height: 1.6;">
          ${isAr
            ? 'الصق قائمة المراكز بصيغة JSON Array أو سطر لكل مركز مفصول بعلامة <code dir="ltr">|</code> كالتالي:<br><code dir="ltr">اسم المركز | المدينة | الهاتف | التخصصات | العنوان | CENTER</code>'
            : 'Paste centers as a JSON array or one line per center separated by <code dir="ltr">|</code>:<br><code dir="ltr">Center Name | City | Phone | Specialties | Address | CENTER</code>'}
        </p>

        <form id="adminBulkCentersForm" style="display: flex; flex-direction: column; gap: 12px;">
          <textarea id="bulkCentersInput" class="form-control" rows="8" dir="auto" placeholder="اسم المركز | القاهرة | 010xxxxxxxx | Smartphone, Laptop | مدينة نصر | CENTER"></textarea>
          <div id="bulkPreviewInfo" style="font-size: 12.5px; color: var(--color-accent);"></div>
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
            <button type="button" id="bulkPreviewBtn" class="btn btn-outline btn-sm">
              <i class="fas fa-search"></i> ${isAr ? 'معاينة العدد والتحقق' : 'Validate Count'}
            </button>
            <div style="display: flex; gap: 8px;">
              <button type="button" class="btn btn-outline btn-sm" onclick="app.closeModal()">${isAr ? 'إلغاء' : 'Cancel'}</button>
              <button type="submit" id="bulkSubmitBtn" class="btn btn-primary btn-sm">
                <i class="fas fa-upload"></i> ${isAr ? 'رفع وحفظ الكل' : 'Import All'}
              </button>
            </div>
          </div>
        </form>
      </div>
    `);

    const previewEl = document.getElementById("bulkPreviewInfo");
    const previewBtn = document.getElementById("bulkPreviewBtn");
    const inputEl = document.getElementById("bulkCentersInput");
    const form = document.getElementById("adminBulkCentersForm");

    if (previewBtn && inputEl && previewEl) {
      previewBtn.addEventListener("click", () => {
        try {
          const rows = this._parseBulkCentersText(inputEl.value);
          previewEl.style.color = rows.length > 0 ? "var(--color-success)" : "var(--color-warning)";
          previewEl.textContent = isAr
            ? `تم التعرف على ${rows.length} مركز/فني جاهز للرفع.`
            : `Detected ${rows.length} center(s) ready to import.`;
        } catch (err) {
          previewEl.style.color = "var(--color-danger)";
          previewEl.textContent = (isAr ? "خطأ في التنسيق: " : "Parse error: ") + err.message;
        }
      });
    }

    if (form && inputEl) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const btn = document.getElementById("bulkSubmitBtn");
        btn.disabled = true;
        try {
          const rows = this._parseBulkCentersText(inputEl.value);
          if (!rows.length) throw new Error(isAr ? "لا توجد بيانات صالحة للرفع." : "No valid rows found.");
          const res = await window.api.bulkCreateAdminCenters(rows);
          const count = res?.created_count ?? rows.length;
          alert(isAr ? `تم رفع وإضافة ${count} مركز صيانة بنجاح!` : `Imported ${count} maintenance centers successfully!`);
          this.closeModal();
          this.adminActiveTab = "centers";
          this.renderAdmin(document.getElementById("mainContent"));
        } catch (err) {
          alert((isAr ? "تعذر الرفع الجماعي: " : "Bulk import error: ") + (err?.message || err));
          btn.disabled = false;
        }
      });
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

// Robust Global App Instance & Boot
var app = null;

function bootApp() {
  if (!window.app) {
    window.FixoraApp = ByteForceApp;
    window.ByteForceApp = ByteForceApp;
    window.app = app = new ByteForceApp();
  } else {
    app = window.app;
  }
}

bootApp();
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootApp);
}
window.addEventListener("load", bootApp);
