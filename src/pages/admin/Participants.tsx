import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Users, 
  TrendingUp, 
  DollarSign,
  Award,
  Eye,
  ArrowUpDown,
  Search,
  Edit,
  UserCheck,
  UserX,
  Download,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

type ParticipantWithStats = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  profile_photo_url: string | null;
  status: string;
  role: string;
  activity_description: string | null;
  created_at: string;
  totalRevenue: number;
  totalProfit: number;
  entriesCount: number;
  trophiesCount: number;
  lastEntryDate?: string;
};

export default function AdminParticipants() {
  const [participants, setParticipants] = useState<ParticipantWithStats[]>([]);
  const [filteredParticipants, setFilteredParticipants] = useState<ParticipantWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedParticipant, setSelectedParticipant] = useState<ParticipantWithStats | null>(null);
  const [editingParticipant, setEditingParticipant] = useState<ParticipantWithStats | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof ParticipantWithStats;
    direction: 'asc' | 'desc';
  }>({ key: 'totalRevenue', direction: 'desc' });

  useEffect(() => {
    fetchParticipants();
  }, []);

  useEffect(() => {
    let filtered = participants;

    // Filter by search query
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter((p) =>
        p.full_name.toLowerCase().includes(searchLower) ||
        p.email.toLowerCase().includes(searchLower) ||
        p.phone.toLowerCase().includes(searchLower)
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }

    setFilteredParticipants(filtered);
  }, [searchQuery, statusFilter, participants]);

  const fetchParticipants = async () => {
    try {
      setLoading(true);
      
      // Fetch participants with their stats
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          email,
          phone,
          profile_photo_url,
          status,
          role,
          activity_description,
          created_at,
          daily_results(revenue, profit, result_date),
          user_trophies(id)
        `)
        .eq('role', 'user')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      const participantsWithStats: ParticipantWithStats[] = (profiles || []).map((profile: any) => {
        const results = profile.daily_results || [];
        const trophies = profile.user_trophies || [];
        
        const totalRevenue = results.reduce((sum: number, r: any) => sum + (r.revenue || 0), 0);
        const totalProfit = results.reduce((sum: number, r: any) => sum + (r.profit || 0), 0);
        
        const sortedResults = results.sort((a: any, b: any) => 
          new Date(b.result_date).getTime() - new Date(a.result_date).getTime()
        );

        return {
          id: profile.id,
          full_name: profile.full_name,
          email: profile.email,
          phone: profile.phone,
          profile_photo_url: profile.profile_photo_url,
          status: profile.status,
          role: profile.role,
          activity_description: profile.activity_description,
          created_at: profile.created_at,
          totalRevenue,
          totalProfit,
          entriesCount: results.length,
          trophiesCount: trophies.length,
          lastEntryDate: sortedResults[0]?.result_date,
        };
      });

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

  const toggleUserStatus = async (userId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', userId);

      if (error) throw error;

      toast.success(`Statut mis à jour vers ${newStatus}`);
      await fetchParticipants();
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('Erreur lors du changement de statut');
    }
  };

  const exportToCSV = () => {
    const headers = ['Nom', 'Email', 'Téléphone', 'Statut', 'CA Total', 'Bénéfice Total', 'Entrées', 'Trophées', 'Dernière entrée'];
    const csvData = filteredParticipants.map(p => [
      p.full_name,
      p.email,
      p.phone,
      p.status,
      p.totalRevenue,
      p.totalProfit,
      p.entriesCount,
      p.trophiesCount,
      p.lastEntryDate ? format(new Date(p.lastEntryDate), 'dd/MM/yyyy') : 'Aucune'
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `participantes_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('fr-FR') + ' FCFA';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Aucune';
    return format(new Date(dateString), 'dd MMM yyyy', { locale: fr });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Actif</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">En attente</Badge>;
      case 'inactive':
        return <Badge className="bg-red-100 text-red-800">Inactif</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const totalStats = {
    participants: participants.length,
    active: participants.filter(p => p.status === 'active').length,
    pending: participants.filter(p => p.status === 'pending').length,
    totalRevenue: participants.reduce((sum, p) => sum + p.totalRevenue, 0),
    totalProfit: participants.reduce((sum, p) => sum + p.totalProfit, 0),
    totalTrophies: participants.reduce((sum, p) => sum + p.trophiesCount, 0),
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

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">👥 Gestion des Participantes</h1>
            <p className="text-gray-600 mt-2">
              Vue d'ensemble et gestion des participantes
            </p>
          </div>
          <Button onClick={exportToCSV} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exporter CSV
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Participantes
              </CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStats.participants}</div>
              <p className="text-xs text-gray-500 mt-1">
                {totalStats.active} actives • {totalStats.pending} en attente
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                CA Total Global
              </CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalStats.totalRevenue)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Bénéfice Total Global
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalStats.totalProfit)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Trophées Attribués
              </CardTitle>
              <Award className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStats.totalTrophies}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Rechercher par nom, email ou téléphone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrer par statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="inactive">Inactif</SelectItem>
                </SelectContent>
              </Select>
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
                    <TableHead>Statut</TableHead>
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
                        CA Total
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
                      <TableCell colSpan={8} className="text-center py-12">
                        <Users className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                        <p className="text-gray-500">
                          {searchQuery || statusFilter !== 'all' ? 'Aucune participante trouvée' : 'Aucune participante'}
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredParticipants.map((participant) => (
                      <TableRow key={participant.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={participant.profile_photo_url || ''} />
                              <AvatarFallback>
                                {participant.full_name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{participant.full_name}</p>
                              <p className="text-sm text-gray-500">{participant.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(participant.status)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{participant.entriesCount}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(participant.totalRevenue)}
                        </TableCell>
                        <TableCell className="font-medium text-purple-600">
                          {formatCurrency(participant.totalProfit)}
                        </TableCell>
                        <TableCell>
                          {participant.trophiesCount > 0 ? (
                            <Badge className="bg-yellow-100 text-yellow-800">
                              <Award className="mr-1 h-3 w-3" />
                              {participant.trophiesCount}
                            </Badge>
                          ) : (
                            <span className="text-gray-400">0</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {formatDate(participant.lastEntryDate)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedParticipant(participant)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleUserStatus(participant.id, participant.status)}
                              className={participant.status === 'active' ? 'text-red-600' : 'text-green-600'}
                            >
                              {participant.status === 'active' ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                            </Button>
                          </div>
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
                <Avatar className="h-20 w-20">
                  <AvatarImage src={selectedParticipant.profile_photo_url || ''} />
                  <AvatarFallback className="text-2xl">
                    {selectedParticipant.full_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-2xl font-bold">{selectedParticipant.full_name}</h3>
                  <p className="text-gray-600">{selectedParticipant.email}</p>
                  <p className="text-gray-600">{selectedParticipant.phone}</p>
                  <div className="mt-2">
                    {getStatusBadge(selectedParticipant.status)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-gray-600">Activité</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{selectedParticipant.activity_description || 'Non renseignée'}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-gray-600">Inscrit(e) le</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{formatDate(selectedParticipant.created_at)}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-gray-600">CA Total</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-bold">{formatCurrency(selectedParticipant.totalRevenue)}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-gray-600">Bénéfice Total</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-bold text-purple-600">{formatCurrency(selectedParticipant.totalProfit)}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-gray-600">Nombre d'entrées</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-bold">{selectedParticipant.entriesCount}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-gray-600">Trophées</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-bold">{selectedParticipant.trophiesCount}</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-gray-600">Dernière entrée</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{formatDate(selectedParticipant.lastEntryDate)}</p>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
