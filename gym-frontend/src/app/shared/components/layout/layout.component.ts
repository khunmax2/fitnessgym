import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { PermissionService } from '../../../core/services/permission.service';
import { UserRole } from '../../../core/services/role.enum';

interface NavItem {
  path: string;
  icon: string;
  label: string;
  roles?: UserRole[]; // ถ้าไม่ระบุ = ทุกคนเห็น
}

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss']
})
export class LayoutComponent implements OnInit {
    // Role label/color mapping (same as user-management)
    roleMap: Record<string, { color: string; label: string }> = {
      admin:   { color: '#E8003D', label: 'Admin' },
      staff:   { color: '#60a5fa', label: 'Staff' },
      trainer: { color: '#f59e0b', label: 'Trainer' },
      member:  { color: '#22c55e', label: 'Member' }
    };
    getRoleLabel(role: string): string {
      return this.roleMap[role?.toLowerCase()]?.label || role;
    }
    getRoleColor(role: string): string {
      return this.roleMap[role?.toLowerCase()]?.color || '#888';
    }
  sidenavExpanded = false;
  showNotifications = false;
  currentLabel = 'Overview';

  allNavItems: NavItem[] = [
    { path: '/dashboard/overview',         icon: 'dashboard',         label: 'Overview' },
    { path: '/dashboard/members',          icon: 'people',            label: 'Members', roles: [UserRole.Admin, UserRole.Staff] },
    { path: '/dashboard/trainers',         icon: 'fitness_center',    label: 'Trainers', roles: [UserRole.Admin, UserRole.Staff] },
    { path: '/dashboard/classes',          icon: 'directions_run',    label: 'Classes', roles: [UserRole.Admin, UserRole.Staff, UserRole.Trainer] },
    { path: '/dashboard/equipment',        icon: 'sports_gymnastics', label: 'Equipment', roles: [UserRole.Admin, UserRole.Staff] },
    { path: '/dashboard/schedules',        icon: 'calendar_month',    label: 'Schedules', roles: [UserRole.Admin, UserRole.Staff, UserRole.Trainer, UserRole.Member] },
    { path: '/dashboard/payments',         icon: 'payments',          label: 'Payments', roles: [UserRole.Admin, UserRole.Staff] },
    { path: '/dashboard/diet-plans',       icon: 'restaurant_menu',   label: 'Diet Plans', roles: [UserRole.Admin, UserRole.Trainer] },
    { path: '/dashboard/progress-reports', icon: 'bar_chart',         label: 'Progress', roles: [UserRole.Admin, UserRole.Trainer, UserRole.Member] },
    { path: '/dashboard/users',            icon: 'manage_accounts',   label: 'Users', roles: [UserRole.Admin] },
  ];

  get navItems(): NavItem[] {
    // ถ้า roles ไม่ระบุ = ทุกคนเห็น, ถ้ามี roles = ต้องมี role ตรงกับ user
    return this.allNavItems.filter(n => !n.roles || this.authService.hasRole(n.roles));
  }

  get userInitials(): string {
    const name = this.authService.currentUserSubject?.value?.name || 'AD';
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  }
  get userName(): string  { return this.authService.currentUserSubject?.value?.name || ''; }
  get userRole(): string  { return this.authService.currentUserSubject?.value?.role || ''; }
  get isAdmin(): boolean  { return this.authService.isAdmin; }

  constructor(
    public authService: AuthService,
    public notifService: NotificationService,
    public permissionService: PermissionService,
    private router: Router
  ) {
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe((e: any) => {
      const found = this.allNavItems.find(n => e.url.startsWith(n.path));
      this.currentLabel = found ? found.label : 'Dashboard';
      this.showNotifications = false;
    });
  }

  ngOnInit(): void { this.notifService.startPolling(); }

  goProfile():  void { this.router.navigate(['/dashboard/profile']); }
  logout():     void { this.authService.logout(); }
  toggleNotifications(): void { this.showNotifications = !this.showNotifications; }
  markAllRead(): void { this.notifService.markAllRead().subscribe(() => this.notifService.refresh()); }
  closeNotif(id: string): void { this.notifService.delete(id).subscribe(() => this.notifService.refresh()); }
}
