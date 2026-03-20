export interface Payment {
  id?: string;
  member_id?: string;
  member_name?: string;
  amount?: number;
  payment_date?: string;
  method?: string;
  status?: string;
  notes?: string;
  created_at?: string;
}
