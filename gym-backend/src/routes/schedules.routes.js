const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const auth = require('../middleware/auth.middleware');
const role = require('../middleware/role.middleware');
const resolveMemberId = require('../middleware/resolve-member');

// GET /my — member gets own schedules
router.get('/my', auth, async (req, res) => {
  const memberId = await resolveMemberId(req);
  if (!memberId) return res.json([]);
  const { data, error } = await supabase
    .from('schedules')
    .select('*, classes(name, duration_minutes, description, trainers(name))')
    .eq('member_id', memberId)
    .order('scheduled_at', { ascending: true });
  if (error) return res.status(400).json({ error: error.message });
  const result = (data || []).map(s => ({
    ...s,
    class_name: s.classes?.name || '-',
    duration_minutes: s.classes?.duration_minutes || 0,
    description: s.classes?.description || '',
    trainer_name: s.classes?.trainers?.name || '-',
  }));
  res.json(result);
});

// GET all — admin & staff (join class + member names)
router.get('/', auth, role('admin', 'staff'), async (req, res) => {
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

// POST /book — member books a class
router.post('/book', auth, async (req, res) => {
  if (req.user.role !== 'member') {
    return res.status(403).json({ error: 'Only members can book classes' });
  }
  const { class_id, scheduled_at } = req.body;
  if (!class_id || !scheduled_at) {
    return res.status(400).json({ error: 'class_id and scheduled_at are required' });
  }

  // Check class exists and get capacity
  const { data: cls, error: clsErr } = await supabase
    .from('classes')
    .select('id, capacity')
    .eq('id', class_id)
    .single();
  if (clsErr || !cls) return res.status(404).json({ error: 'Class not found' });

  // Check member exists
  const memberId = await resolveMemberId(req);
  if (!memberId) return res.status(400).json({ error: 'ไม่พบข้อมูลสมาชิกของคุณ กรุณาติดต่อเจ้าหน้าที่' });
  const { data: member } = await supabase
    .from('members')
    .select('id, status, end_date')
    .eq('id', memberId)
    .single();
  if (!member) return res.status(400).json({ error: 'ไม่พบข้อมูลสมาชิกของคุณ กรุณาติดต่อเจ้าหน้าที่' });
  if (member.status !== 'active') return res.status(400).json({ error: 'สมาชิกภาพของคุณไม่ active กรุณาต่ออายุสมาชิก' });
  if (member.end_date && new Date(member.end_date) < new Date()) {
    return res.status(400).json({ error: 'สมาชิกภาพของคุณหมดอายุแล้ว กรุณาต่ออายุ' });
  }

  // Check duplicate booking
  const { data: existing } = await supabase
    .from('schedules')
    .select('id')
    .eq('class_id', class_id)
    .eq('member_id', memberId)
    .eq('scheduled_at', scheduled_at)
    .single();
  if (existing) return res.status(400).json({ error: 'คุณจองคลาสนี้ในเวลานี้แล้ว' });

  // Check capacity
  const { count } = await supabase
    .from('schedules')
    .select('id', { count: 'exact', head: true })
    .eq('class_id', class_id)
    .eq('scheduled_at', scheduled_at)
    .neq('status', 'cancelled');
  if (count >= cls.capacity) {
    return res.status(400).json({ error: 'คลาสนี้เต็มแล้ว' });
  }

  const { data, error } = await supabase
    .from('schedules')
    .insert([{ class_id, member_id: memberId, scheduled_at, status: 'booked' }])
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

// POST /cancel — member cancels own booking
router.post('/cancel', auth, async (req, res) => {
  if (req.user.role !== 'member') {
    return res.status(403).json({ error: 'Only members can cancel their bookings' });
  }
  const { schedule_id } = req.body;
  if (!schedule_id) return res.status(400).json({ error: 'schedule_id is required' });

  const memberId = await resolveMemberId(req);
  const { data, error } = await supabase
    .from('schedules')
    .update({ status: 'cancelled' })
    .eq('id', schedule_id)
    .eq('member_id', memberId || req.user.id)
    .eq('status', 'booked')
    .select()
    .single();
  if (error) return res.status(400).json({ error: 'ไม่สามารถยกเลิกได้ อาจไม่พบการจอง หรือยกเลิกไปแล้ว' });
  res.json(data);
});

// GET /class-schedules/:classId — get upcoming schedules for a class (for booking UI)
router.get('/class-schedules/:classId', auth, async (req, res) => {
  const { data, error } = await supabase
    .from('schedules')
    .select('id, class_id, scheduled_at, status, member_id')
    .eq('class_id', req.params.classId)
    .gte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true });
  if (error) return res.status(400).json({ error: error.message });
  res.json(data || []);
});

// POST create — admin & staff
router.post('/', auth, role('admin', 'staff'), async (req, res) => {
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
