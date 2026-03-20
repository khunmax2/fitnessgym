import { Component, OnInit } from '@angular/core';
import { MemberService } from '../member.service';

@Component({
  selector: 'app-my-diet',
  templateUrl: './my-diet.component.html',
  styleUrls: ['./my-diet.component.scss']
})
export class MyDietComponent implements OnInit {
  loading = false;
  dietPlans: any[] = [];

  constructor(private memberService: MemberService) {}

  ngOnInit(): void {
    this.loading = true;
    this.memberService.getMyDietPlans().subscribe({
      next: (data) => { this.dietPlans = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  getMeals(meals: any): { name: string; details: string }[] {
    if (!meals) return [];
    if (Array.isArray(meals)) return meals;
    if (typeof meals === 'object') return Object.entries(meals).map(([k, v]) => ({ name: k, details: String(v) }));
    return [];
  }

  isActive(plan: any): boolean {
    const now = new Date();
    const start = plan.start_date ? new Date(plan.start_date) : null;
    const end   = plan.end_date   ? new Date(plan.end_date)   : null;
    return (!start || start <= now) && (!end || end >= now);
  }
}
