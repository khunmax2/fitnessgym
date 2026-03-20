import { Component, OnInit } from '@angular/core';
import { MemberService } from '../member.service';

@Component({
  selector: 'app-my-progress',
  templateUrl: './my-progress.component.html',
  styleUrls: ['./my-progress.component.scss']
})
export class MyProgressComponent implements OnInit {
  loading = false;
  reports: any[] = [];

  get latestReport(): any { return this.reports[0] || null; }
  get previousReport(): any { return this.reports[1] || null; }

  constructor(private memberService: MemberService) {}

  ngOnInit(): void {
    this.loading = true;
    this.memberService.getMyProgress().subscribe({
      next: (data) => { this.reports = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  diff(field: string): number | null {
    if (!this.latestReport || !this.previousReport) return null;
    const a = this.latestReport[field];
    const b = this.previousReport[field];
    if (a == null || b == null) return null;
    return Number((Number(a) - Number(b)).toFixed(2));
  }

  diffSign(field: string): string {
    const d = this.diff(field);
    if (d === null) return '';
    return d > 0 ? '+' : '';
  }

  diffClass(field: string, lowerIsBetter = true): string {
    const d = this.diff(field);
    if (d === null || d === 0) return '';
    if (lowerIsBetter) return d < 0 ? 'good' : 'bad';
    return d > 0 ? 'good' : 'bad';
  }
}
