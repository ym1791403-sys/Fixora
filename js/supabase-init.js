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
    let role = meta.role || "user";

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
      localStorage.setItem("techrepair_token", session.access_token);
      localStorage.setItem("techrepair_user", JSON.stringify(userProfile));
      localStorage.setItem("fixora_token", session.access_token);
      localStorage.setItem("fixora_user", JSON.stringify(userProfile));
    }

    if (window.app) {
      if (typeof window.app.updateNavAuth === "function") {
        window.app.updateNavAuth();
      }
      if (typeof window.app.closeModal === "function") {
        window.app.closeModal();
      }
    }
  },

  _clearUserSession() {
    if (window.api && typeof window.api.clearSession === "function") {
      window.api.clearSession();
    } else {
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
      return data || [];
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
      return data;
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
      return data || [];
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
