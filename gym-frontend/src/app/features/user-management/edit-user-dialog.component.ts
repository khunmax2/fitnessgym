import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-edit-user-dialog',
  template: `
    <h2 mat-dialog-title class="gym-dialog-title">
      <mat-icon>edit</mat-icon> แก้ไขโปรไฟล์ผู้ใช้
    </h2>

    <mat-dialog-content class="gym-form">
      <form [formGroup]="form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>ชื่อ-นามสกุล</mat-label>
          <mat-icon matPrefix>person</mat-icon>
          <input matInput formControlName="name">
          <mat-error>จำเป็นต้องกรอก</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Email</mat-label>
          <mat-icon matPrefix>alternate_email</mat-icon>
          <input matInput formControlName="email" type="email">
          <mat-error>Email ไม่ถูกต้อง</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>เบอร์โทรศัพท์</mat-label>
          <mat-icon matPrefix>phone</mat-icon>
          <input matInput formControlName="phone" maxlength="10" placeholder="0891234567">
          <mat-error>เบอร์โทรต้องเป็นตัวเลข 10 หลัก ขึ้นต้นด้วย 0</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>วันเกิด</mat-label>
          <input matInput [matDatepicker]="dobPicker" formControlName="date_of_birth">
          <mat-datepicker-toggle matSuffix [for]="dobPicker"></mat-datepicker-toggle>
          <mat-datepicker #dobPicker></mat-datepicker>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>เพศ</mat-label>
          <mat-icon matPrefix>wc</mat-icon>
          <mat-select formControlName="gender">
            <mat-option [value]="null">ไม่ระบุ</mat-option>
            <mat-option value="male">ชาย</mat-option>
            <mat-option value="female">หญิง</mat-option>
            <mat-option value="other">อื่นๆ</mat-option>
          </mat-select>
        </mat-form-field>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close [disabled]="loading">ยกเลิก</button>
      <button mat-raised-button color="primary" (click)="save()" [disabled]="form.invalid || loading">
        {{ loading ? 'กำลังบันทึก...' : 'บันทึก' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width { width: 100%; }
  `]
})
export class EditUserDialogComponent implements OnInit {
  form!: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private snack: MatSnackBar,
    private dialogRef: MatDialogRef<EditUserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { user: any }
  ) {}

  ngOnInit(): void {
    const u = this.data.user;
    this.form = this.fb.group({
      name: [u.name || '', [Validators.required, Validators.minLength(2)]],
      email: [u.email || '', [Validators.required, Validators.email, Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)]],
      phone: [u.phone || '', [Validators.pattern(/^0[0-9]{9}$/)]],
      date_of_birth: [u.date_of_birth ? new Date(u.date_of_birth) : null],
      gender: [u.gender || null]
    });
  }

  save(): void {
    if (this.form.invalid) return;
    this.loading = true;
    const val = this.form.value;
    // Format date_of_birth to YYYY-MM-DD
    if (val.date_of_birth instanceof Date) {
      const d = val.date_of_birth;
      val.date_of_birth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
    this.http.put<any>(`/api/users/${this.data.user.id}`, val).subscribe({
      next: () => {
        this.snack.open('อัปเดตโปรไฟล์สำเร็จ', 'Close', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.loading = false;
        this.snack.open(err.error?.error || 'อัปเดตไม่สำเร็จ', 'Close', { duration: 3000 });
      }
    });
  }
}
