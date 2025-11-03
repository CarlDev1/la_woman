import { useAdminStats } from '@/hooks/useAdminStats';
import AdminLayout from '@/components/admin/AdminLayout';
import StatsCard from '@/components/admin/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, Clock, DollarSign, TrendingUp, Loader2 } from 'lucide-react';

const AdminDashboard = () => {
  const { stats, monthlyData, recentActivities, loading, error } = useAdminStats();

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="text-center text-red-600 p-8">
          <p>{error}</p>
        </div>
      </AdminLayout>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR').format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatMonth = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vue d'ensemble</h1>
          <p className="text-gray-600 mt-2">
            Tableau de bord administrateur - LA WOMAN
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Participantes actives"
            value={stats?.activeCount || 0}
            icon={Users}
            color="blue"
          />
          <StatsCard
            title="Inscriptions en attente"
            value={stats?.pendingCount || 0}
            icon={Clock}
            color="orange"
          />
          <StatsCard
            title="CA total global"
            value={`${formatCurrency(stats?.totalRevenue || 0)} FCFA`}
            icon={DollarSign}
            color="green"
          />
          <StatsCard
            title="Bénéfice total global"
            value={`${formatCurrency(stats?.totalProfit || 0)} FCFA`}
            icon={TrendingUp}
            color="pink"
          />
        </div>

        {/* Evolution Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Évolution des performances (12 derniers mois)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month" 
                    tickFormatter={formatMonth}
                  />
                  <YAxis 
                    tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                  />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      `${formatCurrency(value)} FCFA`,
                      name === 'total_revenue' ? 'CA' : 'Bénéfice'
                    ]}
                    labelFormatter={(label) => formatMonth(label)}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="total_revenue" 
                    stroke="#FF69B4" 
                    strokeWidth={2}
                    name="CA"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="total_profit" 
                    stroke="#FFB6C1" 
                    strokeWidth={2}
                    name="Bénéfice"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle>Dernières activités</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Aucune activité récente
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Date</th>
                        <th className="text-left py-2">Participante</th>
                        <th className="text-right py-2">CA</th>
                        <th className="text-right py-2">Bénéfice</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentActivities.map((activity, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="py-3 text-sm text-gray-600">
                            {formatDate(activity.date)}
                          </td>
                          <td className="py-3">
                            <div className="flex items-center gap-3">
                              {activity.photo_url ? (
                                <img
                                  src={activity.photo_url}
                                  alt={activity.full_name}
                                  className="h-8 w-8 rounded-full object-cover"
                                />
                              ) : (
                                <div className="h-8 w-8 rounded-full bg-pink-100 flex items-center justify-center">
                                  <span className="text-pink-600 text-sm font-medium">
                                    {activity.full_name.charAt(0)}
                                  </span>
                                </div>
                              )}
                              <span className="font-medium text-sm">
                                {activity.full_name}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 text-right text-sm font-medium text-green-600">
                            {formatCurrency(activity.revenue)} FCFA
                          </td>
                          <td className="py-3 text-right text-sm font-medium text-pink-600">
                            {formatCurrency(activity.profit)} FCFA
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
