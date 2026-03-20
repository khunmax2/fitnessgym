import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TrainerService } from './trainers.service';

@Component({
  selector: 'app-trainers-form',
  templateUrl: './trainers-form.component.html'
})
export class TrainerFormComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  loading = false;
  pendingUsers: any[] = [];
  selectedPendingUserId: string | null = null;
  selectedPendingUser: any = null;

  constructor(
    private fb: FormBuilder,
    private service: TrainerService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<TrainerFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    const trainer = this.data && this.data.id ? this.data : null;
    this.isEdit = !!trainer;
    this.pendingUsers = this.data?.pendingUsers || [];

    this.form = this.fb.group({
      name: [trainer?.name || '', Validators.required],
      email: [trainer?.email || '', [Validators.email]],
      phone: [trainer?.phone || ''],
      specialty: [trainer?.specialty || '', Validators.required],
      bio: [trainer?.bio || ''],
      status: [trainer?.status || 'active']
    });

    if (this.isEdit && trainer) {
      this.form.patchValue(trainer);
      this.selectedPendingUser = trainer;
      this.selectedPendingUserId = trainer.id;
    }
  }

  onPendingUserSelected(): void {
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
      phone: selected.phone || ''
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    if (!this.isEdit && !this.selectedPendingUserId) {
      this.snackBar.open('Please select a pending user to convert as trainer', 'Close', { duration: 3000 });
      return;
    }
    this.loading = true;
    const action = this.isEdit
      ? this.service.update(this.data.id, this.form.value)
      : this.service.convertFromUser({
          user_id: this.selectedPendingUserId,
          specialty: this.form.value.specialty,
          bio: this.form.value.bio,
          status: this.form.value.status
        });

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
