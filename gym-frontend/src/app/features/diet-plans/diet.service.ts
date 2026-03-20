import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DietPlanService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getAll(): Observable<any[]> { return this.http.get<any[]>(`${this.apiUrl}/diets`); }
  getById(id: string): Observable<any> { return this.http.get<any>(`${this.apiUrl}/diets/${id}`); }
  create(data: any): Observable<any> { return this.http.post<any>(`${this.apiUrl}/diets`, data); }
  update(id: string, data: any): Observable<any> { return this.http.put<any>(`${this.apiUrl}/diets/${id}`, data); }
  delete(id: string): Observable<any> { return this.http.delete<any>(`${this.apiUrl}/diets/${id}`); }

  getMembers(): Observable<any[]> { return this.http.get<any[]>(`${this.apiUrl}/members`); }
  getTrainers(): Observable<any[]> { return this.http.get<any[]>(`${this.apiUrl}/trainers`); }
}
