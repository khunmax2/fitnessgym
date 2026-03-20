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
  pendingUsers: any[] = [];
  selectedPendingUserId: string | null = null;
  selectedPendingUser: any = null;

  constructor(
    private fb: FormBuilder, private service: MemberService,
    private snack: MatSnackBar, public dialogRef: MatDialogRef<MembersFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit() {
    const member = this.data?.member || null;
    this.isEdit = !!member;
    this.pendingUsers = this.data?.pendingUsers || [];
    const today = new Date().toISOString().split('T')[0];
    const nextMonth = new Date(Date.now() + 30*86400000).toISOString().split('T')[0];

    this.form = this.fb.group({
      name:            [member?.name || '', Validators.required],
      email:           [member?.email || '', Validators.email],
      phone:           [member?.phone || ''],
      date_of_birth:   [member?.date_of_birth ? new Date(member.date_of_birth) : null],
      gender:          [member?.gender || ''],
      emergency_contact: [member?.emergency_contact || ''],
      emergency_name:  [member?.emergency_name || ''],
      medical_conditions: [member?.medical_conditions || ''],
      membership_type: [member?.membership_type || 'monthly'],
      start_date:      [member?.start_date?.slice(0,10) || today],
      end_date:        [member?.end_date?.slice(0,10) || nextMonth],
      status:          [member?.status || 'active']
    });

    if (this.isEdit) {
      this.selectedPendingUser = member;
      this.selectedPendingUserId = member?.id || null;
    }
  }

  onPendingUserSelected() {
    if (!this.selectedPendingUserId) {
      this.selectedPendingUser = null;
      this.form.patchValue({ name: '', email: '', phone: '' });
      return;
    }
    const selected = this.pendingUsers.find(u => u.id === this.selectedPendingUserId);
    if (!selected) {
      this.selectedPendingUser = null;
      return;
    }
    this.selectedPendingUser = selected;
    this.form.patchValue({
      name: selected.name || '',
      email: selected.email || '',
      phone: selected.phone || '',
      date_of_birth: selected.date_of_birth ? new Date(selected.date_of_birth) : null,
      gender: selected.gender || ''
    });
  }

  onSubmit() {
    if (this.form.invalid) return;
    if (!this.isEdit && (!this.selectedPendingUserId || typeof this.selectedPendingUserId !== 'string')) {
      this.snack.open('กรุณาเลือกผู้ใช้ที่รอการยืนยันก่อนเพิ่มสมาชิก', 'Close', { duration: 3000 });
      return;
    }
    // เพิ่ม validation user_id ว่าเป็น UUID
    if (!this.isEdit && this.selectedPendingUserId && !/^[0-9a-fA-F-]{36}$/.test(this.selectedPendingUserId)) {
      this.snack.open('user_id ไม่ถูกต้อง กรุณาเลือกใหม่', 'Close', { duration: 3000 });
      return;
    }

    this.loading = true;
    let action;
    const val = { ...this.form.value };
    if (val.date_of_birth instanceof Date) val.date_of_birth = val.date_of_birth.toISOString().slice(0, 10);

    if (this.isEdit) {
      action = this.service.update(this.data.member.id, val);
    } else {
      action = this.service.convertFromUser({
        user_id: this.selectedPendingUserId,
        membership_type: val.membership_type,
        start_date: val.start_date,
        end_date: val.end_date,
        status: val.status,
        date_of_birth: val.date_of_birth,
        gender: val.gender,
        emergency_contact: val.emergency_contact,
        emergency_name: val.emergency_name,
        medical_conditions: val.medical_conditions
      });
    }

    action.subscribe({
      next: () => {
        this.snack.open(this.isEdit ? 'Updated!' : 'Added from user!', 'Close', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: err => {
        this.snack.open(err.error?.error || 'Error', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  onCancel() { this.dialogRef.close(); }
}
