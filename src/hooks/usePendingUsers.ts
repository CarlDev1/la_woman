import { useState, useEffect } from 'react';
import { getPendingUsers, validateUser, rejectUser } from '@/lib/admin-api';
import { sendValidationEmail, sendRejectionEmail } from '@/lib/email-service';
import { toast } from 'sonner';
import { Profile } from '@/lib/supabase';

export const usePendingUsers = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPendingUsers();
      setUsers(data);
    } catch (err) {
      console.error('Error fetching pending users:', err);
      setError('Erreur lors du chargement des inscriptions en attente');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const handleValidate = async (userId: string, email: string, name: string) => {
    try {
      await validateUser(userId);
      await sendValidationEmail(email, name);
      toast.success(`${name} a été validée avec succès !`);
      await fetchPendingUsers();
    } catch (error) {
      console.error('Error validating user:', error);
      toast.error('Erreur lors de la validation');
    }
  };

  const handleReject = async (userId: string, email: string, name: string) => {
    const confirmed = window.confirm(
      `Êtes-vous sûr de vouloir refuser l'inscription de ${name} ?`
    );
    
    if (!confirmed) return;

    try {
      await rejectUser(userId);
      await sendRejectionEmail(email, name);
      toast.success(`L'inscription de ${name} a été refusée`);
      await fetchPendingUsers();
    } catch (error) {
      console.error('Error rejecting user:', error);
      toast.error('Erreur lors du refus');
    }
  };

  const refetch = () => fetchPendingUsers();

  return {
    users,
    loading,
    error,
    handleValidate,
    handleReject,
    refetch
  };
};
