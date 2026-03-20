import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { ScheduleListComponent } from './schedules-list.component';
import { ScheduleFormComponent } from './schedules-form.component';

@NgModule({
  declarations: [ScheduleListComponent, ScheduleFormComponent],
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule,
    RouterModule.forChild([
      { path: '', component: ScheduleListComponent },
    ]),
    MatTableModule, MatButtonModule, MatIconModule, MatCardModule,
    MatInputModule, MatDialogModule, MatSnackBarModule, MatFormFieldModule,
    MatSelectModule, MatChipsModule, MatPaginatorModule,
    MatDatepickerModule, MatNativeDateModule
  ]
})
export class SchedulesModule {}
