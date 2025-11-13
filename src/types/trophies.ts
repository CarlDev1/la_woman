export type TrophyConditionType = 
  | 'revenue_total'      // CA total cumulatif
  | 'monthly_best_profit' // Meilleur bénéfice du mois
  | 'annual_2025';        // Meilleur bénéfice 2025

export interface Trophy {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition_type: TrophyConditionType;
  condition_value: number;
  color: string;
  auto_award: boolean;
  created_at?: string;
}

export interface UserTrophy {
  id: string;
  user_id: string;
  trophy_id: string;
  awarded_at: string;
  value_achieved: number;
  trophy?: Trophy;
}

export interface TrophyProgress {
  trophy: Trophy;
  obtained: boolean;
  obtainedCount: number;
  lastObtainedDate?: string;
  currentValue: number;
  progress: number;
}
