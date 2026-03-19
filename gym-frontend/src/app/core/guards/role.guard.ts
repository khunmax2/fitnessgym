import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const requiredRoles: string[] = route.data['roles'] || [];
    const user = this.authService.currentUserSubject?.value;

    if (!user) {
      this.router.navigate(['/login']);
      return false;
    }

    if (requiredRoles.length === 0 || requiredRoles.includes(user.role)) {
      return true;
    }

    // ไม่มีสิทธิ์ → redirect กลับ dashboard
    this.router.navigate(['/dashboard']);
    return false;
  }
}
