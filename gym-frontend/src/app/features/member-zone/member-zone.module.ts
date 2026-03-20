import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { MatCardModule }     from '@angular/material/card';
import { MatIconModule }     from '@angular/material/icon';
import { MatButtonModule }   from '@angular/material/button';
import { MatInputModule }    from '@angular/material/input';
import { MatFormFieldModule }from '@angular/material/form-field';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule }  from '@angular/material/tooltip';
import { MatSelectModule }   from '@angular/material/select';

import { MemberDashboardComponent } from './member-dashboard/member-dashboard.component';
import { MyClassesComponent }       from './my-classes/my-classes.component';
import { MyScheduleComponent }      from './my-schedule/my-schedule.component';
import { MyProgressComponent }      from './my-progress/my-progress.component';
import { MyDietComponent }          from './my-diet/my-diet.component';
import { MyPaymentsComponent }      from './my-payments/my-payments.component';

const routes: Routes = [
  { path: '',           component: MemberDashboardComponent },
  { path: 'classes',   component: MyClassesComponent },
  { path: 'schedule',  component: MyScheduleComponent },
  { path: 'progress',  component: MyProgressComponent },
  { path: 'diet',      component: MyDietComponent },
  { path: 'payments',  component: MyPaymentsComponent },
];

@NgModule({
  declarations: [
    MemberDashboardComponent,
    MyClassesComponent,
    MyScheduleComponent,
    MyProgressComponent,
    MyDietComponent,
    MyPaymentsComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes),
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatSelectModule,
  ]
})
export class MemberZoneModule {}
