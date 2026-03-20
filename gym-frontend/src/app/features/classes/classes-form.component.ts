import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ClassService } from './classes.service';

@Component({
  selector: 'app-classes-form',
  templateUrl: './classes-form.component.html'
})
export class ClassFormComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  loading = false;
  trainers: any[] = [];

  constructor(
    private fb: FormBuilder,
    private service: ClassService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<ClassFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    const cls = this.data?.classItem || null;
    this.trainers = this.data?.trainers || [];
    this.isEdit = !!cls;

    this.form = this.fb.group({
      name:             [cls?.name || '', Validators.required],
      trainer_id:       [cls?.trainer_id || ''],
      capacity:         [cls?.capacity ?? 10, [Validators.required, Validators.min(1)]],
      duration_minutes: [cls?.duration_minutes ?? 60, [Validators.required, Validators.min(1)]],
      description:      [cls?.description || '']
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    const payload = { ...this.form.value };
    if (!payload.trainer_id) payload.trainer_id = null;

    const action = this.isEdit
      ? this.service.update(this.data.classItem.id, payload)
      : this.service.create(payload);

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
