/**
 * Fixora Database Migration Notice:
 * All Authentication, Profiles, and Cloud Storage have been migrated to Supabase.
 * Project Ref: czwndaulnxvmncbtzsao
 * API: https://czwndaulnxvmncbtzsao.supabase.co
 */

if (typeof window !== "undefined") {
  window.FirebaseBridge = window.SupabaseBridge || {
    isReady: () => typeof window.SupabaseBridge !== "undefined" && window.SupabaseBridge.isReady(),
    login: (...args) => window.SupabaseBridge.login(...args),
    register: (...args) => window.SupabaseBridge.register(...args),
    signInWithGoogle: (...args) => window.SupabaseBridge.signInWithGoogle(...args),
    signOut: (...args) => window.SupabaseBridge.signOut(...args)
  };
}
