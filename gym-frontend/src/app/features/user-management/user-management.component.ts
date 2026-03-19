import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../core/services/auth.service';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss']
})
export class UserManagementComponent implements OnInit, AfterViewInit {
  api = '/api/users';
  loading = false;
  dataSource = new MatTableDataSource<any>([]);
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(private http: HttpClient, private snack: MatSnackBar, public authService: AuthService) {}

  // Stats
  get total()    { return this.dataSource.data.length; }
  get members()  { return this.dataSource.data.filter(u => u.role === 'member').length; }
  get trainers() { return this.dataSource.data.filter(u => u.role === 'trainer').length; }
  get admins()   { return this.dataSource.data.filter(u => u.role === 'admin' || u.role === 'staff').length; }

  roles = ['member', 'trainer', 'staff', 'admin'];
  displayedColumns = ['user', 'email', 'phone', 'role', 'joined', 'actions'];

  getRoleLabel(role: string): string {
    switch (role) {
      case 'member': return 'Member';
      case 'trainer': return 'Trainer';
      case 'staff': return 'Staff';
      case 'admin': return 'Admin';
      default: return role;
    }
  }

  getRoleColor(role: string): string {
    switch (role) {
      case 'member': return '#22c55e';
      case 'trainer': return '#f59e0b';
      case 'staff': return '#60a5fa';
      case 'admin': return '#E8003D';
      default: return '#888';
    }
  }

  getRoleBg(role: string): string {
    return this.getRoleColor(role) + '20';
  }

  getInitials(name: string): string {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  ngOnInit() { this.load(); }
  ngAfterViewInit() { this.dataSource.paginator = this.paginator; }

  load(): void {
    this.loading = true;
    this.http.get<any[]>(this.api).subscribe({
      next: d => { this.dataSource.data = d; this.loading = false; },
      error: () => { this.snack.open('Failed to load users', 'Close', { duration: 3000 }); this.loading = false; }
    });
  }

  applyFilter(e: Event): void {
    this.dataSource.filter = (e.target as HTMLInputElement).value.trim().toLowerCase();
  }

  changeRole(userId: string, newRole: string): void {
    const currentUserId = this.authService.currentUserSubject.value?.id;
    if (userId === currentUserId) {
      this.snack.open('Cannot change your own role', 'Close', { duration: 3000 }); return;
    }
    this.http.patch(`${this.api}/${userId}/role`, { role: newRole }).subscribe({
      next: (updated: any) => {
        this.snack.open(`Role changed to ${this.getRoleLabel(updated.role)}`, 'Close', { duration: 3000 });
        this.load();
      },
      error: (err) => this.snack.open(err.error?.error || 'Failed', 'Close', { duration: 3000 })
    });
  }

  deleteUser(userId: string): void {
    if (!confirm('Delete this user? This action cannot be undone.')) return;
    this.http.delete(`${this.api}/${userId}`).subscribe({
      next: () => { this.snack.open('User deleted', 'Close', { duration: 3000 }); this.load(); },
      error: (err) => this.snack.open(err.error?.error || 'Delete failed', 'Close', { duration: 3000 })
    });
  }

  // Add getRoleLabel and other methods as needed
}
