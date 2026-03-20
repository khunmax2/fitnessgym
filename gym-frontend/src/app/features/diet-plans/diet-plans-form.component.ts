import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DietPlanService } from './diet.service';

@Component({
  selector: 'app-diet-plans-form',
  templateUrl: './diet-plans-form.component.html'
})
export class DietPlanFormComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  loading = false;
  members: any[] = [];
  trainers: any[] = [];

  constructor(
    private fb: FormBuilder,
    private service: DietPlanService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<DietPlanFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.members = this.data?.members || [];
    this.trainers = this.data?.trainers || [];
    const diet = this.data?.diet;
    this.isEdit = !!diet;

    const meals = diet?.meals || {};

    this.form = this.fb.group({
      member_id: [diet?.member_id || '', Validators.required],
      trainer_id: [diet?.trainer_id || ''],
      calories: [diet?.calories || null, [Validators.min(100), Validators.max(10000)]],
      breakfast: [meals.breakfast || ''],
      lunch: [meals.lunch || ''],
      dinner: [meals.dinner || ''],
      snacks: [meals.snacks || ''],
      notes: [diet?.notes || ''],
      start_date: [diet?.start_date ? new Date(diet.start_date) : null],
      end_date: [diet?.end_date ? new Date(diet.end_date) : null]
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;

    const val = { ...this.form.value };
    // Format dates to YYYY-MM-DD
    if (val.start_date instanceof Date) val.start_date = val.start_date.toISOString().slice(0, 10);
    if (val.end_date instanceof Date) val.end_date = val.end_date.toISOString().slice(0, 10);
    // Build meals object from separate fields
    val.meals = {
      breakfast: val.breakfast || '',
      lunch: val.lunch || '',
      dinner: val.dinner || '',
      snacks: val.snacks || ''
    };
    delete val.breakfast;
    delete val.lunch;
    delete val.dinner;
    delete val.snacks;

    const action = this.isEdit
      ? this.service.update(this.data.diet.id, val)
      : this.service.create(val);

    action.subscribe({
      next: () => {
        this.snackBar.open(this.isEdit ? 'Updated!' : 'Created!', 'Close', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.snackBar.open(err.error?.error || 'Error occurred', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  onCancel(): void { this.dialogRef.close(); }
}
