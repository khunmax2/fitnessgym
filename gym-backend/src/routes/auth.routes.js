const express  = require('express');
const router   = express.Router();
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const supabase = require('../config/supabase');

const signToken = (user) => jwt.sign(
  { id: user.id, email: user.email, role: user.role, name: user.name },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
);

// POST /api/auth/register — role บังคับเป็น 'member' เสมอ
router.post('/register', async (req, res) => {
  const { name, email, password, phone, date_of_birth, gender } = req.body;
  const role = 'member';

  if (!name || !email || !password)
    return res.status(400).json({ error: 'Name, email and password are required.' });
  if (password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  if (gender && !['male','female','other'].includes(gender))
    return res.status(400).json({ error: 'Gender must be male, female, or other.' });

  const hashed = await bcrypt.hash(password, 10);

  const { data, error } = await supabase
    .from('users')
    .insert([{ name, email, phone: phone || null, password: hashed, role, date_of_birth: date_of_birth || null, gender: gender || null }])
    .select('id, name, email, role, phone, date_of_birth, gender')
    .single();

  if (error) {
    if (error.message.includes('unique')) return res.status(400).json({ error: 'Email already registered.' });
    return res.status(400).json({ error: error.message });
  }

  res.status(201).json({ token: signToken(data), user: data });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email and password are required.' });

  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !user)
    return res.status(401).json({ error: 'Invalid credentials.' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid)
    return res.status(401).json({ error: 'Invalid credentials.' });

  const { password: _, ...safeUser } = user;
  res.json({ token: signToken(safeUser), user: safeUser });
});

module.exports = router;
