import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, interval } from 'rxjs';
import { switchMap, startWith } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  is_read: boolean;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private api = `${environment.apiUrl}/notifications`;
  private _unread = new BehaviorSubject<number>(0);
  private _list   = new BehaviorSubject<Notification[]>([]);

  unread$ = this._unread.asObservable();
  list$   = this._list.asObservable();

  constructor(private http: HttpClient) {}

  // เริ่ม polling ทุก 60 วินาที
  startPolling(): void {
    interval(60000).pipe(startWith(0), switchMap(() => this.http.get<Notification[]>(this.api)))
      .subscribe({ next: list => { this._list.next(list); this._unread.next(list.filter(n => !n.is_read).length); }, error: () => {} });
  }

  markRead(id: string): Observable<any> {
    return this.http.patch(`${this.api}/${id}/read`, {});
  }

  markAllRead(): Observable<any> {
    return this.http.patch(`${this.api}/read-all`, {});
  }

  delete(id: string): Observable<any> {
    return this.http.delete(`${this.api}/${id}`);
  }

  refresh(): void {
    this.http.get<Notification[]>(this.api).subscribe({
      next: list => { this._list.next(list); this._unread.next(list.filter(n => !n.is_read).length); },
      error: () => {}
    });
  }
}
