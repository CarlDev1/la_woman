import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Camera, Loader2, Download, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function Profile() {
  const { user, profile, refreshProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [newAvatar, setNewAvatar] = useState<File | null>(null);
  const [newAvatarPreview, setNewAvatarPreview] = useState<string | null>(null);

  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('La photo ne doit pas dépasser 2 MB');
        return;
      }
      setNewAvatar(file);
      const reader = new FileReader();
      reader.onloadend = () => setNewAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);

    try {
      let avatarUrl = profile?.avatar_url;

      // Upload new avatar if selected
      if (newAvatar && user) {
        const avatarExt = newAvatar.name.split('.').pop();
        const avatarPath = `${user.id}/avatar.${avatarExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(avatarPath, newAvatar, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(avatarPath);

        avatarUrl = publicUrl;
      }

      // Update profile
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone,
          bio,
          avatar_url: avatarUrl,
        })
        .eq('id', user!.id);

      if (error) throw error;

      await refreshProfile();
      toast.success('Profil mis à jour avec succès');
      setEditing(false);
      setNewAvatar(null);
      setNewAvatarPreview(null);
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast.success('Mot de passe modifié avec succès');
      setPasswordDialogOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors du changement de mot de passe');
    } finally {
      setLoading(false);
    }
  };

  const downloadData = async () => {
    try {
      // Fetch all user data
      const { data: results } = await supabase
        .from('daily_results')
        .select('*')
        .eq('user_id', user!.id);

      const { data: trophies } = await supabase
        .from('user_trophies')
        .select('*, trophies(*)')
        .eq('user_id', user!.id);

      const userData = {
        profile,
        results,
        trophies,
        exportedAt: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mes-donnees-${format(new Date(), 'yyyy-MM-dd')}.json`;
      a.click();

      toast.success('Données téléchargées');
    } catch (error) {
      toast.error('Erreur lors du téléchargement');
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl space-y-8">
        <h1 className="text-3xl font-bold">👤 Mon Profil</h1>

        {/* Photo and Main Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informations personnelles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <div className="relative">
                <Avatar className="h-24 w-24 border-4 border-primary/20">
                  <AvatarImage src={newAvatarPreview || profile?.avatar_url || ''} alt={profile?.full_name} />
                  <AvatarFallback className="bg-primary/10 text-3xl text-primary">
                    {profile?.full_name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                {editing && (
                  <label
                    htmlFor="avatar-upload"
                    className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground"
                  >
                    <Camera className="h-4 w-4" />
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/jpeg,image/png"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div className="flex-1 space-y-4">
                {editing ? (
                  <>
                    <div>
                      <Label>Nom complet</Label>
                      <Input
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Téléphone</Label>
                      <Input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <h3 className="text-2xl font-bold">{profile?.full_name}</h3>
                      <p className="text-muted-foreground">{profile?.phone}</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline">
                        {user?.email} <span className="ml-1">✓</span>
                      </Badge>
                      <Badge>
                        Inscrite le {profile?.created_at && format(new Date(profile.created_at), 'dd MMM yyyy', { locale: fr })}
                      </Badge>
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Presentation */}
        <Card>
          <CardHeader>
            <CardTitle>Présentation de mon activité</CardTitle>
          </CardHeader>
          <CardContent>
            {editing ? (
              <>
                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  minLength={20}
                />
                <p className="mt-2 text-xs text-muted-foreground">{bio.length} caractères</p>
              </>
            ) : (
              <p className="text-muted-foreground">{profile?.bio}</p>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4">
          {editing ? (
            <>
              <Button onClick={handleSaveProfile} disabled={loading} className="bg-primary hover:bg-primary-hover">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Enregistrer
              </Button>
              <Button variant="outline" onClick={() => setEditing(false)} disabled={loading}>
                Annuler
              </Button>
            </>
          ) : (
            <Button onClick={() => setEditing(true)} className="bg-primary hover:bg-primary-hover">
              Modifier mon profil
            </Button>
          )}
        </div>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle>Sécurité</CardTitle>
          </CardHeader>
          <CardContent>
            <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">Changer mon mot de passe</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Changer le mot de passe</DialogTitle>
                  <DialogDescription>
                    Entrez votre nouveau mot de passe ci-dessous
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Nouveau mot de passe</Label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      minLength={6}
                    />
                  </div>
                  <div>
                    <Label>Confirmer le mot de passe</Label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      minLength={6}
                    />
                  </div>
                  <Button onClick={handleChangePassword} disabled={loading} className="w-full">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Changer le mot de passe
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Data */}
        <Card>
          <CardHeader>
            <CardTitle>Mes données</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" onClick={downloadData}>
              <Download className="mr-2 h-4 w-4" />
              Télécharger toutes mes données (JSON)
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
