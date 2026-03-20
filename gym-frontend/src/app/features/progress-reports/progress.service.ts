import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProgressReportService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getAll(): Observable<any[]> { return this.http.get<any[]>(`${this.apiUrl}/progress`); }
  getById(id: string): Observable<any> { return this.http.get<any>(`${this.apiUrl}/progress/${id}`); }
  create(data: any): Observable<any> { return this.http.post<any>(`${this.apiUrl}/progress`, data); }
  update(id: string, data: any): Observable<any> { return this.http.put<any>(`${this.apiUrl}/progress/${id}`, data); }
  delete(id: string): Observable<any> { return this.http.delete<any>(`${this.apiUrl}/progress/${id}`); }

  getMembers(): Observable<any[]> { return this.http.get<any[]>(`${this.apiUrl}/members`); }
}
