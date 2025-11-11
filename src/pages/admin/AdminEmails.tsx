import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase, AdminEmail } from '@/lib/supabase';
import { Loader2, Mail, Plus, Trash2, Check, X } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminEmails() {
  const [emails, setEmails] = useState<AdminEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [toggling, setToggling] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadEmails();
  }, []);

  const loadEmails = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('admin_emails')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEmails(data || []);
    } catch (error) {
      toast.error('Erreur lors du chargement des emails');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newEmail.trim()) {
      toast.error('Veuillez entrer une adresse email');
      return;
    }

    // Validation basique de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail.trim())) {
      toast.error('Adresse email invalide');
      return;
    }

    try {
      setAdding(true);
      const { error } = await supabase
        .from('admin_emails')
        .insert({
          email: newEmail.trim().toLowerCase(),
          is_active: true,
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('Cette adresse email existe déjà');
        } else {
          throw error;
        }
        return;
      }

      toast.success('Email ajouté avec succès');
      setNewEmail('');
      await loadEmails();
    } catch (error) {
      toast.error('Erreur lors de l\'ajout de l\'email');
    } finally {
      setAdding(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      setToggling(id);
      const { error } = await supabase
        .from('admin_emails')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast.success(`Email ${!currentStatus ? 'activé' : 'désactivé'}`);
      await loadEmails();
    } catch (error) {
      toast.error('Erreur lors de la modification');
    } finally {
      setToggling(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet email ?')) {
      return;
    }

    try {
      setDeleting(id);
      const { error } = await supabase
        .from('admin_emails')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Email supprimé');
      await loadEmails();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    } finally {
      setDeleting(null);
    }
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

  const activeEmails = emails.filter(e => e.is_active);
  const inactiveEmails = emails.filter(e => !e.is_active);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des emails admin</h1>
          <p className="text-gray-600 mt-2">
            Configurez les adresses email qui recevront les notifications d'inscription
          </p>
        </div>

        {/* Add Email Form */}
        <Card>
          <CardHeader>
            <CardTitle>Ajouter un email</CardTitle>
            <CardDescription>
              Les emails ajoutés recevront les notifications de nouvelles inscriptions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddEmail} className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="newEmail" className="sr-only">
                  Nouvelle adresse email
                </Label>
                <Input
                  id="newEmail"
                  type="email"
                  placeholder="admin@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  disabled={adding}
                />
              </div>
              <Button type="submit" disabled={adding}>
                {adding ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Ajout...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Active Emails */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Emails actifs ({activeEmails.length})
            </CardTitle>
            <CardDescription>
              Ces emails recevront les notifications de nouvelles inscriptions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activeEmails.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Aucun email actif. Ajoutez un email pour recevoir les notifications.
              </div>
            ) : (
              <div className="space-y-2">
                {activeEmails.map((email) => (
                  <div
                    key={email.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-gray-400" />
                      <span className="font-medium">{email.email}</span>
                      <Badge variant="default" className="bg-green-500">
                        Actif
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(email.id, email.is_active)}
                        disabled={toggling === email.id}
                      >
                        {toggling === email.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <X className="mr-2 h-4 w-4" />
                            Désactiver
                          </>
                        )}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(email.id)}
                        disabled={deleting === email.id}
                      >
                        {deleting === email.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Supprimer
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Inactive Emails */}
        {inactiveEmails.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Emails désactivés ({inactiveEmails.length})
              </CardTitle>
              <CardDescription>
                Ces emails ne recevront pas les notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {inactiveEmails.map((email) => (
                  <div
                    key={email.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 opacity-60"
                  >
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-gray-400" />
                      <span className="font-medium">{email.email}</span>
                      <Badge variant="secondary">Inactif</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(email.id, email.is_active)}
                        disabled={toggling === email.id}
                      >
                        {toggling === email.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            Activer
                          </>
                        )}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(email.id)}
                        disabled={deleting === email.id}
                      >
                        {deleting === email.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Supprimer
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}

