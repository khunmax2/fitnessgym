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
import { PaymentListComponent } from './payments-list.component';
import { PaymentFormComponent } from './payments-form.component';

@NgModule({
  declarations: [PaymentListComponent, PaymentFormComponent],
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule,
    RouterModule.forChild([
      { path: '', component: PaymentListComponent },
    ]),
    MatTableModule, MatButtonModule, MatIconModule, MatCardModule,
    MatInputModule, MatDialogModule, MatSnackBarModule, MatFormFieldModule,
    MatSelectModule, MatChipsModule, MatPaginatorModule
  ]
})
export class PaymentsModule {}
