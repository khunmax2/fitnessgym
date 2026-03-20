import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  form: FormGroup;
  loading = false;
  errorMsg = '';
  showPass = false;
  showConfirm = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/dashboard/overview']);
    }
    this.form = this.fb.group({
      name:            ['', [Validators.required, Validators.minLength(2)]],
      email:           ['', [Validators.required, Validators.email, Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)]],
      phone:           ['', [Validators.pattern(/^0[0-9]{9}$/)]],
      date_of_birth:   [null],
      gender:          [''],
      password:        ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
    }, { validators: this.passwordMatch });
  }

  passwordMatch(fg: AbstractControl) {
    const pw  = fg.get('password')?.value;
    const cpw = fg.get('confirmPassword')?.value;
    return pw === cpw ? null : { mismatch: true };
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.errorMsg = '';

    const { name, email, password, phone, date_of_birth, gender } = this.form.value;
    const dob = date_of_birth instanceof Date ? date_of_birth.toISOString().slice(0, 10) : date_of_birth;

    this.authService.register(name, email, password, phone, dob, gender).subscribe({
      next: () => {
        this.loading = false;
        this.snackBar.open('สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ', 'ปิด', {
          duration: 3500,
          panelClass: ['snackbar-success']
        });
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.errorMsg = err.error?.error || 'Registration failed. Please try again.';
        this.loading = false;
      }
    });
  }

  goLogin(): void { this.router.navigate(['/login']); }
}
