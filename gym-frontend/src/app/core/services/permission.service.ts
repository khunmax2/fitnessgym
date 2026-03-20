import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';

export type Role = 'admin' | 'staff' | 'trainer' | 'member';

const PERMISSIONS: Record<Role, string[]> = {
  admin: [
    'dashboard:view',
    'members:read','members:create','members:update','members:delete',
    'trainers:read','trainers:create','trainers:update','trainers:delete',
    'classes:read','classes:create','classes:update','classes:delete',
    'equipment:read','equipment:create','equipment:update','equipment:delete',
    'schedules:read','schedules:create','schedules:update','schedules:delete',
    'payments:read','payments:create','payments:update','payments:delete',
    'diets:read','diets:create','diets:update','diets:delete',
    'progress:read','progress:create','progress:update','progress:delete',
    'users:read','users:update','users:delete',
    'notifications:read',
  ],
  staff: [
    'dashboard:view',
    'members:read','members:create',
    'trainers:read',
    'classes:read',
    'equipment:read',
    'schedules:read','schedules:create',
    'payments:read','payments:create',
    'diets:read','diets:create',
    'progress:read','progress:create',
    'notifications:read',
  ],
  trainer: [
    'classes:read',
    'schedules:read',
    'diets:read','diets:create','diets:update',
    'progress:read','progress:create','progress:update',
    'members:read',
    'notifications:read',
  ],
  member: [
    'profile:read',
    'member-home:view',
    'schedules:read',
    'bookings:create',
    'classes:read',
    'progress:read',
    'diets:read',
    'payments:read',
    'notifications:read',
  ],
};

@Injectable({ providedIn: 'root' })
export class PermissionService {
  constructor(private authService: AuthService) {}

  get role(): Role {
    return (this.authService.currentUserSubject?.value?.role as Role) || 'member';
  }

  can(permission: string): boolean {
    return PERMISSIONS[this.role]?.includes(permission) ?? false;
  }

  isAdmin():   boolean { return this.role === 'admin'; }
  isStaff():   boolean { return this.role === 'staff'; }
  isTrainer(): boolean { return this.role === 'trainer'; }
  isMember():  boolean { return this.role === 'member'; }

  canManage(): boolean { return this.isAdmin() || this.isStaff(); }

  canCreate(module: string) { return this.can(`${module}:create`); }
  canUpdate(module: string) { return this.can(`${module}:update`); }
  canDelete(module: string) { return this.can(`${module}:delete`); }
  canRead(module: string)   { return this.can(`${module}:read`); }
}
