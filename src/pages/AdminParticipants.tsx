import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useNavigate } from 'react-router-dom';
import { supabase, Profile, DailyResult } from '@/lib/supabase';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  TrendingUp, 
  DollarSign,
  Award,
  Eye,
  ArrowUpDown,
  Search
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type ParticipantWithStats = Profile & {
  email?: string;
  totalRevenue: number;
  totalProfit: number;
  entriesCount: number;
  trophiesCount: number;
  lastEntryDate?: string;
};

export default function AdminParticipants() {
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const [participants, setParticipants] = useState<ParticipantWithStats[]>([]);
  const [filteredParticipants, setFilteredParticipants] = useState<ParticipantWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedParticipant, setSelectedParticipant] = useState<ParticipantWithStats | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof ParticipantWithStats;
    direction: 'asc' | 'desc';
  }>({ key: 'totalRevenue', direction: 'desc' });

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      toast.error('Accès réservé aux administrateurs');
      navigate('/dashboard');
    }
  }, [isAdmin, roleLoading, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchParticipants();
    }
  }, [user, isAdmin]);

  useEffect(() => {
    const filtered = participants.filter((p) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        p.full_name.toLowerCase().includes(searchLower) ||
        p.email?.toLowerCase().includes(searchLower) ||
        p.phone.toLowerCase().includes(searchLower)
      );
    });
    setFilteredParticipants(filtered);
  }, [searchQuery, participants]);

  const fetchParticipants = async () => {
    try {
      setLoading(true);
      
      // Fetch all active users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch all daily results
      const { data: results } = await supabase
        .from('daily_results')
        .select('*');

      // Fetch all user trophies
      const { data: trophies } = await supabase
        .from('user_trophies')
        .select('user_id');

      // Combine data for each participant
      const participantsWithStats = await Promise.all(
        (profiles || []).map(async (profile) => {
          const userResults = (results || []).filter((r) => r.user_id === profile.id);
          const userTrophies = (trophies || []).filter((t) => t.user_id === profile.id);
          
          const totalRevenue = userResults.reduce((sum, r) => sum + (r.revenue || 0), 0);
          const totalProfit = userResults.reduce((sum, r) => sum + (r.profit || 0), 0);
          
          const sortedResults = userResults.sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          
          // Get email
          const { data: { user: authUser } } = await supabase.auth.admin.getUserById(profile.id);

          return {
            ...profile,
            email: authUser?.email,
            totalRevenue,
            totalProfit,
            entriesCount: userResults.length,
            trophiesCount: userTrophies.length,
            lastEntryDate: sortedResults[0]?.date,
          };
        })
      );

      setParticipants(participantsWithStats);
      setFilteredParticipants(participantsWithStats);
    } catch (error) {
      console.error('Error fetching participants:', error);
      toast.error('Erreur lors du chargement des participantes');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key: keyof ParticipantWithStats) => {
    const direction = sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({ key, direction });

    const sorted = [...filteredParticipants].sort((a, b) => {
      const aValue = a[key];
      const bValue = b[key];
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return direction === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return direction === 'asc' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      }
      
      return 0;
    });

    setFilteredParticipants(sorted);
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('fr-FR') + ' FCFA';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Aucune';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const totalStats = {
    participants: participants.length,
    totalRevenue: participants.reduce((sum, p) => sum + p.totalRevenue, 0),
    totalProfit: participants.reduce((sum, p) => sum + p.totalProfit, 0),
    totalTrophies: participants.reduce((sum, p) => sum + p.trophiesCount, 0),
  };

  if (roleLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </DashboardLayout>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Participantes</h1>
          <p className="text-muted-foreground">
            Gestion et statistiques des participantes actives
          </p>
        </div>

        {/* Global Stats Cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="animate-fade-in hover-lift">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Participantes
              </CardTitle>
              <div className="rounded-lg bg-primary/10 p-2">
                <Users className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStats.participants}</div>
            </CardContent>
          </Card>

          <Card className="animate-fade-in hover-lift" style={{ animationDelay: '0.1s' }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                CA Total
              </CardTitle>
              <div className="rounded-lg bg-primary/10 p-2">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalStats.totalRevenue)}</div>
            </CardContent>
          </Card>

          <Card className="animate-fade-in hover-lift" style={{ animationDelay: '0.2s' }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Bénéfice Total
              </CardTitle>
              <div className="rounded-lg bg-primary/10 p-2">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalStats.totalProfit)}</div>
            </CardContent>
          </Card>

          <Card className="animate-fade-in hover-lift" style={{ animationDelay: '0.3s' }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Trophées Totaux
              </CardTitle>
              <div className="rounded-lg bg-primary/10 p-2">
                <Award className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStats.totalTrophies}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search Bar */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, email ou téléphone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Participants Table */}
        <Card>
          <CardHeader>
            <CardTitle>Liste des participantes ({filteredParticipants.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Participante</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('entriesCount')}
                        className="h-8 gap-1"
                      >
                        Entrées
                        <ArrowUpDown className="h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('totalRevenue')}
                        className="h-8 gap-1"
                      >
                        CA
                        <ArrowUpDown className="h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('totalProfit')}
                        className="h-8 gap-1"
                      >
                        Bénéfice
                        <ArrowUpDown className="h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('trophiesCount')}
                        className="h-8 gap-1"
                      >
                        Trophées
                        <ArrowUpDown className="h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>Dernière entrée</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredParticipants.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12">
                        <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                        <p className="text-muted-foreground">
                          {searchQuery ? 'Aucune participante trouvée' : 'Aucune participante'}
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredParticipants.map((participant) => (
                      <TableRow key={participant.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border-2 border-primary/20">
                              <AvatarImage src={participant.avatar_url || ''} />
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {participant.full_name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{participant.full_name}</p>
                              <p className="text-sm text-muted-foreground">{participant.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{participant.entriesCount}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(participant.totalRevenue)}
                        </TableCell>
                        <TableCell className="font-medium text-primary">
                          {formatCurrency(participant.totalProfit)}
                        </TableCell>
                        <TableCell>
                          {participant.trophiesCount > 0 ? (
                            <Badge className="bg-primary/10 text-primary border-primary/20">
                              <Award className="mr-1 h-3 w-3" />
                              {participant.trophiesCount}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(participant.lastEntryDate)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedParticipant(participant)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Participant Details Dialog */}
      <Dialog open={!!selectedParticipant} onOpenChange={() => setSelectedParticipant(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails de la participante</DialogTitle>
            <DialogDescription>
              Informations complètes sur {selectedParticipant?.full_name}
            </DialogDescription>
          </DialogHeader>
          {selectedParticipant && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20 border-2 border-primary/20">
                  <AvatarImage src={selectedParticipant.avatar_url || ''} />
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                    {selectedParticipant.full_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-2xl font-bold">{selectedParticipant.full_name}</h3>
                  <p className="text-muted-foreground">{selectedParticipant.email}</p>
                  <p className="text-muted-foreground">{selectedParticipant.phone}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-muted-foreground">Bio</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{selectedParticipant.bio || 'Non renseignée'}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-muted-foreground">Statut</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="outline" className="bg-primary/10 text-primary">
                      {selectedParticipant.status}
                    </Badge>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-muted-foreground">CA Total</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-bold">{formatCurrency(selectedParticipant.totalRevenue)}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-muted-foreground">Bénéfice Total</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-bold text-primary">{formatCurrency(selectedParticipant.totalProfit)}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-muted-foreground">Nombre d'entrées</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-bold">{selectedParticipant.entriesCount}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-muted-foreground">Trophées</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-bold">{selectedParticipant.trophiesCount}</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-muted-foreground">Inscrit(e) le</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{formatDate(selectedParticipant.created_at)}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-muted-foreground">Dernière entrée</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{formatDate(selectedParticipant.lastEntryDate)}</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
