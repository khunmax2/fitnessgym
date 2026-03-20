import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { DietPlanService } from './diet.service';
import { DietPlanFormComponent } from './diet-plans-form.component';
import { ExportService } from '../../core/services/export.service';
import { PermissionService } from '../../core/services/permission.service';

@Component({
  selector: 'app-diet-plans-list',
  templateUrl: './diet-plans-list.component.html',
  styleUrls: ['./diet-plans-list.component.scss']
})
export class DietPlanListComponent implements OnInit {
  displayedColumns: string[] = ['member_name', 'trainer_name', 'calories', 'start_date', 'end_date', 'actions'];
  dataSource = new MatTableDataSource<any>([]);
  loading = false;
  members: any[] = [];
  trainers: any[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  // Stat cards
  totalPlans = 0;
  avgCalories = 0;
  activePlans = 0;

  constructor(
    private service: DietPlanService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private exportService: ExportService,
    public permissionService: PermissionService
  ) {}

  ngOnInit(): void {
    this.load();
    this.service.getMembers().subscribe(d => this.members = (d || []).filter(m => m.status === 'active'));
    this.service.getTrainers().subscribe(d => this.trainers = (d || []).filter(t => t.status === 'active'));
  }

  ngAfterViewInit(): void { this.dataSource.paginator = this.paginator; }

  load(): void {
    this.loading = true;
    this.service.getAll().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.totalPlans = data.length;
        const cals = data.filter(d => d.calories).map(d => d.calories);
        this.avgCalories = cals.length ? Math.round(cals.reduce((a, b) => a + b, 0) / cals.length) : 0;
        const today = new Date().toISOString().slice(0, 10);
        this.activePlans = data.filter(d => d.start_date <= today && (!d.end_date || d.end_date >= today)).length;
        this.loading = false;
      },
      error: () => { this.snackBar.open('Failed to load data', 'Close', { duration: 3000 }); this.loading = false; }
    });
  }

  applyFilter(event: Event): void {
    this.dataSource.filter = (event.target as HTMLInputElement).value.trim().toLowerCase();
  }

  openForm(item?: any): void {
    const ref = this.dialog.open(DietPlanFormComponent, {
      width: '550px',
      data: item ? { diet: item, members: this.members, trainers: this.trainers } : { members: this.members, trainers: this.trainers }
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
    this.exportService.exportCSV(this.dataSource.data, 'diet-plans');
  }

  exportPDF(): void {
    this.exportService.exportPDF('Diet Plans Report', this.dataSource.data, [
      { key: 'member_name', label: 'Member' },
      { key: 'trainer_name', label: 'Trainer' },
      { key: 'calories', label: 'Calories' },
      { key: 'start_date', label: 'Start Date' },
      { key: 'end_date', label: 'End Date' },
      { key: 'notes', label: 'Notes' },
    ]);
  }
}
