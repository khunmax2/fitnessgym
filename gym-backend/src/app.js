const express = require('express');
const cors    = require('cors');
require('dotenv').config();

const app = express();

app.use(cors({ origin: 'http://localhost:4200', credentials: true }));
app.use(express.json());

// ─── Routes ──────────────────────────────────────────
app.use('/api/auth',          require('./routes/auth.routes'));
app.use('/api/users',         require('./routes/users.routes'));
app.use('/api/members',       require('./routes/members.routes'));
app.use('/api/trainers',      require('./routes/trainers.routes'));
app.use('/api/classes',       require('./routes/classes.routes'));
app.use('/api/equipment',     require('./routes/equipment.routes'));
app.use('/api/schedules',     require('./routes/schedules.routes'));
app.use('/api/payments',      require('./routes/payments.routes'));
app.use('/api/diets',         require('./routes/diets.routes'));
app.use('/api/progress',      require('./routes/progress.routes'));
app.use('/api/notifications', require('./routes/notifications.routes'));
app.use('/api/bookings',      require('./routes/bookings.routes'));

app.get('/', (req, res) => res.json({ message: '🏋️ Gym API running', version: '2.0' }));

// Global error handler — ป้องกัน server crash จาก unhandled errors
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
