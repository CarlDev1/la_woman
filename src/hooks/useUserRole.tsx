import { useState, useEffect } from 'react';
import { supabase, AppRole } from '@/lib/supabase';
import { useAuth } from './useAuth';

export function useUserRole() {
  const { profile } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) {
      setRole(null);
      setLoading(false);
      return;
    }

    // Role is now directly available in the profile
    setRole(profile.role);
    setLoading(false);
  }, [profile]);

  return {
    role,
    isAdmin: role === 'admin',
    isUser: role === 'user',
    loading,
  };
}
