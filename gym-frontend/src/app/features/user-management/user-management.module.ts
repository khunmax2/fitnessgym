import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UserManagementComponent } from './user-management.component';
import { RoleGuard } from '../../core/guards/role.guard';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [UserManagementComponent],
  imports: [
    CommonModule,
    FormsModule,MatTableModule, MatPaginatorModule, MatIconModule, MatCardModule,
    MatInputModule, MatFormFieldModule, MatButtonModule,
    MatSnackBarModule, MatTooltipModule,
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
