import { useAuth } from '@/hooks/useAuth';
import { useTrophies } from '@/hooks/useTrophies';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';

export default function Trophies() {
  const { user } = useAuth();
  const { trophyProgresses, loading, error } = useTrophies(user?.id);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('fr-FR') + ' FCFA';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const obtainedCount = trophyProgresses.filter(t => t.obtained).length;
  const totalCount = trophyProgresses.length;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-12 w-12 animate-spin text-pink-500" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <p className="text-red-600">{error}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="mb-2 text-3xl font-bold gradient-text">🏆 Mes Trophées</h1>
          <p className="text-lg text-muted-foreground">
            {obtainedCount} trophée{obtainedCount > 1 ? 's' : ''} obtenu{obtainedCount > 1 ? 's' : ''} sur {totalCount}
          </p>
          <div className="mx-auto mt-4 max-w-md">
            <Progress value={(obtainedCount / totalCount) * 100} className="h-3" />
            <p className="mt-2 text-sm text-muted-foreground">
              {Math.round((obtainedCount / totalCount) * 100)}% complété
            </p>
          </div>
        </div>

        {/* Trophies Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {trophyProgresses.map((status, index) => (
            <Card
              key={status.trophy.id}
              className="animate-fade-in overflow-hidden hover-lift"
              style={{
                animationDelay: `${index * 0.1}s`,
                borderColor: status.obtained ? status.trophy.color : undefined
              }}
            >
              <CardHeader className="text-center">
                <div className="mb-4 text-6xl">{status.trophy.icon}</div>
                <CardTitle className="text-xl">{status.trophy.name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {status.trophy.description}
                </p>
              </CardHeader>
              <CardContent>
                {status.obtained ? (
                  <div className="space-y-2 text-center">
                    <Badge className="bg-green-500 text-white">
                      ✅ Obtenu
                    </Badge>
                    {status.lastObtainedDate && (
                      <p className="text-xs text-muted-foreground">
                        Le {formatDate(status.lastObtainedDate)}
                      </p>
                    )}
                    {status.currentValue > 0 && (
                      <p className="text-sm font-medium text-green-600">
                        {formatCurrency(status.currentValue)}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Badge variant="outline" className="w-full justify-center">
                      En cours
                    </Badge>
                    
                    {/* Trophées CA */}
                    {status.trophy.condition_type === 'revenue_total' && (
                      <>
                        <div className="space-y-1">
                          <Progress value={status.progress} className="h-2" />
                        </div>
                        <p className="text-center text-sm">
                          {formatCurrency(status.currentValue)} / {formatCurrency(status.trophy.condition_value)}
                        </p>
                        <p className="text-center text-xs text-muted-foreground">
                          {Math.round(status.progress)}% - Plus que {formatCurrency(status.trophy.condition_value - status.currentValue)}
                        </p>
                      </>
                    )}

                    {/* Reine du Mois */}
                    {status.trophy.condition_type === 'monthly_best_profit' && (
                      <div className="text-center">
                        <p className="text-sm font-medium">
                          Bénéfice ce mois : {formatCurrency(status.currentValue)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Soyez la meilleure du mois !
                        </p>
                      </div>
                    )}

                    {/* Championne 2025 */}
                    {status.trophy.condition_type === 'annual_2025' && (
                      <div className="text-center">
                        <p className="text-sm font-medium">
                          Bénéfice 2025 : {formatCurrency(status.currentValue)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Soyez la meilleure de 2025 !
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
