/**
 * Fixora Supabase Client & Authentication Bridge
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

    // Try sync with profiles table if present
    try {
      await supabaseClient.from("profiles").upsert({
        id: user.id,
        email: email,
        full_name: name,
        role: role,
        avatar_initial: (name[0] || "U").toUpperCase()
      });
    } catch (profileErr) {
      // Table may not exist yet or RLS policy
    }

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

    // Try reading profile table
    try {
      const { data: profile } = await supabaseClient
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (profile) {
        if (profile.role) role = profile.role;
        if (profile.full_name) fullName = profile.full_name;
      }
    } catch (pErr) {
      // Optional profile fetch
    }

    return {
      id: user.id,
      uid: user.id,
      email: user.email,
      full_name: fullName,
      role: role,
      avatar_initial: (fullName[0] || "U").toUpperCase(),
      access_token: data.session?.access_token
    };
  },

  async signInWithGoogle() {
    if (!this.isReady()) {
      throw new Error("Supabase SDK is not available");
    }

    const { data, error } = await supabaseClient.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin
      }
    });

    if (error) {
      throw error;
    }
    return data;
  },

  async signOut() {
    if (this.isReady()) {
      try {
        await supabaseClient.auth.signOut();
      } catch (err) {
        console.warn("Supabase signOut error:", err);
      }
    }
  },

  async syncReport(report) {
    if (!this.isReady()) return;
    try {
      await supabaseClient.from("diagnosis_reports").insert([report]);
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
  }
};

// Seamless backwards-compatibility alias for any legacy callers
window.FirebaseBridge = window.SupabaseBridge;

// Auto-handle OAuth redirect sessions
if (typeof supabase !== "undefined" && supabaseClient) {
  supabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_IN" && session?.user) {
      const u = session.user;
      const userProfile = {
        id: u.id,
        uid: u.id,
        email: u.email,
        full_name: u.user_metadata?.full_name || u.email.split("@")[0],
        role: u.user_metadata?.role || "user",
        avatar_initial: ((u.user_metadata?.full_name || u.email)[0] || "U").toUpperCase(),
        access_token: session.access_token
      };
      if (window.api && typeof window.api.setSession === "function") {
        window.api.setSession("sb_" + session.access_token.slice(-16), userProfile);
      }
      if (window.app && typeof window.app.updateNavAuth === "function") {
        window.app.updateNavAuth();
      }
    } else if (event === "SIGNED_OUT") {
      if (window.api && typeof window.api.clearSession === "function") {
        window.api.clearSession();
      }
      if (window.app && typeof window.app.updateNavAuth === "function") {
        window.app.updateNavAuth();
      }
    }
  });
}
