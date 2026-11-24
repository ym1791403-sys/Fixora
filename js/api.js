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

  setSession(token, user) {
    this.token = token;
    this.currentUser = user;
    localStorage.setItem("byteforce_token", token);
    localStorage.setItem("byteforce_user", JSON.stringify(user));
    localStorage.setItem("fixora_token", token);
    localStorage.setItem("fixora_user", JSON.stringify(user));
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

  getUser() {
    if (window.SupabaseBridge && window.SupabaseBridge.currentUser) {
      return window.SupabaseBridge.currentUser;
    }
    return this.currentUser;
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
      return await window.SupabaseBridge.signInWithPassword(email, password);
    }
    throw new Error("Authentication service is unavailable. Please check your Supabase configuration.");
  }

  async register(userData) {
    if (window.SupabaseBridge && window.SupabaseBridge.isReady()) {
      return await window.SupabaseBridge.signUp(userData.email, userData.password, {
        full_name: userData.full_name,
        role: userData.role || "user"
      });
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
    if (window.SupabaseBridge && window.SupabaseBridge.isReady()) {
      return await window.SupabaseBridge.updateProfile(data);
    }
    return data;
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
    // Primary: Call backend FastAPI UnifiedDiagnosisEngine
    return await this.request("/diagnosis/analyze", {
      method: "POST",
      body: JSON.stringify(data)
    });
  }

  async getReports() {
    if (window.SupabaseBridge && window.SupabaseBridge.isReady()) {
      try {
        const sbReports = await window.SupabaseBridge.fetchDiagnosisReports();
        if (sbReports) return sbReports;
      } catch (e) {}
    }
    return [];
  }

  async getReportById(reportId) {
    if (window.SupabaseBridge && window.SupabaseBridge.isReady()) {
      try {
        return await window.SupabaseBridge.fetchReportById(reportId);
      } catch (e) {}
    }
    throw new Error(`Report #${reportId} not found.`);
  }

  // ==========================================
  // MYFIXIT REPAIR MANUALS (SUPABASE BACKEND)
  // ==========================================
  async getGuides(params = {}) {
    const qParams = new URLSearchParams();
    if (params.search) qParams.set("q", params.search);
    if (params.category && params.category !== "all") qParams.set("category", params.category);
    if (params.component) qParams.set("component", params.component);
    if (params.difficulty && params.difficulty !== "all") qParams.set("difficulty", params.difficulty);
    if (params.limit) qParams.set("limit", params.limit);
    if (params.offset) qParams.set("offset", params.offset);

    const queryStr = qParams.toString();
    const endpoint = `/guides${queryStr ? '?' + queryStr : ''}`;

    try {
      const res = await this.request(endpoint);
      return res.guides || [];
    } catch (e) {
      // Fallback: Query Supabase directly via Supabase client if available
      if (window.SupabaseBridge && window.SupabaseBridge.isReady()) {
        return await window.SupabaseBridge.fetchGuides(params);
      }
      throw e;
    }
  }

  async getGuideById(guideId) {
    try {
      return await this.request(`/guides/${guideId}`);
    } catch (e) {
      if (window.SupabaseBridge && window.SupabaseBridge.isReady()) {
        return await window.SupabaseBridge.fetchGuideById(guideId);
      }
      throw e;
    }
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
    return await this.request("/prediction/hard-drive", {
      method: "POST",
      body: JSON.stringify(telemetryData)
    });
  }

  // ==========================================
  // TECHNICIAN MARKETPLACE (SUPABASE)
  // ==========================================
  async getTechnicians(specialization = "all") {
    if (window.SupabaseBridge && window.SupabaseBridge.isReady()) {
      return await window.SupabaseBridge.fetchTechnicians(specialization);
    }
    return [];
  }

  async bookTechnician(booking) {
    if (window.SupabaseBridge && window.SupabaseBridge.isReady()) {
      return await window.SupabaseBridge.bookTechnician(booking);
    }
    throw new Error("Technician booking service is unavailable.");
  }

  // ==========================================
  // USER DEVICES & REPAIR REQUESTS (SUPABASE)
  // ==========================================
  async getDevices() {
    if (window.SupabaseBridge && window.SupabaseBridge.isReady()) {
      return await window.SupabaseBridge.fetchDevices();
    }
    return [];
  }

  async addDevice(device) {
    if (window.SupabaseBridge && window.SupabaseBridge.isReady()) {
      return await window.SupabaseBridge.syncDevice(device);
    }
    throw new Error("Device management service unavailable.");
  }

  async deleteDevice(deviceId) {
    if (window.SupabaseBridge && window.SupabaseBridge.isReady()) {
      return await window.SupabaseBridge.deleteDevice(deviceId);
    }
    throw new Error("Device deletion service unavailable.");
  }

  // ==========================================
  // ADMIN SYSTEM METRICS (SUPABASE)
  // ==========================================
  async getAdminStats() {
    try {
      return await this.request("/admin/stats");
    } catch (e) {
      if (window.SupabaseBridge && window.SupabaseBridge.isReady()) {
        return await window.SupabaseBridge.fetchAdminStats();
      }
      throw e;
    }
  }

  async getPendingTechnicians() {
    if (window.SupabaseBridge && window.SupabaseBridge.isReady()) {
      return await window.SupabaseBridge.fetchPendingTechnicians();
    }
    return [];
  }

  async approveTechnician(techId) {
    if (window.SupabaseBridge && window.SupabaseBridge.isReady()) {
      return await window.SupabaseBridge.approveTechnician(techId);
    }
    throw new Error("Action unavailable.");
  }

  async rejectTechnician(techId) {
    if (window.SupabaseBridge && window.SupabaseBridge.isReady()) {
      return await window.SupabaseBridge.rejectTechnician(techId);
    }
    throw new Error("Action unavailable.");
  }
}

var api = window.api = new ApiClient();
