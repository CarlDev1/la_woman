import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  LogOut, 
  Crown, 
  Mail, 
  Phone, 
  Calendar,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function AdminProfile() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Déconnexion réussie');
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Erreur lors de la déconnexion');
    }
  };

  if (!profile) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">👤 Profil Administrateur</h1>
          <p className="text-gray-600 mt-2">
            Informations de votre compte administrateur
          </p>
        </div>

        {/* Profile Card */}
        <Card className="max-w-2xl">
          <CardHeader>
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile.profile_photo_url || ''} />
                <AvatarFallback className="text-2xl bg-pink-100 text-pink-600">
                  {profile.full_name?.charAt(0) || 'A'}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold">{profile.full_name}</h2>
                  <Badge className="bg-pink-100 text-pink-800 border-pink-200">
                    <Crown className="mr-1 h-3 w-3" />
                    Administrateur
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="h-4 w-4" />
                  <span>{profile.email}</span>
                </div>
                {profile.phone && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="h-4 w-4" />
                    <span>{profile.phone}</span>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-gray-600 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Rôle
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">Administrateur</p>
                  <p className="text-sm text-gray-500">Accès complet à la plateforme</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-gray-600 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Membre depuis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">
                    {format(new Date(profile.created_at), 'dd MMMM yyyy', { locale: fr })}
                  </p>
                </CardContent>
              </Card>
            </div>

            {profile.activity_description && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-gray-600">Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{profile.activity_description}</p>
                </CardContent>
              </Card>
            )}

            <div className="pt-6 border-t">
              <Button 
                onClick={handleLogout}
                variant="destructive"
                className="w-full md:w-auto"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Se déconnecter
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-600">Plateforme</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-bold text-pink-600">LA WOMAN</p>
              <p className="text-sm text-gray-500">Administration</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-600">Statut</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge className="bg-green-100 text-green-800">
                Actif
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-600">Version</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-bold">v1.0</p>
              <p className="text-sm text-gray-500">Interface admin</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
