import { Profile, supabase } from "@/lib/supabase";
import { Session, User } from "@supabase/supabase-js";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (
    userId: string,
    useCache: boolean = true
  ): Promise<Profile | null> => {
    const cacheKey = `profile_${userId}`;

    // Try to load from cache first for instant display
    if (useCache) {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const cachedData = JSON.parse(cached);
          const cachedProfile = cachedData.profile as Profile;
          const cacheTime = cachedData.cachedAt || 0;
          const now = Date.now();
          // Use cache if less than 5 minutes old
          if (now - cacheTime < 5 * 60 * 1000 && cachedProfile) {
            // Fetch fresh data in background (don't wait for it)
            fetchProfile(userId, false)
              .then((freshProfile) => {
                if (freshProfile) {
                  localStorage.setItem(
                    cacheKey,
                    JSON.stringify({
                      profile: freshProfile,
                      cachedAt: Date.now(),
                    })
                  );
                }
              })
              .catch(() => {
                // Ignore background fetch errors
              });
            return cachedProfile;
          }
        } catch (e) {
          // Invalid cache, continue with fetch
        }
      }
    }

    try {
      // Create a timeout promise that rejects after 3 seconds
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error("fetchProfile timeout after 3 seconds"));
        }, 3000);
      });

      // Create the query promise
      const queryPromise = supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      // Race between query and timeout
      const result = await Promise.race([queryPromise, timeoutPromise]);

      const { data, error } = result as {
        data: Profile | null;
        error: { message?: string; code?: string } | null;
      };

      if (error) {
        // Try to return cached profile if available
        if (useCache) {
          const cached = localStorage.getItem(cacheKey);
          if (cached) {
            try {
              const cachedData = JSON.parse(cached);
              return cachedData.profile as Profile;
            } catch (e) {
              // Invalid cache
            }
          }
        }
        return null;
      }

      // Cache the profile
      if (data) {
        localStorage.setItem(
          cacheKey,
          JSON.stringify({
            profile: data,
            cachedAt: Date.now(),
          })
        );
      }

      return data as Profile;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      if (errorMessage.includes("timeout")) {
        // Try to return cached profile if available
        if (useCache) {
          const cached = localStorage.getItem(cacheKey);
          if (cached) {
            try {
              const cachedData = JSON.parse(cached);
              return cachedData.profile as Profile;
            } catch (e) {
              // Invalid cache
            }
          }
        }
      }
      return null;
    }
  };

  const profileRef = useRef<Profile | null>(null);

  useEffect(() => {
    let mounted = true;
    let isLoadingProfile = false;

    const loadProfile = async (userId: string) => {
      if (isLoadingProfile) return; // Prevent concurrent loads
      isLoadingProfile = true;

      try {
        const userProfile = await fetchProfile(userId);

        if (mounted) {
          profileRef.current = userProfile;
          setProfile(userProfile);
          setLoading(false);
        }
      } catch (error) {
        if (mounted) {
          profileRef.current = null;
          setProfile(null);
          setLoading(false);
        }
      } finally {
        isLoadingProfile = false;
      }
    };

    // Check for existing session first (synchronous check)
    supabase.auth
      .getSession()
      .then(({ data: { session: currentSession }, error }) => {
        if (!mounted) return;

        if (error) {
          setLoading(false);
          return;
        }

        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          loadProfile(currentSession.user.id);
        } else {
          setLoading(false);
        }
      })
      .catch((error) => {
        if (mounted) {
          setLoading(false);
        }
      });

    // Set up auth state listener for future changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!mounted) return;

      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        // Only load profile if we don't already have it or if it changed
        if (
          !profileRef.current ||
          profileRef.current.id !== currentSession.user.id
        ) {
          await loadProfile(currentSession.user.id);
        }
      } else {
        profileRef.current = null;
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    profileRef.current = null;
    setProfile(null);
    // Clear profile cache on sign out
    if (user) {
      localStorage.removeItem(`profile_${user.id}`);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      // Force refresh without cache
      const userProfile = await fetchProfile(user.id, false);
      setProfile(userProfile);
      profileRef.current = userProfile;
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, session, profile, loading, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

type ProtectedRouteProps = {
  children: ReactNode;
  adminOnly?: boolean;
  requireStatus?: "active" | "pending" | "inactive";
};

export function ProtectedRoute({
  children,
  adminOnly = false,
  requireStatus = "active",
}: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        toast.error("Vous devez être connecté(e)");
        navigate("/login", { state: { from: location.pathname } });
        return;
      }

      // If user exists but profile is still null after loading, there might be an issue
      // But we should still check the status requirement
      if (requireStatus && profile && profile.status !== requireStatus) {
        if (profile.status === "pending") {
          toast.warning("⏳ Votre compte est en attente de validation");
        } else if (profile.status === "inactive") {
          if (requireStatus === "active") {
            toast.error("❌ Votre compte a été désactivé");
          }
        } else if (profile.status === "active" && requireStatus !== "active") {
          toast.error("Accès non autorisé à cette ressource");
        }
        navigate("/login", { state: { from: location.pathname } });
        return;
      }

      if (adminOnly && profile?.role !== "admin") {
        toast.error("Accès réservé aux administrateurs");
        navigate("/dashboard");
        return;
      }

      // Redirect admin users away from regular user routes, but allow access to community
      if (
        !adminOnly &&
        profile?.role === "admin" &&
        window.location.pathname.startsWith("/dashboard") &&
        !window.location.pathname.startsWith("/community")
      ) {
        navigate("/admin/dashboard");
        return;
      }
    }
  }, [
    user,
    profile,
    loading,
    navigate,
    adminOnly,
    requireStatus,
    location.pathname,
  ]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user || !profile || profile.status !== "active") {
    return null;
  }

  // Admin check is now handled by the component using useUserRole hook
  // This ProtectedRoute only checks authentication and active status

  return <>{children}</>;
}
