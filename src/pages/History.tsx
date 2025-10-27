import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase, DailyResult } from '@/lib/supabase';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, Trash2, Edit, Download } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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

export default function History() {
  const { user } = useAuth();
  const [results, setResults] = useState<DailyResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    if (user) {
      fetchResults();
    }
  }, [user, currentPage]);

  const fetchResults = async () => {
    if (!user) return;

    try {
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data, error, count } = await supabase
        .from('daily_results')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .range(from, to);

      if (error) throw error;

      setResults(data || []);
      setTotalPages(Math.ceil((count || 0) / ITEMS_PER_PAGE));
    } catch (error) {
      console.error('Error fetching results:', error);
      toast.error('Erreur lors du chargement des résultats');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from('daily_results')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;

      toast.success('Saisie supprimée');
      fetchResults();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la suppression');
    } finally {
      setDeleteId(null);
    }
  };

  const canModify = (date: string) => {
    const resultDate = new Date(date);
    const now = new Date();
    const diffHours = (now.getTime() - resultDate.getTime()) / (1000 * 60 * 60);
    return diffHours < 24;
  };

  const exportToCSV = () => {
    const headers = ['Date', 'CA', 'Bénéfice', 'Budget pub'];
    const rows = results.map((r) => [
      format(new Date(r.date), 'dd/MM/yyyy'),
      r.revenue,
      r.profit,
      r.ad_budget || 0,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historique_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('fr-FR') + ' FCFA';
  };

  const totalRevenue = results.reduce((sum, r) => sum + r.revenue, 0);
  const totalProfit = results.reduce((sum, r) => sum + r.profit, 0);
  const avgRevenue = results.length > 0 ? totalRevenue / results.length : 0;
  const bestDay = results.reduce((max, r) => (r.revenue > (max?.revenue || 0) ? r : max), results[0]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">📜 Historique complet</h1>
          <Button onClick={exportToCSV} variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Exporter CSV
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de saisies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{results.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                CA moyen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(avgRevenue)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Meilleur jour
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">
                {bestDay ? formatCurrency(bestDay.revenue) : '-'}
              </div>
              {bestDay && (
                <p className="text-xs text-muted-foreground">
                  {format(new Date(bestDay.date), 'dd MMM yyyy', { locale: fr })}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Bénéfice total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalProfit)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Results Table */}
        <Card>
          <CardHeader>
            <CardTitle>Toutes les saisies</CardTitle>
          </CardHeader>
          <CardContent>
            {results.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="pb-3 text-left text-sm font-medium text-muted-foreground">
                          Date
                        </th>
                        <th className="pb-3 text-left text-sm font-medium text-muted-foreground">
                          CA
                        </th>
                        <th className="pb-3 text-left text-sm font-medium text-muted-foreground">
                          Bénéfice
                        </th>
                        <th className="pb-3 text-left text-sm font-medium text-muted-foreground">
                          Budget pub
                        </th>
                        <th className="pb-3 text-center text-sm font-medium text-muted-foreground">
                          Capture
                        </th>
                        <th className="pb-3 text-center text-sm font-medium text-muted-foreground">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((result) => (
                        <tr key={result.id} className="border-b last:border-0">
                          <td className="py-3 text-sm">
                            {format(new Date(result.date), 'EEE dd MMM yyyy', { locale: fr })}
                          </td>
                          <td className="py-3 text-sm font-medium">
                            {formatCurrency(result.revenue)}
                          </td>
                          <td className="py-3 text-sm font-medium">
                            {formatCurrency(result.profit)}
                          </td>
                          <td className="py-3 text-sm">
                            {result.ad_budget ? formatCurrency(result.ad_budget) : '-'}
                          </td>
                          <td className="py-3 text-center">
                            {result.screenshot_url && (
                              <button
                                onClick={() => setSelectedImage(result.screenshot_url)}
                                className="text-primary hover:text-primary-hover"
                              >
                                <Camera className="mx-auto h-5 w-5" />
                              </button>
                            )}
                          </td>
                          <td className="py-3 text-center">
                            {canModify(result.date) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteId(result.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Page {currentPage} sur {totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        Précédent
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Suivant
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                Aucune saisie trouvée
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Image Preview Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Capture d'écran</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <img src={selectedImage} alt="Screenshot" className="w-full rounded-lg" />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette saisie ? Cette action est irréversible.
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
