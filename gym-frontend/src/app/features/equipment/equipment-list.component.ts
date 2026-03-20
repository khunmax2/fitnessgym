import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { EquipmentService } from './equipment.service';
import { EquipmentFormComponent } from './equipment-form.component';
import { PermissionService } from '../../core/services/permission.service';
import { ExportService } from '../../core/services/export.service';

@Component({
  selector: 'app-equipment-list',
  templateUrl: './equipment-list.component.html',
  styleUrls: ['./equipment-list.component.scss']
})
export class EquipmentListComponent implements OnInit {
  displayedColumns: string[] = ['name','quantity','status','last_maintenance','actions'];
  dataSource = new MatTableDataSource<any>([]);
  loading = false;

  get total()            { return this.dataSource.data.length; }
  get availableCount()   { return this.dataSource.data.filter(e => e.status === 'available').length; }
  get maintenanceCount() { return this.dataSource.data.filter(e => e.status === 'maintenance').length; }
  get outOfServiceCount(){ return this.dataSource.data.filter(e => e.status === 'out_of_service').length; }
  get totalQuantity()    { return this.dataSource.data.reduce((sum, e) => sum + (e.quantity || 0), 0); }

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private service: EquipmentService,
    private dialog: MatDialog,
    private snack: MatSnackBar,
    public perm: PermissionService,
    private exporter: ExportService
  ) {}

  ngOnInit(): void { this.load(); }
  ngAfterViewInit(): void { this.dataSource.paginator = this.paginator; }

  load(): void {
    this.loading = true;
    this.service.getAll().subscribe({
      next: (data) => { this.dataSource.data = data; this.loading = false; },
      error: () => { this.snack.open('Failed to load data', 'Close', { duration: 3000 }); this.loading = false; }
    });
  }

  applyFilter(event: Event): void {
    this.dataSource.filter = (event.target as HTMLInputElement).value.trim().toLowerCase();
  }

  openForm(item?: any): void {
    if (item && !this.perm.canUpdate('equipment')) {
      this.snack.open('You do not have permission to edit equipment', 'Close', { duration: 3000 });
      return;
    }
    this.dialog.open(EquipmentFormComponent, { width: '520px', data: item || null })
      .afterClosed().subscribe(r => { if (r) this.load(); });
  }

  delete(id: string): void {
    if (!this.perm.canDelete('equipment')) {
      this.snack.open('Only admins can delete equipment', 'Close', { duration: 3000 });
      return;
    }
    if (!confirm('Delete this equipment?')) return;
    this.service.delete(id).subscribe({
      next: () => { this.snack.open('Deleted', 'Close', { duration: 3000 }); this.load(); },
      error: (err) => this.snack.open(err.error?.error || 'Delete failed', 'Close', { duration: 3000 })
    });
  }

  exportCSV() { this.exporter.exportCSV(this.dataSource.data, 'equipment'); }

  exportPDF() {
    this.exporter.exportPDF('Equipment Report', this.dataSource.data, [
      { key: 'name',             label: 'Name' },
      { key: 'quantity',         label: 'Qty' },
      { key: 'status',           label: 'Status' },
      { key: 'last_maintenance', label: 'Last Maintenance' },
      { key: 'notes',            label: 'Notes' },
    ]);
  }
}
