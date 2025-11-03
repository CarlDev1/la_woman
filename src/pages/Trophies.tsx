import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase, Trophy, UserTrophy } from '@/lib/supabase';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { subDays } from 'date-fns';

type TrophyStatus = {
  trophy: Trophy;
  obtained: boolean;
  obtainedCount: number;
  lastObtainedDate?: string;
  currentValue: number;
  progress: number;
};


export default function Trophies() {
  const { user } = useAuth();
  const [trophyStatuses, setTrophyStatuses] = useState<TrophyStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTrophies();
    }
  }, [user]);

  const fetchTrophies = async () => {
    if (!user) return;

    try {
      const date90DaysAgo = subDays(new Date(), 90);

      // Fetch all trophies definitions
      const { data: allTrophies } = await supabase
        .from('trophies')
        .select('*')
        .order('threshold', { ascending: true });

      // Fetch results from last 90 days
      const { data: results90Days } = await supabase
        .from('daily_results')
        .select('revenue, profit')
        .eq('user_id', user.id)
        .gte('result_date', date90DaysAgo.toISOString().split('T')[0]);

      const revenueSum = results90Days?.reduce((sum, r) => sum + (r.revenue || 0), 0) || 0;
      const profitSum = results90Days?.reduce((sum, r) => sum + (r.profit || 0), 0) || 0;

      // Fetch obtained trophies
      const { data: userTrophies } = await supabase
        .from('user_trophies')
        .select('trophy_id, earned_at, value_achieved')
        .eq('user_id', user.id);

      const statuses: TrophyStatus[] = (allTrophies || []).map((trophy) => {
        const obtainedTrophies = userTrophies?.filter((ut) => ut.trophy_id === trophy.id) || [];

        let currentValue = 0;
        let progress = 0;

        if (trophy.type === 'revenue_90d' && trophy.threshold) {
          currentValue = revenueSum;
          progress = Math.min((currentValue / trophy.threshold) * 100, 100);
        } else if (trophy.type === 'profit_90d' && trophy.threshold) {
          currentValue = profitSum;
          progress = Math.min((currentValue / trophy.threshold) * 100, 100);
        } else if (trophy.type === 'monthly_queen') {
          // Check if user is in monthly_queens table
          currentValue = 0;
          progress = obtainedTrophies.length > 0 ? 100 : 0;
        }

        return {
          trophy,
          obtained: obtainedTrophies.length > 0,
          obtainedCount: obtainedTrophies.length,
          lastObtainedDate: obtainedTrophies[0]?.earned_at,
          currentValue,
          progress,
        };
      });

      setTrophyStatuses(statuses);
    } catch (error) {
      console.error('Error fetching trophies:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('fr-FR') + ' FCFA';
  };

  const obtainedCount = trophyStatuses.filter((t) => t.obtained).length;
  const totalCount = trophyStatuses.length;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="mb-2 text-3xl font-bold">🏆 Mes Trophées</h1>
          <p className="text-lg text-muted-foreground">
            {obtainedCount} trophée{obtainedCount > 1 ? 's' : ''} obtenu{obtainedCount > 1 ? 's' : ''} sur {totalCount}
          </p>
          <div className="mx-auto mt-4 max-w-md">
            <Progress value={(obtainedCount / totalCount) * 100} className="h-3" />
            <p className="mt-2 text-sm text-muted-foreground">
              {Math.round((obtainedCount / totalCount) * 100)}% complété
            </p>
          </div>
        </div>

        {/* Trophies Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {trophyStatuses.map((status, index) => (
            <Card
              key={status.trophy.id}
              className="animate-fade-in overflow-hidden hover-lift"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardHeader className="text-center">
                <div className="mb-4 text-6xl">{status.trophy.emoji}</div>
                <CardTitle className="text-xl">{status.trophy.name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {status.trophy.description}
                </p>
              </CardHeader>
              <CardContent>
                {status.obtained ? (
                  <div className="space-y-2 text-center">
                    <Badge className="bg-green-500 text-white">
                      ✅ Obtenu
                    </Badge>
                    {status.obtainedCount > 1 && (
                      <p className="text-sm text-muted-foreground">
                        Obtenu {status.obtainedCount} fois
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Badge variant="outline" className="w-full justify-center">
                      En cours
                    </Badge>
                    {status.trophy.type !== 'monthly_queen' && status.trophy.threshold && (
                      <>
                        <div className="space-y-1">
                          <Progress value={status.progress} className="h-2" />
                        </div>
                        <p className="text-center text-sm">
                          {formatCurrency(status.currentValue)} /{' '}
                          {formatCurrency(status.trophy.threshold)}
                        </p>
                        <p className="text-center text-xs text-muted-foreground">
                          {Math.round(status.progress)}%
                        </p>
                      </>
                    )}
                    {status.trophy.type === 'monthly_queen' && (
                      <p className="text-center text-sm text-muted-foreground">
                        Soyez la meilleure du mois prochain !
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
