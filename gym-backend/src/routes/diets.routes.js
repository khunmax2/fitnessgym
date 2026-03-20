const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const auth = require('../middleware/auth.middleware');
const role = require('../middleware/role.middleware');
const resolveMemberId = require('../middleware/resolve-member');

// GET /my — member gets own diet plans
router.get('/my', auth, async (req, res) => {
  const memberId = await resolveMemberId(req);
  if (!memberId) return res.json([]);
  const { data, error } = await supabase
    .from('diet_plans')
    .select('*, trainers(name)')
    .eq('member_id', memberId)
    .order('created_at', { ascending: false });
  if (error) return res.status(400).json({ error: error.message });
  const mapped = (data || []).map(d => ({
    ...d,
    trainer_name: d.trainers?.name || '-',
  }));
  mapped.forEach(d => { delete d.trainers; });
  res.json(mapped);
});

// GET all — admin & staff
router.get('/', auth, role('admin', 'staff'), async (req, res) => {
  const { data, error } = await supabase
    .from('diet_plans')
    .select('*, members(name), trainers(name)')
    .order('created_at', { ascending: false });
  if (error) return res.status(400).json({ error: error.message });
  const mapped = (data || []).map(d => ({
    ...d,
    member_name: d.members?.name || '-',
    trainer_name: d.trainers?.name || '-',
  }));
  mapped.forEach(d => { delete d.members; delete d.trainers; });
  res.json(mapped);
});

// GET one — admin & staff
router.get('/:id', auth, async (req, res) => {
  const { data, error } = await supabase
    .from('diet_plans')
    .select('*')
    .eq('id', req.params.id)
    .single();
  if (error) return res.status(404).json({ error: 'Not found' });
  res.json(data);
});

// POST create — admin, staff & trainer
router.post('/', auth, role('admin', 'staff', 'trainer'), async (req, res) => {
  const { data, error } = await supabase
    .from('diet_plans')
    .insert([req.body])
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

// PUT update — admin only
router.put('/:id', auth, role('admin'), async (req, res) => {
  const { data, error } = await supabase
    .from('diet_plans')
    .update(req.body)
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// DELETE — admin only
router.delete('/:id', auth, role('admin'), async (req, res) => {
  const { error } = await supabase
    .from('diet_plans')
    .delete()
    .eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Deleted successfully' });
});

module.exports = router;
