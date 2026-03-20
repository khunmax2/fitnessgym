import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MemberService {
  private api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Member profile
  getMyProfile(): Observable<any> {
    return this.http.get<any>(`${this.api}/members/me`);
  }

  // Own schedules
  getMySchedules(): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/schedules/my`);
  }

  // Cancel a booking
  cancelBooking(schedule_id: string): Observable<any> {
    return this.http.post<any>(`${this.api}/schedules/cancel`, { schedule_id });
  }

  // Available classes to browse
  getAvailableClasses(): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/classes/available`);
  }

  // Book a class
  bookClass(class_id: string, scheduled_at: string): Observable<any> {
    return this.http.post<any>(`${this.api}/schedules/book`, { class_id, scheduled_at });
  }

  // Own progress reports
  getMyProgress(): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/progress/my`);
  }

  // Own diet plans
  getMyDietPlans(): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/diets/my`);
  }

  // Own payments
  getMyPayments(): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/payments/my`);
  }
}
