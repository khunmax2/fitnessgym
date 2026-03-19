const express = require('express');
const router  = express.Router();
const supabase = require('../config/supabase');
const auth     = require('../middleware/auth.middleware');

// GET — notifications ของ user ที่ login
router.get('/', auth, async (req, res) => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// GET unread count
router.get('/unread-count', auth, async (req, res) => {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', req.user.id)
    .eq('is_read', false);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ count });
});

// PATCH mark as read
router.patch('/:id/read', auth, async (req, res) => {
  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)
    .select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// PATCH mark all as read
router.patch('/read-all', auth, async (req, res) => {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', req.user.id)
    .eq('is_read', false);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'All marked as read' });
});

// DELETE
router.delete('/:id', auth, async (req, res) => {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.user.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Deleted' });
});

module.exports = router;
