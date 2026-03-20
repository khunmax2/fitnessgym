const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const auth = require('../middleware/auth.middleware');
const role = require('../middleware/role.middleware');

// GET all — admin & staff
router.get('/', auth, async (req, res) => {
  const { data, error } = await supabase
    .from('trainers')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// GET one — admin & staff
router.get('/:id', auth, async (req, res) => {
  const { data, error } = await supabase
    .from('trainers')
    .select('*')
    .eq('id', req.params.id)
    .single();
  if (error) return res.status(404).json({ error: 'Not found' });
  res.json(data);
});

// POST create — admin & staff
router.post('/', auth, async (req, res) => {
  const { data, error } = await supabase
    .from('trainers')
    .insert([req.body])
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

// POST convert existing user to trainer — admin only
router.post('/from-user', auth, role('admin'), async (req, res) => {
  const { user_id, specialty, bio, status } = req.body;
  if (!user_id || !specialty)
    return res.status(400).json({ error: 'user_id and specialty are required.' });
  if (typeof user_id !== 'string' || user_id.trim() === '')
    return res.status(400).json({ error: 'user_id must be a valid UUID string.' });

  const { data: user, error: userError } = await supabase
    .from('users').select('id,name,email,phone,role').eq('id', user_id).single();
  if (userError || !user) return res.status(404).json({ error: 'User not found' });
  if (!['member','trainer'].includes(user.role)) return res.status(400).json({ error: 'User role must be member or trainer to convert to trainers table.' });

  const { data: existingTrainer, error: existingError } = await supabase
    .from('trainers').select('*').eq('id', user.id).single();
  if (existingError && existingError.code && existingError.code !== 'PGRST116') {
    return res.status(400).json({ error: existingError.message });
  }

  // ถ้าผู้ใช้เป็น member อยู่แล้ว ให้รีเวิร์ท member เป็น trainer
  if (user.role === 'member') {
    const { error: roleError } = await supabase
      .from('users').update({ role: 'trainer' }).eq('id', user.id);
    if (roleError) return res.status(500).json({ error: roleError.message });

    const { error: memberUpdateError } = await supabase
      .from('members').update({ status: 'inactive' }).eq('id', user.id);
    if (memberUpdateError) {
      console.warn('Failed to set member status inactive on convert to trainer:', memberUpdateError.message);
    }
  }

  const trainerValues = {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    specialty,
    bio: bio || null,
    status: status || 'active'
  };

  let createdTrainer;
  if (existingTrainer) {
    // ถ้ามีเทรนเนอร์อยู่แล้ว (active หรือ inactive) ให้ update เป็นข้อมูลใหม่
    const { data: updatedTrainer, error: updateError } = await supabase
      .from('trainers').update(trainerValues).eq('id', user.id).select().single();
    if (updateError) return res.status(400).json({ error: updateError.message });
    createdTrainer = updatedTrainer;
  } else {
    const { data, error: insertError } = await supabase
      .from('trainers').insert([trainerValues]).select().single();
    if (insertError) return res.status(400).json({ error: insertError.message });
    createdTrainer = data;
  }

  if (user.role !== 'trainer') {
    const { error: roleError2 } = await supabase
      .from('users').update({ role: 'trainer' }).eq('id', user.id);
    if (roleError2) return res.status(500).json({ error: roleError2.message });
  }

  res.status(existingTrainer ? 200 : 201).json(createdTrainer);
});

// PUT update — admin only
router.put('/:id', auth, role('admin'), async (req, res) => {
  const { data, error } = await supabase
    .from('trainers')
    .update(req.body)
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// GET related records count for a trainer (for pre-delete check)
router.get('/:id/relations', auth, role('admin'), async (req, res) => {
  const id = req.params.id;
  const [classes, dietPlans] = await Promise.all([
    supabase.from('classes').select('id', { count: 'exact', head: true }).eq('trainer_id', id),
    supabase.from('diet_plans').select('id', { count: 'exact', head: true }).eq('trainer_id', id),
  ]);
  res.json({
    classes: classes.count || 0,
    diet_plans: dietPlans.count || 0,
  });
});

// DELETE — admin only (with referential integrity check)
router.delete('/:id', auth, role('admin'), async (req, res) => {
  const id = req.params.id;
  const force = req.query.force === 'true';

  // ตรวจสอบข้อมูลที่เกี่ยวข้องก่อนลบ
  const [classes, dietPlans] = await Promise.all([
    supabase.from('classes').select('id', { count: 'exact', head: true }).eq('trainer_id', id),
    supabase.from('diet_plans').select('id', { count: 'exact', head: true }).eq('trainer_id', id),
  ]);

  const relations = {
    classes: classes.count || 0,
    diet_plans: dietPlans.count || 0,
  };
  const totalRelated = Object.values(relations).reduce((a, b) => a + b, 0);

  if (totalRelated > 0 && !force) {
    return res.status(409).json({
      error: 'ไม่สามารถลบเทรนเนอร์นี้ได้ เนื่องจากมีข้อมูลที่เกี่ยวข้อง',
      relations,
      message: `เทรนเนอร์นี้มี: ${relations.classes} คลาสที่สอน, ${relations.diet_plans} แผนอาหาร`,
      hint: 'ส่ง ?force=true เพื่อยืนยันการลบ (คลาสจะไม่มีเทรนเนอร์, แผนอาหารจะไม่มีเทรนเนอร์)'
    });
  }

  const { data: user, error: userError } = await supabase
    .from('users').select('role').eq('id', id).single();
  if (userError) return res.status(404).json({ error: 'User not found' });

  const { error: deleteError } = await supabase
    .from('trainers')
    .delete()
    .eq('id', id);
  if (deleteError) return res.status(400).json({ error: deleteError.message });

  if (user.role === 'trainer') {
    const { data: member } = await supabase
      .from('members').select('id,status').eq('id', id).single();

    if (member && member.status === 'inactive') {
      await supabase.from('members').update({ status: 'active' }).eq('id', id);
    }

    await supabase.from('users').update({ role: 'member' }).eq('id', id);
  }

  res.json({ message: 'Deleted successfully' });
});

module.exports = router;
