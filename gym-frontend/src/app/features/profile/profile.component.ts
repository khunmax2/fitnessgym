import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  loading = false;
  pwLoading = false;
  showCurrent = false;
  showNew = false;
  showConfirm = false;

  private api = environment.apiUrl;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private snack: MatSnackBar,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    const user = this.authService.currentUserSubject?.value;
    this.profileForm = this.fb.group({
      name: [user?.name || '', Validators.required]
    });
    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword:     ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatch });
  }

  passwordMatch(fg: FormGroup) {
    const np = fg.get('newPassword')?.value;
    const cp = fg.get('confirmPassword')?.value;
    return np === cp ? null : { mismatch: true };
  }

  saveProfile(): void {
    if (this.profileForm.invalid) return;
    this.loading = true;
    this.http.put<any>(`${this.api}/users/me`, this.profileForm.value).subscribe({
      next: (u) => {
        // Update stored user
        const current = this.authService.currentUserSubject.value;
        const updated = { ...current, ...u };
        localStorage.setItem('user', JSON.stringify(updated));
        this.authService.currentUserSubject.next(updated);
        this.snack.open('Profile updated!', 'Close', { duration: 3000 });
        this.loading = false;
      },
      error: (err) => { this.snack.open(err.error?.error || 'Update failed', 'Close', { duration: 3000 }); this.loading = false; }
    });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) return;
    this.pwLoading = true;
    const { currentPassword, newPassword } = this.passwordForm.value;
    this.http.post(`${this.api}/users/change-password`, { currentPassword, newPassword }).subscribe({
      next: () => {
        this.snack.open('Password changed successfully!', 'Close', { duration: 3000 });
        this.passwordForm.reset();
        this.pwLoading = false;
      },
      error: (err) => { this.snack.open(err.error?.error || 'Failed', 'Close', { duration: 3000 }); this.pwLoading = false; }
    });
  }

  getInitials(): string {
    const name = this.authService.currentUserSubject?.value?.name || 'AD';
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  }
}
