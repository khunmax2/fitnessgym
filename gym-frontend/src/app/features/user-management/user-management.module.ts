import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { UserManagementComponent } from './user-management.component';
import { EditUserDialogComponent } from './edit-user-dialog.component';
import { RoleGuard } from '../../core/guards/role.guard';

@NgModule({
  declarations: [UserManagementComponent, EditUserDialogComponent],
  imports: [
    CommonModule,
    FormsModule, ReactiveFormsModule,
    MatTableModule, MatPaginatorModule, MatIconModule, MatCardModule,
    MatInputModule, MatFormFieldModule, MatButtonModule,
    MatSnackBarModule, MatTooltipModule, MatDialogModule,
    MatSelectModule, MatDatepickerModule, MatNativeDateModule,
    RouterModule.forChild([
      {
        path: '',
        component: UserManagementComponent,
        canActivate: [RoleGuard],
        data: { roles: ['admin'] }
      }
    ])
  ]
})
export class UserManagementModule {}
