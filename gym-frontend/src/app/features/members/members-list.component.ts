import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MemberService } from './members.service';
import { MembersFormComponent } from './members-form.component';
import { PermissionService } from '../../core/services/permission.service';
import { ExportService } from '../../core/services/export.service';

@Component({
  selector: 'app-members-list',
  templateUrl: './members-list.component.html',
  styleUrls: ['./members-list.component.scss']
})
export class MemberListComponent implements OnInit {
  displayedColumns = ['name','gender','email','membership_type','status','end_date','actions'];
  dataSource = new MatTableDataSource<any>([]);
  pendingUsers: any[] = [];
  loading = false;

  get total()        { return this.dataSource.data.length; }
  get activeCount()  { return this.dataSource.data.filter(m => m.status === 'active').length; }
  get yearlyCount()  { return this.dataSource.data.filter(m => m.membership_type === 'yearly').length; }
  get expiredCount() { return this.dataSource.data.filter(m => m.status === 'expired').length; }

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private service: MemberService,
    private dialog: MatDialog,
    private snack: MatSnackBar,
    public perm: PermissionService,
    private exporter: ExportService
  ) {}

  ngOnInit()       { this.load(); }
  ngAfterViewInit(){ this.dataSource.paginator = this.paginator; }

  load() {
    this.loading = true;
    this.service.getAll().subscribe({
      next: d => { this.dataSource.data = d; this.loading = false; },
      error: () => { this.snack.open('Failed to load', 'Close', { duration: 3000 }); this.loading = false; }
    });
    this.loadPendingUsers();
  }

  loadPendingUsers() {
    this.service.getPendingUsers().subscribe({
      next: data => { this.pendingUsers = data; },
      error: () => { this.pendingUsers = []; }
    });
  }

  applyFilter(e: Event) {
    this.dataSource.filter = (e.target as HTMLInputElement).value.trim().toLowerCase();
  }

  openForm(item?: any) {
    if (item && !this.perm.canUpdate('members')) {
      this.snack.open('You do not have permission to edit members', 'Close', { duration: 3000 });
      return;
    }
    if (!item && !this.pendingUsers.length) {
      this.snack.open('No pending users available to convert. Please ask users to register first.', 'Close', { duration: 3000 });
      return;
    }

    const data = item ? { member: item } : { pendingUsers: this.pendingUsers };
    this.dialog.open(MembersFormComponent, { width: '520px', data })
      .afterClosed().subscribe(r => { if (r) this.load(); });
  }



  delete(id: string) {
    if (!this.perm.canDelete('members')) {
      this.snack.open('Only admins can delete members', 'Close', { duration: 3000 });
      return;
    }
    if (!confirm('Delete this member?')) return;
    this.service.delete(id).subscribe({
      next: () => { this.snack.open('Deleted', 'Close', { duration: 3000 }); this.load(); },
      error: (err) => {
        if (err.status === 409 && err.error?.relations) {
          const r = err.error.relations;
          const msg = `สมาชิกนี้มีข้อมูลที่เกี่ยวข้อง:\n` +
            `- ${r.schedules} ตารางเรียน\n` +
            `- ${r.payments} รายการชำระเงิน\n` +
            `- ${r.diet_plans} แผนอาหาร\n` +
            `- ${r.progress_reports} รายงานความก้าวหน้า\n\n` +
            `ต้องการลบทั้งหมดหรือไม่? (ข้อมูลที่เกี่ยวข้องจะถูกลบด้วย)`;
          if (confirm(msg)) {
            this.service.forceDelete(id).subscribe({
              next: () => { this.snack.open('ลบสมาชิกและข้อมูลที่เกี่ยวข้องเรียบร้อย', 'Close', { duration: 3000 }); this.load(); },
              error: (e) => this.snack.open(e.error?.error || 'Delete failed', 'Close', { duration: 3000 })
            });
          }
        } else {
          this.snack.open(err.error?.error || 'Delete failed', 'Close', { duration: 3000 });
        }
      }
    });
  }

  exportCSV() { this.exporter.exportCSV(this.dataSource.data, 'members'); }

  exportPDF() {
    this.exporter.exportPDF('Members Report', this.dataSource.data, [
      { key: 'name',            label: 'Name' },
      { key: 'gender',          label: 'Gender' },
      { key: 'email',           label: 'Email' },
      { key: 'phone',           label: 'Phone' },
      { key: 'date_of_birth',   label: 'Birth Date' },
      { key: 'membership_type', label: 'Type' },
      { key: 'status',          label: 'Status' },
      { key: 'end_date',        label: 'Expiry' },
      { key: 'emergency_name',  label: 'Emergency Name' },
      { key: 'emergency_contact', label: 'Emergency Tel' },
      { key: 'medical_conditions', label: 'Medical' },
    ]);
  }

  getInitials(name: string) { return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) || '?'; }
  getAvatarBg(name: string) {
    const c = ['#3a1a2a','#1a2a3a','#1a3a1a','#2a2a1a','#2a1a3a'];
    return c[(name?.charCodeAt(0) || 0) % c.length];
  }
}
