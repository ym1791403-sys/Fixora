/**
 * Fixora Supabase Client & Real Authentication Bridge
 * Project Ref: czwndaulnxvmncbtzsao
 * API URL: https://czwndaulnxvmncbtzsao.supabase.co
 */

const SUPABASE_CONFIG = {
  url: "https://czwndaulnxvmncbtzsao.supabase.co",
  anonKey: "sb_publishable_53KU912VNrxvEGjO9DD_bA_HPB31oOc"
};

let supabaseClient = null;

try {
  if (typeof supabase !== "undefined" && supabase.createClient) {
    supabaseClient = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
  }
} catch (err) {
  console.warn("Supabase client initialization note:", err);
}

window.SupabaseBridge = {
  isReady() {
    return typeof supabase !== "undefined" && !!supabaseClient;
  },

  getClient() {
    return supabaseClient;
  },

  async getAccessToken() {
    if (this.currentUser?.access_token) return this.currentUser.access_token;
    if (!this.isReady()) return null;
    try {
      const { data } = await supabaseClient.auth.getSession();
      return data?.session?.access_token || null;
    } catch (e) {
      return null;
    }
  },

  /**
   * Initializes session upon page load / refresh or OAuth redirect.
   */
  async initSession() {
    if (!this.isReady()) return null;
    try {
      if (window.location.hash.includes("access_token=") || window.location.search.includes("code=")) {
        this._oauthRedirectPending = true;
      }
      const { data, error } = await supabaseClient.auth.getSession();
      if (error) {
        console.warn("Supabase getSession notice:", error.message);
        return null;
      }
      if (data && data.session && data.session.user) {
        await this._applyUserSession(data.session);

        // Clean OAuth hash from browser address bar smoothly
        if (window.location.hash && (window.location.hash.includes("access_token=") || window.location.hash.includes("error="))) {
          try {
            window.history.replaceState(null, "", window.location.pathname + window.location.search);
          } catch (e) {}
        }
        return data.session;
      }
    } catch (err) {
      console.warn("Supabase initSession error:", err);
    }
    return null;
  },

  /**
   * Genuine Google OAuth Sign-In via Supabase Auth
   */
  async signInWithGoogle() {
    if (!this.isReady()) {
      throw new Error("Supabase SDK is not available");
    }

    // Determine accurate redirect URL (Vercel production or Localhost)
    const redirectUrl = window.location.origin + window.location.pathname;

    const { data, error } = await supabaseClient.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUrl
      }
    });

    if (error) {
      throw error;
    }
    return data;
  },

  EXCLUSIVE_ADMIN_EMAIL: "snsr19344@gmail.com",

  isExclusiveAdminEmail(email) {
    return String(email || "").toLowerCase().trim() === this.EXCLUSIVE_ADMIN_EMAIL;
  },

  resolveRole(email, profileRole = null, metaRole = null) {
    if (this.isExclusiveAdminEmail(email)) return "admin";
    const candidate = profileRole || metaRole || "user";
    return candidate === "admin" ? "user" : candidate;
  },

  /**
   * Real Email / Password Registration via Supabase (supports Customer & Technician/Center applications)
   */
  async register(nameOrPayload, emailArg, passwordArg, roleArg = "user", techDetailsArg = null) {
    if (!this.isReady()) {
      throw new Error("Supabase SDK is not available");
    }

    let name = nameOrPayload;
    let email = emailArg;
    let password = passwordArg;
    let role = roleArg;
    let techDetails = techDetailsArg;

    if (nameOrPayload && typeof nameOrPayload === "object") {
      name = nameOrPayload.full_name || nameOrPayload.name || "";
      email = nameOrPayload.email || "";
      password = nameOrPayload.password || "";
      role = nameOrPayload.role || "user";
      techDetails = nameOrPayload.techDetails || nameOrPayload;
    }

    const cleanEmail = String(email || "").trim();
    const assignedRole = this.resolveRole(cleanEmail, null, role);

    const { data, error } = await supabaseClient.auth.signUp({
      email: cleanEmail,
      password: password,
      options: {
        data: {
          full_name: name,
          role: assignedRole,
          avatar_initial: (name[0] || cleanEmail[0] || "U").toUpperCase()
        }
      }
    });

    if (error) {
      throw error;
    }

    const user = data.user;
    if (!user) {
      throw new Error("No user returned from Supabase registration");
    }

    await this.syncUserProfile(user, { full_name: name, role: assignedRole });

    if (assignedRole === "technician" && techDetails) {
      try {
        await this.submitTechnicianApplication({
          user_id: user.id,
          name: name,
          email: cleanEmail,
          business_name: techDetails.business_name || name,
          kind: techDetails.kind || "TECHNICIAN",
          city: techDetails.city || "",
          phone: techDetails.phone || "",
          address: techDetails.address || "",
          lat: techDetails.lat || null,
          lng: techDetails.lng || null,
          specializations: techDetails.specializations || [],
          working_hours: techDetails.working_hours || null,
          experience_years: techDetails.experience_years || null,
          home_service: !!techDetails.home_service,
          bio: techDetails.bio || ""
        });
      } catch (techErr) {
        console.warn("Technician application insert note:", techErr.message);
      }
    }

    const userProfile = {
      id: user.id,
      uid: user.id,
      email: user.email,
      full_name: name,
      role: assignedRole,
      avatar_initial: (name[0] || "U").toUpperCase(),
      access_token: data.session?.access_token || null,
      session: data.session
    };

    if (data.session) {
      this._applyUserSession(data.session);
    }

    return userProfile;
  },

  async signUp(email, password, opts = {}) {
    return this.register({
      email,
      password,
      full_name: opts.full_name || opts.name || email.split("@")[0],
      role: opts.role || "user",
      techDetails: opts.techDetails || null
    });
  },

  /**
   * Real Email / Password Login via Supabase
   */
  async login(email, password) {
    if (!this.isReady()) {
      throw new Error("Supabase SDK is not available");
    }

    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: String(email || "").trim(),
      password: password
    });

    if (error) {
      throw error;
    }

    const user = data.user;
    let profile = null;
    try {
      const { data: prof } = await supabaseClient
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      profile = prof;
    } catch (pErr) {}

    if (profile && profile.is_active === false) {
      await supabaseClient.auth.signOut();
      throw new Error("تم تعطيل هذا الحساب من قِبل مدير النظام / This account has been deactivated.");
    }

    const role = this.resolveRole(user.email, profile?.role, user.user_metadata?.role);
    const fullName = profile?.full_name || user.user_metadata?.full_name || user.user_metadata?.name || email.split("@")[0];
    const avatarUrl = profile?.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture || null;

    if (this.isExclusiveAdminEmail(user.email) && (!profile || profile.role !== "admin")) {
      await this.syncUserProfile(user, { full_name: fullName, role: "admin" });
    }

    return {
      id: user.id,
      uid: user.id,
      email: user.email,
      full_name: fullName,
      avatar_url: avatarUrl,
      role: role,
      avatar_initial: (fullName[0] || "U").toUpperCase(),
      access_token: data.session?.access_token
    };
  },

  async signInWithPassword(email, password) {
    return this.login(email, password);
  },

  /**
   * Genuine Sign Out via Supabase
   */
  async signOut() {
    if (this.isReady()) {
      try {
        await supabaseClient.auth.signOut();
      } catch (err) {
        console.warn("Supabase signOut error:", err);
      }
    }
    this._clearUserSession();
  },

  /**
   * Syncs real user data to public.profiles table
   */
  async syncUserProfile(user, extraMeta = {}) {
    if (!this.isReady() || !user) return;
    try {
      const meta = { ...(user.user_metadata || {}), ...extraMeta };
      const fullName = meta.full_name || meta.name || (user.email ? user.email.split("@")[0] : "User");
      const avatarUrl = meta.avatar_url || meta.picture || null;
      const initial = (fullName[0] || (user.email ? user.email[0] : "U")).toUpperCase();
      const role = this.resolveRole(user.email, null, meta.role);

      await supabaseClient.from("profiles").upsert({
        id: user.id,
        email: user.email,
        full_name: fullName,
        avatar_url: avatarUrl,
        avatar_initial: initial,
        role: role,
        updated_at: new Date().toISOString()
      }, { onConflict: "id" });
    } catch (e) {
      console.warn("Client profile sync note:", e.message);
    }
  },

  /**
   * Internal session applicator
   */
  async _applyUserSession(session) {
    if (!session || !session.user) return;
    const u = session.user;
    const meta = u.user_metadata || {};
    let fullName = meta.full_name || meta.name || (u.email ? u.email.split("@")[0] : "User");
    let avatarUrl = meta.avatar_url || meta.picture || null;

    let profile = null;
    try {
      if (supabaseClient) {
        const { data: prof } = await supabaseClient
          .from("profiles")
          .select("*")
          .eq("id", u.id)
          .maybeSingle();
        profile = prof;

        if (profile && profile.is_active === false) {
          await supabaseClient.auth.signOut();
          this._clearUserSession();
          return;
        }

        if (profile) {
          if (profile.full_name) fullName = profile.full_name;
          if (profile.avatar_url) avatarUrl = profile.avatar_url;
        } else {
          await this.syncUserProfile(u);
        }

        // Guarantee exclusive admin profile stays synced for snsr19344@gmail.com
        if (this.isExclusiveAdminEmail(u.email) && (!profile || profile.role !== "admin")) {
          await this.syncUserProfile(u, { full_name: fullName, role: "admin" });
        }
      }
    } catch (syncErr) {
      console.warn("Profile read note:", syncErr.message);
    }

    const role = this.resolveRole(u.email, profile?.role, meta.role);
    const initial = (fullName[0] || (u.email ? u.email[0] : "U")).toUpperCase();

    const userProfile = {
      id: u.id,
      uid: u.id,
      email: u.email,
      full_name: fullName,
      avatar_url: avatarUrl,
      avatar_initial: initial,
      role: role,
      provider: u.app_metadata?.provider || (u.identities?.[0]?.provider) || "google",
      access_token: session.access_token
    };

    if (window.api && typeof window.api.setSession === "function") {
      window.api.setSession(session.access_token, userProfile);
    } else {
      localStorage.setItem("byteforce_token", session.access_token);
      localStorage.setItem("byteforce_user", JSON.stringify(userProfile));
      localStorage.setItem("techrepair_token", session.access_token);
      localStorage.setItem("techrepair_user", JSON.stringify(userProfile));
      localStorage.setItem("fixora_token", session.access_token);
      localStorage.setItem("fixora_user", JSON.stringify(userProfile));
    }

    this.currentUser = userProfile;

    if (window.app) {
      if (typeof window.app.updateNavAuth === "function") {
        window.app.updateNavAuth();
      }
      if (typeof window.app.loadNotifications === "function") {
        window.app.loadNotifications();
      }
      if (typeof window.app.closeModal === "function") {
        window.app.closeModal();
      }
      // If user had an intent to diagnose or an in-progress quick triage input, resume smoothly
      if (window.app.pendingQuickDiagnosis) {
        window.app.wizardData = window.app.wizardData || {};
        window.app.wizardData.device_category = window.app.pendingQuickDiagnosis.category;
        window.app.wizardData.description = window.app.pendingQuickDiagnosis.description;
        window.app.wizardData.problem_category = "Hardware";
        window.app.pendingQuickDiagnosis = null;
        window.app.pendingNavigation = null;
        window.app.navigate("diagnose");
      } else if (window.app.pendingNavigation) {
        const dest = window.app.pendingNavigation;
        window.app.pendingNavigation = null;
        window.app.navigate(dest);
      } else if (this._oauthRedirectPending) {
        this._oauthRedirectPending = false;
        // Land signed-in users & exclusive admin cleanly on the home page (admin pill stays accessible in navbar)
        window.app.navigate("home");
      }
    }
  },

  _clearUserSession() {
    this.currentUser = null;
    if (window.api && typeof window.api.clearSession === "function") {
      window.api.clearSession();
    } else {
      localStorage.removeItem("byteforce_token");
      localStorage.removeItem("byteforce_user");
      localStorage.removeItem("techrepair_token");
      localStorage.removeItem("techrepair_user");
      localStorage.removeItem("fixora_token");
      localStorage.removeItem("fixora_user");
    }
    if (window.app) {
      if (typeof window.app.updateNavAuth === "function") {
        window.app.updateNavAuth();
      }
      if (typeof window.app.loadNotifications === "function") {
        window.app.loadNotifications();
      }
    }
  },

  async getCurrentUser() {
    if (this.currentUser) return this.currentUser;
    if (!this.isReady()) return null;
    const { data } = await supabaseClient.auth.getSession();
    if (data?.session?.user) {
      await this._applyUserSession(data.session);
      return this.currentUser;
    }
    return null;
  },

  async updateProfile(updates = {}) {
    if (!this.isReady()) throw new Error("Supabase SDK unavailable");
    const user = await this.getCurrentUser();
    if (!user) throw new Error("Authentication required");
    const safeUpdates = { updated_at: new Date().toISOString() };
    if (updates.full_name) safeUpdates.full_name = updates.full_name;
    if (updates.phone !== undefined) safeUpdates.phone = updates.phone;
    const { data, error } = await supabaseClient
      .from("profiles")
      .update(safeUpdates)
      .eq("id", user.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async syncReport(report) {
    if (!this.isReady()) return;
    try {
      const user = this.currentUser || (await this.getCurrentUser());
      const payload = {
        report_code: report.report_id || `BF-${Date.now().toString().slice(-6)}`,
        user_id: user?.id || null,
        device_category: report.device_category || "Other",
        brand: report.brand || "",
        model: report.model || "",
        problem_category: report.problem_category || "General Fault",
        description: report.symptoms || report.description || "",
        severity: report.severity || "moderate",
        confidence_score: report.confidence_score ?? null,
        empirical_statistics: report.empirical_statistics || null,
        empirical_evidence: report.empirical_statistics || null,
        verified_guide: report.verified_guide || null,
        possible_causes: report.possible_causes || [],
        troubleshooting_steps: report.troubleshooting_steps || [],
        required_tools: report.required_tools || [],
        extracted_symptoms: report.extracted_symptoms || [],
        estimated_difficulty: report.estimated_difficulty || null,
        estimated_minutes: report.estimated_minutes || null,
        requires_technician: !!report.requires_technician,
        status: report.status || "completed"
      };
      await supabaseClient.from("diagnosis_reports").insert([payload]);
    } catch (e) {
      console.warn("Report sync note:", e.message);
    }
  },

  async syncDevice(device) {
    if (!this.isReady()) throw new Error("Supabase SDK is not available");
    const user = this.currentUser || (await this.getCurrentUser());
    if (!user) throw new Error("Authentication required to save device");
    const payload = {
      user_id: user.id,
      device_category: device.device_category || "Other",
      brand: device.brand || "",
      model: device.model || "",
      serial_number: device.serial_number || null,
      purchase_date: device.purchase_date || null,
      os_version: device.os_version || null,
      notes: device.notes || null
    };
    const { data, error } = await supabaseClient.from("devices").insert([payload]).select().single();
    if (error) throw error;
    return data;
  },

  async deleteDevice(deviceId) {
    if (!this.isReady()) throw new Error("Supabase SDK is not available");
    const user = this.currentUser || (await this.getCurrentUser());
    if (!user) throw new Error("Authentication required");
    const { error } = await supabaseClient.from("devices").delete().eq("id", deviceId).eq("user_id", user.id);
    if (error) throw error;
    return { ok: true };
  },

  /**
   * Helper to normalize guides from any data source
   */
  _normalizeGuide(g) {
    if (!g) return null;
    const title = g.title || g.title_en || g.title_ar || "Repair Guide";
    const summary = g.summary || g.summary_en || g.summary_ar || "Step-by-step instructions for device repair and disassembly.";
    let estMins = 25;
    if (g.estimated_minutes) {
      estMins = parseInt(g.estimated_minutes) || 25;
    } else if (g.time_required) {
      const match = String(g.time_required).match(/\d+/);
      estMins = match ? parseInt(match[0]) : 30;
    }

    let steps = [];
    if (Array.isArray(g.steps)) {
      steps = g.steps.map((st, idx) => {
        if (typeof st === "string") {
          return {
            step_number: idx + 1,
            title_ar: `الخطوة ${idx + 1}`,
            title_en: `Step ${idx + 1}`,
            instruction_ar: st,
            instruction_en: st
          };
        }
        const rawText = (st.Text_raw || st.text_raw || (Array.isArray(st.Lines) ? st.Lines.map(l => (typeof l === 'object' ? (l.Text || l.text || '') : l)).join(" ").replace(/ \./g, ".").trim() : "") || st.instruction_en || st.instruction_ar || "").trim();
        const stepNum = st.step_number || (st.Order !== undefined ? st.Order + 1 : (st.StepId || idx + 1));
        return {
          step_number: stepNum,
          title_ar: st.title_ar || `الخطوة ${stepNum}`,
          title_en: st.title_en || `Step ${stepNum}`,
          instruction_ar: rawText || st.instruction_ar || "",
          instruction_en: rawText || st.instruction_en || "",
          images: st.Images || st.images || []
        };
      });
    }

    let tools = [];
    const srcTools = (Array.isArray(g.required_tools) && g.required_tools.length > 0) ? g.required_tools : g.tools;
    if (Array.isArray(srcTools)) {
      tools = srcTools.map(t => typeof t === "string" ? t.trim() : (t.Name || t.name || "").trim()).filter(Boolean);
    }

    return {
      ...g,
      id: g.id || g.guide_id,
      title: title,
      title_en: g.title_en || title,
      title_ar: g.title_ar || title,
      summary: summary,
      summary_en: g.summary_en || summary,
      summary_ar: g.summary_ar || summary,
      estimated_minutes: estMins,
      time_required: g.time_required || `${estMins} min`,
      steps: steps,
      tools: tools,
      required_tools: tools,
      safety_precautions: g.safety_precautions || [
        "Disconnect all power cables and remove batteries before disassembly.",
        "Wear an ESD wrist strap to protect delicate microchips from electrostatic discharge.",
        "Organize screws by size and thread length to avoid logic board damage."
      ],
      device_category: g.device_category || "General",
      difficulty: g.difficulty || "Moderate"
    };
  },

  /**
   * Helper to normalize technician records
   */
  _normalizeTechnician(t) {
    if (!t) return null;
    let specs = [];
    if (Array.isArray(t.specializations)) {
      specs = t.specializations;
    } else if (typeof t.specializations === 'string') {
      try {
        const parsed = JSON.parse(t.specializations);
        if (Array.isArray(parsed)) specs = parsed;
        else specs = t.specializations.split(',').map(s => s.trim()).filter(Boolean);
      } catch (e) {
        specs = t.specializations.split(',').map(s => s.trim()).filter(Boolean);
      }
    }
    return {
      ...t,
      id: t.id,
      user_id: t.user_id || null,
      business_name: t.business_name || t.name || "",
      technician_name: t.technician_name || t.name || t.business_name || "",
      name: t.name || t.technician_name || t.business_name || "",
      kind: (t.kind || "TECHNICIAN").toUpperCase(),
      is_verified_center: (t.kind || "").toUpperCase() === "CENTER",
      city: t.city || "",
      address: t.address || "",
      phone: t.phone || "",
      lat: typeof t.lat === "number" ? t.lat : (t.lat ? parseFloat(t.lat) : null),
      lng: typeof t.lng === "number" ? t.lng : (t.lng ? parseFloat(t.lng) : null),
      rating: (Number(t.reviews_count) > 0 && t.rating != null) ? parseFloat(t.rating) : 0,
      total_reviews: Number(t.reviews_count || t.total_reviews || 0),
      reviews_count: Number(t.reviews_count || t.total_reviews || 0),
      experience_years: t.experience_years ? Number(t.experience_years) : null,
      working_hours: t.working_hours || null,
      home_service_available: !!(t.home_service || t.home_service_available),
      bio: t.bio || "",
      specializations: specs
    };
  },

  /**
   * Data Retrieval & Real Marketplace APIs directly querying Supabase PostgreSQL
   */
  async fetchGuides(categoryOrParams = null, difficulty = null, search = null) {
    if (!this.isReady()) return [];
    let category = categoryOrParams;
    let diff = difficulty;
    let qText = search;
    let limit = 60;
    let offset = 0;
    if (categoryOrParams && typeof categoryOrParams === "object") {
      category = categoryOrParams.category || null;
      diff = categoryOrParams.difficulty || null;
      qText = categoryOrParams.search || categoryOrParams.q || null;
      limit = categoryOrParams.limit || 60;
      offset = categoryOrParams.offset || 0;
    }
    try {
      let q = supabaseClient.from("repair_guides").select("*");
      if (category && category !== "all") {
        q = q.ilike("device_category", `%${category}%`);
      }
      if (diff && diff !== "all") {
        const cleanDiff = String(diff).trim().toLowerCase();
        const mappedDiff = (cleanDiff === "hard" || cleanDiff === "difficult") ? "Difficult" : cleanDiff;
        q = q.ilike("difficulty", mappedDiff);
      }
      if (qText) {
        q = q.or(`title.ilike.%${qText}%,summary.ilike.%${qText}%,device_model.ilike.%${qText}%,component.ilike.%${qText}%`);
      }
      const { data, error } = await q.order("id", { ascending: true }).range(offset, offset + limit - 1);
      if (error) throw error;
      return (data || []).map(g => this._normalizeGuide(g));
    } catch (err) {
      console.warn("Supabase fetchGuides error:", err);
      return [];
    }
  },

  async fetchGuide(id) {
    if (!this.isReady()) return null;
    try {
      const { data, error } = await supabaseClient
        .from("repair_guides")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return this._normalizeGuide(data);
    } catch (err) {
      return null;
    }
  },

  async fetchGuideById(id) {
    return this.fetchGuide(id);
  },

  async submitTechnicianApplication(techData) {
    if (!this.isReady()) throw new Error("Supabase SDK unavailable");
    const specsStr = Array.isArray(techData.specializations)
      ? techData.specializations.join(", ")
      : String(techData.specializations || "");
    const payload = {
      user_id: techData.user_id || this.currentUser?.id || null,
      name: techData.name || techData.full_name || techData.business_name,
      email: techData.email || this.currentUser?.email || null,
      business_name: techData.business_name || techData.name,
      kind: (techData.kind || "TECHNICIAN").toUpperCase(),
      city: techData.city || "",
      phone: techData.phone || "",
      address: techData.address || "",
      lat: techData.lat ? parseFloat(techData.lat) : null,
      lng: techData.lng ? parseFloat(techData.lng) : null,
      specializations: specsStr,
      working_hours: techData.working_hours || null,
      experience_years: techData.experience_years ? parseInt(techData.experience_years) : null,
      home_service: !!techData.home_service,
      bio: techData.bio || "",
      rating: 0,
      reviews_count: 0,
      status: "pending"
    };
    const { data, error } = await supabaseClient.from("technicians").insert([payload]).select().single();
    if (error) throw error;
    try {
      fetch("/api/notifications/pending-tech-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: payload.email, business_name: payload.business_name })
      }).catch(() => {});
    } catch (notifyErr) {}
    return this._normalizeTechnician(data);
  },

  _matchesBilingualCity(centerCity, filterCity) {
    if (!filterCity || filterCity === "all" || filterCity === "الكل") return true;
    const raw = String(centerCity || "").trim().toLowerCase();
    const target = String(filterCity || "").trim().toLowerCase();
    if (!raw) return false;
    if (raw.includes(target) || target.includes(raw)) return true;
    const cityGroups = [
      ["cairo", "القاهرة", "القاهره", "nasr city", "مدينة نصر", "maadi", "المعادي", "heliopolis", "مصر الجديدة", "new cairo", "القاهرة الجديدة", "shubra", "شبرا"],
      ["giza", "الجيزة", "الجيزه", "dokki", "الدقي", "mohandessin", "المهندسين", "haram", "الهرم", "faisal", "فيصل"],
      ["alexandria", "الإسكندرية", "الاسكندرية", "الإسكندريه", "الاسكندريه", "alex", "اسكندرية"],
      ["6th of october", "6 october", "السادس من أكتوبر", "6 أكتوبر", "اكتوبر", "sheikh zayed", "الشيخ زايد"],
      ["fayoum", "الفيوم"],
      ["beni suef", "بني سويف"],
      ["mansoura", "المنصورة"],
      ["tanta", "طنطا"],
      ["zagazig", "الزقازيق"],
      ["ismailia", "الإسماعيلية", "الاسماعيلية"],
      ["suez", "السويس"],
      ["port said", "بورسعيد"],
      ["luxor", "الأقصر", "الاقصر"],
      ["aswan", "أسوان", "اسوان"],
      ["assiut", "أسيوط", "اسيوط"]
    ];
    for (const grp of cityGroups) {
      if (grp.some(k => target.includes(k) || k.includes(target))) {
        if (grp.some(k => raw.includes(k))) return true;
      }
    }
    return false;
  },

  _matchesBilingualSpec(centerSpecs, filterSpec) {
    if (!filterSpec || filterSpec === "all" || filterSpec === "الكل") return true;
    const specText = Array.isArray(centerSpecs)
      ? centerSpecs.join(" ").toLowerCase()
      : String(centerSpecs || "").toLowerCase();
    const target = String(filterSpec || "").trim().toLowerCase();
    if (!specText) return false;
    if (specText.includes(target)) return true;
    const specGroups = [
      ["phone", "smartphone", "mobile", "هواتف", "موبايل", "جوال", "آيفون", "ايفون", "iphone", "samsung", "سامسونج", "اندرويد", "أندرويد"],
      ["laptop", "mac", "pc", "computer", "لابتوب", "ماك", "كمبيوتر", "حاسوب"],
      ["tablet", "ipad", "تابلت", "ايباد", "آيباد"],
      ["gaming", "console", "playstation", "xbox", "nintendo", "بلايستيشن", "ألعاب", "العاب", "اكس بوكس"],
      ["camera", "dslr", "كاميرا", "تصوير", "عدسات"],
      ["appliance", "home", "ثلاجة", "غسالة", "تكييف", "أجهزة منزلية", "اجهزة منزلية", "منزلية"],
      ["watch", "smartwatch", "ساعة", "ساعات"],
      ["audio", "headphone", "speaker", "صوتيات", "سماعة", "سماعات"]
    ];
    for (const grp of specGroups) {
      if (grp.some(k => target.includes(k) || k.includes(target))) {
        if (grp.some(k => specText.includes(k))) return true;
      }
    }
    return false;
  },

  async fetchTechnicians(city = null, specialization = null) {
    if (!this.isReady()) return [];
    try {
      const { data, error } = await supabaseClient
        .from("technicians")
        .select("*")
        .eq("status", "approved")
        .order("rating", { ascending: false })
        .order("reviews_count", { ascending: false });
      if (error) throw error;
      return (data || [])
        .map(t => this._normalizeTechnician(t))
        .filter(t => this._matchesBilingualCity(t.city, city) && this._matchesBilingualSpec(t.specializations, specialization));
    } catch (err) {
      console.warn("Supabase fetchTechnicians error:", err);
      return [];
    }
  },

  _normalizeReport(r) {
    if (!r) return null;
    return {
      ...r,
      report_id: r.report_code || r.id,
      symptoms: r.description || r.symptoms || "",
      empirical_statistics: r.empirical_statistics || r.empirical_evidence || null
    };
  },

  async fetchDiagnosisReports() {
    if (!this.isReady()) return [];
    const user = this.currentUser || (await this.getCurrentUser());
    if (!user) return [];
    try {
      const { data, error } = await supabaseClient
        .from("diagnosis_reports")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map(r => this._normalizeReport(r));
    } catch (err) {
      console.warn("Supabase fetchDiagnosisReports error:", err);
      return [];
    }
  },

  async fetchReports() {
    return this.fetchDiagnosisReports();
  },

  async fetchReportById(reportId) {
    if (!this.isReady()) throw new Error("Supabase SDK unavailable");
    const user = this.currentUser || (await this.getCurrentUser());
    if (!user) throw new Error("Authentication required");
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(reportId));
    let q = supabaseClient.from("diagnosis_reports").select("*");
    if (isUuid) {
      q = q.eq("id", reportId);
    } else {
      q = q.eq("report_code", String(reportId));
    }
    const { data, error } = await q.maybeSingle();
    if (error) throw error;
    if (!data) throw new Error(`Report #${reportId} not found.`);
    return this._normalizeReport(data);
  },

  async fetchDevices() {
    if (!this.isReady()) return [];
    const user = this.currentUser || (await this.getCurrentUser());
    if (!user) return [];
    try {
      const { data, error } = await supabaseClient
        .from("devices")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.warn("Supabase fetchDevices error:", err);
      return [];
    }
  },

  _normalizeRequest(r) {
    if (!r) return null;
    return {
      ...r,
      customer_name: r.user_name || r.customer_name || "",
      customer_phone: r.user_phone || r.customer_phone || "",
      device_model: r.device_model || r.device_info || "",
      issue_description: r.issue_description || r.problem_summary || "",
      history: Array.isArray(r.history) ? r.history : []
    };
  },

  async fetchRepairRequests() {
    if (!this.isReady()) return [];
    const user = this.currentUser || (await this.getCurrentUser());
    if (!user) return [];
    try {
      const { data, error } = await supabaseClient
        .from("repair_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map(r => this._normalizeRequest(r));
    } catch (err) {
      console.warn("Supabase fetchRepairRequests error:", err);
      return [];
    }
  },

  async createRepairRequest(booking) {
    if (!this.isReady()) throw new Error("Supabase SDK unavailable");
    const user = this.currentUser || (await this.getCurrentUser());
    if (!user) throw new Error("Authentication required to create repair booking");

    const techProfileId = booking.tech_profile_id || (typeof booking.technician_id === "number" ? booking.technician_id : null);
    let techAuthUuid = (typeof booking.technician_id === "string" && booking.technician_id.includes("-")) ? booking.technician_id : null;
    if (!techAuthUuid && techProfileId) {
      const { data: techRow } = await supabaseClient.from("technicians").select("user_id, business_name, name").eq("id", techProfileId).maybeSingle();
      if (techRow?.user_id) techAuthUuid = techRow.user_id;
    }

    const nowTs = new Date().toISOString();
    const initialHistory = [{
      at: nowTs.replace("T", " ").slice(0, 19),
      old: "",
      new: "NEW",
      actor: booking.customer_name || user.full_name || user.email,
      note: "تم إرسال طلب الصيانة بنجاح"
    }];

    const payload = {
      user_id: user.id,
      user_name: booking.customer_name || booking.user_name || user.full_name || user.email,
      user_phone: booking.customer_phone || booking.user_phone || "",
      user_email: user.email,
      tech_profile_id: techProfileId,
      technician_id: techAuthUuid,
      technician_name: booking.technician_name || "",
      technician_business: booking.technician_business || booking.technician_name || "",
      device_category: booking.device_category || "Other",
      device_model: booking.device_model || booking.device_info || "",
      device_info: booking.device_info || booking.device_model || "Device",
      problem_summary: booking.issue_description || booking.problem_summary || booking.description || "",
      issue_description: booking.issue_description || booking.problem_summary || booking.description || "",
      diagnosis_id: booking.diagnosis_id ? String(booking.diagnosis_id) : null,
      scheduled_date: booking.scheduled_date || booking.appointment || null,
      appointment: booking.scheduled_date || booking.appointment || null,
      customer_notes: booking.customer_notes || "",
      status: "NEW",
      history: initialHistory
    };

    const { data, error } = await supabaseClient.from("repair_requests").insert([payload]).select().single();
    if (error) throw error;

    await this.createNotification({
      user_id: user.id,
      title: "تم إرسال طلب الصيانة",
      message: `تم إرسال طلبك للجهاز (${payload.device_info}) بنجاح`,
      type: "request"
    });
    if (techAuthUuid && techAuthUuid !== user.id) {
      await this.createNotification({
        user_id: techAuthUuid,
        title: "طلب صيانة جديد",
        message: `طلب جديد من ${payload.user_name} لجهاز ${payload.device_info}`,
        type: "request"
      });
    }

    return this._normalizeRequest(data);
  },

  async bookTechnician(booking) {
    return this.createRepairRequest(booking);
  },

  async updateRequestStatus(reqId, newStatus, updates = {}) {
    if (!this.isReady()) throw new Error("Supabase SDK unavailable");
    const user = this.currentUser || (await this.getCurrentUser());
    if (!user) throw new Error("Authentication required");

    const { data: existing, error: fetchErr } = await supabaseClient
      .from("repair_requests")
      .select("*")
      .eq("id", reqId)
      .maybeSingle();
    if (fetchErr) throw fetchErr;
    if (!existing) throw new Error("Repair request not found");

    const history = Array.isArray(existing.history) ? [...existing.history] : [];
    history.push({
      at: new Date().toISOString().replace("T", " ").slice(0, 19),
      old: existing.status,
      new: newStatus,
      actor: updates.actor || user.full_name || user.email,
      note: updates.note || ""
    });

    const patch = {
      status: newStatus,
      history
    };
    const allowedFields = ["estimate", "extra_cost", "final_cost", "actual_fault", "appointment", "scheduled_date", "rating", "review_comment", "reviewed"];
    for (const k of allowedFields) {
      if (updates[k] !== undefined) patch[k] = updates[k];
    }

    const { data, error } = await supabaseClient
      .from("repair_requests")
      .update(patch)
      .eq("id", reqId)
      .select()
      .single();
    if (error) throw error;

    if (updates.reviewed && (data?.tech_profile_id || existing.tech_profile_id)) {
      await this._syncTechnicianRatingFromRequests(data.tech_profile_id || existing.tech_profile_id);
    }

    // Real DB notification for the counterparty
    const notifyTarget = user.id === existing.user_id ? existing.technician_id : existing.user_id;
    if (notifyTarget) {
      await this.createNotification({
        user_id: notifyTarget,
        title: `تحديث حالة الطلب: ${newStatus}`,
        message: updates.note || `تغيرت حالة طلب الصيانة (${existing.device_info}) إلى ${newStatus}`,
        type: "status"
      });
    }

    return this._normalizeRequest(data);
  },

  /**
   * Notifications backed strictly by public.notifications
   */
  async fetchNotifications() {
    if (!this.isReady()) return [];
    const user = this.currentUser || (await this.getCurrentUser());
    if (!user) return [];
    try {
      const { data, error } = await supabaseClient
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .neq("type", "admin_audit")
        .neq("type", "system_ai_config")
        .order("created_at", { ascending: false })
        .limit(40);
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.warn("fetchNotifications note:", err.message);
      return [];
    }
  },

  async createNotification(notif) {
    if (!this.isReady() || !notif?.user_id) return null;
    try {
      const { data } = await supabaseClient
        .from("notifications")
        .insert([{
          user_id: notif.user_id,
          title: notif.title,
          message: notif.message,
          type: notif.type || "info",
          is_read: false
        }])
        .select()
        .single();
      return data;
    } catch (e) {
      return null;
    }
  },

  async markNotificationRead(id) {
    if (!this.isReady()) return;
    await supabaseClient.from("notifications").update({ is_read: true }).eq("id", id);
  },

  async markAllNotificationsRead() {
    if (!this.isReady()) return;
    const user = this.currentUser || (await this.getCurrentUser());
    if (!user) return;
    await supabaseClient.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
  },

  /**
   * Admin System Controls (Exclusive to snsr19344@gmail.com)
   */
  _requireClientAdmin() {
    const user = this.currentUser;
    if (!user || !this.isExclusiveAdminEmail(user.email)) {
      throw new Error(`Forbidden: restricted exclusively to ${this.EXCLUSIVE_ADMIN_EMAIL}`);
    }
    return user;
  },

  async _logAdminAudit(action, title, message) {
    try {
      const adminUser = this.currentUser;
      if (!adminUser?.id || !this.isExclusiveAdminEmail(adminUser.email)) return;
      await supabaseClient.from("notifications").insert([{
        user_id: adminUser.id,
        title,
        message: `[${action}] ${message}`,
        type: "admin_audit",
        is_read: true
      }]);
    } catch (e) {}
  },

  async fetchAdminStats() {
    if (!this.isReady()) throw new Error("Supabase SDK unavailable");
    this._requireClientAdmin();
    const [guidesRes, incidentsRes, profilesRes, techsRes, diagRes, reqRes] = await Promise.all([
      supabaseClient.from("repair_guides").select("*", { count: "exact", head: true }),
      supabaseClient.from("repair_incidents").select("*", { count: "exact", head: true }),
      supabaseClient.from("profiles").select("*", { count: "exact", head: true }),
      supabaseClient.from("technicians").select("id, status"),
      supabaseClient.from("diagnosis_reports").select("*", { count: "exact", head: true }),
      supabaseClient.from("repair_requests").select("id, status")
    ]);
    const techs = techsRes.data || [];
    const reqs = reqRes.data || [];
    const approved = techs.filter(t => String(t.status || "").toLowerCase() === "approved").length;
    const pending = techs.filter(t => String(t.status || "").toLowerCase() === "pending").length;
    const suspended = techs.filter(t => ["suspended", "rejected"].includes(String(t.status || "").toLowerCase())).length;
    const closed = new Set(["COMPLETED", "CANCELED", "CANCELLED", "REJECTED"]);
    const activeReqs = reqs.filter(r => !closed.has(String(r.status || "NEW").toUpperCase())).length;
    const completedReqs = reqs.filter(r => String(r.status || "").toUpperCase() === "COMPLETED").length;
    return {
      verified_guides_count: guidesRes.count || 0,
      repair_incidents_count: incidentsRes.count || 0,
      active_technicians_count: approved,
      repair_requests_count: reqs.length,
      active_requests: activeReqs,
      completed_requests: completedReqs,
      total_users: profilesRes.count || 0,
      total_technicians: approved,
      approved_centers: approved,
      pending_approvals: pending,
      suspended_centers: suspended,
      total_diagnoses: diagRes.count || 0,
      source: "Supabase Live Client"
    };
  },

  async fetchAllTechniciansAdmin() {
    if (!this.isReady()) return [];
    this._requireClientAdmin();
    const { data, error } = await supabaseClient
      .from("technicians")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    const order = { pending: 0, approved: 1, suspended: 2, rejected: 3 };
    return (data || [])
      .map(t => this._normalizeTechnician(t))
      .sort((a, b) => (order[String(a.status || "pending").toLowerCase()] ?? 9) - (order[String(b.status || "pending").toLowerCase()] ?? 9));
  },

  async fetchPendingTechnicians() {
    if (!this.isReady()) return [];
    this._requireClientAdmin();
    const { data, error } = await supabaseClient
      .from("technicians")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data || []).map(t => this._normalizeTechnician(t));
  },

  async _transitionTechnicianStatusAdmin(techId, targetStatus, notifTitle, notifMessage, auditAction, auditTitle) {
    if (!this.isReady()) throw new Error("Supabase SDK unavailable");
    this._requireClientAdmin();
    const { data, error } = await supabaseClient
      .from("technicians")
      .update({ status: targetStatus })
      .eq("id", techId)
      .select()
      .single();
    if (error) throw error;
    if (data?.user_id) {
      const { data: prof } = await supabaseClient.from("profiles").select("email").eq("id", data.user_id).maybeSingle();
      if (!this.isExclusiveAdminEmail(prof?.email)) {
        await supabaseClient.from("profiles").update({ role: targetStatus === "approved" ? "technician" : "user" }).eq("id", data.user_id);
      }
      await this.createNotification({
        user_id: data.user_id,
        title: notifTitle,
        message: notifMessage,
        type: "status"
      });
    }
    await this._logAdminAudit(auditAction, auditTitle, `${data?.business_name || data?.name || "#" + techId} (${data?.city || "-"})`);
    return data;
  },

  async approveTechnician(techId) {
    return this._transitionTechnicianStatusAdmin(
      techId,
      "approved",
      "تم قبول حسابك الفني",
      "تمت مراجعة وتوثيق ملفك المهني من قِبل الإدارة وهو ظاهر الآن للعملاء.",
      `center:${techId}:approved`,
      "اعتماد مركز / فني صيانة"
    );
  },

  async suspendTechnician(techId) {
    return this._transitionTechnicianStatusAdmin(
      techId,
      "suspended",
      "تم إيقاف الحساب الفني مؤقتاً",
      "تم إيقاف ظهور مركز الصيانة مؤقتاً من قِبل مدير النظام. تواصل مع الإدارة للمراجعة.",
      `center:${techId}:suspended`,
      "إيقاف مركز / فني صيانة"
    );
  },

  async rejectTechnician(techId) {
    return this._transitionTechnicianStatusAdmin(
      techId,
      "rejected",
      "تحديث طلب التوثيق",
      "نعتذر، تم رفض طلب الانضمام كمركز صيانة. يرجى مراجعة البيانات والمحاولة مجدداً.",
      `center:${techId}:rejected`,
      "رفض طلب انضمام فني"
    );
  },

  async fetchAdminUsers() {
    if (!this.isReady()) return [];
    this._requireClientAdmin();
    const { data, error } = await supabaseClient
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async toggleUserStatus(userId) {
    if (!this.isReady()) throw new Error("Supabase SDK unavailable");
    this._requireClientAdmin();
    const { data: userRow, error: getErr } = await supabaseClient
      .from("profiles")
      .select("id, email, full_name, is_active")
      .eq("id", userId)
      .single();
    if (getErr) throw getErr;
    if (this.isExclusiveAdminEmail(userRow.email)) {
      throw new Error("لا يمكن تعطيل حساب مدير النظام الرئيسي.");
    }
    const nextState = userRow.is_active === false ? true : false;
    const { data, error } = await supabaseClient
      .from("profiles")
      .update({ is_active: nextState })
      .eq("id", userId)
      .select()
      .single();
    if (error) throw error;
    await this._logAdminAudit(
      `user:${userId}:${nextState ? "reactivate" : "suspend"}`,
      nextState ? "تفعيل حساب مستخدم" : "تعطيل حساب مستخدم",
      `${userRow.full_name || userRow.email} (${userRow.email})`
    );
    return data;
  },

  async fetchAllRequestsAdmin() {
    if (!this.isReady()) return [];
    this._requireClientAdmin();
    const { data, error } = await supabaseClient
      .from("repair_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return (data || []).map(r => this._normalizeRequest(r));
  },

  async fetchAdminAuditLogs() {
    if (!this.isReady()) return [];
    this._requireClientAdmin();
    const { data, error } = await supabaseClient
      .from("notifications")
      .select("id, title, message, type, created_at")
      .eq("type", "admin_audit")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    return data || [];
  },

  async _syncTechnicianRatingFromRequests(techProfileId) {
    if (!this.isReady() || !techProfileId) return { rating: 0, reviews_count: 0 };
    try {
      const { data, error } = await supabaseClient
        .from("repair_requests")
        .select("rating")
        .eq("tech_profile_id", techProfileId)
        .eq("reviewed", true);
      if (error) return { rating: 0, reviews_count: 0 };
      const ratings = (data || []).map(r => Number(r.rating)).filter(n => !isNaN(n) && n >= 1 && n <= 5);
      const count = ratings.length;
      const avg = count > 0 ? Math.round((ratings.reduce((a, b) => a + b, 0) / count) * 100) / 100 : 0;
      await supabaseClient
        .from("technicians")
        .update({ rating: avg, reviews_count: count })
        .eq("id", techProfileId);
      return { rating: avg, reviews_count: count };
    } catch (e) {
      return { rating: 0, reviews_count: 0 };
    }
  },

  _normalizeAdminCenterInput(centerData, isCreate = true) {
    const biz = String(centerData.business_name || "").trim();
    const person = String(centerData.name || centerData.full_name || "").trim();
    const businessName = biz || person;
    const name = person || biz;
    const city = String(centerData.city || "").trim();
    if (isCreate && (!businessName || !city)) {
      throw new Error("يرجى إدخال اسم المركز/الفني والمدينة.");
    }
    const specsStr = Array.isArray(centerData.specializations)
      ? centerData.specializations.map(s => String(s).trim()).filter(Boolean).join(", ")
      : String(centerData.specializations || "").trim();

    const payload = {};
    if (businessName) payload.business_name = businessName;
    if (name) payload.name = name;
    if (city) payload.city = city;
    if (centerData.phone !== undefined || isCreate) payload.phone = String(centerData.phone || "").trim();
    if (centerData.email !== undefined || isCreate) payload.email = String(centerData.email || "").trim() || null;
    if (centerData.address !== undefined || isCreate) payload.address = String(centerData.address || "").trim();
    if (centerData.bio !== undefined || isCreate) payload.bio = String(centerData.bio || "").trim();
    if (centerData.working_hours !== undefined || isCreate) payload.working_hours = String(centerData.working_hours || "").trim() || null;
    if (centerData.kind !== undefined || isCreate) {
      const k = String(centerData.kind || "CENTER").trim().toUpperCase();
      payload.kind = k === "TECHNICIAN" ? "TECHNICIAN" : "CENTER";
    }
    if (centerData.specializations !== undefined || isCreate) payload.specializations = specsStr;
    if (centerData.home_service !== undefined || isCreate) payload.home_service = !!centerData.home_service;
    if (centerData.experience_years !== undefined || isCreate) {
      payload.experience_years = centerData.experience_years ? parseInt(centerData.experience_years, 10) : null;
    }
    if (centerData.lat != null && centerData.lat !== "") payload.lat = parseFloat(centerData.lat);
    if (centerData.lng != null && centerData.lng !== "") payload.lng = parseFloat(centerData.lng);
    if (centerData.status !== undefined || isCreate) {
      const st = String(centerData.status || "approved").trim().toLowerCase();
      if (["pending", "approved", "suspended", "rejected"].includes(st)) {
        payload.status = st;
      } else if (isCreate) {
        payload.status = "approved";
      }
    }
    if (isCreate) {
      payload.rating = 0;
      payload.reviews_count = 0;
    }
    return payload;
  },

  async createTechnicianAdmin(centerData) {
    if (!this.isReady()) throw new Error("Supabase SDK unavailable");
    this._requireClientAdmin();
    const payload = this._normalizeAdminCenterInput(centerData, true);
    const targetStatus = payload.status || "approved";
    // Insert as pending first if RLS requires pending status on INSERT, then transition to approved
    const insertPayload = { ...payload, status: "pending" };
    const { data, error } = await supabaseClient
      .from("technicians")
      .insert([insertPayload])
      .select()
      .single();
    if (error) throw error;

    let finalRow = data;
    if (targetStatus !== "pending") {
      const { data: upd, error: updErr } = await supabaseClient
        .from("technicians")
        .update({ status: targetStatus })
        .eq("id", data.id)
        .select()
        .single();
      if (!updErr && upd) finalRow = upd;
    }

    await this._logAdminAudit(
      `center:${finalRow.id}:create`,
      "إضافة مركز صيانة جديد",
      `${finalRow.business_name || finalRow.name} (${finalRow.city || "-"})`
    );
    return this._normalizeTechnician(finalRow);
  },

  async bulkCreateTechniciansAdmin(centersList) {
    if (!this.isReady()) throw new Error("Supabase SDK unavailable");
    this._requireClientAdmin();
    const created = [];
    const errors = [];
    for (let i = 0; i < (centersList || []).length; i++) {
      try {
        const row = await this.createTechnicianAdmin(centersList[i]);
        created.push(row);
      } catch (e) {
        errors.push({ index: i, error: e?.message || String(e) });
      }
    }
    return { created_count: created.length, failed_count: errors.length, centers: created, errors };
  },

  async updateTechnicianAdmin(techId, updates) {
    if (!this.isReady()) throw new Error("Supabase SDK unavailable");
    this._requireClientAdmin();
    const patch = this._normalizeAdminCenterInput(updates, false);
    const { data, error } = await supabaseClient
      .from("technicians")
      .update(patch)
      .eq("id", techId)
      .select()
      .single();
    if (error) throw error;
    await this._logAdminAudit(
      `center:${techId}:update`,
      "تعديل بيانات مركز صيانة",
      `${data?.business_name || data?.name || "#" + techId} (${data?.city || "-"})`
    );
    return this._normalizeTechnician(data);
  },

  async deleteTechnicianAdmin(techId) {
    if (!this.isReady()) throw new Error("Supabase SDK unavailable");
    this._requireClientAdmin();
    await supabaseClient.from("repair_requests").update({ tech_profile_id: null }).eq("tech_profile_id", techId);
    const { error } = await supabaseClient.from("technicians").delete().eq("id", techId);
    if (error) throw error;
    await this._logAdminAudit(`center:${techId}:delete`, "حذف مركز صيانة", `تم حذف المركز #${techId}`);
    return { deleted: true, id: techId };
  },

  async clearReviewAdmin(reqId) {
    if (!this.isReady()) throw new Error("Supabase SDK unavailable");
    this._requireClientAdmin();
    const { data: existing } = await supabaseClient
      .from("repair_requests")
      .select("id, tech_profile_id, device_info")
      .eq("id", reqId)
      .maybeSingle();
    const { error } = await supabaseClient
      .from("repair_requests")
      .update({ rating: null, review_comment: null, reviewed: false })
      .eq("id", reqId);
    if (error) throw error;
    const stats = await this._syncTechnicianRatingFromRequests(existing?.tech_profile_id);
    await this._logAdminAudit(`request:${reqId}:clear-review`, "إزالة تقييم عميل", `طلب #${reqId}`);
    return { cleared: true, id: reqId, center_rating: stats };
  },

  async fetchTechnicianReviewsFallback(techId) {
    const breakdown = { "5": 0, "4": 0, "3": 0, "2": 0, "1": 0 };
    if (!this.isReady() || !techId) {
      return { tech_id: techId, average_rating: 0, reviews_count: 0, rating_breakdown: breakdown, reviews: [] };
    }
    try {
      const { data, error } = await supabaseClient
        .from("repair_requests")
        .select("id, user_name, device_info, device_category, rating, review_comment, created_at")
        .eq("tech_profile_id", techId)
        .eq("reviewed", true)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error || !data) {
        return { tech_id: techId, average_rating: 0, reviews_count: 0, rating_breakdown: breakdown, reviews: [] };
      }
      let sum = 0;
      let cnt = 0;
      const reviews = data.map(r => {
        const star = Math.round(Number(r.rating || 0));
        if (star >= 1 && star <= 5) {
          breakdown[String(star)] += 1;
          sum += Number(r.rating);
          cnt += 1;
        }
        return {
          id: r.id,
          reviewer_name: (r.user_name || "عميل موثق").split("@")[0],
          rating: Number(r.rating || 0),
          review_comment: r.review_comment || "",
          device_info: r.device_info || r.device_category || "",
          created_at: r.created_at
        };
      });
      return {
        tech_id: techId,
        average_rating: cnt > 0 ? Math.round((sum / cnt) * 100) / 100 : 0,
        reviews_count: reviews.length,
        rating_breakdown: breakdown,
        reviews
      };
    } catch (e) {
      return { tech_id: techId, average_rating: 0, reviews_count: 0, rating_breakdown: breakdown, reviews: [] };
    }
  }
};

// Seamless backwards-compatibility alias
window.FirebaseBridge = window.SupabaseBridge;

// Auto-handle OAuth redirect & auth state changes in real time
if (typeof supabase !== "undefined" && supabaseClient) {
  supabaseClient.auth.onAuthStateChange(async (event, session) => {
    console.log("Supabase Auth State:", event, session?.user?.email);
    if ((event === "SIGNED_IN" || event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") && session?.user) {
      await window.SupabaseBridge._applyUserSession(session);
      // Clean hash if present
      if (window.location.hash && (window.location.hash.includes("access_token=") || window.location.hash.includes("error="))) {
        try {
          window.history.replaceState(null, "", window.location.pathname + window.location.search);
        } catch (e) {}
      }
    } else if (event === "SIGNED_OUT") {
      window.SupabaseBridge._clearUserSession();
    }
  });
}
