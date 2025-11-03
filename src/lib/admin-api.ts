import { supabase } from './supabase';

export interface AdminStats {
  activeCount: number;
  pendingCount: number;
  totalRevenue: number;
  totalProfit: number;
}

export interface MonthlyData {
  month: string;
  total_revenue: number;
  total_profit: number;
}

export interface RecentActivity {
  date: string;
  revenue: number;
  profit: number;
  full_name: string;
  photo_url: string | null;
}

export interface ParticipantWithStats {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  photo_url: string | null;
  status: string;
  created_at: string;
  total_revenue: number;
  total_profit: number;
  trophy_count: number;
}

export const getAdminStats = async (): Promise<AdminStats> => {
  // Fetch active count
  const { count: activeCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .eq('role', 'user');

  // Fetch pending count
  const { count: pendingCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')
    .eq('role', 'user');

  // Fetch total revenue and profit from daily_results
  const { data: entries, error: entriesError } = await supabase
    .from('daily_results')
    .select(`
      revenue,
      profit,
      profiles!inner(status, role)
    `)
    .eq('profiles.status', 'active')
    .eq('profiles.role', 'user');

  let totalRevenue = 0;
  let totalProfit = 0;

  if (entriesError) {
    console.error('Error fetching daily_results:', entriesError);
  } else if (entries && entries.length > 0) {
    totalRevenue = entries.reduce((sum, entry) => sum + (entry.revenue || 0), 0);
    totalProfit = entries.reduce((sum, entry) => sum + (entry.profit || 0), 0);
  }

  return {
    activeCount: activeCount || 0,
    pendingCount: pendingCount || 0,
    totalRevenue,
    totalProfit
  };
};

export const getMonthlyData = async (): Promise<MonthlyData[]> => {
  // Fallback: fetch data directly from daily_results and group by month
  const { data, error } = await supabase
    .from('daily_results')
    .select(`
      result_date,
      revenue,
      profit,
      profiles!inner(status, role)
    `)
    .eq('profiles.status', 'active')
    .eq('profiles.role', 'user')
    .gte('result_date', new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    .order('result_date', { ascending: true });

  if (error) {
    console.error('Error fetching monthly data:', error);
    return [];
  }

  // Group by month
  const monthlyMap = new Map<string, { total_revenue: number; total_profit: number }>();
  
  data?.forEach(entry => {
    const monthKey = entry.result_date.substring(0, 7); // YYYY-MM format
    const existing = monthlyMap.get(monthKey) || { total_revenue: 0, total_profit: 0 };
    monthlyMap.set(monthKey, {
      total_revenue: existing.total_revenue + entry.revenue,
      total_profit: existing.total_profit + entry.profit
    });
  });

  return Array.from(monthlyMap.entries()).map(([month, data]) => ({
    month,
    total_revenue: data.total_revenue,
    total_profit: data.total_profit
  }));
};

export const getRecentActivities = async (): Promise<RecentActivity[]> => {
  const { data, error } = await supabase
    .from('daily_results')
    .select(`
      result_date,
      revenue,
      profit,
      profiles!inner(
        full_name,
        profile_photo_url,
        status,
        role
      )
    `)
    .eq('profiles.status', 'active')
    .eq('profiles.role', 'user')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching recent activities:', error);
    return [];
  }

  return data?.map((entry: any) => ({
    date: entry.result_date,
    revenue: entry.revenue,
    profit: entry.profit,
    full_name: entry.profiles.full_name,
    photo_url: entry.profiles.profile_photo_url
  })) || [];
};

export const getPendingUsers = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('status', 'pending')
    .eq('role', 'user')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching pending users:', error);
    return [];
  }

  return data || [];
};

export const getAllParticipants = async (
  search: string = '',
  statusFilter: string = 'all',
  sortField: string = 'created_at',
  sortOrder: 'asc' | 'desc' = 'desc'
): Promise<ParticipantWithStats[]> => {
  let query = supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      email,
      phone,
      profile_photo_url,
      status,
      created_at,
      daily_results(revenue, profit),
      trophies(id)
    `)
    .eq('role', 'user');

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  if (statusFilter !== 'all') {
    query = query.eq('status', statusFilter);
  }

  const { data, error } = await query.order(sortField, { ascending: sortOrder === 'asc' });

  if (error) {
    console.error('Error fetching participants:', error);
    return [];
  }

  return data?.map(participant => ({
    ...participant,
    photo_url: participant.profile_photo_url,
    total_revenue: participant.daily_results?.reduce((sum: number, entry: any) => sum + entry.revenue, 0) || 0,
    total_profit: participant.daily_results?.reduce((sum: number, entry: any) => sum + entry.profit, 0) || 0,
    trophy_count: participant.trophies?.length || 0,
    daily_results: undefined,
    trophies: undefined,
    profile_photo_url: undefined
  })) || [];
};

export const validateUser = async (userId: string) => {
  const { error } = await supabase
    .from('profiles')
    .update({ 
      status: 'active', 
      updated_at: new Date().toISOString() 
    })
    .eq('id', userId);

  if (error) {
    throw new Error('Erreur lors de la validation');
  }
};

export const rejectUser = async (userId: string) => {
  const { error } = await supabase
    .from('profiles')
    .update({ 
      status: 'inactive', 
      updated_at: new Date().toISOString() 
    })
    .eq('id', userId);

  if (error) {
    throw new Error('Erreur lors du refus');
  }
};

export const toggleUserStatus = async (userId: string, currentStatus: string) => {
  const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
  
  const { error } = await supabase
    .from('profiles')
    .update({ 
      status: newStatus,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId);

  if (error) {
    throw new Error('Erreur lors du changement de statut');
  }

  return newStatus;
};

export const updateParticipant = async (
  userId: string,
  updates: {
    full_name: string;
    phone: string;
    activity_description: string;
    role: string;
    status: string;
  }
) => {
  const { error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId);

  if (error) {
    throw new Error('Erreur lors de la mise à jour');
  }
};

export const downloadFile = async (bucket: string, path: string, filename: string) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .download(path);

  if (error) {
    throw new Error('Erreur lors du téléchargement');
  }

  const blob = new Blob([data]);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
