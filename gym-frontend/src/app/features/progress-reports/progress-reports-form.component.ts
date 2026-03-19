import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProgressReportService } from './progress.service';

@Component({
  selector: 'app-progress-reports-form',
  templateUrl: './progress-reports-form.component.html'
})
export class ProgressReportFormComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private service: ProgressReportService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<ProgressReportFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.isEdit = !!this.data;
    this.form = this.fb.group({
      name: [this.data?.name || '', Validators.required],
      email: [this.data?.email || '', [Validators.email]],
      phone: [this.data?.phone || ''],
      status: [this.data?.status || 'active']
    });
    if (this.data) this.form.patchValue(this.data);
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    const action = this.isEdit
      ? this.service.update(this.data.id, this.form.value)
      : this.service.create(this.form.value);

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
