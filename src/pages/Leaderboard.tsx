import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { startOfMonth } from 'date-fns';
import { cn } from '@/lib/utils';

type RankingEntry = {
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  total: number;
  trophyCount?: number;
};

export default function Leaderboard() {
  const { user } = useAuth();
  const [revenueRanking, setRevenueRanking] = useState<RankingEntry[]>([]);
  const [profitRanking, setProfitRanking] = useState<RankingEntry[]>([]);
  const [trophyRanking, setTrophyRanking] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRankings();
  }, []);

  const fetchRankings = async () => {
    try {
      const monthStart = startOfMonth(new Date()).toISOString().split('T')[0];

      // Revenue ranking
      const { data: revenueData } = await supabase
        .from('daily_results')
        .select(`
          user_id,
          revenue,
          profiles!inner(full_name, avatar_url, status, role)
        `)
        .gte('date', monthStart)
        .eq('profiles.status', 'active')
        .eq('profiles.role', 'user');

      if (revenueData) {
        const grouped = revenueData.reduce((acc: Record<string, RankingEntry>, item: any) => {
          if (!acc[item.user_id]) {
            acc[item.user_id] = {
              userId: item.user_id,
              fullName: item.profiles.full_name,
              avatarUrl: item.profiles.avatar_url,
              total: 0,
            };
          }
          acc[item.user_id].total += item.revenue || 0;
          return acc;
        }, {});

        const sorted = Object.values(grouped).sort((a, b) => b.total - a.total);
        setRevenueRanking(sorted);
      }

      // Profit ranking
      const { data: profitData } = await supabase
        .from('daily_results')
        .select(`
          user_id,
          profit,
          profiles!inner(full_name, avatar_url, status, role)
        `)
        .gte('date', monthStart)
        .eq('profiles.status', 'active')
        .eq('profiles.role', 'user');

      if (profitData) {
        const grouped = profitData.reduce((acc: Record<string, RankingEntry>, item: any) => {
          if (!acc[item.user_id]) {
            acc[item.user_id] = {
              userId: item.user_id,
              fullName: item.profiles.full_name,
              avatarUrl: item.profiles.avatar_url,
              total: 0,
            };
          }
          acc[item.user_id].total += item.profit || 0;
          return acc;
        }, {});

        const sorted = Object.values(grouped).sort((a, b) => b.total - a.total);
        setProfitRanking(sorted);
      }

      // Trophy ranking
      const { data: trophyData } = await supabase
        .from('user_trophies')
        .select(`
          user_id,
          profiles!inner(full_name, avatar_url, status, role)
        `)
        .eq('profiles.status', 'active')
        .eq('profiles.role', 'user');

      if (trophyData) {
        const grouped = trophyData.reduce((acc: Record<string, RankingEntry>, item: any) => {
          if (!acc[item.user_id]) {
            acc[item.user_id] = {
              userId: item.user_id,
              fullName: item.profiles.full_name,
              avatarUrl: item.profiles.avatar_url,
              total: 0,
              trophyCount: 0,
            };
          }
          acc[item.user_id].trophyCount = (acc[item.user_id].trophyCount || 0) + 1;
          return acc;
        }, {});

        const sorted = Object.values(grouped).sort((a, b) => (b.trophyCount || 0) - (a.trophyCount || 0));
        setTrophyRanking(sorted);
      }
    } catch (error) {
      console.error('Error fetching rankings:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('fr-FR') + ' FCFA';
  };

  const getMedalIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  };

  const myRevenueRank = revenueRanking.findIndex((e) => e.userId === user?.id) + 1;
  const myProfitRank = profitRanking.findIndex((e) => e.userId === user?.id) + 1;
  const myTrophyCount = trophyRanking.find((e) => e.userId === user?.id)?.trophyCount || 0;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </DashboardLayout>
    );
  }

  const RankingTable = ({ entries, type }: { entries: RankingEntry[]; type: 'revenue' | 'profit' | 'trophy' }) => (
    <div className="space-y-3">
      {entries.map((entry, index) => {
        const rank = index + 1;
        const isMe = entry.userId === user?.id;
        const medal = getMedalIcon(rank);

        return (
          <div
            key={entry.userId}
            className={cn(
              'flex items-center gap-4 rounded-lg border p-4 transition-colors',
              isMe && 'border-primary bg-primary/5'
            )}
          >
            <div className="flex w-12 items-center justify-center">
              {medal ? (
                <span className="text-3xl">{medal}</span>
              ) : (
                <span className="text-lg font-bold text-muted-foreground">#{rank}</span>
              )}
            </div>

            <Avatar className="h-12 w-12 border-2 border-primary/20">
              <AvatarImage src={entry.avatarUrl || ''} alt={entry.fullName} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {entry.fullName.charAt(0)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <p className="font-semibold">{entry.fullName}</p>
              {isMe && <Badge variant="outline" className="mt-1">Vous</Badge>}
            </div>

            <div className="text-right">
              <p className="text-lg font-bold text-primary">
                {type === 'trophy' ? `${entry.trophyCount || 0} trophées` : formatCurrency(entry.total)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">🏅 Classement Général</h1>
          <p className="text-muted-foreground">Comparez vos performances</p>
        </div>

        {/* My Position Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ma position CA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                #{myRevenueRank || '-'} sur {revenueRanking.length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ma position Bénéfice
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                #{myProfitRank || '-'} sur {profitRanking.length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Mes trophées
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{myTrophyCount} obtenus</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="revenue" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="revenue">💰 CA du mois</TabsTrigger>
            <TabsTrigger value="profit">💎 Bénéfice</TabsTrigger>
            <TabsTrigger value="trophies">👑 Hall of Fame</TabsTrigger>
          </TabsList>

          <TabsContent value="revenue">
            <Card>
              <CardHeader>
                <CardTitle>Meilleur CA du mois en cours</CardTitle>
              </CardHeader>
              <CardContent>
                {revenueRanking.length > 0 ? (
                  <RankingTable entries={revenueRanking} type="revenue" />
                ) : (
                  <p className="py-8 text-center text-muted-foreground">
                    Aucune donnée disponible pour ce mois
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profit">
            <Card>
              <CardHeader>
                <CardTitle>Meilleur bénéfice du mois</CardTitle>
              </CardHeader>
              <CardContent>
                {profitRanking.length > 0 ? (
                  <RankingTable entries={profitRanking} type="profit" />
                ) : (
                  <p className="py-8 text-center text-muted-foreground">
                    Aucune donnée disponible pour ce mois
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trophies">
            <Card>
              <CardHeader>
                <CardTitle>Les championnes aux trophées</CardTitle>
              </CardHeader>
              <CardContent>
                {trophyRanking.length > 0 ? (
                  <RankingTable entries={trophyRanking} type="trophy" />
                ) : (
                  <p className="py-8 text-center text-muted-foreground">
                    Aucun trophée obtenu pour le moment
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
