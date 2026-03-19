import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class EquipmentService {
  private apiUrl = `${environment.apiUrl}/equipment`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<any[]> { return this.http.get<any[]>(this.apiUrl); }
  getById(id: string): Observable<any> { return this.http.get<any>(`${this.apiUrl}/${id}`); }
  create(data: any): Observable<any> { return this.http.post<any>(this.apiUrl, data); }
  update(id: string, data: any): Observable<any> { return this.http.put<any>(`${this.apiUrl}/${id}`, data); }
  delete(id: string): Observable<any> { return this.http.delete<any>(`${this.apiUrl}/${id}`); }
}
