import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent implements OnInit, OnDestroy {
  isScrolled = false;
  showLoginModal = false;
  activeDay = 2;
  staffLoginForm: FormGroup;
  staffLoginLoading = false;
  staffLoginError = '';

  days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  dates = [17, 18, 19, 20, 21, 22, 23];

  classes = [
    { icon: '⚡', name: 'HIIT Extreme',   desc: 'High intensity interval training เผาผลาญแคลอรี่สูงสุดใน 45 นาที', duration: '45 min', cal: '800 kcal', color: '#E8003D' },
    { icon: '🧘', name: 'Yoga Flow',      desc: 'พัฒนาความยืดหยุ่น สมาธิ และสมดุลของร่างกาย เหมาะสำหรับทุกระดับ',  duration: '60 min', cal: '250 kcal', color: '#8b5cf6' },
    { icon: '🥊', name: 'Muay Thai',      desc: 'ศิลปะการต่อสู้ไทย เสริมความแข็งแกร่ง ความคล่องตัว และฝึกจิตใจ',   duration: '90 min', cal: '700 kcal', color: '#f59e0b' },
    { icon: '🚴', name: 'Spinning',       desc: 'Cardio แบบเข้มข้นบนจักรยานในร่ม พร้อมเพลงและแสงสีที่สนุกสนาน',    duration: '45 min', cal: '600 kcal', color: '#22c55e' },
  ];

  trainers = [
    { initials: 'SC', name: 'สมชาย มีสุข',   specialty: 'Weight Training', exp: 8,  rating: '4.9', clients: 320, color: '#E8003D',  bg: 'linear-gradient(135deg,#1a0a0a,#2a1015)', badge: 'Head Trainer', badgeColor: '#E8003D' },
    { initials: 'WP', name: 'วิภา ดีใจ',      specialty: 'Yoga & Pilates',  exp: 6,  rating: '4.8', clients: 215, color: '#8b5cf6',  bg: 'linear-gradient(135deg,#0a0a1a,#101025)', badge: 'Yoga',        badgeColor: '#8b5cf6' },
    { initials: 'NK', name: 'นคร แข็งแรง',    specialty: 'Muay Thai',       exp: 12, rating: '5.0', clients: 180, color: '#f59e0b',  bg: 'linear-gradient(135deg,#0e0a00,#1a1200)', badge: 'Muay Thai',   badgeColor: '#f59e0b' },
    { initials: 'PM', name: 'ปวีณา มุ่งมั่น', specialty: 'Cardio & HIIT',   exp: 5,  rating: '4.7', clients: 290, color: '#22c55e',  bg: 'linear-gradient(135deg,#001a0e,#001508)', badge: 'Cardio',      badgeColor: '#22c55e' },
  ];

  schedules: Record<number, any[]> = {
    0: [{ t:'06:00', cls:'Morning Yoga',  tr:'วิภา ดีใจ',      cap:8,  max:12 }, { t:'09:00', cls:'HIIT Extreme', tr:'สมชาย มีสุข', cap:15, max:15 }, { t:'18:00', cls:'Muay Thai',    tr:'นคร แข็งแรง',    cap:7, max:10 }],
    1: [{ t:'07:00', cls:'Spinning',      tr:'ปวีณา มุ่งมั่น', cap:10, max:15 }, { t:'10:00', cls:'Pilates Core', tr:'วิภา ดีใจ',    cap:6,  max:8  }, { t:'19:00', cls:'HIIT Extreme', tr:'สมชาย มีสุข',    cap:12, max:15 }],
    2: [{ t:'06:00', cls:'Morning Yoga',  tr:'วิภา ดีใจ',      cap:9,  max:12 }, { t:'12:00', cls:'Muay Thai',   tr:'นคร แข็งแรง',  cap:8,  max:10 }, { t:'18:00', cls:'Spinning',    tr:'ปวีณา มุ่งมั่น', cap:14, max:15 }],
    3: [{ t:'07:00', cls:'HIIT Extreme',  tr:'สมชาย มีสุข',   cap:15, max:15 }, { t:'10:00', cls:'Morning Yoga',tr:'วิภา ดีใจ',    cap:5,  max:12 }, { t:'19:00', cls:'Muay Thai',   tr:'นคร แข็งแรง',    cap:9,  max:10 }],
    4: [{ t:'06:00', cls:'Spinning',      tr:'ปวีณา มุ่งมั่น', cap:11, max:15 }, { t:'09:00', cls:'Pilates Core',tr:'วิภา ดีใจ',   cap:7,  max:8  }, { t:'18:00', cls:'HIIT Extreme',tr:'สมชาย มีสุข',    cap:13, max:15 }],
    5: [{ t:'08:00', cls:'Muay Thai',     tr:'นคร แข็งแรง',   cap:6,  max:10 }, { t:'10:00', cls:'Morning Yoga',tr:'วิภา ดีใจ',   cap:10, max:12 }, { t:'14:00', cls:'Spinning',    tr:'ปวีณา มุ่งมั่น', cap:8,  max:15 }, { t:'16:00', cls:'HIIT Extreme', tr:'สมชาย มีสุข', cap:14, max:15 }],
    6: [{ t:'09:00', cls:'Morning Yoga',  tr:'วิภา ดีใจ',      cap:11, max:12 }, { t:'11:00', cls:'Pilates Core',tr:'วิภา ดีใจ',   cap:8,  max:8  }, { t:'15:00', cls:'Muay Thai',   tr:'นคร แข็งแรง',    cap:7,  max:10 }],
  };

  get todaySchedule() { return this.schedules[this.activeDay] || []; }

  getCapPct(s: any) { return Math.round((s.cap / s.max) * 100); }
  isFull(s: any)    { return s.cap >= s.max; }

  @HostListener('window:scroll')
  onScroll() { this.isScrolled = window.scrollY > 50; }

  constructor(private router: Router, private fb: FormBuilder, private authService: AuthService) {
    this.staffLoginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }
  ngOnInit() {}
  ngOnDestroy() {}

  scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  openLogin()  { this.showLoginModal = true;  }
  closeLogin() { this.showLoginModal = false; this.staffLoginError = ''; this.staffLoginLoading = false; }

  goRegister(): void { this.router.navigate(["/register"]); }

  staffLoginSubmit() {
    if (this.staffLoginForm.invalid) return;
    this.staffLoginLoading = true;
    this.staffLoginError = '';
    const { email, password } = this.staffLoginForm.value;
    this.authService.login(email, password).subscribe({
      next: () => {
        this.staffLoginLoading = false;
        this.showLoginModal = false;
        this.router.navigate(['/dashboard']);
      },
      error: err => {
        this.staffLoginError = err.error?.error || 'Login failed';
        this.staffLoginLoading = false;
      }
    });
  }
}
