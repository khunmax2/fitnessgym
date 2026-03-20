import { Component, OnInit } from '@angular/core';
import { MemberService } from '../member.service';

@Component({
  selector: 'app-my-payments',
  templateUrl: './my-payments.component.html',
  styleUrls: ['./my-payments.component.scss']
})
export class MyPaymentsComponent implements OnInit {
  loading = false;
  payments: any[] = [];

  get totalPaid(): number {
    return this.payments.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0);
  }
  get pendingCount(): number {
    return this.payments.filter(p => p.status === 'pending').length;
  }

  constructor(private memberService: MemberService) {}

  ngOnInit(): void {
    this.loading = true;
    this.memberService.getMyPayments().subscribe({
      next: (data) => { this.payments = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  getMethodLabel(m: string): string {
    const map: Record<string, string> = {
      cash: 'เงินสด', transfer: 'โอนเงิน',
      credit_card: 'บัตรเครดิต', promptpay: 'PromptPay'
    };
    return map[m] || m;
  }

  getStatusLabel(s: string): string {
    const m: Record<string, string> = { paid: 'ชำระแล้ว', pending: 'รอชำระ', refunded: 'คืนเงิน' };
    return m[s] || s;
  }

  getTypeLabel(t: string): string {
    const m: Record<string, string> = {
      membership_fee: 'ค่าสมาชิก', personal_training: 'เทรนส่วนตัว',
      class_fee: 'ค่าคลาส', other: 'อื่นๆ'
    };
    return m[t] || t || '-';
  }
}
