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
  displayedColumns = ['name','email','membership_type','status','end_date','actions'];
  dataSource = new MatTableDataSource<any>([]);
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
  }

  applyFilter(e: Event) {
    this.dataSource.filter = (e.target as HTMLInputElement).value.trim().toLowerCase();
  }

  openForm(item?: any) {
    if (item && !this.perm.canUpdate('members')) {
      this.snack.open('You do not have permission to edit members', 'Close', { duration: 3000 });
      return;
    }
    this.dialog.open(MembersFormComponent, { width: '520px', data: item || null })
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
      error: (err) => this.snack.open(err.error?.error || 'Delete failed', 'Close', { duration: 3000 })
    });
  }

  exportCSV() { this.exporter.exportCSV(this.dataSource.data, 'members'); }

  exportPDF() {
    this.exporter.exportPDF('Members Report', this.dataSource.data, [
      { key: 'name',            label: 'Name' },
      { key: 'email',           label: 'Email' },
      { key: 'phone',           label: 'Phone' },
      { key: 'membership_type', label: 'Type' },
      { key: 'status',          label: 'Status' },
      { key: 'end_date',        label: 'Expiry' },
    ]);
  }

  getInitials(name: string) { return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) || '?'; }
  getAvatarBg(name: string) {
    const c = ['#3a1a2a','#1a2a3a','#1a3a1a','#2a2a1a','#2a1a3a'];
    return c[(name?.charCodeAt(0) || 0) % c.length];
  }
}
