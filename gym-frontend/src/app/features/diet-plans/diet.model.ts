export interface DietPlan {
  id?: string;
  member_id?: string;
  trainer_id?: string;
  calories?: number;
  meals?: any;
  notes?: string;
  start_date?: string;
  end_date?: string;
  member_name?: string;
  trainer_name?: string;
  created_at?: string;
}
