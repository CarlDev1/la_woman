import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Trophy, 
  Users, 
  Settings, 
  Award, 
  Loader2, 
  Plus,
  Play,
  UserCheck,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';
import { subDays, format } from 'date-fns';
import { fr } from 'date-fns/locale';

type TrophyDefinition = {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition_type: string;
  condition_value: number;
  color: string;
  auto_award: boolean;
};

type ParticipantTrophy = {
  id: string;
  full_name: string;
  email: string;
  profile_photo_url: string | null;
  trophy_count: number;
  last_trophy_date: string | null;
  current_90d_revenue: number;
  current_90d_profit: number;
  eligible_trophies: string[];
};

type TrophyAward = {
  id: string;
  user_id: string;
  trophy_id: string;
  awarded_at: string;
  awarded_by: string;
  value_achieved: number;
  full_name: string;
  trophy_name: string;
  trophy_icon: string;
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
    auto_award: true,
  },
  {
    id: 'bronze',
    name: 'Bronze Business',
    description: '10 millions de CA en 90 jours',
    icon: '🥉',
    condition_type: '90_days_revenue',
    condition_value: 10000000,
    color: '#CD7F32',
    auto_award: true,
  },
  {
    id: 'silver',
    name: 'Argent Impératrice',
    description: '30 millions de CA en 90 jours',
    icon: '🥈',
    condition_type: '90_days_revenue',
    condition_value: 30000000,
    color: '#C0C0C0',
    auto_award: true,
  },
  {
    id: 'gold',
    name: 'Or Conquérante',
    description: '50 millions de CA en 90 jours',
    icon: '🥇',
    condition_type: '90_days_revenue',
    condition_value: 50000000,
    color: '#FFD700',
    auto_award: true,
  },
  {
    id: 'star',
    name: 'Étoile Montante',
    description: '500K de bénéfice en 90 jours',
    icon: '🌟',
    condition_type: '90_days_profit',
    condition_value: 500000,
    color: '#FFC107',
    auto_award: true,
  },
  {
    id: 'diamond',
    name: 'Diamant Précieux',
    description: '1 million de bénéfice en 90 jours',
    icon: '💎',
    condition_type: '90_days_profit',
    condition_value: 1000000,
    color: '#00BCD4',
    auto_award: true,
  },
  {
    id: 'empress',
    name: 'Impératrice des Profits',
    description: '5 millions de bénéfice en 90 jours',
    icon: '👸',
    condition_type: '90_days_profit',
    condition_value: 5000000,
    color: '#9C27B0',
    auto_award: true,
  },
];

export default function AdminTrophies() {
  const [participants, setParticipants] = useState<ParticipantTrophy[]>([]);
  const [recentAwards, setRecentAwards] = useState<TrophyAward[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingAuto, setProcessingAuto] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedTrophy, setSelectedTrophy] = useState<string>('');
  const [manualValue, setManualValue] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchParticipants(),
        fetchRecentAwards()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const fetchParticipants = async () => {
    const date90DaysAgo = subDays(new Date(), 90);

    // Fetch participants with their 90-day stats
    const { data: participants, error } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        profile_photo_url,
        user_trophies(id, trophy_id, awarded_at),
        daily_results!inner(revenue, profit, result_date)
      `)
      .eq('status', 'active')
      .eq('role', 'user')
      .gte('daily_results.result_date', date90DaysAgo.toISOString().split('T')[0]);

    if (error) {
      console.error('Error fetching participants:', error);
      return;
    }

    const processedParticipants: ParticipantTrophy[] = participants?.map(participant => {
      const revenue90d = participant.daily_results?.reduce((sum: number, r: any) => sum + (r.revenue || 0), 0) || 0;
      const profit90d = participant.daily_results?.reduce((sum: number, r: any) => sum + (r.profit || 0), 0) || 0;
      
      const trophyCount = participant.user_trophies?.length || 0;
      const lastTrophyDate = participant.user_trophies?.length > 0 
        ? participant.user_trophies.sort((a: any, b: any) => new Date(b.awarded_at).getTime() - new Date(a.awarded_at).getTime())[0].awarded_at
        : null;

      // Check eligible trophies
      const eligibleTrophies: string[] = [];
      const existingTrophyIds = participant.user_trophies?.map((t: any) => t.trophy_id) || [];

      trophyDefinitions.forEach(trophy => {
        if (existingTrophyIds.includes(trophy.id)) return;

        if (trophy.condition_type === '90_days_revenue' && revenue90d >= trophy.condition_value) {
          eligibleTrophies.push(trophy.id);
        } else if (trophy.condition_type === '90_days_profit' && profit90d >= trophy.condition_value) {
          eligibleTrophies.push(trophy.id);
        }
      });

      return {
        id: participant.id,
        full_name: participant.full_name,
        email: participant.email,
        profile_photo_url: participant.profile_photo_url,
        trophy_count: trophyCount,
        last_trophy_date: lastTrophyDate,
        current_90d_revenue: revenue90d,
        current_90d_profit: profit90d,
        eligible_trophies: eligibleTrophies
      };
    }) || [];

    setParticipants(processedParticipants);
  };

  const fetchRecentAwards = async () => {
    const { data, error } = await supabase
      .from('user_trophies')
      .select(`
        id,
        user_id,
        trophy_id,
        awarded_at,
        awarded_by,
        value_achieved,
        profiles!inner(full_name)
      `)
      .order('awarded_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching recent awards:', error);
      return;
    }

    const processedAwards: TrophyAward[] = data?.map(award => {
      const trophy = trophyDefinitions.find(t => t.id === award.trophy_id);
      return {
        id: award.id,
        user_id: award.user_id,
        trophy_id: award.trophy_id,
        awarded_at: award.awarded_at,
        awarded_by: award.awarded_by,
        value_achieved: award.value_achieved,
        full_name: (award.profiles as any).full_name,
        trophy_name: trophy?.name || 'Trophée inconnu',
        trophy_icon: trophy?.icon || '🏆'
      };
    }) || [];

    setRecentAwards(processedAwards);
  };

  const processAutoAwards = async () => {
    setProcessingAuto(true);
    let awardedCount = 0;

    try {
      for (const participant of participants) {
        for (const trophyId of participant.eligible_trophies) {
          const trophy = trophyDefinitions.find(t => t.id === trophyId);
          if (!trophy || !trophy.auto_award) continue;

          let valueAchieved = 0;
          if (trophy.condition_type === '90_days_revenue') {
            valueAchieved = participant.current_90d_revenue;
          } else if (trophy.condition_type === '90_days_profit') {
            valueAchieved = participant.current_90d_profit;
          }

          await awardTrophy(participant.id, trophyId, valueAchieved, 'auto');
          awardedCount++;
        }
      }

      toast.success(`${awardedCount} trophée(s) attribué(s) automatiquement`);
      await fetchData();
    } catch (error) {
      console.error('Error processing auto awards:', error);
      toast.error('Erreur lors de l\'attribution automatique');
    } finally {
      setProcessingAuto(false);
    }
  };

  const awardTrophy = async (userId: string, trophyId: string, valueAchieved: number, awardedBy: string) => {
    const { error } = await supabase
      .from('user_trophies')
      .insert({
        user_id: userId,
        trophy_id: trophyId,
        awarded_at: new Date().toISOString(),
        awarded_by: awardedBy,
        value_achieved: valueAchieved
      });

    if (error) {
      throw error;
    }
  };

  const handleManualAward = async () => {
    if (!selectedUser || !selectedTrophy) {
      toast.error('Veuillez sélectionner un utilisateur et un trophée');
      return;
    }

    try {
      const value = manualValue ? parseInt(manualValue.replace(/\s/g, '')) : 0;
      await awardTrophy(selectedUser, selectedTrophy, value, 'manual');
      
      toast.success('Trophée attribué manuellement');
      setSelectedUser('');
      setSelectedTrophy('');
      setManualValue('');
      await fetchData();
    } catch (error) {
      console.error('Error awarding trophy manually:', error);
      toast.error('Erreur lors de l\'attribution manuelle');
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('fr-FR') + ' FCFA';
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMM yyyy à HH:mm', { locale: fr });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  const eligibleCount = participants.reduce((sum, p) => sum + p.eligible_trophies.length, 0);
  const totalTrophies = participants.reduce((sum, p) => sum + p.trophy_count, 0);

  return (
    <AdminLayout>
      <div className="space-y-4 md:space-y-8">
        {/* Header */}
        <div className="px-1">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">🏆 Gestion des Trophées</h1>
          <p className="text-gray-600 mt-1 md:mt-2 text-sm md:text-base">
            Attribution automatique et manuelle des récompenses
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
          <Card className="p-3 md:p-4">
            <CardHeader className="flex flex-row items-center justify-between pb-2 p-0 md:p-6 md:pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-gray-600 leading-tight">
                Trophées attribués
              </CardTitle>
              <Trophy className="h-4 w-4 text-yellow-600 flex-shrink-0" />
            </CardHeader>
            <CardContent className="p-0 md:p-6 md:pt-0">
              <div className="text-xl md:text-2xl font-bold">{totalTrophies}</div>
            </CardContent>
          </Card>

          <Card className="p-3 md:p-4">
            <CardHeader className="flex flex-row items-center justify-between pb-2 p-0 md:p-6 md:pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-gray-600 leading-tight">
                En attente d'attribution
              </CardTitle>
              <Award className="h-4 w-4 text-orange-600 flex-shrink-0" />
            </CardHeader>
            <CardContent className="p-0 md:p-6 md:pt-0">
              <div className="text-xl md:text-2xl font-bold">{eligibleCount}</div>
            </CardContent>
          </Card>

          <Card className="p-3 md:p-4">
            <CardHeader className="flex flex-row items-center justify-between pb-2 p-0 md:p-6 md:pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-gray-600 leading-tight">
                Participantes actives
              </CardTitle>
              <Users className="h-4 w-4 text-blue-600 flex-shrink-0" />
            </CardHeader>
            <CardContent className="p-0 md:p-6 md:pt-0">
              <div className="text-xl md:text-2xl font-bold">{participants.length}</div>
            </CardContent>
          </Card>

          <Card className="p-3 md:p-4">
            <CardHeader className="flex flex-row items-center justify-between pb-2 p-0 md:p-6 md:pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-gray-600 leading-tight">
                Types de trophées
              </CardTitle>
              <Settings className="h-4 w-4 text-purple-600 flex-shrink-0" />
            </CardHeader>
            <CardContent className="p-0 md:p-6 md:pt-0">
              <div className="text-xl md:text-2xl font-bold">{trophyDefinitions.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
          <Button 
            onClick={processAutoAwards}
            disabled={processingAuto || eligibleCount === 0}
            className="bg-green-600 hover:bg-green-700 w-full sm:w-auto text-sm md:text-base"
            size="sm"
          >
            {processingAuto ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span className="hidden sm:inline">Attribution en cours...</span>
                <span className="sm:hidden">En cours...</span>
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Attribuer automatiquement ({eligibleCount})</span>
                <span className="sm:hidden">Auto ({eligibleCount})</span>
              </>
            )}
          </Button>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto text-sm md:text-base" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Attribution manuelle</span>
                <span className="sm:hidden">Manuel</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-md mx-auto">
              <DialogHeader>
                <DialogTitle className="text-lg">Attribution manuelle de trophée</DialogTitle>
                <DialogDescription className="text-sm">
                  Attribuez un trophée spécifique à une participante
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="user-select" className="text-sm">Participante</Label>
                  <Select value={selectedUser} onValueChange={setSelectedUser}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Sélectionner une participante" />
                    </SelectTrigger>
                    <SelectContent>
                      {participants.map(participant => (
                        <SelectItem key={participant.id} value={participant.id}>
                          {participant.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="trophy-select" className="text-sm">Trophée</Label>
                  <Select value={selectedTrophy} onValueChange={setSelectedTrophy}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Sélectionner un trophée" />
                    </SelectTrigger>
                    <SelectContent>
                      {trophyDefinitions.map(trophy => (
                        <SelectItem key={trophy.id} value={trophy.id}>
                          {trophy.icon} {trophy.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="value" className="text-sm">Valeur atteinte (optionnel)</Label>
                  <Input
                    id="value"
                    value={manualValue}
                    onChange={(e) => setManualValue(e.target.value)}
                    placeholder="Ex: 15000000"
                    className="mt-1"
                  />
                </div>

                <Button onClick={handleManualAward} className="w-full">
                  Attribuer le trophée
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="participants" className="space-y-4 md:space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-auto p-1">
            <TabsTrigger value="participants" className="text-xs md:text-sm py-2 md:py-3">
              <span className="hidden sm:inline">Participantes</span>
              <span className="sm:hidden">Users</span>
            </TabsTrigger>
            <TabsTrigger value="recent" className="text-xs md:text-sm py-2 md:py-3">
              <span className="hidden sm:inline">Attributions récentes</span>
              <span className="sm:hidden">Récent</span>
            </TabsTrigger>
            <TabsTrigger value="definitions" className="text-xs md:text-sm py-2 md:py-3">
              <span className="hidden sm:inline">Définitions des trophées</span>
              <span className="sm:hidden">Types</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="participants" className="space-y-3 md:space-y-4">
            <div className="grid gap-3 md:gap-4">
              {participants.map(participant => (
                <Card key={participant.id}>
                  <CardContent className="p-4 md:p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
                      <div className="flex items-center space-x-3 md:space-x-4">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                          {participant.profile_photo_url ? (
                            <img 
                              src={participant.profile_photo_url} 
                              alt={participant.full_name}
                              className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover"
                            />
                          ) : (
                            <UserCheck className="h-5 w-5 md:h-6 md:w-6 text-gray-500" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-sm md:text-base truncate">{participant.full_name}</h3>
                          <p className="text-xs md:text-sm text-gray-600 truncate">{participant.email}</p>
                          <div className="flex flex-wrap gap-1 md:gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {participant.trophy_count} trophée{participant.trophy_count > 1 ? 's' : ''}
                            </Badge>
                            {participant.eligible_trophies.length > 0 && (
                              <Badge className="bg-orange-100 text-orange-800 text-xs">
                                {participant.eligible_trophies.length} éligible{participant.eligible_trophies.length > 1 ? 's' : ''}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-left md:text-right pl-13 md:pl-0">
                        <div className="text-xs md:text-sm text-gray-600">90 derniers jours</div>
                        <div className="font-medium text-sm md:text-base">CA: {formatCurrency(participant.current_90d_revenue)}</div>
                        <div className="font-medium text-sm md:text-base">Profit: {formatCurrency(participant.current_90d_profit)}</div>
                        {participant.last_trophy_date && (
                          <div className="text-xs text-gray-500 mt-1">
                            Dernier: {formatDate(participant.last_trophy_date)}
                          </div>
                        )}
                      </div>
                    </div>
                    {participant.eligible_trophies.length > 0 && (
                      <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t">
                        <div className="text-sm font-medium text-gray-700 mb-2">Trophées éligibles:</div>
                        <div className="flex flex-wrap gap-1 md:gap-2">
                          {participant.eligible_trophies.map(trophyId => {
                            const trophy = trophyDefinitions.find(t => t.id === trophyId);
                            return trophy ? (
                              <Badge key={trophyId} className="bg-green-100 text-green-800 text-xs">
                                {trophy.icon} <span className="hidden sm:inline">{trophy.name}</span>
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="recent" className="space-y-3 md:space-y-4">
            <div className="grid gap-3 md:gap-4">
              {recentAwards.map(award => (
                <Card key={award.id}>
                  <CardContent className="p-3 md:p-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
                      <div className="flex items-center space-x-3 md:space-x-4">
                        <div className="text-2xl md:text-3xl flex-shrink-0">{award.trophy_icon}</div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-sm md:text-base truncate">{award.full_name}</h3>
                          <p className="text-xs md:text-sm text-gray-600 truncate">{award.trophy_name}</p>
                          <div className="flex items-center gap-1 md:gap-2 mt-1 flex-wrap">
                            <Calendar className="h-3 w-3 text-gray-400 flex-shrink-0" />
                            <span className="text-xs text-gray-500">
                              {formatDate(award.awarded_at)}
                            </span>
                            <Badge variant={award.awarded_by === 'auto' ? 'default' : 'secondary'} className="text-xs">
                              {award.awarded_by === 'auto' ? 'Auto' : 'Manuel'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      {award.value_achieved > 0 && (
                        <div className="text-left md:text-right pl-11 md:pl-0">
                          <div className="font-medium text-sm md:text-base">{formatCurrency(award.value_achieved)}</div>
                          <div className="text-xs text-gray-500">Valeur atteinte</div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="definitions" className="space-y-3 md:space-y-4">
            <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {trophyDefinitions.map(trophy => (
                <Card key={trophy.id}>
                  <CardHeader className="text-center p-4 md:p-6">
                    <div className="text-3xl md:text-4xl mb-2">{trophy.icon}</div>
                    <CardTitle className="text-base md:text-lg">{trophy.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center p-4 md:p-6 pt-0">
                    <p className="text-xs md:text-sm text-gray-600 mb-3 leading-relaxed">{trophy.description}</p>
                    {trophy.condition_value > 0 && (
                      <p className="text-xs md:text-sm font-medium mb-3">
                        Objectif: {formatCurrency(trophy.condition_value)}
                      </p>
                    )}
                    <div className="flex justify-center gap-1 md:gap-2 flex-wrap">
                      <Badge 
                        variant={trophy.auto_award ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {trophy.auto_award ? 'Auto' : 'Manuel'}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className="text-xs"
                        style={{ borderColor: trophy.color, color: trophy.color }}
                      >
                        <span className="hidden sm:inline">{trophy.condition_type}</span>
                        <span className="sm:hidden">{trophy.condition_type.split('_')[0]}</span>
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
