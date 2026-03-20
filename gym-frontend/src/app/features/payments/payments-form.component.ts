import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PaymentService } from './payments.service';

@Component({
  selector: 'app-payments-form',
  templateUrl: './payments-form.component.html',
  styles: [`
    .promptpay-hint {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 14px; border-radius: 8px;
      background: rgba(34,197,94,.08); color: #22c55e;
      font-size: 13px; border: 1px solid rgba(34,197,94,.2);
    }
    .promptpay-hint mat-icon { font-size: 20px; }
    .invoice-display {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 14px; border-radius: 8px;
      background: rgba(59,130,246,.08); color: #3b82f6;
      font-size: 13px; border: 1px solid rgba(59,130,246,.2);
      font-family: monospace;
    }
    .invoice-display mat-icon { font-size: 18px; }
  `]
})
export class PaymentFormComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  loading = false;
  members: any[] = [];
  isPromptPay = false;

  constructor(
    private fb: FormBuilder,
    private service: PaymentService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<PaymentFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.members = this.data?.members || [];
    const payment = this.data?.payment;
    this.isEdit = !!payment;

    this.form = this.fb.group({
      member_id: [payment?.member_id || '', Validators.required],
      amount: [payment?.amount || null, [Validators.required, Validators.min(1), Validators.max(999999)]],
      payment_date: [payment?.payment_date ? new Date(payment.payment_date) : new Date(), Validators.required],
      method: [payment?.method || 'cash'],
      status: [payment?.status || 'paid'],
      payment_type: [payment?.payment_type || 'membership_fee'],
      transaction_ref: [payment?.transaction_ref || ''],
      due_date: [payment?.due_date ? new Date(payment.due_date) : null],
      notes: [payment?.notes || '']
    });

    this.onMethodChange(this.form.value.method);

    // Auto-calculate due_date when payment_date changes (only for new payments)
    if (!this.isEdit) {
      this.autoDueDate();
      this.form.get('payment_date')!.valueChanges.subscribe(() => this.autoDueDate());
    }

    this.form.get('method')!.valueChanges.subscribe(m => this.onMethodChange(m));
  }

  autoDueDate(): void {
    const pd = this.form.get('payment_date')!.value;
    if (pd instanceof Date) {
      const due = new Date(pd);
      due.setDate(due.getDate() + 30);
      this.form.patchValue({ due_date: due });
    }
  }

  onMethodChange(method: string): void {
    this.isPromptPay = method === 'promptpay';
    if (this.isPromptPay && !this.isEdit) {
      this.form.patchValue({ status: 'pending' });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;

    const val = { ...this.form.value };
    if (val.payment_date instanceof Date) val.payment_date = val.payment_date.toISOString().slice(0, 10);
    if (val.due_date instanceof Date) val.due_date = val.due_date.toISOString().slice(0, 10);
    if (!val.due_date) delete val.due_date;
    if (!val.transaction_ref) delete val.transaction_ref;

    const action = this.isEdit
      ? this.service.update(this.data.payment.id, val)
      : this.service.create(val);

    action.subscribe({
      next: (result) => {
        this.snackBar.open(this.isEdit ? 'Updated!' : 'Created!', 'Close', { duration: 3000 });
        // Return result with promptpay flag for QR dialog
        if (this.isPromptPay && !this.isEdit) {
          const memberName = this.members.find(m => m.id === val.member_id)?.name || '-';
          this.dialogRef.close({ promptpay: true, payment: result, memberName });
        } else {
          this.dialogRef.close(true);
        }
      },
      error: (err) => {
        this.snackBar.open(err.error?.error || 'Error occurred', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  onCancel(): void { this.dialogRef.close(); }
}
