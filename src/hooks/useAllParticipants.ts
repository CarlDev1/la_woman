import { useState, useEffect } from 'react';
import { getAllParticipants, toggleUserStatus, updateParticipant, ParticipantWithStats } from '@/lib/admin-api';
import { toast } from 'sonner';

export const useAllParticipants = () => {
  const [participants, setParticipants] = useState<ParticipantWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const fetchParticipants = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllParticipants(search, statusFilter, sortField, sortOrder);
      setParticipants(data);
    } catch (err) {
      console.error('Error fetching participants:', err);
      setError('Erreur lors du chargement des participantes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParticipants();
  }, [search, statusFilter, sortField, sortOrder]);

  const handleToggleStatus = async (userId: string, currentStatus: string, userName: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const action = newStatus === 'active' ? 'activer' : 'désactiver';
    
    const confirmed = window.confirm(
      `Êtes-vous sûr de vouloir ${action} le compte de ${userName} ?`
    );
    
    if (!confirmed) return;

    try {
      const resultStatus = await toggleUserStatus(userId, currentStatus);
      toast.success(`Compte ${resultStatus === 'active' ? 'activé' : 'désactivé'} avec succès`);
      await fetchParticipants();
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast.error('Erreur lors du changement de statut');
    }
  };

  const handleUpdateParticipant = async (
    userId: string,
    updates: {
      full_name: string;
      phone: string;
      activity_description: string;
      role: string;
      status: string;
    }
  ) => {
    try {
      await updateParticipant(userId, updates);
      toast.success('Participante mise à jour avec succès');
      await fetchParticipants();
    } catch (error) {
      console.error('Error updating participant:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const exportToCSV = () => {
    const headers = ['Nom', 'Email', 'Téléphone', 'Statut', 'CA Total', 'Bénéfice Total', 'Trophées'];
    const rows = participants.map(p => [
      p.full_name,
      p.email,
      p.phone,
      p.status,
      p.total_revenue.toString(),
      p.total_profit.toString(),
      p.trophy_count.toString()
    ]);

    const csv = [headers, ...rows]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `participantes_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const refetch = () => fetchParticipants();

  return {
    participants,
    loading,
    error,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    sortField,
    setSortField,
    sortOrder,
    setSortOrder,
    handleToggleStatus,
    handleUpdateParticipant,
    exportToCSV,
    refetch
  };
};
