import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PaymentService } from './payments.service';

@Component({
  selector: 'app-promptpay-qr-dialog',
  template: `
    <h2 mat-dialog-title>PromptPay Payment</h2>

    <mat-dialog-content class="qr-content">
      <!-- Loading -->
      <div *ngIf="loading" class="qr-loading">
        <mat-icon class="spin">sync</mat-icon>
        <p>กำลังสร้าง QR Code...</p>
      </div>

      <!-- QR Code -->
      <div *ngIf="!loading && qrDataUrl" class="qr-body">
        <div class="qr-amount">฿{{ amount | number:'1.2-2' }}</div>
        <div class="qr-frame">
          <img [src]="qrDataUrl" alt="PromptPay QR Code" class="qr-image">
        </div>
        <div class="qr-label">สแกน QR ด้วยแอปธนาคาร</div>
        <div class="qr-id">PromptPay ID: {{ promptpayId }}</div>
        <div class="qr-member">สมาชิก: {{ memberName }}</div>

        <div class="qr-status" [class.confirmed]="confirmed">
          <mat-icon>{{ confirmed ? 'check_circle' : 'hourglass_empty' }}</mat-icon>
          <span>{{ confirmed ? 'ยืนยันการชำระเรียบร้อย!' : 'รอการชำระเงิน...' }}</span>
        </div>
      </div>

      <!-- Error -->
      <div *ngIf="!loading && errorMsg" class="qr-error">
        <mat-icon>error</mat-icon>
        <p>{{ errorMsg }}</p>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">{{ confirmed ? 'ปิด' : 'ยกเลิก' }}</button>
      <button mat-raised-button color="primary"
              *ngIf="!loading && qrDataUrl && !confirmed"
              (click)="confirmPayment()"
              [disabled]="confirming">
        <mat-icon>check</mat-icon>
        {{ confirming ? 'กำลังยืนยัน...' : 'ยืนยันรับชำระแล้ว' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .qr-content { text-align: center; min-width: 340px; padding: 8px 0; }
    .qr-loading { padding: 40px 0; }
    .qr-loading .spin { font-size: 40px; width: 40px; height: 40px; animation: spin 1s linear infinite; color: #e8003d; }
    @keyframes spin { from { transform: rotate(0) } to { transform: rotate(360deg) } }
    .qr-loading p { margin-top: 12px; color: #999; }
    .qr-body { display: flex; flex-direction: column; align-items: center; gap: 8px; }
    .qr-amount { font-size: 32px; font-weight: 900; color: #e8003d; }
    .qr-frame { background: #fff; padding: 12px; border-radius: 12px; display: inline-block; }
    .qr-image { width: 280px; height: 280px; display: block; }
    .qr-label { font-size: 14px; color: #999; margin-top: 4px; }
    .qr-id { font-size: 12px; color: #666; font-family: monospace; }
    .qr-member { font-size: 13px; color: #aaa; }
    .qr-status {
      margin-top: 12px; padding: 10px 20px; border-radius: 8px;
      display: flex; align-items: center; gap: 8px;
      background: rgba(234,179,8,.1); color: #eab308;
    }
    .qr-status.confirmed { background: rgba(34,197,94,.1); color: #22c55e; }
    .qr-error { padding: 30px 0; color: #e8003d; }
    .qr-error mat-icon { font-size: 40px; width: 40px; height: 40px; }
  `]
})
export class PromptpayQrDialogComponent implements OnInit {
  qrDataUrl: string = '';
  promptpayId: string = '';
  amount: number = 0;
  memberName: string = '';
  paymentId: string = '';
  loading = true;
  confirmed = false;
  confirming = false;
  errorMsg = '';

  constructor(
    private service: PaymentService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<PromptpayQrDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.amount = this.data.amount;
    this.memberName = this.data.memberName || '-';
    this.paymentId = this.data.paymentId;
    this.generateQR();
  }

  generateQR(): void {
    this.loading = true;
    this.service.generatePromptPayQR(this.amount).subscribe({
      next: (res) => {
        this.qrDataUrl = res.qr;
        this.promptpayId = res.promptpay_id;
        this.loading = false;
      },
      error: () => {
        this.errorMsg = 'ไม่สามารถสร้าง QR Code ได้';
        this.loading = false;
      }
    });
  }

  confirmPayment(): void {
    this.confirming = true;
    this.service.confirmPayment(this.paymentId).subscribe({
      next: () => {
        this.confirmed = true;
        this.confirming = false;
        this.snackBar.open('ยืนยันการชำระเรียบร้อย!', 'Close', { duration: 3000 });
      },
      error: (err) => {
        this.snackBar.open(err.error?.error || 'ยืนยันไม่สำเร็จ', 'Close', { duration: 3000 });
        this.confirming = false;
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close(this.confirmed);
  }
}
