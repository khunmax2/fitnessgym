const express  = require('express');
const router   = express.Router();
const supabase = require('../config/supabase');
const bcrypt   = require('bcryptjs');
const auth     = require('../middleware/auth.middleware');
const role     = require('../middleware/role.middleware');

const VALID_ROLES = ['member', 'trainer', 'staff', 'admin'];

// GET my profile
router.get('/me', auth, async (req, res) => {
  const { data, error } = await supabase
    .from('users').select('id,name,email,role,phone,date_of_birth,gender,created_at')
    .eq('id', req.user.id).single();
  if (error) return res.status(404).json({ error: 'User not found' });
  res.json(data);
});

// PUT update my profile
router.put('/me', auth, async (req, res) => {
  const { name, phone } = req.body;
  const { data, error } = await supabase
    .from('users').update({ name, phone })
    .eq('id', req.user.id)
    .select('id,name,email,role,phone,date_of_birth,gender').single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// POST change password
router.post('/change-password', auth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword)
    return res.status(400).json({ error: 'Both passwords are required' });
  if (newPassword.length < 6)
    return res.status(400).json({ error: 'New password must be at least 6 characters' });

  const { data: user, error } = await supabase
    .from('users').select('password').eq('id', req.user.id).single();
  if (error || !user) return res.status(404).json({ error: 'User not found' });

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });

  const hashed = await bcrypt.hash(newPassword, 10);
  const { error: updErr } = await supabase
    .from('users').update({ password: hashed }).eq('id', req.user.id);
  if (updErr) return res.status(400).json({ error: updErr.message });
  res.json({ message: 'Password changed successfully' });
});

// GET all users — admin only
router.get('/', auth, role('admin'), async (req, res) => {
  const { data, error } = await supabase
    .from('users').select('id,name,email,role,phone,date_of_birth,gender,created_at')
    .order('created_at', { ascending: false });
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// GET pending member-users (in users.role='member' or 'trainer' but not yet in members)
router.get('/pending-members', auth, role('admin'), async (req, res) => {
  const [usersRes, membersRes] = await Promise.all([
    supabase.from('users').select('id,name,email,phone,role,date_of_birth,gender,created_at').in('role', ['member', 'trainer']),
    supabase.from('members').select('id')
  ]);
  if (usersRes.error) return res.status(400).json({ error: usersRes.error.message });
  if (membersRes.error) return res.status(400).json({ error: membersRes.error.message });
  const memberIds = new Set(membersRes.data.map(m => m.id));
  const pending = usersRes.data.filter(u => !memberIds.has(u.id));
  res.json(pending);
});

// GET pending trainer-users (role member or trainer, but not yet in trainers)
router.get('/pending-trainers', auth, role('admin'), async (req, res) => {
  const [usersRes, trainersRes] = await Promise.all([
    supabase.from('users').select('id,name,email,phone,role,date_of_birth,gender,created_at').in('role', ['member','trainer']),
    supabase.from('trainers').select('id')
  ]);
  if (usersRes.error) return res.status(400).json({ error: usersRes.error.message });
  if (trainersRes.error) return res.status(400).json({ error: trainersRes.error.message });
  const trainerIds = new Set(trainersRes.data.map(t => t.id));
  const pending = usersRes.data.filter(u => !trainerIds.has(u.id));
  res.json(pending);
});

// PATCH change role — admin only
router.patch('/:id/role', auth, role('admin'), async (req, res) => {
  const { role: newRole } = req.body;
  if (!VALID_ROLES.includes(newRole))
    return res.status(400).json({ error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` });

  // ป้องกัน admin ลด role ตัวเอง
  if (req.params.id === req.user.id && newRole !== 'admin')
    return res.status(400).json({ error: 'Cannot change your own role' });

  const { data, error } = await supabase
    .from('users').update({ role: newRole })
    .eq('id', req.params.id)
    .select('id,name,email,role').single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// DELETE user — admin only
router.delete('/:id', auth, role('admin'), async (req, res) => {
  if (req.params.id === req.user.id)
    return res.status(400).json({ error: 'Cannot delete yourself' });
  const { error } = await supabase.from('users').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'User deleted' });
});

module.exports = router;
