# 🏋️ Fitness & Gym Management System

ระบบจัดการยิมและฟิตเนส พัฒนาด้วย Angular + Node.js (Express) + Supabase

## Tech Stack

|     ส่วน   |          Technology           |
|-----------|-------------------------------|
| Frontend  | Angular 17 + Angular Material |
| Backend   | Node.js + Express             |
| Database  | Supabase (PostgreSQL)         |
| Auth      | JWT (jsonwebtoken + bcryptjs) |
| Container | Docker + Docker Compose       |

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

### 🔧 Prerequisites

- [Node.js](https://nodejs.org/) >= 18 (comes with npm)
- Git
- Optional: Docker / Docker Compose (ถ้าต้องการรันทั้งระบบแบบ container)

---

### 1. ตั้งค่า Supabase Database

1. ไปที่ [supabase.com](https://supabase.com) → สร้าง project ใหม่
2. ไปที่ **SQL Editor** → วางและรันไฟล์ `gym-backend/schema.sql`
3. คัดลอก **Project URL** และ **anon key** จาก Settings → API

> บันทึกค่า 2 ตัวนี้ไว้ เพราะจะต้องใช้ในขั้นตอนตั้งค่า backend

---

### 2. ตั้งค่า Backend (API)

```bash
cd gym-backend
cp .env.example .env
```

แก้ไฟล์ `.env` ให้ใส่ค่า Supabase ที่ได้จากขั้นตอนก่อนหน้า:

```env
PORT=3000
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_KEY=<your-anon-key>
JWT_SECRET=my-super-secret-key-change-this
JWT_EXPIRES_IN=7d
```

ติดตั้ง dependencies และรัน backend:

```bash
cd gym-backend
npm install
npm run dev
```

> API จะรันที่ `http://localhost:3000/api`

---

### 3. ตั้งค่า Frontend (Angular)

```bash
cd gym-frontend
npm install
npm start
```

เปิดเว็บเบราว์เซอร์ที่ `http://localhost:4200`

> Frontend จะเรียก API ที่ `http://localhost:3000/api` (กำหนดใน `proxy.conf.json` แล้ว)

---

### 4. รันด้วย Docker (ทางเลือก)

```bash
# ที่ root folder ของโปรเจค
cp gym-backend/.env.example gym-backend/.env
# แก้ไข .env ตามค่า Supabase ของคุณ แล้ว:
docker-compose up --build
```

- Frontend: `http://localhost`
- Backend API: `http://localhost:3000/api`

---

## ✨ ฟีเจอร์ของระบบ (Key Features)

### 🧑‍🤝‍🧑 User Management
- สมัครสมาชิก / เข้าสู่ระบบ (JWT)
- สิทธิ์แต่ละ role (Admin / Staff / Trainer / Member)
- Admin จัดการบัญชีผู้ใช้ (แก้ role / ลบผู้ใช้)
- แสดงสถิติสมาชิก (จำนวนทั้งหมด, trainer, member, staff/admin)

### 🧑‍🏫 Trainers / Members
- จัดการข้อมูลสมาชิกและเทรนเนอร์ (CRUD)
- ระบบค้นหาและกรองข้อมูล

### 🏋️ Classes / Schedules
- สร้าง-แก้ไข/ลบคลาสออกกำลังกาย
- ตารางนัดหมาย (Schedule)
- จัดการการลงทะเบียนเข้าคลาส

### 🍽️ Diet Plans
- จัดการแผนโภชนาการสำหรับสมาชิก
- กำหนดโปรแกรมโภชนาการตามผู้ใช้งาน

### 🧾 Progress Reports
- บันทึกและติดตามความก้าวหน้าของสมาชิก
- รายงานแสดงข้อมูลความคืบหน้าและการเปลี่ยนแปลง

### 💳 Payments
- บันทึกการชำระเงินของสมาชิก
- จัดการสถานะการชำระเงิน

### 🧰 Equipment
- จัดการข้อมูลอุปกรณ์ในยิม (CRUD)

---

## 🗂️ โครงสร้างโปรเจค (Project Structure)

...existing code...

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
