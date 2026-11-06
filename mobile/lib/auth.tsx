import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { AppState } from "react-native";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabase, isSupabaseConfigured } from "./supabase";

// Supabase Auth, email one-time code. The session persists in AsyncStorage
// (see getSupabase), so a hunter signs in once per phone. Signed out, the
// logbook still works — it just stays on the phone.

type Auth = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  /** Emails a 6-digit code. Creates the account on first use. */
  signInWithEmail: (email: string) => Promise<void>;
  verifyOtp: (email: string, token: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const OFF = "Sync is off in this build — your hunts stay on this phone.";

const AuthContext = createContext<Auth | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const sb = getSupabase();
    let live = true;
    sb.auth
      .getSession()
      .then(({ data }) => live && setSession(data.session))
      .finally(() => live && setLoading(false));
    const { data: sub } = sb.auth.onAuthStateChange((_event, s) => setSession(s));
    // Token refresh only while the app is in front (Supabase's RN guidance).
    const app = AppState.addEventListener("change", (state) => {
      if (state === "active") sb.auth.startAutoRefresh();
      else sb.auth.stopAutoRefresh();
    });
    return () => {
      live = false;
      sub.subscription.unsubscribe();
      app.remove();
    };
  }, []);

  const value = useMemo<Auth>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      async signInWithEmail(email) {
        if (!isSupabaseConfigured) throw new Error(OFF);
        const { error } = await getSupabase().auth.signInWithOtp({
          email: email.trim(),
          options: { shouldCreateUser: true },
        });
        if (error) throw new Error(error.message);
      },
      async verifyOtp(email, token) {
        if (!isSupabaseConfigured) throw new Error(OFF);
        const { error } = await getSupabase().auth.verifyOtp({ email: email.trim(), token: token.trim(), type: "email" });
        if (error) throw new Error(error.message);
      },
      async signOut() {
        if (!isSupabaseConfigured) return;
        const { error } = await getSupabase().auth.signOut();
        if (error) throw new Error(error.message);
      },
    }),
    [session, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): Auth {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
