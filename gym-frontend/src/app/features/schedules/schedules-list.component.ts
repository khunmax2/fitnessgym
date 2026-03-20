import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { ScheduleService } from './schedules.service';
import { ScheduleFormComponent } from './schedules-form.component';
import { PermissionService } from '../../core/services/permission.service';
import { ExportService } from '../../core/services/export.service';

@Component({
  selector: 'app-schedules-list',
  templateUrl: './schedules-list.component.html',
  styleUrls: ['./schedules-list.component.scss']
})
export class ScheduleListComponent implements OnInit {
  displayedColumns: string[] = ['class_name','member_name','scheduled_at','status','actions'];
  dataSource = new MatTableDataSource<any>([]);
  loading = false;
  classes: any[] = [];
  members: any[] = [];

  get total()          { return this.dataSource.data.length; }
  get bookedCount()    { return this.dataSource.data.filter(s => s.status === 'booked').length; }
  get completedCount() { return this.dataSource.data.filter(s => s.status === 'completed').length; }
  get cancelledCount() { return this.dataSource.data.filter(s => s.status === 'cancelled').length; }

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private service: ScheduleService,
    private dialog: MatDialog,
    private snack: MatSnackBar,
    public perm: PermissionService,
    private exporter: ExportService
  ) {}

  ngOnInit(): void { this.load(); this.loadDropdowns(); }
  ngAfterViewInit(): void { this.dataSource.paginator = this.paginator; }

  load(): void {
    this.loading = true;
    this.service.getAll().subscribe({
      next: (data) => { this.dataSource.data = data; this.loading = false; },
      error: () => { this.snack.open('Failed to load data', 'Close', { duration: 3000 }); this.loading = false; }
    });
  }

  loadDropdowns(): void {
    this.service.getClasses().subscribe({ next: d => this.classes = d, error: () => {} });
    this.service.getMembers().subscribe({ next: d => this.members = d, error: () => {} });
  }

  applyFilter(event: Event): void {
    this.dataSource.filter = (event.target as HTMLInputElement).value.trim().toLowerCase();
  }

  openForm(item?: any): void {
    if (item && !this.perm.canUpdate('schedules')) {
      this.snack.open('You do not have permission to edit schedules', 'Close', { duration: 3000 });
      return;
    }
    const data = { schedule: item || null, classes: this.classes, members: this.members };
    this.dialog.open(ScheduleFormComponent, { width: '520px', data })
      .afterClosed().subscribe(r => { if (r) this.load(); });
  }

  delete(id: string): void {
    if (!this.perm.canDelete('schedules')) {
      this.snack.open('Only admins can delete schedules', 'Close', { duration: 3000 });
      return;
    }
    if (!confirm('Delete this schedule?')) return;
    this.service.delete(id).subscribe({
      next: () => { this.snack.open('Deleted', 'Close', { duration: 3000 }); this.load(); },
      error: (err) => {
        if (err.status === 409 && err.error?.relations) {
          const r = err.error.relations;
          const msg = `ตารางเรียนนี้มี: ${r.bookings} การจอง\n\nต้องการลบทั้งหมดหรือไม่?`;
          if (confirm(msg)) {
            this.service.forceDelete(id).subscribe({
              next: () => { this.snack.open('ลบตารางเรียนเรียบร้อย', 'Close', { duration: 3000 }); this.load(); },
              error: (e) => this.snack.open(e.error?.error || 'Delete failed', 'Close', { duration: 3000 })
            });
          }
        } else {
          this.snack.open(err.error?.error || 'Delete failed', 'Close', { duration: 3000 });
        }
      }
    });
  }

  formatDate(d: string): string {
    if (!d) return '-';
    return new Date(d).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });
  }

  exportCSV() { this.exporter.exportCSV(this.dataSource.data, 'schedules'); }

  exportPDF() {
    this.exporter.exportPDF('Schedules Report', this.dataSource.data, [
      { key: 'class_name',    label: 'Class' },
      { key: 'member_name',   label: 'Member' },
      { key: 'scheduled_at',  label: 'Scheduled At' },
      { key: 'status',        label: 'Status' },
    ]);
  }
}
