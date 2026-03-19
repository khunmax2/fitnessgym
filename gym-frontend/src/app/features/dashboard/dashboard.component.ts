import { Component, OnInit, AfterViewInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { forkJoin } from 'rxjs';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, AfterViewInit {
  today = new Date();
  private api = environment.apiUrl;

  stats = { members: 0, trainers: 0, classes: 0, revenue: 0, activeMembers: 0, expiredMembers: 0, pendingPayments: 0, equipment: 0 };
  recentMembers: any[] = [];
  recentPayments: any[] = [];
  activities: any[] = [];
  loading = true;

  private revenueChart?: Chart;
  private memberChart?: Chart;

  constructor(private http: HttpClient) {}

  ngOnInit() { this.loadData(); }

  ngAfterViewInit() { setTimeout(() => this.buildCharts(), 300); }

  loadData() {
    forkJoin({
      members:  this.http.get<any[]>(`${this.api}/members`),
      trainers: this.http.get<any[]>(`${this.api}/trainers`),
      classes:  this.http.get<any[]>(`${this.api}/classes`),
      payments: this.http.get<any[]>(`${this.api}/payments`),
      equipment:this.http.get<any[]>(`${this.api}/equipment`),
    }).subscribe({
      next: (d) => {
        this.stats.members        = d.members.length;
        this.stats.trainers       = d.trainers.length;
        this.stats.classes        = d.classes.length;
        this.stats.equipment      = d.equipment.length;
        this.stats.activeMembers  = d.members.filter((m: any) => m.status === 'active').length;
        this.stats.expiredMembers = d.members.filter((m: any) => m.status === 'expired').length;
        this.stats.revenue        = d.payments.filter((p: any) => p.status === 'paid').reduce((s: number, p: any) => s + Number(p.amount), 0);
        this.stats.pendingPayments= d.payments.filter((p: any) => p.status === 'pending').length;
        this.recentMembers        = d.members.slice(0, 5);
        this.recentPayments       = d.payments.slice(0, 5);
        this.buildActivities(d.members, d.payments);
        this.loading = false;
        setTimeout(() => this.buildCharts(), 100);
      },
      error: () => { this.loading = false; this.buildCharts(); }
    });
  }

  buildActivities(members: any[], payments: any[]) {
    const acts: any[] = [];
    members.slice(0, 3).forEach(m => acts.push({ icon: '👤', text: `สมาชิกใหม่: ${m.name}`, time: 'ล่าสุด', color: '#22c55e' }));
    payments.filter((p: any) => p.status === 'paid').slice(0, 2).forEach(p => acts.push({ icon: '💳', text: `รับชำระ ฿${Number(p.amount).toLocaleString()}`, time: 'ล่าสุด', color: '#60a5fa' }));
    if (this.stats.expiredMembers) acts.push({ icon: '⚠️', text: `${this.stats.expiredMembers} สมาชิกหมดอายุ`, time: 'แจ้งเตือน', color: '#E8003D' });
    this.activities = acts.slice(0, 6);
  }

  buildCharts() {
    // Revenue Bar Chart
    const rCanvas = document.getElementById('revenueChart') as HTMLCanvasElement;
    if (rCanvas) {
      this.revenueChart?.destroy();
      this.revenueChart = new Chart(rCanvas, {
        type: 'bar',
        data: {
          labels: ['ต.ค.','พ.ย.','ธ.ค.','ม.ค.','ก.พ.','มี.ค.'],
          datasets: [{
            label: 'Revenue (฿)',
            data: [38000, 52000, 61000, 45000, 58000, this.stats.revenue || 48200],
            backgroundColor: 'rgba(232,0,61,0.7)',
            borderColor: '#E8003D',
            borderWidth: 1,
            borderRadius: 4,
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#666' } },
            y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#666', callback: v => '฿' + Number(v).toLocaleString() } }
          }
        }
      });
    }

    // Membership Donut Chart
    const mCanvas = document.getElementById('memberChart') as HTMLCanvasElement;
    if (mCanvas) {
      this.memberChart?.destroy();
      const active  = this.stats.activeMembers  || 982;
      const expired = this.stats.expiredMembers || 34;
      const inactive= (this.stats.members - active - expired) || 232;
      this.memberChart = new Chart(mCanvas, {
        type: 'doughnut',
        data: {
          labels: ['Active', 'Expired', 'Inactive'],
          datasets: [{
            data: [active, expired, inactive],
            backgroundColor: ['rgba(34,197,94,0.8)', 'rgba(232,0,61,0.8)', 'rgba(100,100,100,0.5)'],
            borderColor: ['#22c55e', '#E8003D', '#444'],
            borderWidth: 1,
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom', labels: { color: '#888', padding: 16, font: { size: 11 } } } },
          cutout: '70%',
        }
      });
    }
  }

  formatCurrency(n: number) { return '฿' + n.toLocaleString(); }
  getInitials(name: string) { return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??'; }
  getAvatarBg(name: string) {
    const c = ['#3a1a2a','#1a2a3a','#1a3a1a','#2a2a1a','#2a1a3a'];
    return c[(name?.charCodeAt(0) || 0) % c.length];
  }
}
