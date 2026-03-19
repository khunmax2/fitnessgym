import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MemberService } from './members.service';

@Component({ selector: 'app-members-form', templateUrl: './members-form.component.html' })
export class MembersFormComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  loading = false;

  constructor(
    private fb: FormBuilder, private service: MemberService,
    private snack: MatSnackBar, public dialogRef: MatDialogRef<MembersFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit() {
    this.isEdit = !!this.data;
    const today = new Date().toISOString().split('T')[0];
    const nextMonth = new Date(Date.now() + 30*86400000).toISOString().split('T')[0];
    this.form = this.fb.group({
      name:            [this.data?.name || '', Validators.required],
      email:           [this.data?.email || '', Validators.email],
      phone:           [this.data?.phone || ''],
      membership_type: [this.data?.membership_type || 'monthly'],
      start_date:      [this.data?.start_date?.slice(0,10) || today],
      end_date:        [this.data?.end_date?.slice(0,10) || nextMonth],
      status:          [this.data?.status || 'active']
    });
  }

  onSubmit() {
    if (this.form.invalid) return;
    this.loading = true;
    const action = this.isEdit
      ? this.service.update(this.data.id, this.form.value)
      : this.service.create(this.form.value);
    action.subscribe({
      next: () => { this.snack.open(this.isEdit ? 'Updated!' : 'Created!', 'Close', { duration: 3000 }); this.dialogRef.close(true); },
      error: err => { this.snack.open(err.error?.error || 'Error', 'Close', { duration: 3000 }); this.loading = false; }
    });
  }
  onCancel() { this.dialogRef.close(); }
}
