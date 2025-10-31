import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useNavigate } from 'react-router-dom';
import { supabase, Trophy } from '@/lib/supabase';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Award, 
  Plus, 
  Pencil, 
  Trash2,
  Trophy as TrophyIcon
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type TrophyFormData = {
  name: string;
  description: string;
  icon: string;
  condition_type: 'monthly_best' | '90_days_revenue' | '90_days_profit';
  condition_value: number;
  color: string;
};

const TROPHY_ICONS = ['🏆', '👑', '💎', '⭐', '🎖️', '🥇', '🥈', '🥉', '🌟', '✨'];
const TROPHY_COLORS = {
  gold: 'hsl(var(--gold))',
  silver: 'hsl(var(--silver))',
  bronze: 'hsl(var(--bronze))',
  diamond: 'hsl(var(--diamond))',
  star: 'hsl(var(--star))',
  royal: 'hsl(var(--royal))',
};

export default function AdminTrophies() {
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const [trophies, setTrophies] = useState<Trophy[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTrophy, setEditingTrophy] = useState<Trophy | null>(null);
  const [deletingTrophy, setDeletingTrophy] = useState<Trophy | null>(null);
  const [formData, setFormData] = useState<TrophyFormData>({
    name: '',
    description: '',
    icon: '🏆',
    condition_type: 'monthly_best',
    condition_value: 0,
    color: 'gold',
  });

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      toast.error('Accès réservé aux administrateurs');
      navigate('/dashboard');
    }
  }, [isAdmin, roleLoading, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchTrophies();
    }
  }, [user, isAdmin]);

  const fetchTrophies = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('trophies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTrophies(data || []);
    } catch (error) {
      console.error('Error fetching trophies:', error);
      toast.error('Erreur lors du chargement des trophées');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (trophy?: Trophy) => {
    if (trophy) {
      setEditingTrophy(trophy);
      setFormData({
        name: trophy.name,
        description: trophy.description,
        icon: trophy.icon,
        condition_type: trophy.condition_type,
        condition_value: trophy.condition_value,
        color: trophy.color,
      });
    } else {
      setEditingTrophy(null);
      setFormData({
        name: '',
        description: '',
        icon: '🏆',
        condition_type: 'monthly_best',
        condition_value: 0,
        color: 'gold',
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingTrophy(null);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.description || !formData.condition_value) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    try {
      if (editingTrophy) {
        // Update existing trophy
        const { error } = await supabase
          .from('trophies')
          .update(formData)
          .eq('id', editingTrophy.id);

        if (error) throw error;
        toast.success('Trophée mis à jour avec succès');
      } else {
        // Create new trophy
        const { error } = await supabase
          .from('trophies')
          .insert([formData]);

        if (error) throw error;
        toast.success('Trophée créé avec succès');
      }

      handleCloseDialog();
      fetchTrophies();
    } catch (error) {
      console.error('Error saving trophy:', error);
      toast.error('Erreur lors de l\'enregistrement du trophée');
    }
  };

  const handleDelete = async () => {
    if (!deletingTrophy) return;

    try {
      const { error } = await supabase
        .from('trophies')
        .delete()
        .eq('id', deletingTrophy.id);

      if (error) throw error;
      
      toast.success('Trophée supprimé avec succès');
      setDeletingTrophy(null);
      fetchTrophies();
    } catch (error) {
      console.error('Error deleting trophy:', error);
      toast.error('Erreur lors de la suppression du trophée');
    }
  };

  const getConditionTypeLabel = (type: string) => {
    switch (type) {
      case 'monthly_best':
        return 'Meilleure du mois';
      case '90_days_revenue':
        return 'CA sur 90 jours';
      case '90_days_profit':
        return 'Bénéfice sur 90 jours';
      default:
        return type;
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text">Trophées</h1>
            <p className="text-muted-foreground">
              Gestion des trophées et récompenses
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()} className="gap-2">
            <Plus className="h-4 w-4" />
            Créer un trophée
          </Button>
        </div>

        {/* Trophy Stats */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="animate-fade-in hover-lift">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de trophées
              </CardTitle>
              <div className="rounded-lg bg-primary/10 p-2">
                <Award className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{trophies.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Trophies Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {trophies.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <TrophyIcon className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">Aucun trophée créé</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => handleOpenDialog()}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Créer votre premier trophée
                </Button>
              </CardContent>
            </Card>
          ) : (
            trophies.map((trophy, index) => (
              <Card 
                key={trophy.id} 
                className="animate-fade-in hover-lift"
                style={{ 
                  animationDelay: `${index * 0.1}s`,
                  borderColor: trophy.color,
                }}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="flex h-12 w-12 items-center justify-center rounded-lg text-2xl"
                        style={{ backgroundColor: `${trophy.color}20` }}
                      >
                        {trophy.icon}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{trophy.name}</CardTitle>
                        <CardDescription className="text-xs">
                          {getConditionTypeLabel(trophy.condition_type)}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{trophy.description}</p>
                  
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Condition</p>
                    <p className="text-sm font-bold">
                      {trophy.condition_type === 'monthly_best' 
                        ? 'Être la meilleure du mois'
                        : `${formatCurrency(trophy.condition_value)}`
                      }
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleOpenDialog(trophy)}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Modifier
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeletingTrophy(trophy)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingTrophy ? 'Modifier le trophée' : 'Créer un nouveau trophée'}
            </DialogTitle>
            <DialogDescription>
              Définissez les caractéristiques du trophée
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du trophée</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Reine du Commerce"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Décrivez ce trophée..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="icon">Icône</Label>
                <Select
                  value={formData.icon}
                  onValueChange={(value) => setFormData({ ...formData, icon: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TROPHY_ICONS.map((icon) => (
                      <SelectItem key={icon} value={icon}>
                        <span className="text-xl">{icon}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Couleur</Label>
                <Select
                  value={formData.color}
                  onValueChange={(value) => setFormData({ ...formData, color: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TROPHY_COLORS).map(([name, color]) => (
                      <SelectItem key={name} value={color}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="h-4 w-4 rounded-full border" 
                            style={{ backgroundColor: color }}
                          />
                          <span className="capitalize">{name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="condition_type">Type de condition</Label>
              <Select
                value={formData.condition_type}
                onValueChange={(value: any) => setFormData({ ...formData, condition_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly_best">Meilleure du mois</SelectItem>
                  <SelectItem value="90_days_revenue">CA sur 90 jours</SelectItem>
                  <SelectItem value="90_days_profit">Bénéfice sur 90 jours</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.condition_type !== 'monthly_best' && (
              <div className="space-y-2">
                <Label htmlFor="condition_value">Valeur requise (FCFA)</Label>
                <Input
                  id="condition_value"
                  type="number"
                  value={formData.condition_value}
                  onChange={(e) => setFormData({ ...formData, condition_value: Number(e.target.value) })}
                  placeholder="Ex: 1000000"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Annuler
            </Button>
            <Button onClick={handleSubmit}>
              {editingTrophy ? 'Mettre à jour' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingTrophy} onOpenChange={() => setDeletingTrophy(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce trophée ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer "{deletingTrophy?.name}" ? 
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
