import { useEffect, useState, createContext, useContext } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  isAdmin: false,
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const getAdminStatus = async (userId: string) => {
      try {
        const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
        return !!data;
      } catch {
        return false;
      }
    };

    const syncAuthState = async (nextSession: Session | null, isInitial = false) => {
      if (!isMounted) return;
      // Only show full-page loading on the very first hydration.
      // Subsequent auth events (TOKEN_REFRESHED, SIGNED_IN on tab refocus, etc.)
      // must NOT flip `loading` back to true — that would unmount the current
      // route and wipe local form state (e.g. half-written blog posts).
      if (isInitial) setLoading(true);

      const nextUser = nextSession?.user ?? null;

      if (!nextSession || !nextUser) {
        if (!isMounted) return;
        setSession(null);
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      const bannedUntil = (nextUser as any).banned_until;
      if (bannedUntil && new Date(bannedUntil) > new Date()) {
        await supabase.auth.signOut();
        if (!isMounted) return;
        setSession(null);
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      const prevUserId = user?.id ?? null;
      setSession(nextSession);
      setUser(nextUser);

      // Re-query admin status only on initial load or when user actually changes.
      if (isInitial || prevUserId !== nextUser.id) {
        const admin = await getAdminStatus(nextUser.id);
        if (!isMounted) return;
        setIsAdmin(admin);
      }

      setLoading(false);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void syncAuthState(nextSession, false);
    });

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      void syncAuthState(error ? null : session, true);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdmin, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
