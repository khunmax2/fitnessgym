const app = require('./app');
require('dotenv').config();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🏋️  Gym API running on http://localhost:${PORT}`);
});

// ป้องกัน process crash จาก unhandled rejection/exception
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err.message || err);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message || err);
});
