import { useState, useEffect } from 'react';
import { getAdminStats, getMonthlyData, getRecentActivities, AdminStats, MonthlyData, RecentActivity } from '@/lib/admin-api';

export const useAdminStats = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsData, monthlyDataResult, recentActivitiesResult] = await Promise.all([
        getAdminStats(),
        getMonthlyData(),
        getRecentActivities()
      ]);

      setStats(statsData);
      setMonthlyData(monthlyDataResult);
      setRecentActivities(recentActivitiesResult);
    } catch (err) {
      console.error('Error fetching admin stats:', err);
      setError('Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const refetch = () => fetchData();

  return {
    stats,
    monthlyData,
    recentActivities,
    loading,
    error,
    refetch
  };
};
