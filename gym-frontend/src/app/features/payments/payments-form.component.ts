import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PaymentService } from './payments.service';

@Component({
  selector: 'app-payments-form',
  templateUrl: './payments-form.component.html'
})
export class PaymentFormComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  loading = false;
  members: any[] = [];

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
      amount: [payment?.amount || null, [Validators.required, Validators.min(0)]],
      payment_date: [payment?.payment_date ? new Date(payment.payment_date) : new Date(), Validators.required],
      method: [payment?.method || 'cash'],
      status: [payment?.status || 'paid'],
      notes: [payment?.notes || '']
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;

    const val = { ...this.form.value };
    if (val.payment_date instanceof Date) val.payment_date = val.payment_date.toISOString().slice(0, 10);

    const action = this.isEdit
      ? this.service.update(this.data.payment.id, val)
      : this.service.create(val);

    action.subscribe({
      next: () => {
        this.snackBar.open(this.isEdit ? 'Updated!' : 'Created!', 'Close', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.snackBar.open(err.error?.error || 'Error occurred', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  onCancel(): void { this.dialogRef.close(); }
}
