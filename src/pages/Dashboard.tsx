import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { DailyResult, supabase } from "@/lib/supabase";
import { format, subMonths } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Camera,
  DollarSign,
  Loader2,
  PiggyBank,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

type Stats = {
  totalRevenue: number;
  totalProfit: number;
  avgRevenuePerMonth: number;
  avgProfitPerMonth: number;
};

type MonthlyData = {
  month: string;
  revenue: number;
  profit: number;
};

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalRevenue: 0,
    totalProfit: 0,
    avgRevenuePerMonth: 0,
    avgProfitPerMonth: 0,
  });
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [recentResults, setRecentResults] = useState<DailyResult[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedImagePath, setSelectedImagePath] = useState<string | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isSigningUrl, setIsSigningUrl] = useState(false);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  useEffect(() => {
    if (selectedImagePath) {
      const getSignedUrl = async () => {
        setIsSigningUrl(true);
        setSignedUrl(null);
        try {
          const { data, error } = await supabase.storage
            .from("screenshots")
            .createSignedUrl(selectedImagePath, 3600);

          if (error) throw error;

          setSignedUrl(data.signedUrl);
        } catch (error) {
          toast.error(`Erreur de génération de lien: ${error.message}`);
          setSelectedImagePath(null);
        } finally {
          setIsSigningUrl(false);
        }
      };
      getSignedUrl();
    }
  }, [selectedImagePath]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      const { data: allResults } = await supabase
        .from("daily_results")
        .select("*")
        .eq("user_id", user.id)
        .order("result_date", { ascending: true });

      if (allResults && allResults.length > 0) {
        const totalRevenue = allResults.reduce((sum, r) => sum + (r.revenue || 0), 0);
        const totalProfit = allResults.reduce((sum, r) => sum + (r.profit || 0), 0);

        const firstDate = new Date(allResults[0].result_date);
        const monthsSinceStart = Math.max(
          1,
          Math.ceil((Date.now() - firstDate.getTime()) / (1000 * 60 * 60 * 24 * 30))
        );

        setStats({
          totalRevenue,
          totalProfit,
          avgRevenuePerMonth: totalRevenue / monthsSinceStart,
          avgProfitPerMonth: totalProfit / monthsSinceStart,
        });

        const sixMonthsAgo = subMonths(new Date(), 6);
        const recentData = allResults.filter((r) => new Date(r.result_date) >= sixMonthsAgo);

        const grouped = recentData.reduce((acc: Record<string, MonthlyData>, item) => {
          const monthKey = format(new Date(item.result_date), "MMM yyyy", { locale: fr });
          if (!acc[monthKey]) {
            acc[monthKey] = { month: monthKey, revenue: 0, profit: 0 };
          }
          acc[monthKey].revenue += item.revenue || 0;
          acc[monthKey].profit += item.profit || 0;
          return acc;
        }, {});

        setMonthlyData(Object.values(grouped));
      }

      const { data: recent } = await supabase
        .from("daily_results")
        .select("*")
        .eq("user_id", user.id)
        .order("result_date", { ascending: false })
        .limit(5);

      setRecentResults(recent || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString("fr-FR") + " FCFA";
  };

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
        <div>
          <h1 className="text-3xl font-bold">Tableau de bord</h1>
          <p className="text-muted-foreground">
            Bienvenue, {profile?.full_name} 👋
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="animate-fade-in hover-lift">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                CA Total Cumulé
              </CardTitle>
              <div className="rounded-lg bg-primary/10 p-2">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            </CardContent>
          </Card>

          <Card className="animate-fade-in hover-lift" style={{ animationDelay: "0.1s" }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Bénéfice Total
              </CardTitle>
              <div className="rounded-lg bg-primary/10 p-2">
                <PiggyBank className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalProfit)}</div>
            </CardContent>
          </Card>

          <Card className="animate-fade-in hover-lift" style={{ animationDelay: "0.2s" }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Moyenne CA/mois
              </CardTitle>
              <div className="rounded-lg bg-primary/10 p-2">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.avgRevenuePerMonth)}
              </div>
            </CardContent>
          </Card>

          <Card className="animate-fade-in hover-lift" style={{ animationDelay: "0.3s" }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Moyenne Bénéfice/mois
              </CardTitle>
              <div className="rounded-lg bg-primary/10 p-2">
                <TrendingDown className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.avgProfitPerMonth)}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle>Évolution des 6 derniers mois</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#FF69B4"
                    strokeWidth={3}
                    name="CA"
                    dot={{ fill: "#FF69B4" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="profit"
                    stroke="#FFB6C1"
                    strokeWidth={3}
                    name="Bénéfice"
                    dot={{ fill: "#FFB6C1" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-64 items-center justify-center text-muted-foreground">
                Aucune donnée disponible pour le graphique
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="animate-fade-in">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Mes 5 dernières saisies</CardTitle>
            <Button asChild variant="outline" size="sm">
              <Link to="/history">Voir tout</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentResults.length > 0 ? (
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
                    </tr>
                  </thead>
                  <tbody>
                    {recentResults.map((result) => (
                      <tr key={result.id} className="border-b last:border-0">
                        <td className="py-3 text-sm">
                          {format(new Date(result.result_date), "EEE dd MMM yyyy", { locale: fr })}
                        </td>
                        <td className="py-3 text-sm font-medium">
                          {formatCurrency(result.revenue)}
                        </td>
                        <td className="py-3 text-sm font-medium">
                          {formatCurrency(result.profit)}
                        </td>
                        <td className="py-3 text-sm">
                          {result.ad_budget ? formatCurrency(result.ad_budget) : "-"}
                        </td>
                        <td className="py-3 text-center">
                          {result.screenshot_url && (
                            <Camera
                              className="mx-auto h-5 w-5 cursor-pointer text-primary hover:text-primary-hover"
                              onClick={() => setSelectedImagePath(result.screenshot_url)}
                            />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <p className="mb-4 text-muted-foreground">
                  Vous n'avez pas encore de saisies
                </p>
                <Button asChild className="bg-primary hover:bg-primary-hover">
                  <Link to="/new-entry">Faire ma première saisie</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedImagePath} onOpenChange={() => setSelectedImagePath(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Capture d'écran</DialogTitle>
          </DialogHeader>
          <div className="flex min-h-[300px] items-center justify-center">
            {isSigningUrl && <Loader2 className="h-12 w-12 animate-spin" />}
            {!isSigningUrl && signedUrl && (
              <img src={signedUrl} alt="Screenshot" className="w-full rounded-lg" />
            )}
            {!isSigningUrl && !signedUrl && (
              <p className="text-destructive">
                Erreur lors du chargement de l'image.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
