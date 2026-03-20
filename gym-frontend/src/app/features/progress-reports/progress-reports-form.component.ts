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
  members: any[] = [];

  constructor(
    private fb: FormBuilder,
    private service: ProgressReportService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<ProgressReportFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.members = this.data?.members || [];
    const report = this.data?.report;
    this.isEdit = !!report;

    this.form = this.fb.group({
      member_id: [report?.member_id || '', Validators.required],
      height: [report?.height || null, [Validators.min(50), Validators.max(250)]],
      weight: [report?.weight || null, [Validators.min(10), Validators.max(300)]],
      bmi: [{ value: report?.bmi || null, disabled: true }],
      body_fat_percent: [{ value: report?.body_fat_percent || null, disabled: true }],
      waist: [report?.waist || null, [Validators.min(30), Validators.max(200)]],
      hip: [report?.hip || null, [Validators.min(30), Validators.max(200)]],
      chest: [report?.chest || null, [Validators.min(30), Validators.max(200)]],
      arm: [report?.arm || null, [Validators.min(10), Validators.max(100)]],
      muscle_mass: [report?.muscle_mass || null, [Validators.min(1), Validators.max(150)]],
      bmr: [{ value: report?.bmr || null, disabled: true }],
      notes: [report?.notes || ''],
      report_date: [report?.report_date ? new Date(report.report_date) : new Date(), Validators.required]
    });

    // Auto-calculate BMI when weight or height changes
    this.form.get('weight')!.valueChanges.subscribe(() => { this.calcBmi(); this.calcBmr(); this.calcBodyFat(); });
    this.form.get('height')!.valueChanges.subscribe(() => { this.calcBmi(); this.calcBmr(); this.calcBodyFat(); });
    this.form.get('member_id')!.valueChanges.subscribe(() => { this.calcBmr(); this.calcBodyFat(); });
    this.calcBmi();
    this.calcBmr();
    this.calcBodyFat();
  }

  calcBmi(): void {
    const w = this.form.get('weight')!.value;
    const h = this.form.get('height')!.value;
    if (w && h && h > 0) {
      const hm = h / 100;
      this.form.get('bmi')!.setValue(+(w / (hm * hm)).toFixed(1));
    } else {
      this.form.get('bmi')!.setValue(null);
    }
  }

  /** BMR (Mifflin-St Jeor): Male = (10×w)+(6.25×h)−(5×age)+5, Female = (10×w)+(6.25×h)−(5×age)−161 */
  calcBmr(): void {
    const w = this.form.get('weight')!.value;
    const h = this.form.get('height')!.value;
    const memberId = this.form.get('member_id')!.value;
    const member = this.members.find(m => m.id === memberId);
    if (!w || !h || !member?.date_of_birth || !member?.gender) {
      this.form.get('bmr')!.setValue(null);
      return;
    }
    const age = Math.floor((Date.now() - new Date(member.date_of_birth).getTime()) / 31557600000);
    let bmr = (10 * w) + (6.25 * h) - (5 * age);
    bmr += member.gender === 'female' ? -161 : 5;
    this.form.get('bmr')!.setValue(Math.round(bmr));
  }

  /** Body Fat % = (1.20 × BMI) + (0.23 × Age) - (10.8 × Gender) - 5.4  (Gender: male=1, female=0) */
  calcBodyFat(): void {
    const bmi = this.form.get('bmi')!.value;
    const memberId = this.form.get('member_id')!.value;
    const member = this.members.find(m => m.id === memberId);
    if (!bmi || !member?.date_of_birth || !member?.gender) {
      this.form.get('body_fat_percent')!.setValue(null);
      return;
    }
    const age = Math.floor((Date.now() - new Date(member.date_of_birth).getTime()) / 31557600000);
    const genderVal = member.gender === 'male' ? 1 : 0;
    const bf = (1.20 * bmi) + (0.23 * age) - (10.8 * genderVal) - 5.4;
    this.form.get('body_fat_percent')!.setValue(+bf.toFixed(1));
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;

    const val = { ...this.form.getRawValue() };
    if (val.report_date instanceof Date) val.report_date = val.report_date.toISOString().slice(0, 10);

    const action = this.isEdit
      ? this.service.update(this.data.report.id, val)
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
