import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ScheduleService } from './schedules.service';

@Component({
  selector: 'app-schedules-form',
  templateUrl: './schedules-form.component.html'
})
export class ScheduleFormComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  loading = false;
  classes: any[] = [];
  members: any[] = [];

  constructor(
    private fb: FormBuilder,
    private service: ScheduleService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<ScheduleFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    const schedule = this.data?.schedule || null;
    this.classes = this.data?.classes || [];
    this.members = this.data?.members || [];
    this.isEdit = !!schedule;

    const now = new Date();
    const defaultDateTime = now.toISOString().slice(0, 16);

    this.form = this.fb.group({
      class_id:     [schedule?.class_id || '', Validators.required],
      member_id:    [schedule?.member_id || '', Validators.required],
      scheduled_at: [schedule?.scheduled_at?.slice(0, 16) || defaultDateTime, Validators.required],
      status:       [schedule?.status || 'booked']
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    const payload = { ...this.form.value };
    const action = this.isEdit
      ? this.service.update(this.data.schedule.id, payload)
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
