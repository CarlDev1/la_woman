import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Trophy, UserTrophy, TrophyProgress } from '@/types/trophies';

export const useTrophies = (userId: string | undefined) => {
  const [trophyProgresses, setTrophyProgresses] = useState<TrophyProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      fetchTrophies();
    }
  }, [userId]);

  const fetchTrophies = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      // 1. Récupérer tous les trophées
      const { data: allTrophies, error: trophiesError } = await supabase
        .from('trophies')
        .select('*')
        .order('condition_value', { ascending: true });

      if (trophiesError) throw trophiesError;

      // 2. Récupérer les trophées obtenus par l'utilisateur
      const { data: userTrophies, error: userTrophiesError } = await supabase
        .from('user_trophies')
        .select('*')
        .eq('user_id', userId);

      if (userTrophiesError) throw userTrophiesError;

      // 3. Calculer le CA total de l'utilisateur
      const { data: totalRevenueData, error: revenueError } = await supabase
        .rpc('get_user_total_revenue', { p_user_id: userId });

      if (revenueError) throw revenueError;
      const totalRevenue = totalRevenueData || 0;

      // 4. Récupérer les stats mensuelles (mois actuel)
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;

      const { data: monthlyStats, error: monthlyError } = await supabase
        .from('monthly_profits')
        .select('total_profit')
        .eq('user_id', userId)
        .eq('year', currentYear)
        .eq('month', currentMonth)
        .single();

      const currentMonthProfit = monthlyStats?.total_profit || 0;

      // 5. Récupérer les stats annuelles 2025
      const { data: annualStats, error: annualError } = await supabase
        .from('annual_profits')
        .select('total_profit')
        .eq('user_id', userId)
        .eq('year', 2025)
        .single();

      const current2025Profit = annualStats?.total_profit || 0;

      // 6. Construire les progressions
      const progresses: TrophyProgress[] = (allTrophies || []).map((trophy: Trophy) => {
        const obtainedTrophies = (userTrophies || []).filter(
          (ut: UserTrophy) => ut.trophy_id === trophy.id
        );

        let currentValue = 0;
        let progress = 0;

        switch (trophy.condition_type) {
          case 'revenue_total':
            currentValue = totalRevenue;
            if (trophy.condition_value > 0) {
              progress = Math.min((currentValue / trophy.condition_value) * 100, 100);
            }
            break;

          case 'monthly_best_profit':
            currentValue = currentMonthProfit;
            progress = obtainedTrophies.length > 0 ? 100 : 0;
            break;

          case 'annual_2025':
            currentValue = current2025Profit;
            progress = obtainedTrophies.length > 0 ? 100 : 0;
            break;
        }

        return {
          trophy,
          obtained: obtainedTrophies.length > 0,
          obtainedCount: obtainedTrophies.length,
          lastObtainedDate: obtainedTrophies[0]?.awarded_at,
          currentValue,
          progress
        };
      });

      setTrophyProgresses(progresses);
    } catch (err: any) {
      console.error('Error fetching trophies:', err);
      setError(err.message || 'Erreur lors du chargement des trophées');
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => fetchTrophies();

  return {
    trophyProgresses,
    loading,
    error,
    refetch
  };
};
