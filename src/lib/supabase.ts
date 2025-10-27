import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://liipnwgzssmglektzigx.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpaXBud2d6c3NtZ2xla3R6aWd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MTQ1NzMsImV4cCI6MjA3NzA5MDU3M30.U0arNeHiHbBQNbwE6GE5AJx6LaUCssHTIhENtXZm04M';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  full_name: string;
  phone: string;
  bio: string;
  avatar_url: string | null;
  payment_proof_url: string | null;
  contract_url: string | null;
  role: 'user' | 'admin';
  status: 'pending' | 'active' | 'inactive';
  created_at: string;
  updated_at: string;
};

export type DailyResult = {
  id: string;
  user_id: string;
  date: string;
  revenue: number;
  profit: number;
  ad_budget: number | null;
  screenshot_url: string | null;
  created_at: string;
};

export type Trophy = {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition_type: 'monthly_best' | '90_days_revenue' | '90_days_profit';
  condition_value: number;
  color: string;
  created_at: string;
};

export type UserTrophy = {
  id: string;
  user_id: string;
  trophy_id: string;
  obtained_at: string;
  value_achieved: number;
};
