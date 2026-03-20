const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const auth = require('../middleware/auth.middleware');
const role = require('../middleware/role.middleware');

// GET all — admin & staff
router.get('/', auth, async (req, res) => {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// GET one — admin & staff
router.get('/:id', auth, async (req, res) => {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('id', req.params.id)
    .single();
  if (error) return res.status(404).json({ error: 'Not found' });
  res.json(data);
});

// POST create — admin & staff
router.post('/', auth, async (req, res) => {
  const { data, error } = await supabase
    .from('members')
    .insert([req.body])
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

// POST convert existing user to member — admin only
router.post('/from-user', auth, role('admin'), async (req, res) => {
  const { user_id, membership_type, start_date, end_date, status, date_of_birth, gender, emergency_contact, emergency_name, medical_conditions } = req.body;
  if (!user_id || !membership_type || !start_date || !end_date)
    return res.status(400).json({ error: 'user_id, membership_type, start_date, and end_date are required.' });
  if (typeof user_id !== 'string' || user_id.trim() === '' || !/^[0-9a-fA-F-]{36}$/.test(user_id)) {
    return res.status(400).json({ error: 'user_id must be a valid UUID string.' });
  }

  const { data: user, error: userError } = await supabase
    .from('users').select('id,name,email,phone,role,date_of_birth,gender').eq('id', user_id).single();
  if (userError || !user) return res.status(404).json({ error: 'User not found' });
  if (!['member','trainer'].includes(user.role)) return res.status(400).json({ error: 'User role must be member or trainer to convert to members table.' });

  const { data: existingMember, error: existingError } = await supabase
    .from('members').select('*').eq('id', user.id).single();
  if (existingError && existingError.code && existingError.code !== 'PGRST116') {
    return res.status(400).json({ error: existingError.message });
  }

  // ถ้าผู้ใช้เป็น trainer อยู่แล้ว ให้รีเวิร์ทเทรนเนอร์เป็น member
  if (user.role === 'trainer') {
    const { error: roleError } = await supabase
      .from('users').update({ role: 'member' }).eq('id', user.id);
    if (roleError) return res.status(500).json({ error: roleError.message });

    const { error: trainerUpdateError } = await supabase
      .from('trainers').update({ status: 'inactive' }).eq('id', user.id);
    if (trainerUpdateError) {
      console.warn('Failed to set trainer status inactive on convert to member:', trainerUpdateError.message);
    }
  }

  const values = {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    membership_type,
    start_date,
    end_date,
    status: status || 'active',
    date_of_birth: date_of_birth || user.date_of_birth || null,
    gender: gender || user.gender || null,
    emergency_contact: emergency_contact || null,
    emergency_name: emergency_name || null,
    medical_conditions: medical_conditions || null
  };

  let createdMember;
  if (existingMember && existingMember.status === 'inactive') {
    const { data: updatedMember, error: updateError } = await supabase
      .from('members').update(values).eq('id', user.id).select().single();
    if (updateError) return res.status(400).json({ error: updateError.message });
    createdMember = updatedMember;
  } else if (existingMember) {
    return res.status(400).json({ error: 'Member already exists' });
  } else {
    const { data, error: insertError } = await supabase
      .from('members').insert([values]).select().single();
    if (insertError) return res.status(400).json({ error: insertError.message });
    createdMember = data;
  }

  // Ensure user role is member after conversion
  if (user.role !== 'member') {
    const { error: roleError2 } = await supabase
      .from('users').update({ role: 'member' }).eq('id', user.id);
    if (roleError2) return res.status(500).json({ error: roleError2.message });
  }

  res.status(existingMember ? 200 : 201).json(createdMember);
});

// PUT update — admin only
router.put('/:id', auth, role('admin'), async (req, res) => {
  const { data, error } = await supabase
    .from('members')
    .update(req.body)
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// GET related records count for a member (for pre-delete check)
router.get('/:id/relations', auth, role('admin'), async (req, res) => {
  const id = req.params.id;
  const [schedules, payments, dietPlans, progressReports] = await Promise.all([
    supabase.from('schedules').select('id', { count: 'exact', head: true }).eq('member_id', id),
    supabase.from('payments').select('id', { count: 'exact', head: true }).eq('member_id', id),
    supabase.from('diet_plans').select('id', { count: 'exact', head: true }).eq('member_id', id),
    supabase.from('progress_reports').select('id', { count: 'exact', head: true }).eq('member_id', id),
  ]);
  res.json({
    schedules: schedules.count || 0,
    payments: payments.count || 0,
    diet_plans: dietPlans.count || 0,
    progress_reports: progressReports.count || 0,
  });
});

// DELETE — admin only (with referential integrity check)
router.delete('/:id', auth, role('admin'), async (req, res) => {
  const id = req.params.id;
  const force = req.query.force === 'true';

  // ตรวจสอบข้อมูลที่เกี่ยวข้องก่อนลบ
  const [schedules, payments, dietPlans, progressReports] = await Promise.all([
    supabase.from('schedules').select('id', { count: 'exact', head: true }).eq('member_id', id),
    supabase.from('payments').select('id', { count: 'exact', head: true }).eq('member_id', id),
    supabase.from('diet_plans').select('id', { count: 'exact', head: true }).eq('member_id', id),
    supabase.from('progress_reports').select('id', { count: 'exact', head: true }).eq('member_id', id),
  ]);

  const relations = {
    schedules: schedules.count || 0,
    payments: payments.count || 0,
    diet_plans: dietPlans.count || 0,
    progress_reports: progressReports.count || 0,
  };
  const totalRelated = Object.values(relations).reduce((a, b) => a + b, 0);

  if (totalRelated > 0 && !force) {
    return res.status(409).json({
      error: 'ไม่สามารถลบสมาชิกนี้ได้ เนื่องจากมีข้อมูลที่เกี่ยวข้อง',
      relations,
      message: `สมาชิกนี้มี: ${relations.schedules} ตารางเรียน, ${relations.payments} รายการชำระเงิน, ${relations.diet_plans} แผนอาหาร, ${relations.progress_reports} รายงานความก้าวหน้า`,
      hint: 'ส่ง ?force=true เพื่อยืนยันการลบทั้งหมด (ข้อมูลที่เกี่ยวข้องจะถูกลบด้วย)'
    });
  }

  // ก่อนลบ ให้จับ role ปัจจุบันและสถาณะเทรนเนอร์หากมี
  const { data: user, error: userError } = await supabase
    .from('users').select('role').eq('id', id).single();
  if (userError) return res.status(404).json({ error: 'User not found' });

  const { error: deleteError } = await supabase
    .from('members')
    .delete()
    .eq('id', id);
  if (deleteError) return res.status(400).json({ error: deleteError.message });

  if (user.role === 'member') {
    const { data: trainer } = await supabase
      .from('trainers').select('id,status').eq('id', id).single();

    if (trainer && trainer.status === 'inactive') {
      await supabase.from('trainers').update({ status: 'active' }).eq('id', id);
    }

    await supabase.from('users').update({ role: 'trainer' }).eq('id', id);
  }

  res.json({ message: 'Deleted successfully' });
});

module.exports = router;
