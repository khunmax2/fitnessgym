import { Component, OnInit } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MemberService } from '../member.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-member-dashboard',
  templateUrl: './member-dashboard.component.html',
  styleUrls: ['./member-dashboard.component.scss']
})
export class MemberDashboardComponent implements OnInit {
  loading = true;
  today = new Date();

  member: any = null;
  upcomingSchedules: any[] = [];
  recentPayments: any[] = [];
  recentProgress: any[] = [];
  myDietPlans: any[] = [];

  daysLeft = 0;
  statusColor = '#22c55e';
  membershipExpired = false;

  get userName(): string {
    return this.auth.currentUserSubject?.value?.name || '';
  }

  constructor(private memberService: MemberService, private auth: AuthService) {}

  ngOnInit(): void {
    forkJoin({
      profile:   this.memberService.getMyProfile().pipe(catchError(() => of(null))),
      schedules: this.memberService.getMySchedules().pipe(catchError(() => of([]))),
      payments:  this.memberService.getMyPayments().pipe(catchError(() => of([]))),
      progress:  this.memberService.getMyProgress().pipe(catchError(() => of([]))),
      diets:     this.memberService.getMyDietPlans().pipe(catchError(() => of([]))),
    }).subscribe({
      next: (d) => {
        this.member = d.profile;
        this.upcomingSchedules = d.schedules
          .filter((s: any) => s.status === 'booked' && new Date(s.scheduled_at) >= new Date())
          .slice(0, 5);
        this.recentPayments  = d.payments.slice(0, 3);
        this.recentProgress  = d.progress.slice(0, 3);
        this.myDietPlans     = d.diets.slice(0, 2);
        this.calcMembership();
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  calcMembership(): void {
    if (!this.member?.end_date) return;
    const end  = new Date(this.member.end_date);
    const now  = new Date();
    this.daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (this.daysLeft <= 0) {
      this.statusColor = '#E8003D';
      this.membershipExpired = true;
    } else if (this.daysLeft <= 7) {
      this.statusColor = '#f59e0b';
    } else {
      this.statusColor = '#22c55e';
    }
  }

  getMembershipTypeLabel(type: string): string {
    const map: Record<string, string> = {
      monthly: 'รายเดือน', quarterly: 'รายไตรมาส',
      yearly: 'รายปี', weekly: 'รายสัปดาห์'
    };
    return map[type] || type;
  }

  getStatusLabel(status: string): string {
    return status === 'active' ? 'Active' : 'Expired';
  }

  getPaymentStatusLabel(s: string): string {
    const m: Record<string,string> = { paid: 'ชำระแล้ว', pending: 'รอชำระ', refunded: 'คืนเงิน' };
    return m[s] || s;
  }
}
