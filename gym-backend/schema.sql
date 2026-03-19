-- ============================================
-- Fitness & Gym Management — Supabase Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Users (for login)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password TEXT NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(20) DEFAULT 'staff',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Members
CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  phone VARCHAR(20),
  membership_type VARCHAR(50) DEFAULT 'monthly',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trainers
CREATE TABLE IF NOT EXISTS trainers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  phone VARCHAR(20),
  specialty VARCHAR(100),
  bio TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Classes
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  trainer_id UUID REFERENCES trainers(id) ON DELETE SET NULL,
  capacity INT DEFAULT 10,
  duration_minutes INT DEFAULT 60,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Equipment
CREATE TABLE IF NOT EXISTS equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  quantity INT DEFAULT 1,
  status VARCHAR(20) DEFAULT 'available',
  last_maintenance DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Schedules
CREATE TABLE IF NOT EXISTS schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) DEFAULT 'booked',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  payment_date DATE NOT NULL,
  method VARCHAR(50) DEFAULT 'cash',
  status VARCHAR(20) DEFAULT 'paid',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Diet Plans
CREATE TABLE IF NOT EXISTS diet_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  trainer_id UUID REFERENCES trainers(id) ON DELETE SET NULL,
  calories INT,
  meals JSONB,
  notes TEXT,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Progress Reports
CREATE TABLE IF NOT EXISTS progress_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  weight DECIMAL(5,2),
  bmi DECIMAL(4,2),
  body_fat_percent DECIMAL(4,2),
  notes TEXT,
  report_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Sample Data
-- ============================================
INSERT INTO trainers (name, email, phone, specialty) VALUES
  ('สมชาย มีสุข', 'somchai@gym.com', '081-111-1111', 'Weight Training'),
  ('วิภา ดีใจ', 'wipa@gym.com', '082-222-2222', 'Yoga & Cardio');

INSERT INTO members (name, email, phone, membership_type, start_date, end_date) VALUES
  ('อนันต์ สุขดี', 'anant@email.com', '083-333-3333', 'monthly', NOW(), NOW() + INTERVAL '30 days'),
  ('มะลิ งามจริง', 'mali@email.com', '084-444-4444', 'yearly',  NOW(), NOW() + INTERVAL '365 days');

-- ============================================
-- Notifications
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  title      VARCHAR(200) NOT NULL,
  message    TEXT NOT NULL,
  type       VARCHAR(30) DEFAULT 'info',  -- info | warning | success | error
  is_read    BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bookings (from Landing Page)
CREATE TABLE IF NOT EXISTS bookings (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         VARCHAR(100) NOT NULL,
  email        VARCHAR(150) NOT NULL,
  phone        VARCHAR(20),
  class_id     UUID REFERENCES classes(id) ON DELETE SET NULL,
  schedule_id  UUID REFERENCES schedules(id) ON DELETE SET NULL,
  notes        TEXT,
  status       VARCHAR(20) DEFAULT 'pending',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
