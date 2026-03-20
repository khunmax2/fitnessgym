import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { ClassService } from './classes.service';
import { ClassFormComponent } from './classes-form.component';
import { PermissionService } from '../../core/services/permission.service';
import { ExportService } from '../../core/services/export.service';

@Component({
  selector: 'app-classes-list',
  templateUrl: './classes-list.component.html',
  styleUrls: ['./classes-list.component.scss']
})
export class ClassListComponent implements OnInit {
  displayedColumns: string[] = ['name','trainer_name','capacity','duration_minutes','description','actions'];
  dataSource = new MatTableDataSource<any>([]);
  loading = false;
  trainers: any[] = [];

  totalClasses = 0;
  totalCapacity = 0;
  avgDuration = 0;
  withTrainer = 0;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private service: ClassService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    public permission: PermissionService,
    private exportService: ExportService
  ) {}

  ngOnInit(): void {
    this.load();
    this.loadTrainers();
  }

  ngAfterViewInit(): void { this.dataSource.paginator = this.paginator; }

  load(): void {
    this.loading = true;
    this.service.getAll().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.totalClasses = data.length;
        this.totalCapacity = data.reduce((s: number, c: any) => s + (c.capacity || 0), 0);
        this.avgDuration = data.length ? Math.round(data.reduce((s: number, c: any) => s + (c.duration_minutes || 0), 0) / data.length) : 0;
        this.withTrainer = data.filter((c: any) => c.trainer_id).length;
        this.loading = false;
      },
      error: () => { this.snackBar.open('Failed to load data', 'Close', { duration: 3000 }); this.loading = false; }
    });
  }

  loadTrainers(): void {
    this.service.getTrainers().subscribe({
      next: (data) => this.trainers = data,
      error: () => {}
    });
  }

  applyFilter(event: Event): void {
    this.dataSource.filter = (event.target as HTMLInputElement).value.trim().toLowerCase();
  }

  openForm(item?: any): void {
    const ref = this.dialog.open(ClassFormComponent, {
      width: '520px',
      data: item ? { classItem: item, trainers: this.trainers } : { classItem: null, trainers: this.trainers }
    });
    ref.afterClosed().subscribe(result => { if (result) this.load(); });
  }

  delete(id: string): void {
    if (!confirm('Are you sure?')) return;
    this.service.delete(id).subscribe({
      next: () => { this.snackBar.open('Deleted successfully', 'Close', { duration: 3000 }); this.load(); },
      error: (err) => {
        if (err.status === 409 && err.error?.relations) {
          const r = err.error.relations;
          const msg = `คลาสนี้มีข้อมูลที่เกี่ยวข้อง:\n` +
            `- ${r.schedules} ตารางเรียน\n` +
            `- ${r.bookings} การจอง\n\n` +
            `ต้องการลบทั้งหมดหรือไม่? (ตารางเรียนจะถูกลบด้วย)`;
          if (confirm(msg)) {
            this.service.forceDelete(id).subscribe({
              next: () => { this.snackBar.open('ลบคลาสและข้อมูลที่เกี่ยวข้องเรียบร้อย', 'Close', { duration: 3000 }); this.load(); },
              error: (e) => this.snackBar.open(e.error?.error || 'Delete failed', 'Close', { duration: 3000 })
            });
          }
        } else {
          this.snackBar.open(err.error?.error || 'Delete failed', 'Close', { duration: 3000 });
        }
      }
    });
  }

  exportCSV(): void {
    this.exportService.exportCSV(this.dataSource.data, 'classes');
  }

  exportPDF(): void {
    this.exportService.exportPDF('Classes Report', this.dataSource.data, [
      { key: 'name',             label: 'Name' },
      { key: 'trainer_name',     label: 'Trainer' },
      { key: 'capacity',         label: 'Capacity' },
      { key: 'duration_minutes', label: 'Duration (min)' },
      { key: 'description',      label: 'Description' },
    ]);
  }
}
