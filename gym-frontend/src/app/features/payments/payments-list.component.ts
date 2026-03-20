import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { PaymentService } from './payments.service';
import { PaymentFormComponent } from './payments-form.component';
import { ExportService } from '../../core/services/export.service';
import { PermissionService } from '../../core/services/permission.service';

@Component({
  selector: 'app-payments-list',
  templateUrl: './payments-list.component.html',
  styleUrls: ['./payments-list.component.scss']
})
export class PaymentListComponent implements OnInit {
  displayedColumns: string[] = ['member_name', 'amount', 'payment_date', 'method', 'status', 'actions'];
  dataSource = new MatTableDataSource<any>([]);
  loading = false;
  members: any[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  // Stat cards
  totalPayments = 0;
  totalRevenue = 0;
  paidCount = 0;
  pendingCount = 0;

  constructor(
    private service: PaymentService,
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
        this.totalPayments = data.length;
        this.paidCount = data.filter(d => d.status === 'paid').length;
        this.pendingCount = data.filter(d => d.status === 'pending').length;
        this.totalRevenue = data.filter(d => d.status === 'paid').reduce((sum, d) => sum + (+d.amount || 0), 0);
        this.loading = false;
      },
      error: () => { this.snackBar.open('Failed to load data', 'Close', { duration: 3000 }); this.loading = false; }
    });
  }

  applyFilter(event: Event): void {
    this.dataSource.filter = (event.target as HTMLInputElement).value.trim().toLowerCase();
  }

  openForm(item?: any): void {
    const ref = this.dialog.open(PaymentFormComponent, {
      width: '550px',
      data: item ? { payment: item, members: this.members } : { members: this.members }
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
    this.exportService.exportCSV(this.dataSource.data, 'payments');
  }

  exportPDF(): void {
    this.exportService.exportPDF('Payments Report', this.dataSource.data, [
      { key: 'member_name', label: 'Member' },
      { key: 'amount', label: 'Amount (฿)' },
      { key: 'payment_date', label: 'Date' },
      { key: 'method', label: 'Method' },
      { key: 'status', label: 'Status' },
      { key: 'notes', label: 'Notes' },
    ]);
  }
}
