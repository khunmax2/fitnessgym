import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { EquipmentService } from './equipment.service';
import { EquipmentFormComponent } from './equipment-form.component';

@Component({
  selector: 'app-equipment-list',
  templateUrl: './equipment-list.component.html',
  styleUrls: ['./equipment-list.component.scss']
})
export class EquipmentListComponent implements OnInit {
  displayedColumns: string[] = ['name','quantity','status','last_maintenance', 'actions'];
  dataSource = new MatTableDataSource<any>([]);
  loading = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private service: EquipmentService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void { this.load(); }

  ngAfterViewInit(): void { this.dataSource.paginator = this.paginator; }

  load(): void {
    this.loading = true;
    this.service.getAll().subscribe({
      next: (data) => { this.dataSource.data = data; this.loading = false; },
      error: () => { this.snackBar.open('Failed to load data', 'Close', { duration: 3000 }); this.loading = false; }
    });
  }

  applyFilter(event: Event): void {
    this.dataSource.filter = (event.target as HTMLInputElement).value.trim().toLowerCase();
  }

  openForm(item?: any): void {
    const ref = this.dialog.open(EquipmentFormComponent, {
      width: '500px',
      data: item || null
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
}
