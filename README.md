# 🏋️ Fitness & Gym Management System

ระบบจัดการยิมและฟิตเนส พัฒนาด้วย Angular + Node.js (Express) + Supabase

## Tech Stack

| ส่วน | Technology |
|------|-----------|
| Frontend | Angular 17 + Angular Material |
| Backend | Node.js + Express |
| Database | Supabase (PostgreSQL) |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| Container | Docker + Docker Compose |

## Modules

- **Members** — จัดการสมาชิก
- **Trainers** — จัดการเทรนเนอร์
- **Classes** — คลาสออกกำลังกาย
- **Equipment** — อุปกรณ์ยิม
- **Schedules** — ตารางนัดหมาย
- **Payments** — การชำระเงิน
- **Diet Plans** — แผนโภชนาการ
- **Progress Reports** — รายงานความก้าวหน้า

---

## 🚀 Getting Started

### 1. ตั้งค่า Supabase Database

1. ไปที่ [supabase.com](https://supabase.com) → สร้าง project ใหม่
2. ไปที่ **SQL Editor** → วางและ run ไฟล์ `gym-backend/schema.sql`
3. คัดลอก **Project URL** และ **anon key** จาก Settings → API

### 2. ตั้งค่า Backend

```bash
cd gym-backend
cp .env.example .env
# แก้ไขค่าใน .env
npm install
npm run dev
```

ไฟล์ `.env`:
```
PORT=3000
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_KEY=your-anon-key
JWT_SECRET=my-super-secret-key-change-this
JWT_EXPIRES_IN=7d
```


### 3. ตั้งค่า Frontend

```bash
cd gym-frontend
npm install
npm start
```

เปิด browser ที่ `http://localhost:4200`

**Login**: ปุ่มเข้าสู่ระบบในหน้าแรกใช้สำหรับทุก role (Admin, Staff, Member, Trainer, Member) ไม่ใช่เฉพาะ staff
แนะนำให้ใช้คำว่า "เข้าสู่ระบบ" หรือ "Login" แทน "Staff Login"

### 4. รันด้วย Docker (ทางเลือก)

```bash
# ที่ root folder
cp gym-backend/.env.example gym-backend/.env
# แก้ไข .env ก่อน แล้ว:
docker-compose up --build
```

- Frontend: `http://localhost`
- Backend API: `http://localhost:3000/api`

---

## 📁 Project Structure

```
gym-management/
├── gym-frontend/          # Angular 17
│   ├── src/app/
│   │   ├── core/          # Guards, Interceptors, Services
│   │   ├── shared/        # Layout component
│   │   └── features/      # 8 modules (lazy-loaded)
│   ├── Dockerfile
│   └── nginx.conf
│
├── gym-backend/           # Node.js + Express
│   ├── src/
│   │   ├── routes/        # 9 route files (auth + 8 resources)
│   │   ├── middleware/    # JWT auth middleware
│   │   └── config/        # Supabase client
│   ├── schema.sql         # Database schema + sample data
│   └── Dockerfile
│
└── docker-compose.yml
```

## 🔗 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | สมัครสมาชิก |
| POST | /api/auth/login | เข้าสู่ระบบ |
| GET | /api/members | ดูสมาชิกทั้งหมด |
| POST | /api/members | เพิ่มสมาชิก |
| PUT | /api/members/:id | แก้ไขสมาชิก |
| DELETE | /api/members/:id | ลบสมาชิก |
| ... | (เหมือนกันทุก resource) | ... |

> ทุก endpoint ยกเว้น `/api/auth/*` ต้องส่ง `Authorization: Bearer <token>` ใน header
