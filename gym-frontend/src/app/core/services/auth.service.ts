import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { UserRole } from './role.enum';
import { environment } from '../../../environments/environment';

export interface User {
  id: string; name: string; email: string; role: string; phone?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = environment.apiUrl + '/auth';
  currentUserSubject = new BehaviorSubject<User | null>(this.getStoredUser());
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap(res => this.saveSession(res))
    );
  }

  register(name: string, email: string, password: string, phone?: string): Observable<any> {
    // ไม่ auto-login หลังสมัคร
    return this.http.post<any>(`${this.apiUrl}/register`, { name, email, password, phone });
  }

  private saveSession(res: any): void {
    localStorage.setItem('token', res.token);
    localStorage.setItem('user', JSON.stringify(res.user));
    this.currentUserSubject.next(res.user);
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
    this.router.navigate(['/']);
  }

  getToken(): string | null { return localStorage.getItem('token'); }
  isLoggedIn(): boolean { return !!this.getToken(); }

  get currentRole(): string { return this.currentUserSubject.value?.role || ''; }
  get isAdmin():   boolean { return this.currentRole === 'admin'; }
  get isStaff():   boolean { return this.currentRole === 'staff'; }
  get isTrainer(): boolean { return this.currentRole === 'trainer'; }
  get isMember():  boolean { return this.currentRole === 'member'; }

  /**
   * Get current user's role as UserRole enum (or null)
   */
  getUserRole(): UserRole | null {
    const role = this.currentUserSubject.value?.role || '';
    if (role && Object.values(UserRole).includes(role as UserRole)) {
      return role as UserRole;
    }
    return null;
  }

  /**
   * Check if current user has one of the allowed roles
   */
  hasRole(roles: UserRole[]): boolean {
    const userRole = this.getUserRole();
    return userRole ? roles.includes(userRole) : false;
  }

  private getStoredUser(): User | null {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  }
}
