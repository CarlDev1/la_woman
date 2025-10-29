import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useNavigate } from 'react-router-dom';
import { supabase, Profile } from '@/lib/supabase';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Award,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Download,
  UserCheck,
  UserX
} from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type PendingUser = Profile & {
  email?: string;
};

type GlobalStats = {
  totalUsers: number;
  activeUsers: number;
  pendingUsers: number;
  totalRevenue: number;
  totalProfit: number;
  totalTrophies: number;
};

export default function Admin() {
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [activeUsers, setActiveUsers] = useState<Profile[]>([]);
  const [globalStats, setGlobalStats] = useState<GlobalStats>({
    totalUsers: 0,
    activeUsers: 0,
    pendingUsers: 0,
    totalRevenue: 0,
    totalProfit: 0,
    totalTrophies: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [viewDocuments, setViewDocuments] = useState<PendingUser | null>(null);

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      toast.error('Accès réservé aux administrateurs');
      navigate('/dashboard');
    }
  }, [isAdmin, roleLoading, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchAdminData();
    }
  }, [user, isAdmin]);

  const fetchAdminData = async () => {
    try {
      // Fetch pending users
      const { data: pending } = await supabase
        .from('profiles')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      // Get emails for pending users
      const pendingWithEmails = await Promise.all(
        (pending || []).map(async (profile) => {
          const { data: { user: authUser } } = await supabase.auth.admin.getUserById(profile.id);
          return {
            ...profile,
            email: authUser?.email,
          };
        })
      );

      setPendingUsers(pendingWithEmails);

      // Fetch active users
      const { data: active } = await supabase
        .from('profiles')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      setActiveUsers(active || []);

      // Fetch global statistics
      const { data: allProfiles } = await supabase
        .from('profiles')
        .select('*');

      const { data: allResults } = await supabase
        .from('daily_results')
        .select('revenue, profit');

      const { data: allTrophies } = await supabase
        .from('user_trophies')
        .select('id');

      const totalRevenue = (allResults || []).reduce((sum, r) => sum + (r.revenue || 0), 0);
      const totalProfit = (allResults || []).reduce((sum, r) => sum + (r.profit || 0), 0);

      setGlobalStats({
        totalUsers: allProfiles?.length || 0,
        activeUsers: active?.length || 0,
        pendingUsers: pending?.length || 0,
        totalRevenue,
        totalProfit,
        totalTrophies: allTrophies?.length || 0,
      });
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async () => {
    if (!selectedUser || !actionType) return;

    try {
      const newStatus = actionType === 'approve' ? 'active' : 'inactive';
      
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', selectedUser.id);

      if (error) throw error;

      toast.success(
        actionType === 'approve' 
          ? `${selectedUser.full_name} a été approuvé(e)` 
          : `${selectedUser.full_name} a été rejeté(e)`
      );
      
      fetchAdminData();
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Erreur lors de la mise à jour du statut');
    } finally {
      setSelectedUser(null);
      setActionType(null);
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('fr-FR') + ' FCFA';
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
          <h1 className="text-3xl font-bold">Administration</h1>
          <p className="text-muted-foreground">
            Gestion des inscriptions et statistiques globales
          </p>
        </div>

        {/* Global Stats Cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="animate-fade-in hover-lift">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Utilisateurs Total
              </CardTitle>
              <div className="rounded-lg bg-primary/10 p-2">
                <Users className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{globalStats.totalUsers}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {globalStats.activeUsers} actifs, {globalStats.pendingUsers} en attente
              </p>
            </CardContent>
          </Card>

          <Card className="animate-fade-in hover-lift" style={{ animationDelay: '0.1s' }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                CA Global
              </CardTitle>
              <div className="rounded-lg bg-primary/10 p-2">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(globalStats.totalRevenue)}</div>
            </CardContent>
          </Card>

          <Card className="animate-fade-in hover-lift" style={{ animationDelay: '0.2s' }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Bénéfice Global
              </CardTitle>
              <div className="rounded-lg bg-primary/10 p-2">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(globalStats.totalProfit)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Pending and Active Users */}
        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList>
            <TabsTrigger value="pending" className="relative">
              En attente
              {globalStats.pendingUsers > 0 && (
                <Badge className="ml-2 h-5 min-w-5 rounded-full bg-primary px-1.5 text-xs">
                  {globalStats.pendingUsers}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="active">Utilisateurs actifs</TabsTrigger>
          </TabsList>

          {/* Pending Users Tab */}
          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Inscriptions en attente de validation</CardTitle>
              </CardHeader>
              <CardContent>
                {pendingUsers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Clock className="mb-4 h-12 w-12 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      Aucune inscription en attente
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12 border-2 border-primary/20">
                            <AvatarImage src={user.avatar_url || ''} alt={user.full_name} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {user.full_name?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold">{user.full_name}</h3>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                            <p className="text-sm text-muted-foreground">{user.phone}</p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setViewDocuments(user)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Documents
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user);
                              setActionType('approve');
                            }}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Approuver
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user);
                              setActionType('reject');
                            }}
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Rejeter
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Active Users Tab */}
          <TabsContent value="active">
            <Card>
              <CardHeader>
                <CardTitle>Utilisateurs actifs ({globalStats.activeUsers})</CardTitle>
              </CardHeader>
              <CardContent>
                {activeUsers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <UserCheck className="mb-4 h-12 w-12 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      Aucun utilisateur actif
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12 border-2 border-primary/20">
                            <AvatarImage src={user.avatar_url || ''} alt={user.full_name} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {user.full_name?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold">{user.full_name}</h3>
                            <p className="text-sm text-muted-foreground">{user.phone}</p>
                            <Badge variant="outline" className="mt-1">
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Actif
                            </Badge>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setViewDocuments(user)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Voir profil
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user);
                              setActionType('reject');
                            }}
                          >
                            <UserX className="mr-2 h-4 w-4" />
                            Désactiver
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!selectedUser && !!actionType} onOpenChange={() => {
        setSelectedUser(null);
        setActionType(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === 'approve' ? 'Approuver l\'inscription' : 'Rejeter l\'inscription'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === 'approve' 
                ? `Êtes-vous sûr de vouloir approuver ${selectedUser?.full_name} ? L'utilisateur pourra accéder à l'application.`
                : `Êtes-vous sûr de vouloir rejeter ${selectedUser?.full_name} ? L'utilisateur ne pourra pas accéder à l'application.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleUserAction}>
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Documents View Dialog */}
      <AlertDialog open={!!viewDocuments} onOpenChange={() => setViewDocuments(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Documents de {viewDocuments?.full_name}</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-4 pt-4">
                <div>
                  <p className="font-medium">Bio:</p>
                  <p className="text-sm">{viewDocuments?.bio || 'Non renseignée'}</p>
                </div>
                <div>
                  <p className="font-medium">Téléphone:</p>
                  <p className="text-sm">{viewDocuments?.phone}</p>
                </div>
                {viewDocuments?.payment_proof_url && (
                  <div>
                    <p className="font-medium mb-2">Preuve de paiement:</p>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <a href={viewDocuments.payment_proof_url} target="_blank" rel="noopener noreferrer">
                        <Download className="mr-2 h-4 w-4" />
                        Télécharger
                      </a>
                    </Button>
                  </div>
                )}
                {viewDocuments?.contract_url && (
                  <div>
                    <p className="font-medium mb-2">Contrat:</p>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <a href={viewDocuments.contract_url} target="_blank" rel="noopener noreferrer">
                        <Download className="mr-2 h-4 w-4" />
                        Télécharger
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Fermer</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
