import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = false;
  errorMsg = '';
  showPass = false;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    // ถ้า login แล้ว redirect ไป dashboard เลย
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
    }
    this.loginForm = this.fb.group({
      email:    ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;
    this.loading = true; this.errorMsg = '';
    const { email, password } = this.loginForm.value;
    this.authService.login(email, password).subscribe({
      next: () => this.router.navigate(['/dashboard']),  // ← ไปหน้า dashboard
      error: (err) => { this.errorMsg = err.error?.error || 'Login failed'; this.loading = false; }
    });
  }
}
