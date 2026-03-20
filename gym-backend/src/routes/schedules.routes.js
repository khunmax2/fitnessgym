const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const auth = require('../middleware/auth.middleware');
const role = require('../middleware/role.middleware');

// GET all — admin & staff (join class + member names)
router.get('/', auth, async (req, res) => {
  const { data, error } = await supabase
    .from('schedules')
    .select('*, classes(name), members(name)')
    .order('scheduled_at', { ascending: true });
  if (error) return res.status(400).json({ error: error.message });
  const result = data.map(s => ({
    ...s,
    class_name: s.classes?.name || '-',
    member_name: s.members?.name || '-',
  }));
  res.json(result);
});

// GET one — admin & staff
router.get('/:id', auth, async (req, res) => {
  const { data, error } = await supabase
    .from('schedules')
    .select('*')
    .eq('id', req.params.id)
    .single();
  if (error) return res.status(404).json({ error: 'Not found' });
  res.json(data);
});

// POST create — admin & staff
router.post('/', auth, async (req, res) => {
  const { data, error } = await supabase
    .from('schedules')
    .insert([req.body])
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

// PUT update — admin only
router.put('/:id', auth, role('admin'), async (req, res) => {
  const { data, error } = await supabase
    .from('schedules')
    .update(req.body)
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// GET related records count for a schedule (for pre-delete check)
router.get('/:id/relations', auth, role('admin'), async (req, res) => {
  const id = req.params.id;
  const bookings = await supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('schedule_id', id);
  res.json({
    bookings: bookings.count || 0,
  });
});

// DELETE — admin only (with referential integrity check)
router.delete('/:id', auth, role('admin'), async (req, res) => {
  const id = req.params.id;
  const force = req.query.force === 'true';

  const bookings = await supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('schedule_id', id);
  const bookingCount = bookings.count || 0;

  if (bookingCount > 0 && !force) {
    return res.status(409).json({
      error: 'ไม่สามารถลบตารางเรียนนี้ได้ เนื่องจากมีการจองอยู่',
      relations: { bookings: bookingCount },
      message: `ตารางเรียนนี้มี: ${bookingCount} การจอง`,
      hint: 'ส่ง ?force=true เพื่อยืนยันการลบ'
    });
  }

  const { error } = await supabase
    .from('schedules')
    .delete()
    .eq('id', id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Deleted successfully' });
});

module.exports = router;
