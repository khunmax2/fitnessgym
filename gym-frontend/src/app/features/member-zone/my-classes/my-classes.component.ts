import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MemberService } from '../member.service';

@Component({
  selector: 'app-my-classes',
  templateUrl: './my-classes.component.html',
  styleUrls: ['./my-classes.component.scss']
})
export class MyClassesComponent implements OnInit {
  loading = false;
  classes: any[] = [];
  filteredClasses: any[] = [];
  searchTerm = '';
  bookedClassIds = new Set<string>();

  // Booking dialog state
  selectedClass: any = null;
  bookingDate = '';
  bookingTime = '09:00';
  bookingLoading = false;
  showBookingDialog = false;

  constructor(private memberService: MemberService, private snack: MatSnackBar) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.memberService.getAvailableClasses().subscribe({
      next: (data) => {
        this.classes = data;
        this.filteredClasses = data;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
    this.loadMyBookings();
  }

  loadMyBookings(): void {
    this.memberService.getMySchedules().subscribe({
      next: (schedules) => {
        this.bookedClassIds = new Set(
          schedules.filter(s => s.status === 'booked').map(s => s.class_id)
        );
      },
      error: () => {}
    });
  }

  isBooked(classId: string): boolean {
    return this.bookedClassIds.has(classId);
  }

  applyFilter(): void {
    const q = this.searchTerm.toLowerCase();
    this.filteredClasses = q
      ? this.classes.filter(c =>
          c.name?.toLowerCase().includes(q) ||
          c.trainer_name?.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q)
        )
      : this.classes;
  }

  openBooking(cls: any): void {
    this.selectedClass = cls;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.bookingDate = tomorrow.toISOString().slice(0, 10);
    this.bookingTime = '09:00';
    this.showBookingDialog = true;
  }

  closeDialog(): void {
    this.showBookingDialog = false;
    this.selectedClass = null;
  }

  confirmBooking(): void {
    if (!this.bookingDate || !this.bookingTime) {
      this.snack.open('กรุณาเลือกวันและเวลา', 'ปิด', { duration: 3000 });
      return;
    }
    const scheduled_at = `${this.bookingDate}T${this.bookingTime}:00`;
    this.bookingLoading = true;
    this.memberService.bookClass(this.selectedClass.id, scheduled_at).subscribe({
      next: () => {
        this.snack.open(`จองคลาส "${this.selectedClass.name}" สำเร็จ!`, 'ปิด', { duration: 4000, panelClass: 'snack-success' });
        this.closeDialog();
        this.bookingLoading = false;
        this.loadMyBookings();
      },
      error: (err) => {
        this.snack.open(err.error?.error || 'เกิดข้อผิดพลาด', 'ปิด', { duration: 4000, panelClass: 'snack-error' });
        this.bookingLoading = false;
      }
    });
  }

  getMinDate(): string {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }
}
