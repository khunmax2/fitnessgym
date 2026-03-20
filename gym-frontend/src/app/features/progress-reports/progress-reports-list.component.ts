import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { ProgressReportService } from './progress.service';
import { ProgressReportFormComponent } from './progress-reports-form.component';
import { ExportService } from '../../core/services/export.service';
import { PermissionService } from '../../core/services/permission.service';

@Component({
  selector: 'app-progress-reports-list',
  templateUrl: './progress-reports-list.component.html',
  styleUrls: ['./progress-reports-list.component.scss']
})
export class ProgressReportListComponent implements OnInit {
  displayedColumns: string[] = ['member_name', 'height', 'weight', 'bmi', 'body_fat_percent', 'waist', 'bmr', 'report_date', 'actions'];
  dataSource = new MatTableDataSource<any>([]);
  loading = false;
  members: any[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  // Stat cards
  totalReports = 0;
  avgWeight = 0;
  avgBmi = 0;
  avgBodyFat = 0;

  constructor(
    private service: ProgressReportService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private exportService: ExportService,
    public permissionService: PermissionService
  ) {}

  ngOnInit(): void {
    this.load();
    this.service.getMembers().subscribe(d => this.members = (d || []).filter(m => m.status === 'active'));
  }

  ngAfterViewInit(): void { this.dataSource.paginator = this.paginator; }

  load(): void {
    this.loading = true;
    this.service.getAll().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.totalReports = data.length;
        const weights = data.filter(d => d.weight).map(d => +d.weight);
        this.avgWeight = weights.length ? +(weights.reduce((a, b) => a + b, 0) / weights.length).toFixed(1) : 0;
        const bmis = data.filter(d => d.bmi).map(d => +d.bmi);
        this.avgBmi = bmis.length ? +(bmis.reduce((a, b) => a + b, 0) / bmis.length).toFixed(1) : 0;
        const fats = data.filter(d => d.body_fat_percent).map(d => +d.body_fat_percent);
        this.avgBodyFat = fats.length ? +(fats.reduce((a, b) => a + b, 0) / fats.length).toFixed(1) : 0;
        this.loading = false;
      },
      error: () => { this.snackBar.open('Failed to load data', 'Close', { duration: 3000 }); this.loading = false; }
    });
  }

  applyFilter(event: Event): void {
    this.dataSource.filter = (event.target as HTMLInputElement).value.trim().toLowerCase();
  }

  openForm(item?: any): void {
    const ref = this.dialog.open(ProgressReportFormComponent, {
      width: '550px',
      data: item ? { report: item, members: this.members } : { members: this.members }
    });
    ref.afterClosed().subscribe(result => { if (result) this.load(); });
  }

  delete(id: string): void {
    if (!confirm('Are you sure?')) return;
    this.service.delete(id).subscribe({
      next: () => { this.snackBar.open('Deleted successfully', 'Close', { duration: 3000 }); this.load(); },
      error: () => this.snackBar.open('Delete failed', 'Close', { duration: 3000 })
    });
  }

  formatDate(d: string): string {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  exportCSV(): void {
    this.exportService.exportCSV(this.dataSource.data, 'progress-reports');
  }

  exportPDF(): void {
    this.exportService.exportPDF('Progress Reports', this.dataSource.data, [
      { key: 'member_name', label: 'Member' },
      { key: 'height', label: 'Height (cm)' },
      { key: 'weight', label: 'Weight (kg)' },
      { key: 'bmi', label: 'BMI' },
      { key: 'body_fat_percent', label: 'Body Fat %' },
      { key: 'waist', label: 'Waist (cm)' },
      { key: 'hip', label: 'Hip (cm)' },
      { key: 'chest', label: 'Chest (cm)' },
      { key: 'arm', label: 'Arm (cm)' },
      { key: 'muscle_mass', label: 'Muscle (kg)' },
      { key: 'bmr', label: 'BMR (kcal)' },
      { key: 'report_date', label: 'Report Date' },
      { key: 'notes', label: 'Notes' },
    ]);
  }
}
