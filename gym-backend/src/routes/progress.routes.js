const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const auth = require('../middleware/auth.middleware');
const role = require('../middleware/role.middleware');

// GET all — admin & staff
router.get('/', auth, async (req, res) => {
  const { data, error } = await supabase
    .from('progress_reports')
    .select('*, members(name)')
    .order('created_at', { ascending: false });
  if (error) return res.status(400).json({ error: error.message });
  const mapped = (data || []).map(d => ({
    ...d,
    member_name: d.members?.name || '-',
  }));
  mapped.forEach(d => { delete d.members; });
  res.json(mapped);
});

// GET one — admin & staff
router.get('/:id', auth, async (req, res) => {
  const { data, error } = await supabase
    .from('progress_reports')
    .select('*')
    .eq('id', req.params.id)
    .single();
  if (error) return res.status(404).json({ error: 'Not found' });
  res.json(data);
});

// POST create — admin & staff
router.post('/', auth, async (req, res) => {
  const { data, error } = await supabase
    .from('progress_reports')
    .insert([req.body])
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

// PUT update — admin only
router.put('/:id', auth, role('admin'), async (req, res) => {
  const { data, error } = await supabase
    .from('progress_reports')
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
    .from('progress_reports')
    .delete()
    .eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Deleted successfully' });
});

module.exports = router;
