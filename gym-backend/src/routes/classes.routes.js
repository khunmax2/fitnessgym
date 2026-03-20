const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const auth = require('../middleware/auth.middleware');
const role = require('../middleware/role.middleware');

// GET all — admin & staff (join trainer name)
router.get('/', auth, async (req, res) => {
  const { data, error } = await supabase
    .from('classes')
    .select('*, trainers(name)')
    .order('created_at', { ascending: false });
  if (error) return res.status(400).json({ error: error.message });
  const result = data.map(c => ({
    ...c,
    trainer_name: c.trainers?.name || '-',
  }));
  res.json(result);
});

// GET one — admin & staff
router.get('/:id', auth, async (req, res) => {
  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .eq('id', req.params.id)
    .single();
  if (error) return res.status(404).json({ error: 'Not found' });
  res.json(data);
});

// POST create — admin & staff
router.post('/', auth, async (req, res) => {
  const { data, error } = await supabase
    .from('classes')
    .insert([req.body])
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

// PUT update — admin only
router.put('/:id', auth, role('admin'), async (req, res) => {
  const { data, error } = await supabase
    .from('classes')
    .update(req.body)
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// GET related records count for a class (for pre-delete check)
router.get('/:id/relations', auth, role('admin'), async (req, res) => {
  const id = req.params.id;
  const [schedules, bookings] = await Promise.all([
    supabase.from('schedules').select('id', { count: 'exact', head: true }).eq('class_id', id),
    supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('class_id', id),
  ]);
  res.json({
    schedules: schedules.count || 0,
    bookings: bookings.count || 0,
  });
});

// DELETE — admin only (with referential integrity check)
router.delete('/:id', auth, role('admin'), async (req, res) => {
  const id = req.params.id;
  const force = req.query.force === 'true';

  const [schedules, bookings] = await Promise.all([
    supabase.from('schedules').select('id', { count: 'exact', head: true }).eq('class_id', id),
    supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('class_id', id),
  ]);

  const relations = {
    schedules: schedules.count || 0,
    bookings: bookings.count || 0,
  };
  const totalRelated = Object.values(relations).reduce((a, b) => a + b, 0);

  if (totalRelated > 0 && !force) {
    return res.status(409).json({
      error: 'ไม่สามารถลบคลาสนี้ได้ เนื่องจากมีข้อมูลที่เกี่ยวข้อง',
      relations,
      message: `คลาสนี้มี: ${relations.schedules} ตารางเรียน, ${relations.bookings} การจอง`,
      hint: 'ส่ง ?force=true เพื่อยืนยันการลบทั้งหมด (ตารางเรียนจะถูกลบด้วย)'
    });
  }

  const { error } = await supabase
    .from('classes')
    .delete()
    .eq('id', id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Deleted successfully' });
});

module.exports = router;
