import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PaymentService } from './payments.service';

@Component({
  selector: 'app-refund-dialog',
  template: `
    <h2 mat-dialog-title>คืนเงิน</h2>
    <mat-dialog-content>
      <div class="refund-info">
        <p><strong>สมาชิก:</strong> {{ data.payment.member_name }}</p>
        <p><strong>จำนวนเงิน:</strong> {{ data.payment.amount | number:'1.2-2' }} บาท</p>
        <p><strong>Invoice:</strong> {{ data.payment.invoice_number || '-' }}</p>
      </div>
      <mat-form-field appearance="outline" style="width:100%">
        <mat-label>เหตุผลการคืนเงิน</mat-label>
        <textarea matInput [(ngModel)]="refundReason" rows="3"
                  placeholder="ระบุเหตุผลการคืนเงิน..."></textarea>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close [disabled]="loading">ยกเลิก</button>
      <button mat-raised-button color="warn"
              (click)="confirmRefund()"
              [disabled]="!refundReason.trim() || loading">
        {{ loading ? 'กำลังดำเนินการ...' : 'ยืนยันคืนเงิน' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .refund-info { margin-bottom: 16px; }
    .refund-info p { margin: 4px 0; color: #cbd5e1; }
    .refund-info strong { color: #fff; }
  `]
})
export class RefundDialogComponent {
  refundReason = '';
  loading = false;

  constructor(
    private dialogRef: MatDialogRef<RefundDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { payment: any },
    private service: PaymentService,
    private snackBar: MatSnackBar
  ) {}

  confirmRefund(): void {
    this.loading = true;
    this.service.refundPayment(this.data.payment.id, this.refundReason.trim()).subscribe({
      next: () => {
        this.snackBar.open('คืนเงินสำเร็จ', 'Close', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.loading = false;
        const msg = err.error?.error || 'คืนเงินไม่สำเร็จ';
        this.snackBar.open(msg, 'Close', { duration: 3000 });
      }
    });
  }
}
