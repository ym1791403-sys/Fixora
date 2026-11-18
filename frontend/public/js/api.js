/**
 * TechRepair API Client
 */

class ApiClient {
  constructor() {
    this.baseUrl = "/api/v1";
    this.token = localStorage.getItem("techrepair_token") || null;
    this.currentUser = JSON.parse(localStorage.getItem("techrepair_user") || "null");
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
      const response = await fetch(url, {
        ...options,
        headers
      });

      if (response.status === 401) {
        // Token expired or invalid
        this.clearSession();
        if (window.app && typeof window.app.updateNavAuth === "function") {
          window.app.updateNavAuth();
        }
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || data.message || "An error occurred");
      }
      return data;
    } catch (err) {
      console.error(`API Error on ${endpoint}:`, err);
      throw err;
    }
  }

  // --- AUTH ---
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

  // --- DIAGNOSIS ---
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

  // --- GUIDES ---
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

  // --- TECHNICIANS ---
  async getTechnicians(city = null, specialization = null) {
    const params = new URLSearchParams();
    if (city) params.append("city", city);
    if (specialization) params.append("specialization", specialization);
    return await this.request(`/technicians?${params.toString()}`);
  }

  async getTechnician(techId) {
    return await this.request(`/technicians/${techId}`);
  }

  // --- BOOKINGS ---
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

  // --- DEVICES ---
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

  // --- ADMIN ---
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

window.api = new ApiClient();
