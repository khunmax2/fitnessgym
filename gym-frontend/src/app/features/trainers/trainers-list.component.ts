import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { TrainerService } from './trainers.service';
import { TrainerFormComponent } from './trainers-form.component';
import { ExportService } from '../../core/services/export.service';
import { PermissionService } from '../../core/services/permission.service';

@Component({
  selector: 'app-trainers-list',
  templateUrl: './trainers-list.component.html',
  styleUrls: ['./trainers-list.component.scss']
})
export class TrainerListComponent implements OnInit {
  displayedColumns: string[] = ['name','email','phone','specialty','status', 'actions'];
  dataSource = new MatTableDataSource<any>([]);
  loading = false;
  pendingUsers: any[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  // Stat cards
  totalTrainers = 0;
  activeCount = 0;
  inactiveCount = 0;

  constructor(
    private service: TrainerService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private exportService: ExportService,
    public permissionService: PermissionService
  ) {}

  ngOnInit(): void { this.load(); this.loadPendingUsers(); }

  ngAfterViewInit(): void { this.dataSource.paginator = this.paginator; }

  load(): void {
    this.loading = true;
    this.service.getAll().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.totalTrainers = data.length;
        this.activeCount = data.filter(d => d.status === 'active').length;
        this.inactiveCount = data.filter(d => d.status === 'inactive').length;
        this.loading = false;
      },
      error: () => { this.snackBar.open('Failed to load data', 'Close', { duration: 3000 }); this.loading = false; }
    });
  }

  loadPendingUsers(): void {
    this.service.getPendingUsers().subscribe({
      next: (data) => { this.pendingUsers = data; },
      error: () => { this.pendingUsers = []; }
    });
  }

  applyFilter(event: Event): void {
    this.dataSource.filter = (event.target as HTMLInputElement).value.trim().toLowerCase();
  }

  openForm(item?: any): void {
    if (!item && this.pendingUsers?.length === 0) {
      this.snackBar.open('No pending users available to convert to trainer.', 'Close', { duration: 3000 });
      return;
    }

    const data = item ? { ...item } : { pendingUsers: this.pendingUsers };

    const ref = this.dialog.open(TrainerFormComponent, {
      width: '500px',
      data
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
          const msg = `เทรนเนอร์นี้มีข้อมูลที่เกี่ยวข้อง:\n` +
            `- ${r.classes} คลาสที่สอน\n` +
            `- ${r.diet_plans} แผนอาหาร\n\n` +
            `ต้องการลบหรือไม่? (คลาสจะไม่มีเทรนเนอร์, แผนอาหารจะไม่มีเทรนเนอร์)`;
          if (confirm(msg)) {
            this.service.forceDelete(id).subscribe({
              next: () => { this.snackBar.open('ลบเทรนเนอร์เรียบร้อย', 'Close', { duration: 3000 }); this.load(); },
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
    this.exportService.exportCSV(this.dataSource.data, 'trainers');
  }

  exportPDF(): void {
    this.exportService.exportPDF('Trainers Report', this.dataSource.data, [
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'specialty', label: 'Specialty' },
      { key: 'bio', label: 'Bio' },
      { key: 'status', label: 'Status' },
    ]);
  }
}
