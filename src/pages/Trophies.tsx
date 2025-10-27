import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { subDays } from 'date-fns';

type TrophyDefinition = {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition_type: string;
  condition_value: number;
  color: string;
};

type TrophyStatus = {
  definition: TrophyDefinition;
  obtained: boolean;
  obtainedCount: number;
  lastObtainedDate?: string;
  currentValue: number;
  progress: number;
};

const trophyDefinitions: TrophyDefinition[] = [
  {
    id: 'monthly_best',
    name: 'Reine du Mois',
    description: 'Meilleur CA du mois précédent',
    icon: '👑',
    condition_type: 'monthly_best',
    condition_value: 0,
    color: '#FFD700',
  },
  {
    id: 'bronze',
    name: 'Bronze Business',
    description: '10 millions de CA en 90 jours',
    icon: '🥉',
    condition_type: '90_days_revenue',
    condition_value: 10000000,
    color: '#CD7F32',
  },
  {
    id: 'silver',
    name: 'Argent Impératrice',
    description: '30 millions de CA en 90 jours',
    icon: '🥈',
    condition_type: '90_days_revenue',
    condition_value: 30000000,
    color: '#C0C0C0',
  },
  {
    id: 'gold',
    name: 'Or Conquérante',
    description: '50 millions de CA en 90 jours',
    icon: '🥇',
    condition_type: '90_days_revenue',
    condition_value: 50000000,
    color: '#FFD700',
  },
  {
    id: 'star',
    name: 'Étoile Montante',
    description: '500K de bénéfice en 90 jours',
    icon: '🌟',
    condition_type: '90_days_profit',
    condition_value: 500000,
    color: '#FFC107',
  },
  {
    id: 'diamond',
    name: 'Diamant Précieux',
    description: '1 million de bénéfice en 90 jours',
    icon: '💎',
    condition_type: '90_days_profit',
    condition_value: 1000000,
    color: '#00BCD4',
  },
  {
    id: 'empress',
    name: 'Impératrice des Profits',
    description: '5 millions de bénéfice en 90 jours',
    icon: '👸',
    condition_type: '90_days_profit',
    condition_value: 5000000,
    color: '#9C27B0',
  },
];

export default function Trophies() {
  const { user } = useAuth();
  const [trophies, setTrophies] = useState<TrophyStatus[]>([]);
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

      // Fetch results from last 90 days
      const { data: results90Days } = await supabase
        .from('daily_results')
        .select('revenue, profit')
        .eq('user_id', user.id)
        .gte('date', date90DaysAgo.toISOString().split('T')[0]);

      const revenueSum = results90Days?.reduce((sum, r) => sum + (r.revenue || 0), 0) || 0;
      const profitSum = results90Days?.reduce((sum, r) => sum + (r.profit || 0), 0) || 0;

      // Fetch obtained trophies
      const { data: userTrophies } = await supabase
        .from('user_trophies')
        .select('trophy_id, obtained_at, value_achieved')
        .eq('user_id', user.id);

      const trophyStatuses: TrophyStatus[] = trophyDefinitions.map((def) => {
        const obtainedTrophies = userTrophies?.filter((ut) => {
          // Match by trophy name since we don't have IDs in the trophies table yet
          return true; // We'll enhance this later
        }) || [];

        let currentValue = 0;
        let progress = 0;

        if (def.condition_type === '90_days_revenue') {
          currentValue = revenueSum;
          progress = Math.min((currentValue / def.condition_value) * 100, 100);
        } else if (def.condition_type === '90_days_profit') {
          currentValue = profitSum;
          progress = Math.min((currentValue / def.condition_value) * 100, 100);
        } else if (def.condition_type === 'monthly_best') {
          // This would need special calculation
          currentValue = 0;
          progress = 0;
        }

        return {
          definition: def,
          obtained: progress >= 100,
          obtainedCount: obtainedTrophies.length,
          currentValue,
          progress,
        };
      });

      setTrophies(trophyStatuses);
    } catch (error) {
      console.error('Error fetching trophies:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('fr-FR') + ' FCFA';
  };

  const obtainedCount = trophies.filter((t) => t.obtained).length;
  const totalCount = trophies.length;

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
          {trophies.map((trophy, index) => (
            <Card
              key={trophy.definition.id}
              className="animate-fade-in overflow-hidden hover-lift"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardHeader className="text-center">
                <div className="mb-4 text-6xl">{trophy.definition.icon}</div>
                <CardTitle className="text-xl">{trophy.definition.name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {trophy.definition.description}
                </p>
              </CardHeader>
              <CardContent>
                {trophy.obtained ? (
                  <div className="space-y-2 text-center">
                    <Badge className="bg-success text-success-foreground">
                      ✅ Obtenu
                    </Badge>
                    {trophy.obtainedCount > 1 && (
                      <p className="text-sm text-muted-foreground">
                        Obtenu {trophy.obtainedCount} fois
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Badge variant="outline" className="w-full justify-center">
                      En cours
                    </Badge>
                    {trophy.definition.condition_type !== 'monthly_best' && (
                      <>
                        <div className="space-y-1">
                          <div
                            className="h-4 rounded-full transition-all duration-1000"
                            style={{
                              width: `${trophy.progress}%`,
                              backgroundColor: trophy.definition.color,
                            }}
                          />
                        </div>
                        <p className="text-center text-sm">
                          {formatCurrency(trophy.currentValue)} /{' '}
                          {formatCurrency(trophy.definition.condition_value)}
                        </p>
                        <p className="text-center text-xs text-muted-foreground">
                          {Math.round(trophy.progress)}%
                        </p>
                      </>
                    )}
                    {trophy.definition.condition_type === 'monthly_best' && (
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
