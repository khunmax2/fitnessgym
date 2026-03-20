import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent }    from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { LayoutComponent }   from './shared/components/layout/layout.component';
import { AuthGuard }         from './core/guards/auth.guard';

const routes: Routes = [
  // ── PUBLIC ─────────────────────────────────────────────────────
  { path: '', loadChildren: () => import('./features/landing/landing.module').then(m => m.LandingModule) },
  { path: 'login',    component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  // ── PROTECTED DASHBOARD ────────────────────────────────────────
  {
    path: 'dashboard',
    component: LayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      { path: 'overview',         loadChildren: () => import('./features/dashboard/dashboard.module').then(m => m.DashboardModule) },
      { path: 'members',          loadChildren: () => import('./features/members/members.module').then(m => m.MembersModule) },
      { path: 'trainers',         loadChildren: () => import('./features/trainers/trainers.module').then(m => m.TrainersModule) },
      { path: 'classes',          loadChildren: () => import('./features/classes/classes.module').then(m => m.ClassesModule) },
      { path: 'equipment',        loadChildren: () => import('./features/equipment/equipment.module').then(m => m.EquipmentModule) },
      { path: 'schedules',        loadChildren: () => import('./features/schedules/schedules.module').then(m => m.SchedulesModule) },
      { path: 'payments',         loadChildren: () => import('./features/payments/payments.module').then(m => m.PaymentsModule) },
      { path: 'diet-plans',       loadChildren: () => import('./features/diet-plans/diet-plans.module').then(m => m.DietPlansModule) },
      { path: 'progress-reports', loadChildren: () => import('./features/progress-reports/progress-reports.module').then(m => m.ProgressReportsModule) },
      { path: 'profile',          loadChildren: () => import('./features/profile/profile.module').then(m => m.ProfileModule) },
      { path: 'users',            loadChildren: () => import('./features/user-management/user-management.module').then(m => m.UserManagementModule) },
      { path: 'member-home',      loadChildren: () => import('./features/member-zone/member-zone.module').then(m => m.MemberZoneModule) },
    ]
  },

  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
