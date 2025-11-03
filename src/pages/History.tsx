import DashboardLayout from "@/components/DashboardLayout";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { DailyResult, supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Camera, Download, Loader2, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function History() {
  const { user } = useAuth();
  const [results, setResults] = useState<DailyResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const ITEMS_PER_PAGE = 20;

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isSigningUrl, setIsSigningUrl] = useState(false);

  useEffect(() => {
    if (user) {
      fetchResults();
    }
  }, [user, currentPage]);

  useEffect(() => {
    if (selectedImage) {
      const getSignedUrl = async () => {
        setIsSigningUrl(true);
        setSignedUrl(null);
        try {
          const { data, error } = await supabase.storage
            .from("screenshots")
            .createSignedUrl(selectedImage, 3600);

          if (error) throw error;

          setSignedUrl(data.signedUrl);
        } catch (error) {
          toast.error(`Erreur de génération de lien: ${error.message}`);
          setSelectedImage(null);
        } finally {
          setIsSigningUrl(false);
        }
      };
      getSignedUrl();
    }
  }, [selectedImage]);

  const fetchResults = async () => {
    if (!user) return;

    try {
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data, error, count } = await supabase
        .from("daily_results")
        .select("*", { count: "exact" })
        .eq("user_id", user.id)
        .order("result_date", { ascending: false })
        .range(from, to);

      if (error) throw error;

      setResults(data || []);
      setTotalPages(Math.ceil((count || 0) / ITEMS_PER_PAGE));
    } catch (error) {
      console.error("Error fetching results:", error);
      toast.error("Erreur lors du chargement des résultats");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const resultToDelete = results.find((r) => r.id === deleteId);
      if (resultToDelete?.screenshot_url) {
        await supabase.storage
          .from("screenshots")
          .remove([resultToDelete.screenshot_url]);
      }

      const { error } = await supabase
        .from("daily_results")
        .delete()
        .eq("id", deleteId);

      if (error) throw error;

      toast.success("Saisie supprimée");
      fetchResults();
    } catch (error) {
      toast.error(error.message || "Erreur lors de la suppression");
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
    const headers = ["Date", "CA", "Bénéfice", "Budget pub"];
    const rows = results.map((r) => [
      format(new Date(r.result_date), "dd/MM/yyyy"),
      r.revenue,
      r.profit,
      r.ad_budget || 0,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `historique_${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString("fr-FR") + " FCFA";
  };

  const totalRevenue = results.reduce((sum, r) => sum + r.revenue, 0);
  const totalProfit = results.reduce((sum, r) => sum + r.profit, 0);
  const avgRevenue = results.length > 0 ? totalRevenue / results.length : 0;
  const bestDay = results.reduce(
    (max, r) => (r.revenue > (max?.revenue || 0) ? r : max),
    results[0]
  );

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
                {bestDay ? formatCurrency(bestDay.revenue) : "-"}
              </div>
              {bestDay && (
                <p className="text-xs text-muted-foreground">
                  {format(new Date(bestDay.result_date), "dd MMM yyyy", {
                    locale: fr,
                  })}
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
                            {format(
                              new Date(result.result_date),
                              "EEE dd MMM yyyy",
                              { locale: fr }
                            )}
                          </td>
                          <td className="py-3 text-sm font-medium">
                            {formatCurrency(result.revenue)}
                          </td>
                          <td className="py-3 text-sm font-medium">
                            {formatCurrency(result.profit)}
                          </td>
                          <td className="py-3 text-sm">
                            {result.ad_budget
                              ? formatCurrency(result.ad_budget)
                              : "-"}
                          </td>
                          <td className="py-3 text-center">
                            {result.screenshot_url && (
                              <button
                                onClick={() =>
                                  // MODIFIÉ: On stocke le CHEMIN
                                  setSelectedImage(result.screenshot_url)
                                }
                                className="text-primary hover:text-primary-hover"
                              >
                                <Camera className="mx-auto h-5 w-5" />
                              </button>
                            )}
                          </td>
                          <td className="py-3 text-center">
                            {canModify(result.result_date) && (
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
                        onClick={() =>
                          setCurrentPage((p) => Math.max(1, p - 1))
                        }
                        disabled={currentPage === 1}
                      >
                        Précédent
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage((p) => Math.min(totalPages, p + 1))
                        }
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

      {/* MODIFIÉ: Tout le Dialog d'image a été mis à jour */}
      <Dialog
        open={!!selectedImage}
        onOpenChange={() => setSelectedImage(null)}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Capture d'écran</DialogTitle>
          </DialogHeader>
          <div className="flex min-h-[300px] items-center justify-center">
            {isSigningUrl && <Loader2 className="h-12 w-12 animate-spin" />}
            {!isSigningUrl && signedUrl && (
              <img
                src={signedUrl}
                alt="Screenshot"
                className="w-full rounded-lg"
              />
            )}
            {!isSigningUrl && !signedUrl && (
              <p className="text-destructive">
                Erreur lors du chargement de l'image.
              </p>
            )}
          </div>
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
