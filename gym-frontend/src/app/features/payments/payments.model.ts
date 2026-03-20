export interface Payment {
  id?: string;
  member_id?: string;
  member_name?: string;
  amount?: number;
  payment_date?: string;
  method?: string;
  status?: string;
  notes?: string;
  payment_type?: string;
  transaction_ref?: string;
  invoice_number?: string;
  due_date?: string;
  is_deleted?: boolean;
  deleted_at?: string;
  refund_reason?: string;
  refunded_at?: string;
  created_by?: string;
  updated_by?: string;
  created_at?: string;
  updated_at?: string;
}
