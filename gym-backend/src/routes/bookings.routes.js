const express  = require('express');
const router   = express.Router();
const supabase = require('../config/supabase');
const auth     = require('../middleware/auth.middleware');
const role     = require('../middleware/role.middleware');

// POST — public booking from Landing Page (no auth)
router.post('/', async (req, res) => {
  const { name, email, phone, class_id, notes } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Name and email are required' });

  const { data, error } = await supabase
    .from('bookings')
    .insert([{ name, email, phone, class_id, notes, status: 'pending' }])
    .select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json({ message: 'Booking received! We will contact you shortly.', data });
});

// GET all — staff & admin
router.get('/', auth, role('admin', 'staff'), async (req, res) => {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// PATCH status — admin only
router.patch('/:id', auth, role('admin'), async (req, res) => {
  const { data, error } = await supabase
    .from('bookings')
    .update({ status: req.body.status })
    .eq('id', req.params.id)
    .select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

module.exports = router;
