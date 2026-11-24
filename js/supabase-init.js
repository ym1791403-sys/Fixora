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

  /**
   * Initializes session upon page load / refresh or OAuth redirect.
   */
  async initSession() {
    if (!this.isReady()) return null;
    try {
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

  /**
   * Real Email / Password Registration via Supabase
   */
  async register(name, email, password, role = "user") {
    if (!this.isReady()) {
      throw new Error("Supabase SDK is not available");
    }

    const { data, error } = await supabaseClient.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          full_name: name,
          role: role,
          avatar_initial: (name[0] || "U").toUpperCase()
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

    // Direct sync to public.profiles if client has permission
    await this.syncUserProfile(user, { full_name: name, role: role });

    return {
      id: user.id,
      uid: user.id,
      email: user.email,
      full_name: name,
      role: role,
      avatar_initial: (name[0] || "U").toUpperCase(),
      session: data.session
    };
  },

  /**
   * Real Email / Password Login via Supabase
   */
  async login(email, password) {
    if (!this.isReady()) {
      throw new Error("Supabase SDK is not available");
    }

    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (error) {
      throw error;
    }

    const user = data.user;
    let role = user.user_metadata?.role || "user";
    let fullName = user.user_metadata?.full_name || email.split("@")[0];
    let avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;

    // Try reading profile table for custom attributes
    try {
      const { data: profile } = await supabaseClient
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (profile) {
        if (profile.role) role = profile.role;
        if (profile.full_name) fullName = profile.full_name;
        if (profile.avatar_url) avatarUrl = profile.avatar_url;
      }
    } catch (pErr) {
      // Optional profile fetch
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
      const initial = (fullName[0] || user.email[0] || "U").toUpperCase();
      const role = meta.role || "user";

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
      console.warn("Client profile sync note (handled gracefully by trigger):", e.message);
    }
  },

  /**
   * Internal session applicator
   */
  async _applyUserSession(session) {
    if (!session || !session.user) return;
    const u = session.user;
    const meta = u.user_metadata || {};
    const fullName = meta.full_name || meta.name || (u.email ? u.email.split("@")[0] : "User");
    const avatarUrl = meta.avatar_url || meta.picture || null;
    const initial = (fullName[0] || (u.email ? u.email[0] : "U")).toUpperCase();
    // Exclusive Admin Control: ONLY snsr19344@gmail.com has Admin access
    let role = "user";
    const userEmail = (u.email || "").toLowerCase().trim();
    if (userEmail === "snsr19344@gmail.com") {
      role = "admin";
    } else if (meta.role === "technician" || userEmail.includes("manager") || userEmail.includes("maint")) {
      role = "technician";
    } else {
      role = "user";
    }

    // Read profile table
    try {
      if (supabaseClient) {
        const { data: profile } = await supabaseClient
          .from("profiles")
          .select("*")
          .eq("id", u.id)
          .maybeSingle();

        if (profile) {
          if (profile.role) role = profile.role;
          if (profile.full_name) fullName = profile.full_name;
        } else {
          // Sync profile
          await this.syncUserProfile(u);
        }
      }
    } catch (syncErr) {
      // Handled
    }

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
    if (window.app && typeof window.app.updateNavAuth === "function") {
      window.app.updateNavAuth();
    }
  },

  async syncReport(report) {
    if (!this.isReady()) return;
    try {
      const payload = {
        report_code: report.report_id || `FIX-${Date.now().toString().slice(-4)}`,
        device_category: report.device_category || "General",
        brand: report.brand || "",
        model: report.model || "",
        problem_category: report.problem_category || "General Fault",
        description: report.symptoms || report.description || "",
        severity: report.severity || "medium",
        empirical_statistics: report.empirical_statistics || null,
        verified_guide: report.verified_guide || null,
        possible_causes: report.possible_causes || [],
        troubleshooting_steps: report.troubleshooting_steps || [],
        required_tools: report.required_tools || []
      };
      await supabaseClient.from("diagnosis_reports").insert([payload]);
    } catch (e) {
      console.warn("Report sync to Supabase:", e);
    }
  },

  async syncDevice(device) {
    if (!this.isReady()) return;
    try {
      await supabaseClient.from("devices").insert([device]);
    } catch (e) {
      console.warn("Device sync to Supabase:", e);
    }
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
        const rawText = st.Text_raw || (Array.isArray(st.Lines) ? st.Lines.map(l => (typeof l === 'object' ? l.Text : l)).join(" ") : "") || st.instruction_en || st.instruction_ar || "";
        return {
          step_number: st.step_number || (st.Order !== undefined ? st.Order + 1 : idx + 1),
          title_ar: st.title_ar || `الخطوة ${st.Order !== undefined ? st.Order + 1 : idx + 1}`,
          title_en: st.title_en || `Step ${st.Order !== undefined ? st.Order + 1 : idx + 1}`,
          instruction_ar: st.instruction_ar || rawText,
          instruction_en: st.instruction_en || rawText,
          images: st.Images || st.images || []
        };
      });
    }

    let tools = [];
    if (Array.isArray(g.tools)) {
      tools = g.tools.map(t => typeof t === "string" ? t : (t.Name || t.name || "Tool"));
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
      business_name: t.business_name || t.name || 'Certified Repair Lab',
      technician_name: t.technician_name || t.name || 'Certified Tech',
      name: t.name || t.technician_name || 'Certified Tech',
      city: t.city || 'Cairo',
      phone: t.phone || '',
      rating: parseFloat(t.rating) || 5.0,
      total_reviews: t.total_reviews || t.reviews_count || 120,
      reviews_count: t.reviews_count || t.total_reviews || 120,
      experience_years: t.experience_years || 7,
      bio: t.bio || 'فني صيانة معتمد وخبير في فحص وإصلاح اللوحات الإلكترونية والأجهزة الذكية.',
      specializations: specs.length > 0 ? specs : ["Hardware Diagnostics", "Electronics Repair"]
    };
  },

  /**
   * Data Retrieval APIs directly querying Supabase PostgreSQL tables
   */
  async fetchGuides(category = null, difficulty = null, search = null) {
    if (!this.isReady()) return [];
    try {
      let q = supabaseClient.from("repair_guides").select("*");
      if (category && category !== "all") {
        q = q.ilike("device_category", `%${category}%`);
      }
      if (difficulty && difficulty !== "all") {
        q = q.eq("difficulty", difficulty);
      }
      if (search) {
        q = q.or(`title.ilike.%${search}%,summary.ilike.%${search}%,device_model.ilike.%${search}%`);
      }
      const { data, error } = await q.order("id", { ascending: true }).limit(60);
      if (error) throw error;
      return (data || []).map(g => this._normalizeGuide(g));
    } catch(err) {
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
    } catch(err) {
      return null;
    }
  },

  async fetchTechnicians(city = null, specialization = null) {
    if (!this.isReady()) return [];
    try {
      let q = supabaseClient.from("technicians").select("*");
      if (city && city !== "all") {
        q = q.ilike("city", `%${city}%`);
      }
      if (specialization && specialization !== "all") {
        q = q.ilike("specializations", `%${specialization}%`);
      }
      const { data, error } = await q.order("rating", { ascending: false });
      if (error) throw error;
      return (data || []).map(t => this._normalizeTechnician(t));
    } catch(err) {
      console.warn("Supabase fetchTechnicians error:", err);
      return [];
    }
  },

  async fetchReports() {
    if (!this.isReady()) return [];
    try {
      const { data, error } = await supabaseClient
        .from("diagnosis_reports")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    } catch(err) {
      console.warn("Supabase fetchReports error:", err);
      return [];
    }
  },

  async fetchDevices() {
    if (!this.isReady()) return [];
    try {
      const { data, error } = await supabaseClient
        .from("devices")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    } catch(err) {
      console.warn("Supabase fetchDevices error:", err);
      return [];
    }
  },

  async fetchRepairRequests() {
    if (!this.isReady()) return [];
    try {
      const { data, error } = await supabaseClient
        .from("repair_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    } catch(err) {
      console.warn("Supabase fetchRepairRequests error:", err);
      return [];
    }
  },

  async bookTechnician(booking) {
    if (!this.isReady()) return booking;
    try {
      const payload = {
        technician_id: booking.technician_id || null,
        technician_business: booking.technician_business || booking.technician_name || "Certified Technician",
        device_info: booking.device_info || "Device",
        problem_summary: booking.problem_summary || booking.description || "",
        customer_name: booking.customer_name || (this.currentUser ? this.currentUser.full_name : "Customer"),
        customer_phone: booking.customer_phone || "",
        status: "NEW",
        estimate: null,
        final_cost: null,
        actual_fault: "",
        appointment: booking.appointment || null,
        created_at: new Date().toISOString()
      };
      const { data, error } = await supabaseClient.from("repair_requests").insert([payload]).select().single();
      if (error) throw error;
      return data || payload;
    } catch(err) {
      console.warn("Supabase bookTechnician note:", err);
      return booking;
    }
  },

  async createRepairRequest(reqData) {
    if (!this.isReady()) return reqData;
    try {
      const { data, error } = await supabaseClient
        .from("repair_requests")
        .insert([reqData])
        .select()
        .single();
      if (error) throw error;
      return data || reqData;
    } catch(err) {
      console.warn("Supabase createRepairRequest error:", err);
      return reqData;
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
