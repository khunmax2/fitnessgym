import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MemberService } from '../member.service';

@Component({
  selector: 'app-my-schedule',
  templateUrl: './my-schedule.component.html',
  styleUrls: ['./my-schedule.component.scss']
})
export class MyScheduleComponent implements OnInit {
  loading = false;
  schedules: any[] = [];
  filter: 'all' | 'upcoming' | 'past' | 'cancelled' = 'all';

  get filtered(): any[] {
    const now = new Date();
    switch (this.filter) {
      case 'upcoming':  return this.schedules.filter(s => s.status === 'booked' && new Date(s.scheduled_at) >= now);
      case 'past':      return this.schedules.filter(s => new Date(s.scheduled_at) < now || s.status === 'completed');
      case 'cancelled': return this.schedules.filter(s => s.status === 'cancelled');
      default:          return this.schedules;
    }
  }

  constructor(private memberService: MemberService, private snack: MatSnackBar) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.memberService.getMySchedules().subscribe({
      next: (data) => { this.schedules = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  cancel(schedule: any): void {
    if (!confirm(`ยืนยันยกเลิกคลาส "${schedule.class_name}"?`)) return;
    this.memberService.cancelBooking(schedule.id).subscribe({
      next: () => {
        this.snack.open('ยกเลิกการจองสำเร็จ', 'ปิด', { duration: 3000 });
        this.load();
      },
      error: (err) => {
        this.snack.open(err.error?.error || 'ยกเลิกไม่ได้', 'ปิด', { duration: 3000 });
      }
    });
  }

  isUpcoming(s: any): boolean {
    return s.status === 'booked' && new Date(s.scheduled_at) >= new Date();
  }
}
