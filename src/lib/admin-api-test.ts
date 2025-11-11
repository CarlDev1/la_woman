import { supabase } from "./supabase";

// Test function to debug the exact issue
export const testAdminTotals = async () => {
  // Test 1: Check if we have active users
  const { data: activeUsers, error: usersError } = await supabase
    .from("profiles")
    .select("id, full_name, email, status, role")
    .eq("status", "active")
    .eq("role", "user");

  if (!activeUsers || activeUsers.length === 0) {
    return { totalRevenue: 0, totalProfit: 0 };
  }

  // Test 2: Check daily_results for these users
  const userIds = activeUsers.map((u) => u.id);
  const { data: dailyResults, error: resultsError } = await supabase
    .from("daily_results")
    .select("*")
    .in("user_id", userIds);

  if (!dailyResults || dailyResults.length === 0) {
    return { totalRevenue: 0, totalProfit: 0 };
  }

  // Test 3: Calculate totals
  const totalRevenue = dailyResults.reduce((sum, entry) => {
    const revenue = entry.revenue || 0;
    return sum + revenue;
  }, 0);

  const totalProfit = dailyResults.reduce((sum, entry) => {
    const profit = entry.profit || 0;
    return sum + profit;
  }, 0);

  return { totalRevenue, totalProfit };
};
