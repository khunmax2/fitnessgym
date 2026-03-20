import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EquipmentService } from './equipment.service';

@Component({
  selector: 'app-equipment-form',
  templateUrl: './equipment-form.component.html'
})
export class EquipmentFormComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private service: EquipmentService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<EquipmentFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.isEdit = !!this.data;
    const today = new Date().toISOString().split('T')[0];
    this.form = this.fb.group({
      name:             [this.data?.name || '', Validators.required],
      quantity:         [this.data?.quantity ?? 1, [Validators.required, Validators.min(0), Validators.max(9999)]],
      status:           [this.data?.status || 'available'],
      last_maintenance: [this.data?.last_maintenance?.slice(0, 10) || today],
      notes:            [this.data?.notes || '']
    });
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
