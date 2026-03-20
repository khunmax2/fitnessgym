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

    const dt = schedule?.scheduled_at ? new Date(schedule.scheduled_at) : new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timeStr = `${pad(dt.getHours())}:${pad(dt.getMinutes())}`;

    this.form = this.fb.group({
      class_id:     [schedule?.class_id || '', Validators.required],
      member_id:    [schedule?.member_id || '', Validators.required],
      schedule_date: [dt, Validators.required],
      schedule_time: [timeStr, Validators.required],
      status:       [schedule?.status || 'booked']
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    const val = this.form.value;
    const d = new Date(val.schedule_date);
    const [hh, mm] = val.schedule_time.split(':');
    d.setHours(+hh, +mm, 0, 0);
    const payload = {
      class_id: val.class_id,
      member_id: val.member_id,
      scheduled_at: d.toISOString(),
      status: val.status
    };
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
