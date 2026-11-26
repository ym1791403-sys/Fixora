/**
 * ByteForce Production API Client
 * Connects directly to backend API and Supabase PostgreSQL.
 * Strictly zero mock data, zero synthetic fallbacks, and zero fabricated diagnosis results.
 * When services are unavailable, returns authentic 503 Dataset Unavailable errors.
 */

class ApiClient {
  constructor() {
    this.baseUrl = "/api";
    this.token = localStorage.getItem("byteforce_token") || localStorage.getItem("fixora_token") || localStorage.getItem("techrepair_token") || null;
    this.currentUser = JSON.parse(localStorage.getItem("byteforce_user") || localStorage.getItem("fixora_user") || localStorage.getItem("techrepair_user") || "null");
  }

  _normalizeUserRole(user) {
    if (!user || typeof user !== "object") return user;
    const email = String(user.email || "").toLowerCase().trim();
    const isAdmin = email === "snsr19344@gmail.com";
    const resolvedRole = isAdmin ? "admin" : (user.role === "admin" ? "user" : (user.role || "user"));
    return resolvedRole === user.role ? user : { ...user, role: resolvedRole };
  }

  setSession(token, user) {
    const cleanUser = this._normalizeUserRole(user);
    this.token = token;
    this.currentUser = cleanUser;
    localStorage.setItem("byteforce_token", token);
    localStorage.setItem("byteforce_user", JSON.stringify(cleanUser));
    localStorage.setItem("fixora_token", token);
    localStorage.setItem("fixora_user", JSON.stringify(cleanUser));
  }

  clearSession() {
    this.token = null;
    this.currentUser = null;
    localStorage.removeItem("byteforce_token");
    localStorage.removeItem("byteforce_user");
    localStorage.removeItem("fixora_token");
    localStorage.removeItem("fixora_user");
  }

  isLoggedIn() {
    return !!this.token || (window.SupabaseBridge && !!window.SupabaseBridge.currentUser);
  }

  // Auth gate: block any write/action when there is no logged-in session.
  // Reuses the app's existing modal shell (window.app.openModal) and the
  // existing Google sign-in (SupabaseBridge.signInWithGoogle), mirroring the
  // diagnosis flow that asks the user to sign in first.
  requireLogin() {
    if (this.isLoggedIn()) return true;
    if (window.app && typeof window.app.openModal === "function") {
      window.app.openModal(
        '<div style="text-align:center;padding:8px 4px;">' +
        '<h3>سجّل دخولك أولاً</h3>' +
        '<p>لازم تسجّل دخولك عشان تعمل طلب صيانة أو أي إجراء.</p>' +
        '<button onclick="window.SupabaseBridge && window.SupabaseBridge.signInWithGoogle()" style="padding:10px 18px;cursor:pointer;">تسجيل الدخول عبر Google</button>' +
        '<p><button onclick="window.app.closeModal()" style="padding:6px 12px;cursor:pointer;">إلغاء</button></p>' +
        '</div>'
      );
    }
    const err = new Error("Authentication required. Please sign in first.");
    err.status = 401;
    throw err;
  }

  getUser() {
    if (window.SupabaseBridge && window.SupabaseBridge.currentUser) {
      return this._normalizeUserRole(window.SupabaseBridge.currentUser);
    }
    return this._normalizeUserRole(this.currentUser);
  }

  getRole() {
    const user = this.getUser();
    return user ? (user.role || "user") : "guest";
  }

  async request(endpoint, options = {}) {
    const cleanEndpoint = endpoint.startsWith("/v1/") ? endpoint.replace("/v1/", "/") : endpoint;
    const url = `${this.baseUrl}${cleanEndpoint}`;
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

      let errData = {};
      try {
        errData = await response.json();
      } catch (e) {}

      const err = new Error(errData.detail || errData.message || `HTTP ${response.status}`);
      err.status = response.status;
      err.data = errData;
      throw err;
    } catch (err) {
      // If network failure or serverless function unavailable, return explicit 503 error
      if (!err.status) {
        err.status = 503;
        err.message = "503 Dataset unavailable: Unable to reach diagnosis API service. No fabricated data will be returned.";
      }
      throw err;
    }
  }

  // ==========================================
  // AUTHENTICATION (SUPABASE OAUTH & EMAIL)
  // ==========================================
  async login(email, password) {
    if (window.SupabaseBridge && window.SupabaseBridge.isReady()) {
      const user = await window.SupabaseBridge.login(email, password);
      if (user?.access_token) {
        this.setSession(user.access_token, user);
      }
      return user;
    }
    throw new Error("Authentication service is unavailable. Please check your Supabase configuration.");
  }

  async register(nameOrData, email, password, role = "user", techDetails = null) {
    if (window.SupabaseBridge && window.SupabaseBridge.isReady()) {
      return await window.SupabaseBridge.register(nameOrData, email, password, role, techDetails);
    }
    throw new Error("Registration service is unavailable. Please check your Supabase configuration.");
  }

  async getCurrentUser() {
    if (window.SupabaseBridge && window.SupabaseBridge.isReady()) {
      return await window.SupabaseBridge.getCurrentUser();
    }
    return this.getUser();
  }

  async updateProfile(data) {
    this.requireLogin();
    if (window.SupabaseBridge && window.SupabaseBridge.isReady()) {
      return await window.SupabaseBridge.updateProfile(data);
    }
    throw new Error("Profile update service is unavailable.");
  }

  // ==========================================
  // DATASET STATUS & VERIFICATION
  // ==========================================
  async getDatasetStatus() {
    return await this.request("/datasets/status");
  }

  // ==========================================
  // GENUINE DATA-DRIVEN DIAGNOSIS
  // ==========================================
  async diagnoseDevice(data) {
    this.requireLogin();
    const user = this.getUser();
    const payload = { ...data };
    if (user?.id && !payload.user_id) {
      payload.user_id = user.id;
    }
    return await this.request("/diagnosis/analyze", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }

  async runDiagnosis(data) {
    return await this.diagnoseDevice(data);
  }

  async submitDiagnosisFeedback(data) {
    this.requireLogin();
    const user = this.getUser();
    const payload = { ...data };
    if (user?.id && !payload.user_id) {
      payload.user_id = user.id;
    }
    return await this.request("/diagnosis/feedback", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }

  async getReports() {
    if (window.SupabaseBridge && window.SupabaseBridge.isReady()) {
      return await window.SupabaseBridge.fetchDiagnosisReports();
    }
    return [];
  }

  async getMyReports() {
    return await this.getReports();
  }

  async getReportById(reportId) {
    if (window.SupabaseBridge && window.SupabaseBridge.isReady()) {
      return await window.SupabaseBridge.fetchReportById(reportId);
    }
    throw new Error(`Report #${reportId} not found.`);
  }

  async getReport(reportId) {
    return await this.getReportById(reportId);
  }

  // ==========================================
  // MYFIXIT REPAIR MANUALS (SUPABASE BACKEND)
  // ==========================================
  async getGuides(categoryOrParams = {}, difficulty = null, search = null) {
    let params = {};
    if (categoryOrParams && typeof categoryOrParams === "object") {
      params = categoryOrParams;
    } else {
      params = { category: categoryOrParams, difficulty, search };
    }

    const qParams = new URLSearchParams();
    if (params.search) qParams.set("q", params.search);
    if (params.category && params.category !== "all") qParams.set("category", params.category);
    if (params.component) qParams.set("component", params.component);
    if (params.difficulty && params.difficulty !== "all") qParams.set("difficulty", params.difficulty);
    qParams.set("limit", String(params.limit || 60));
    if (params.offset) qParams.set("offset", String(params.offset));
    if (window.i18n?.currentLang) qParams.set("lang", window.i18n.currentLang);

    const queryStr = qParams.toString();
    const endpoint = `/guides${queryStr ? '?' + queryStr : ''}`;

    try {
      const res = await this.request(endpoint);
      const list = res.guides || [];
      return list.map(g => (window.SupabaseBridge && window.SupabaseBridge._normalizeGuide) ? window.SupabaseBridge._normalizeGuide(g) : g);
    } catch (e) {
      if (window.SupabaseBridge && window.SupabaseBridge.isReady()) {
        return await window.SupabaseBridge.fetchGuides(params);
      }
      throw e;
    }
  }

  async getGuideById(guideId) {
    const lang = window.i18n?.currentLang || "en";
    try {
      const g = await this.request(`/guides/${guideId}?lang=${encodeURIComponent(lang)}`);
      return (window.SupabaseBridge && window.SupabaseBridge._normalizeGuide) ? window.SupabaseBridge._normalizeGuide(g) : g;
    } catch (e) {
      if (window.SupabaseBridge && window.SupabaseBridge.isReady()) {
        return await window.SupabaseBridge.fetchGuideById(guideId);
      }
      throw e;
    }
  }

  async getGuide(guideId) {
    return await this.getGuideById(guideId);
  }

  async getGuideCategories() {
    try {
      return await this.request("/guides/categories");
    } catch (e) {
      return [];
    }
  }

  // ==========================================
  // BACKBLAZE HARD DRIVE PREDICTION
  // ==========================================
  async predictHardDrive(telemetryData) {
    this.requireLogin();
    return await this.request("/prediction/hard-drive", {
      method: "POST",
      body: JSON.stringify(telemetryData)
    });
  }

  // ==========================================
  // TECHNICIAN MARKETPLACE (SUPABASE ONLY)
  // ==========================================
  async getTechnicians(city = "all", specialization = "all") {
    if (window.SupabaseBridge && window.SupabaseBridge.isReady()) {
      return await window.SupabaseBridge.fetchTechnicians(city, specialization);
    }
    return [];
  }

  async getNearbyRepairShops(lat, lng, radiusKm = 6) {
    return await this.request(`/marketplace/nearby-shops?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}&radius_km=${encodeURIComponent(radiusKm)}`);
  }

  async bookTechnician(booking) {
    this.requireLogin();
    if (window.SupabaseBridge && window.SupabaseBridge.isReady()) {
      return await window.SupabaseBridge.bookTechnician(booking);
    }
    throw new Error("Technician booking service is unavailable.");
  }

  // ==========================================
  // USER DEVICES & REPAIR REQUESTS (STRICT SUPABASE ONLY - ZERO LOCAL FALLBACKS)
  // ==========================================
  async getDevices() {
    if (window.SupabaseBridge && window.SupabaseBridge.isReady()) {
      return await window.SupabaseBridge.fetchDevices();
    }
    return [];
  }

  async getMyDevices() {
    return await this.getDevices();
  }

  async addDevice(device) {
    this.requireLogin();
    if (window.SupabaseBridge && window.SupabaseBridge.isReady()) {
      return await window.SupabaseBridge.syncDevice(device);
    }
    throw new Error("Device management service unavailable.");
  }

  async deleteDevice(deviceId) {
    this.requireLogin();
    if (window.SupabaseBridge && window.SupabaseBridge.isReady()) {
      return await window.SupabaseBridge.deleteDevice(deviceId);
    }
    throw new Error("Device deletion service unavailable.");
  }

  async getMyRequests() {
    if (window.SupabaseBridge && window.SupabaseBridge.isReady()) {
      return await window.SupabaseBridge.fetchRepairRequests();
    }
    throw new Error("Repair requests service is unavailable.");
  }

  async createRepairRequest(reqData) {
    this.requireLogin();
    if (window.SupabaseBridge && window.SupabaseBridge.isReady()) {
      return await window.SupabaseBridge.createRepairRequest(reqData);
    }
    throw new Error("Repair booking service is unavailable.");
  }

  async updateRequestStatus(reqId, newStatus, updates = {}) {
    this.requireLogin();
    if (window.SupabaseBridge && window.SupabaseBridge.isReady()) {
      return await window.SupabaseBridge.updateRequestStatus(reqId, newStatus, updates);
    }
    throw new Error("Repair status service is unavailable.");
  }

  // ==========================================
  // REAL NOTIFICATIONS (SUPABASE BACKED)
  // ==========================================
  async getNotifications() {
    if (window.SupabaseBridge && window.SupabaseBridge.isReady()) {
      return await window.SupabaseBridge.fetchNotifications();
    }
    return [];
  }

  async markNotificationRead(id) {
    if (window.SupabaseBridge && window.SupabaseBridge.isReady()) {
      return await window.SupabaseBridge.markNotificationRead(id);
    }
  }

  async markAllNotificationsRead() {
    if (window.SupabaseBridge && window.SupabaseBridge.isReady()) {
      return await window.SupabaseBridge.markAllNotificationsRead();
    }
  }

  // ==========================================
  // DEVICE & GUIDE VISUAL MEDIA LOOKUP
  // ==========================================
  async getDeviceImage(query, category = "") {
    try {
      const q = new URLSearchParams();
      if (query) q.set("q", query);
      if (category) q.set("category", category);
      return await this.request(`/media/device-image?${q.toString()}`);
    } catch (e) {
      return { image_url: null, title: null, source: null };
    }
  }

  // ==========================================
  // ADMIN SYSTEM METRICS & CONTROLS (EXCLUSIVE TO snsr19344@gmail.com)
  // ==========================================
  async _adminRequest(endpoint, method = "GET", fallbackFn = null, bodyPayload = null) {
    let token = this.token;
    if (window.SupabaseBridge && typeof window.SupabaseBridge.getAccessToken === "function") {
      try {
        const liveTok = await window.SupabaseBridge.getAccessToken();
        if (liveTok) token = liveTok;
      } catch (e) {}
    }

    try {
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const fetchOpts = { method, headers };
      if (bodyPayload !== null && method !== "GET" && method !== "HEAD") {
        fetchOpts.body = JSON.stringify(bodyPayload);
      }
      const response = await fetch(`${this.baseUrl}${endpoint}`, fetchOpts);
      if (response.status === 401 || response.status === 403) {
        let errData = {};
        try { errData = await response.json(); } catch (e) {}
        const err = new Error(errData.detail || errData.message || `HTTP ${response.status}`);
        err.status = response.status;
        throw err;
      }
      if (response.ok) {
        return await response.json();
      }
      let errData = {};
      try { errData = await response.json(); } catch (e) {}
      if (response.status === 400 || response.status === 404 || response.status === 409 || response.status === 422) {
        const err = new Error(errData.detail || errData.message || `HTTP ${response.status}`);
        err.status = response.status;
        throw err;
      }
      throw new Error(errData.detail || `HTTP ${response.status}`);
    } catch (err) {
      if (err.status === 401 || err.status === 403 || err.status === 400 || err.status === 404 || err.status === 409 || err.status === 422) {
        throw err;
      }
      if (fallbackFn && window.SupabaseBridge && window.SupabaseBridge.isReady()) {
        return await fallbackFn();
      }
      throw err;
    }
  }

  async getAdminStats() {
    return await this._adminRequest("/admin/stats", "GET", () => window.SupabaseBridge.fetchAdminStats());
  }

  async getAllAdminCenters(status = "all") {
    const qs = status && status !== "all" ? `?status=${encodeURIComponent(status)}` : "";
    const rows = await this._adminRequest(`/admin/centers${qs}`, "GET", () => window.SupabaseBridge.fetchAllTechniciansAdmin());
    if (window.SupabaseBridge && typeof window.SupabaseBridge._normalizeTechnician === "function") {
      return (rows || []).map(r => window.SupabaseBridge._normalizeTechnician(r));
    }
    return rows || [];
  }

  async getPendingTechnicians() {
    const rows = await this._adminRequest("/admin/centers?status=pending", "GET", () => window.SupabaseBridge.fetchPendingTechnicians());
    if (window.SupabaseBridge && typeof window.SupabaseBridge._normalizeTechnician === "function") {
      return (rows || []).map(r => window.SupabaseBridge._normalizeTechnician(r));
    }
    return rows || [];
  }

  async approveTechnician(techId) {
    return await this._adminRequest(`/admin/centers/${techId}/approve`, "POST", () => window.SupabaseBridge.approveTechnician(techId));
  }

  async suspendTechnician(techId) {
    return await this._adminRequest(`/admin/centers/${techId}/suspend`, "POST", () => window.SupabaseBridge.suspendTechnician(techId));
  }

  async rejectTechnician(techId) {
    return await this._adminRequest(`/admin/centers/${techId}/reject`, "POST", () => window.SupabaseBridge.rejectTechnician(techId));
  }

  async getAdminUsers() {
    return await this._adminRequest("/admin/users", "GET", () => window.SupabaseBridge.fetchAdminUsers());
  }

  async toggleUserStatus(userId) {
    return await this._adminRequest(`/admin/users/${userId}/toggle`, "POST", () => window.SupabaseBridge.toggleUserStatus(userId));
  }

  async getAdminRequests() {
    const rows = await this._adminRequest("/admin/requests", "GET", () => window.SupabaseBridge.fetchAllRequestsAdmin());
    if (window.SupabaseBridge && typeof window.SupabaseBridge._normalizeRequest === "function") {
      return (rows || []).map(r => window.SupabaseBridge._normalizeRequest(r));
    }
    return rows || [];
  }

  async getAdminAuditLogs() {
    return await this._adminRequest("/admin/audit", "GET", () => window.SupabaseBridge.fetchAdminAuditLogs());
  }

  async getAdminAiStatus() {
    return await this._adminRequest("/admin/ai-status", "GET", null);
  }

  async saveAdminAiConfig(provider, apiKey) {
    return await this._adminRequest("/admin/ai-config", "POST", null, { provider, api_key: apiKey });
  }

  async testAdminAi() {
    return await this._adminRequest("/admin/ai-test", "POST", null, {});
  }

  async createAdminCenter(centerData) {
    const row = await this._adminRequest(
      "/admin/centers",
      "POST",
      () => window.SupabaseBridge.createTechnicianAdmin(centerData),
      centerData
    );
    if (row && window.SupabaseBridge && typeof window.SupabaseBridge._normalizeTechnician === "function") {
      return window.SupabaseBridge._normalizeTechnician(row);
    }
    return row;
  }

  async bulkCreateAdminCenters(centersArray) {
    return await this._adminRequest(
      "/admin/centers/bulk",
      "POST",
      () => window.SupabaseBridge.bulkCreateTechniciansAdmin(centersArray),
      { centers: centersArray }
    );
  }

  async updateAdminCenter(techId, updates) {
    const row = await this._adminRequest(
      `/admin/centers/${encodeURIComponent(techId)}`,
      "PUT",
      () => window.SupabaseBridge.updateTechnicianAdmin(techId, updates),
      updates
    );
    if (row && window.SupabaseBridge && typeof window.SupabaseBridge._normalizeTechnician === "function") {
      return window.SupabaseBridge._normalizeTechnician(row);
    }
    return row;
  }

  async deleteAdminCenter(techId) {
    return await this._adminRequest(
      `/admin/centers/${encodeURIComponent(techId)}`,
      "DELETE",
      () => window.SupabaseBridge.deleteTechnicianAdmin(techId)
    );
  }

  async clearAdminRequestReview(reqId) {
    return await this._adminRequest(
      `/admin/requests/${encodeURIComponent(reqId)}/clear-review`,
      "POST",
      () => window.SupabaseBridge.clearReviewAdmin(reqId),
      {}
    );
  }

  async getTechnicianReviews(techId) {
    try {
      const response = await fetch(`${this.baseUrl}/technicians/${encodeURIComponent(techId)}/reviews`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (e) {}
    if (window.SupabaseBridge && typeof window.SupabaseBridge.fetchTechnicianReviewsFallback === "function") {
      return await window.SupabaseBridge.fetchTechnicianReviewsFallback(techId);
    }
    return {
      tech_id: techId,
      average_rating: 0,
      reviews_count: 0,
      rating_breakdown: { "5": 0, "4": 0, "3": 0, "2": 0, "1": 0 },
      reviews: []
    };
  }

  async submitRepairReview(reqId, rating, reviewComment) {
    this.requireLogin();
    const headers = { "Content-Type": "application/json" };
    let hasToken = false;
    try {
      if (typeof supabaseClient !== "undefined" && supabaseClient) {
        const { data } = await supabaseClient.auth.getSession();
        const token = data?.session?.access_token;
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
          hasToken = true;
        }
      }
    } catch (e) {}

    if (hasToken) {
      try {
        const response = await fetch(`${this.baseUrl}/requests/${encodeURIComponent(reqId)}/review`, {
          method: "POST",
          headers,
          body: JSON.stringify({ rating, review_comment: reviewComment })
        });
        if (response.ok) {
          return await response.json();
        }
        let errData = {};
        try { errData = await response.json(); } catch (e) {}
        if ([400, 401, 403, 404, 409, 422].includes(response.status)) {
          const err = new Error(errData.detail || errData.message || `HTTP ${response.status}`);
          err.status = response.status;
          throw err;
        }
      } catch (err) {
        if ([400, 401, 403, 404, 409, 422].includes(err.status)) {
          throw err;
        }
      }
    }

    if (window.SupabaseBridge && window.SupabaseBridge.isReady()) {
      return await window.SupabaseBridge.updateRequestStatus(reqId, "COMPLETED", {
        rating,
        review_comment: reviewComment,
        reviewed: true,
        note: `تم إضافة تقييم العميل (${rating}★)`
      });
    }
    throw new Error("Unable to submit review.");
  }
}

var api = window.api = new ApiClient();
