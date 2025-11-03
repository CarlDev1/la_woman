import { supabase } from './supabase';

// Test function to debug the exact issue
export const testAdminTotals = async () => {
  console.log('🧪 Testing admin totals calculation...');

  // Test 1: Check if we have active users
  const { data: activeUsers, error: usersError } = await supabase
    .from('profiles')
    .select('id, full_name, email, status, role')
    .eq('status', 'active')
    .eq('role', 'user');

  console.log('👥 Active users:', { 
    count: activeUsers?.length, 
    users: activeUsers,
    error: usersError 
  });

  if (!activeUsers || activeUsers.length === 0) {
    console.log('❌ No active users found!');
    return { totalRevenue: 0, totalProfit: 0 };
  }

  // Test 2: Check daily_results for these users
  const userIds = activeUsers.map(u => u.id);
  const { data: dailyResults, error: resultsError } = await supabase
    .from('daily_results')
    .select('*')
    .in('user_id', userIds);

  console.log('📊 Daily results:', { 
    count: dailyResults?.length, 
    results: dailyResults,
    error: resultsError 
  });

  if (!dailyResults || dailyResults.length === 0) {
    console.log('❌ No daily results found!');
    return { totalRevenue: 0, totalProfit: 0 };
  }

  // Test 3: Calculate totals
  const totalRevenue = dailyResults.reduce((sum, entry) => {
    const revenue = entry.revenue || 0;
    console.log(`Adding revenue: ${revenue}`);
    return sum + revenue;
  }, 0);

  const totalProfit = dailyResults.reduce((sum, entry) => {
    const profit = entry.profit || 0;
    console.log(`Adding profit: ${profit}`);
    return sum + profit;
  }, 0);

  console.log('💰 Final totals:', { totalRevenue, totalProfit });

  return { totalRevenue, totalProfit };
};
