import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, Profile } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

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

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
    return data as Profile;
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          setTimeout(async () => {
            const userProfile = await fetchProfile(currentSession.user.id);
            setProfile(userProfile);
          }, 0);
        } else {
          setProfile(null);
        }

        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        fetchProfile(currentSession.user.id).then((userProfile) => {
          setProfile(userProfile);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user) {
      const userProfile = await fetchProfile(user.id);
      setProfile(userProfile);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

type ProtectedRouteProps = {
  children: ReactNode;
  adminOnly?: boolean;
  requireStatus?: 'active' | 'pending' | 'inactive';
};

export function ProtectedRoute({ 
  children, 
  adminOnly = false, 
  requireStatus = 'active' 
}: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        toast.error('Vous devez être connecté(e)');
        navigate('/login');
        return;
      }

      if (requireStatus && profile?.status !== requireStatus) {
        if (profile?.status === 'pending') {
          toast.warning('⏳ Votre compte est en attente de validation');
        } else if (profile?.status === 'inactive') {
          if (requireStatus === 'active') {
            toast.error('❌ Votre compte a été désactivé');
          }
        } else if (profile?.status === 'active' && requireStatus !== 'active') {
          toast.error('Accès non autorisé à cette ressource');
        }
        navigate('/login');
        return;
      }

      if (adminOnly && profile?.role !== 'admin') {
        toast.error('Accès réservé aux administrateurs');
        navigate('/dashboard');
        return;
      }

      // Redirect admin users away from regular user routes, but allow access to community
      if (!adminOnly && profile?.role === 'admin' && 
          window.location.pathname.startsWith('/dashboard') && 
          !window.location.pathname.startsWith('/community')) {
        navigate('/admin/dashboard');
        return;
      }
    }
  }, [user, profile, loading, navigate, adminOnly]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user || !profile || profile.status !== 'active') {
    return null;
  }

  // Admin check is now handled by the component using useUserRole hook
  // This ProtectedRoute only checks authentication and active status

  return <>{children}</>;
}