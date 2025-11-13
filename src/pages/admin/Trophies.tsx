import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  Award, 
  Loader2, 
  Play,
  UserCheck,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';
import { format, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ParticipantStats {
  id: string;
  full_name: string;
  email: string;
  profile_photo_url: string | null;
  total_revenue: number;
  trophy_count: number;
  last_trophy_date: string | null;
  eligible_trophies: string[];
}

interface TrophyAward {
  id: string;
  user_id: string;
  trophy_id: string;
  awarded_at: string;
  value_achieved: number;
  full_name: string;
  trophy_name: string;
  trophy_icon: string;
}

interface Trophy {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition_type: string;
  condition_value: number;
  color: string;
  auto_award: boolean;
}

interface ParticipantTrophy {
  id: string;
  full_name: string;
  email: string;
  profile_photo_url: string | null;
  revenue_90d: number;
  profit_90d: number;
  trophy_count: number;
  last_trophy_date: string | null;
  eligible_trophies: string[];
}

export default function AdminTrophies() {
  const [participants, setParticipants] = useState<ParticipantTrophy[]>([]);
  const [recentAwards, setRecentAwards] = useState<TrophyAward[]>([]);
  const [trophies, setTrophies] = useState<Trophy[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingAuto, setProcessingAuto] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedTrophy, setSelectedTrophy] = useState<string>('');
  const [manualValue, setManualValue] = useState<string>('');
  const [activeTab, setActiveTab] = useState('participants');
  const [eligibleCount, setEligibleCount] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchTrophies(),
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

  const fetchTrophies = async () => {
    const { data, error } = await supabase
      .from('trophies')
      .select('*')
      .order('condition_value', { ascending: true });

    if (error) {
      console.error('Error fetching trophies:', error);
      return;
    }
    setTrophies(data || []);
  };

  const fetchParticipants = async () => {
    const date90DaysAgo = subDays(new Date(), 90);

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

    const processedParticipants: ParticipantTrophy[] = (participants || []).map(participant => {
      const revenue90d = participant.daily_results?.reduce((sum: number, r: any) => sum + (r.revenue || 0), 0) || 0;
      const profit90d = participant.daily_results?.reduce((sum: number, r: any) => sum + (r.profit || 0), 0) || 0;
      
      return {
        id: participant.id,
        full_name: participant.full_name,
        email: participant.email,
        profile_photo_url: participant.profile_photo_url,
        revenue_90d: revenue90d,
        profit_90d: profit90d,
        trophy_count: participant.user_trophies?.length || 0,
        last_trophy_date: participant.user_trophies?.length 
          ? participant.user_trophies.reduce((latest: string, t: any) => 
              latest > t.awarded_at ? latest : t.awarded_at, '')
          : null,
        eligible_trophies: []
      };
    });

    setParticipants(processedParticipants);
  };

  const fetchRecentAwards = async () => {
    const { data, error } = await supabase
      .from('trophy_awards')
      .select(`
        id,
        user_id,
        trophy_id,
        awarded_at,
        value_achieved,
        profiles!inner(full_name),
        trophies!inner(name, icon)
      `)
      .order('awarded_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching recent awards:', error);
      return;
    }

    const formattedData = data.map((award: any) => ({
      id: award.id,
      user_id: award.user_id,
      trophy_id: award.trophy_id,
      awarded_at: award.awarded_at,
      value_achieved: award.value_achieved,
      full_name: award.profiles.full_name,
      trophy_name: award.trophies.name,
      trophy_icon: award.trophies.icon
    }));

    setRecentAwards(formattedData);
  };

  const processAutoAwards = async () => {
    setProcessingAuto(true);
    try {
      const { data, error } = await supabase.rpc('award_trophies_auto');
      
      if (error) throw error;
      
      toast.success(`${data.length} trophées attribués avec succès !`);
      
      // Recharger les données
      await Promise.all([
        fetchParticipants(),
        fetchRecentAwards()
      ]);
      
    } catch (err: any) {
      console.error('Erreur lors de l\'attribution automatique:', err);
      toast.error(err.message || 'Erreur lors de l\'attribution automatique');
    } finally {
      setProcessingAuto(false);
    }
  };

  const awardTrophy = async (userId: string, trophyId: string, valueAchieved: number, awardedBy: string) => {
    try {
      const { data, error } = await supabase
        .from('trophy_awards')
        .insert([
          {
            user_id: userId,
            trophy_id: trophyId,
            value_achieved: valueAchieved,
            awarded_by: awardedBy
          }
        ])
        .select();

      if (error) throw error;
      return data?.[0];
    } catch (error) {
      console.error('Error awarding trophy:', error);
      throw error;
    }
  };

  const handleManualAward = async () => {
    if (!selectedUser || !selectedTrophy) {
      toast.error('Veuillez sélectionner une participante et un trophée');
      return;
    }

    try {
      await awardTrophy(
        selectedUser, 
        selectedTrophy, 
        parseFloat(manualValue) || 0,
        'admin_manual'
      );
      
      toast.success('Trophée attribué avec succès !');
      
      // Recharger les données
      await Promise.all([
        fetchParticipants(),
        fetchRecentAwards()
      ]);
      
      // Réinitialiser les sélections
      setSelectedUser('');
      setSelectedTrophy('');
      setManualValue('');
      
    } catch (err: any) {
      console.error('Erreur lors de l\'attribution manuelle:', err);
      toast.error(err.message || 'Erreur lors de l\'attribution du trophée');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value).replace('XOF', 'FCFA');
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: fr });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-4 md:space-y-8">
        {/* Header */}
        <div className="px-1">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">🏆 Gestion des Trophées</h1>
          <p className="text-gray-600 mt-1 md:mt-2 text-sm md:text-base">
            Gérez les attributions de trophées et consultez les statistiques
          </p>
        </div>

        {/* Statistiques */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Participantes</p>
                  <p className="text-2xl font-bold">{participants.length}</p>
                </div>
                <div className="p-3 rounded-full bg-blue-100">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Trophées attribués</p>
                  <p className="text-2xl font-bold">
                    {participants.reduce((sum, p) => sum + p.trophy_count, 0)}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-green-100">
                  <Trophy className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Dernier trophée</p>
                  <p className="text-2xl font-bold">
                    {recentAwards.length > 0 
                      ? format(new Date(recentAwards[0].awarded_at), 'dd/MM/yyyy')
                      : 'Aucun'}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-yellow-100">
                  <Award className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Trophées disponibles</p>
                  <p className="text-2xl font-bold">{trophies.length}</p>
                </div>
                <div className="p-3 rounded-full bg-purple-100">
                  <Trophy className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Boutons d'action */}
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
          <Button 
            onClick={processAutoAwards}
            disabled={processingAuto || eligibleCount === 0}
            className="bg-green-600 hover:bg-green-700 w-full sm:w-auto text-sm md:text-base"
          >
            {processingAuto ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Traitement...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Attribution automatique
              </>
            )}
          </Button>

          <Button 
            variant="outline" 
            className="w-full sm:w-auto text-sm md:text-base"
            onClick={() => setActiveTab('manual')}
          >
            <UserCheck className="mr-2 h-4 w-4" />
            Attribution manuelle
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 md:space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-auto p-1">
            <TabsTrigger value="participants" className="text-xs md:text-sm py-2 md:py-3">
              <span className="hidden sm:inline">Participantes</span>
              <span className="sm:hidden">Users</span>
            </TabsTrigger>
            <TabsTrigger value="recent" className="text-xs md:text-sm py-2 md:py-3">
              <span className="hidden sm:inline">Dernières attributions</span>
              <span className="sm:hidden">Récents</span>
            </TabsTrigger>
            <TabsTrigger value="trophies" className="text-xs md:text-sm py-2 md:py-3">
              Trophées
            </TabsTrigger>
          </TabsList>

          <TabsContent value="participants" className="space-y-3 md:space-y-4">
            <div className="rounded-lg border">
              <div className="grid grid-cols-12 gap-4 p-4 font-medium border-b bg-gray-50">
                <div className="col-span-5">Participante</div>
                <div className="col-span-2 text-center">Trophées</div>
                <div className="col-span-2 text-center">Dernier</div>
                <div className="col-span-3 text-right">CA 90j</div>
              </div>
              
              {participants.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  Aucune participante trouvée
                </div>
              ) : (
                participants.map(participant => (
                  <div key={participant.id} className="grid grid-cols-12 gap-4 p-4 items-center border-b hover:bg-gray-50">
                    <div className="col-span-5 flex items-center space-x-3">
                      {participant.profile_photo_url ? (
                        <img 
                          src={participant.profile_photo_url} 
                          alt={participant.full_name}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-500">
                            {participant.full_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <div className="font-medium">{participant.full_name}</div>
                        <div className="text-sm text-gray-500">{participant.email}</div>
                      </div>
                    </div>
                    
                    <div className="col-span-2 text-center">
                      <Badge variant={participant.trophy_count > 0 ? 'default' : 'outline'}>
                        {participant.trophy_count}
                      </Badge>
                    </div>
                    
                    <div className="col-span-2 text-center text-sm text-gray-500">
                      {participant.last_trophy_date ? formatDate(participant.last_trophy_date) : '-'}
                    </div>
                    
                    <div className="col-span-3 text-right font-medium">
                      {formatCurrency(participant.revenue_90d)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="recent" className="space-y-3 md:space-y-4">
            <div className="grid gap-3 md:gap-4">
              {recentAwards.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Aucune attribution récente
                </div>
              ) : (
                recentAwards.map(award => (
                  <Card key={award.id}>
                    <CardContent className="p-3 md:p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                            <span className="text-lg">{award.trophy_icon}</span>
                          </div>
                          <div>
                            <p className="font-medium">{award.full_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {award.trophy_name}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(award.awarded_at), 'PPPp', { locale: fr })}
                          </p>
                          {award.value_achieved > 0 && (
                            <p className="text-sm font-medium">
                              {formatCurrency(award.value_achieved)}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="trophies">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {trophies.map((trophy) => (
                <Card key={trophy.id} className="relative overflow-hidden">
                  <div 
                    className="absolute top-0 left-0 h-1 w-full"
                    style={{ backgroundColor: trophy.color }}
                  />
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{trophy.name}</CardTitle>
                      <div className="text-2xl">{trophy.icon}</div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {trophy.description}
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Condition:</span>
                      <span className="font-medium">
                        {trophy.condition_type === 'revenue_total' 
                          ? `CA Total: ${formatCurrency(trophy.condition_value)}`
                          : trophy.condition_type === 'monthly_best_profit'
                            ? `Meilleur profit mensuel: ${formatCurrency(trophy.condition_value)}`
                            : trophy.condition_type === 'annual_2025'
                              ? `Objectif 2025: ${formatCurrency(trophy.condition_value)}`
                              : `${formatCurrency(trophy.condition_value)}`}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Attribution:</span>
                      <Badge variant={trophy.auto_award ? 'default' : 'outline'}>
                        {trophy.auto_award ? 'Automatique' : 'Manuelle'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="manual">
            <Card>
              <CardHeader>
                <CardTitle>Attribution manuelle d'un trophée</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Attribuez manuellement un trophée à une participante
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Participante</label>
                    <Select 
                      value={selectedUser} 
                      onValueChange={setSelectedUser}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une participante" />
                      </SelectTrigger>
                      <SelectContent>
                        {participants.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Trophée</label>
                    <Select 
                      value={selectedTrophy} 
                      onValueChange={setSelectedTrophy}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un trophée" />
                      </SelectTrigger>
                      <SelectContent>
                        {trophies
                          .filter(t => !t.auto_award)
                          .map((t) => (
                            <SelectItem key={t.id} value={t.id}>
                              <div className="flex items-center">
                                <span className="mr-2">{t.icon}</span>
                                {t.name}
                              </div>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Valeur (optionnel)
                    </label>
                    <input
                      type="number"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Valeur du critère"
                      value={manualValue}
                      onChange={(e) => setManualValue(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button 
                    onClick={handleManualAward}
                    disabled={!selectedUser || !selectedTrophy || processingAuto}
                  >
                    {processingAuto ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Traitement...
                      </>
                    ) : (
                      'Attribuer le trophée'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
