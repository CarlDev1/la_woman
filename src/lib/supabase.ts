import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://liipnwgzssmglektzigx.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpaXBud2d6c3NtZ2xla3R6aWd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MTQ1NzMsImV4cCI6MjA3NzA5MDU3M30.U0arNeHiHbBQNbwE6GE5AJx6LaUCssHTIhENtXZm04M';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type AppRole = 'admin' | 'user';

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  bio: string | null;
  role: 'user' | 'admin';
  status: 'pending' | 'active' | 'inactive';
  profile_photo_url: string | null;
  activity_description: string | null;
  payment_proof_url: string | null;
  contract_url: string | null;
  created_at: string;
  updated_at: string;
};

// UserRole type removed - role is now directly in profiles table

export type DailyResult = {
  id: string;
  user_id: string;
  result_date: string;
  revenue: number;
  profit: number;
  ad_budget: number | null;
  screenshot_url: string;
  created_at: string;
};

export type Trophy = {
  id: string;
  name: string;
  emoji: string;
  description: string;
  type: 'revenue_90d' | 'profit_90d' | 'monthly_queen';
  threshold: number | null;
  created_at: string;
};

export type UserTrophy = {
  id: string;
  user_id: string;
  trophy_id: string;
  earned_at: string;
  value_achieved: number | null;
  period_start: string | null;
  period_end: string | null;
  created_at: string;
};

export type MonthlyQueen = {
  id: string;
  user_id: string;
  month: number;
  year: number;
  revenue: number;
  profit: number;
  created_at: string;
};

export type Notification = {
  id: string;
  user_id: string | null;
  type: 'account_approved' | 'account_rejected' | 'trophy_earned' | 'new_registration';
  title: string;
  message: string;
  is_read: boolean;
  email_sent: boolean;
  created_at: string;
};

export type Email = {
  id: string;
  to: string;
  subject: string;
  body: string;
  created_at: string;
};
