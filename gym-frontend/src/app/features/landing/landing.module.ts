import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { LandingComponent } from './landing.component';
import { ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [LandingComponent],
  imports: [
    CommonModule,
    MatIconModule,
    ReactiveFormsModule,
    RouterModule.forChild([
      { path: '', component: LandingComponent }
    ])
  ]
})
export class LandingModule {}
