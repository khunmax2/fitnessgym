import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { PaymentService } from './payments.service';
import { PaymentFormComponent } from './payments-form.component';
import { PromptpayQrDialogComponent } from './promptpay-qr-dialog.component';
import { RefundDialogComponent } from './refund-dialog.component';
import { ExportService } from '../../core/services/export.service';
import { PermissionService } from '../../core/services/permission.service';

@Component({
  selector: 'app-payments-list',
  templateUrl: './payments-list.component.html',
  styleUrls: ['./payments-list.component.scss']
})
export class PaymentListComponent implements OnInit {
  displayedColumns: string[] = ['invoice_number', 'member_name', 'payment_type', 'amount', 'payment_date', 'method', 'status', 'actions'];
  dataSource = new MatTableDataSource<any>([]);
  allData: any[] = [];
  loading = false;
  members: any[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  // Stat cards
  totalPayments = 0;
  totalRevenue = 0;
  paidCount = 0;
  pendingCount = 0;

  // Filters
  searchText = '';
  filterStatus = 'all';
  filterType = 'all';
  filterDateFrom: Date | null = null;
  filterDateTo: Date | null = null;

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
        this.allData = data;
        this.updateStats(data);
        this.applyFilters();
        this.loading = false;
      },
      error: () => { this.snackBar.open('Failed to load data', 'Close', { duration: 3000 }); this.loading = false; }
    });
  }

  updateStats(data: any[]): void {
    this.totalPayments = data.length;
    this.paidCount = data.filter(d => d.status === 'paid').length;
    this.pendingCount = data.filter(d => d.status === 'pending').length;
    this.totalRevenue = data.filter(d => d.status === 'paid').reduce((sum, d) => sum + (+d.amount || 0), 0);
  }

  applyFilters(): void {
    let filtered = [...this.allData];

    // Text search
    if (this.searchText) {
      const term = this.searchText.toLowerCase();
      filtered = filtered.filter(d =>
        (d.member_name || '').toLowerCase().includes(term) ||
        (d.invoice_number || '').toLowerCase().includes(term) ||
        (d.transaction_ref || '').toLowerCase().includes(term) ||
        (d.notes || '').toLowerCase().includes(term)
      );
    }

    // Status filter
    if (this.filterStatus !== 'all') {
      filtered = filtered.filter(d => d.status === this.filterStatus);
    }

    // Type filter
    if (this.filterType !== 'all') {
      filtered = filtered.filter(d => d.payment_type === this.filterType);
    }

    // Date range filter
    if (this.filterDateFrom) {
      const from = new Date(this.filterDateFrom).toISOString().slice(0, 10);
      filtered = filtered.filter(d => d.payment_date >= from);
    }
    if (this.filterDateTo) {
      const to = new Date(this.filterDateTo).toISOString().slice(0, 10);
      filtered = filtered.filter(d => d.payment_date <= to);
    }

    this.dataSource.data = filtered;
  }

  hasActiveFilters(): boolean {
    return this.filterStatus !== 'all' || this.filterType !== 'all' || !!this.filterDateFrom || !!this.filterDateTo || !!this.searchText;
  }

  clearFilters(): void {
    this.searchText = '';
    this.filterStatus = 'all';
    this.filterType = 'all';
    this.filterDateFrom = null;
    this.filterDateTo = null;
    this.applyFilters();
  }

  openForm(item?: any): void {
    const ref = this.dialog.open(PaymentFormComponent, {
      width: '550px',
      data: item ? { payment: item, members: this.members } : { members: this.members }
    });
    ref.afterClosed().subscribe(result => {
      if (!result) return;
      // If PromptPay → open QR dialog
      if (result.promptpay) {
        this.openQrDialog(result.payment, result.memberName);
      } else {
        this.load();
      }
    });
  }

  openQrDialog(payment: any, memberName?: string): void {
    const ref = this.dialog.open(PromptpayQrDialogComponent, {
      width: '420px',
      disableClose: true,
      data: {
        paymentId: payment.id,
        amount: payment.amount,
        memberName: memberName || payment.member_name || '-'
      }
    });
    ref.afterClosed().subscribe(() => this.load());
  }

  delete(id: string): void {
    if (!confirm('คุณต้องการลบรายการชำระเงินนี้? (ข้อมูลจะถูกซ่อน ไม่ลบถาวร)')) return;
    this.service.delete(id).subscribe({
      next: () => { this.snackBar.open('ลบเรียบร้อย', 'Close', { duration: 3000 }); this.load(); },
      error: () => this.snackBar.open('ลบไม่สำเร็จ', 'Close', { duration: 3000 })
    });
  }

  openRefundDialog(payment: any): void {
    const ref = this.dialog.open(RefundDialogComponent, {
      width: '450px',
      data: { payment }
    });
    ref.afterClosed().subscribe(result => { if (result) this.load(); });
  }

  formatDate(d: string): string {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  exportCSV(): void {
    this.exportService.exportCSV(this.dataSource.data, 'payments');
  }

  formatPaymentType(type: string): string {
    const map: Record<string, string> = {
      'membership_fee': 'ค่าสมาชิก',
      'personal_training': 'เทรนส่วนตัว',
      'class_fee': 'ค่าคอร์ส',
      'other': 'อื่นๆ'
    };
    return map[type] || type || '-';
  }

  exportPDF(): void {
    this.exportService.exportPDF('Payments Report', this.dataSource.data, [
      { key: 'invoice_number', label: 'Invoice' },
      { key: 'member_name', label: 'Member' },
      { key: 'payment_type', label: 'Type' },
      { key: 'amount', label: 'Amount (฿)' },
      { key: 'payment_date', label: 'Date' },
      { key: 'method', label: 'Method' },
      { key: 'status', label: 'Status' },
      { key: 'transaction_ref', label: 'Ref' },
      { key: 'notes', label: 'Notes' },
    ]);
  }
}
