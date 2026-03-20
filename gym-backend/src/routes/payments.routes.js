const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const auth = require('../middleware/auth.middleware');
const role = require('../middleware/role.middleware');
const generatePayload = require('promptpay-qr');
const QRCode = require('qrcode');

// ── Config: PromptPay ID (เบอร์โทร / เลขบัตรประชาชน / Tax ID ของ Gym) ──
const PROMPTPAY_ID = process.env.PROMPTPAY_ID ;

const VALID_METHODS = ['cash', 'transfer', 'credit_card', 'promptpay'];
const VALID_STATUSES = ['paid', 'pending', 'refunded'];
const VALID_PAYMENT_TYPES = ['membership_fee', 'personal_training', 'class_fee', 'other'];

// ── Validate payment input ──
function validatePayment(body, isUpdate = false) {
  const errors = [];
  if (!isUpdate) {
    if (!body.member_id) errors.push('member_id is required');
    if (body.amount == null) errors.push('amount is required');
    if (!body.payment_date) errors.push('payment_date is required');
  }
  if (body.amount != null && (isNaN(body.amount) || Number(body.amount) <= 0)) {
    errors.push('amount must be a positive number');
  }
  if (body.method && !VALID_METHODS.includes(body.method)) {
    errors.push(`method must be one of: ${VALID_METHODS.join(', ')}`);
  }
  if (body.status && !VALID_STATUSES.includes(body.status)) {
    errors.push(`status must be one of: ${VALID_STATUSES.join(', ')}`);
  }
  if (body.payment_type && !VALID_PAYMENT_TYPES.includes(body.payment_type)) {
    errors.push(`payment_type must be one of: ${VALID_PAYMENT_TYPES.join(', ')}`);
  }
  return errors;
}

// ── Sanitize: pick only allowed fields ──
function sanitize(body) {
  const allowed = ['member_id', 'amount', 'payment_date', 'method', 'status', 'notes', 'payment_type', 'due_date'];
  const clean = {};
  for (const key of allowed) {
    if (body[key] !== undefined) clean[key] = body[key];
  }
  if (clean.amount != null) clean.amount = Math.round(Number(clean.amount) * 100) / 100;
  return clean;
}

// ── POST generate PromptPay QR (must be before /:id routes) ──
router.post('/promptpay-qr', auth, role('admin', 'staff'), async (req, res) => {
  const { amount } = req.body;
  if (!amount || isNaN(amount) || Number(amount) <= 0) {
    return res.status(400).json({ error: 'Valid amount is required' });
  }

  const payload = generatePayload(PROMPTPAY_ID, { amount: Number(amount) });
  const qrDataUrl = await QRCode.toDataURL(payload, {
    width: 400,
    margin: 2,
    color: { dark: '#000000', light: '#ffffff' }
  });

  res.json({
    qr: qrDataUrl,
    promptpay_id: PROMPTPAY_ID,
    amount: Number(amount)
  });
});

const resolveMemberId = require('../middleware/resolve-member');

// ── GET /my — member gets own payments ──
router.get('/my', auth, async (req, res) => {
  const memberId = await resolveMemberId(req);
  if (!memberId) return res.json([]);
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('member_id', memberId)
    .or('is_deleted.is.null,is_deleted.eq.false')
    .order('payment_date', { ascending: false });
  if (error) return res.status(400).json({ error: error.message });
  res.json(data || []);
});

// ── GET all — admin & staff (exclude soft-deleted) ──
router.get('/', auth, role('admin', 'staff'), async (req, res) => {
  const { data, error } = await supabase
    .from('payments')
    .select('*, members(name)')
    .or('is_deleted.is.null,is_deleted.eq.false')
    .order('created_at', { ascending: false });
  if (error) return res.status(400).json({ error: error.message });
  const mapped = (data || []).map(d => ({
    ...d,
    member_name: d.members?.name || '-',
  }));
  mapped.forEach(d => { delete d.members; });
  res.json(mapped);
});

// ── GET one ──
router.get('/:id', auth, async (req, res) => {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('id', req.params.id)
    .single();
  if (error) return res.status(404).json({ error: 'Not found' });
  res.json(data);
});

// ── POST create — admin & staff ──
router.post('/', auth, role('admin', 'staff'), async (req, res) => {
  const errors = validatePayment(req.body);
  if (errors.length) return res.status(400).json({ error: errors.join(', ') });

  const clean = sanitize(req.body);

  // Verify member exists
  const { data: member } = await supabase
    .from('members')
    .select('id')
    .eq('id', clean.member_id)
    .single();
  if (!member) return res.status(400).json({ error: 'Member not found' });

  // PromptPay → default pending
  if (clean.method === 'promptpay' && !clean.status) {
    clean.status = 'pending';
  }

  // Auto-generate invoice number
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  clean.invoice_number = `INV-${dateStr}-${rand}`;

  // Auto-generate transaction_ref: PAY-YYYYMMDD-XXXX
  const seq = Math.floor(1000 + Math.random() * 9000);
  clean.transaction_ref = `PAY-${dateStr}-${seq}`;

  // Auto-set due_date if not provided (payment_date + 30 days)
  if (!clean.due_date && clean.payment_date) {
    const pd = new Date(clean.payment_date);
    pd.setDate(pd.getDate() + 30);
    clean.due_date = pd.toISOString().slice(0, 10);
  }

  clean.created_by = req.user.id;

  const { data, error } = await supabase
    .from('payments')
    .insert([clean])
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

// ── PUT update — admin only ──
router.put('/:id', auth, role('admin'), async (req, res) => {
  const errors = validatePayment(req.body, true);
  if (errors.length) return res.status(400).json({ error: errors.join(', ') });

  const clean = sanitize(req.body);
  clean.updated_by = req.user.id;
  const { data, error } = await supabase
    .from('payments')
    .update(clean)
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// ── PATCH confirm payment (staff/admin) ──
router.patch('/:id/confirm', auth, role('admin', 'staff'), async (req, res) => {
  const { data, error } = await supabase
    .from('payments')
    .update({ status: 'paid', updated_by: req.user.id })
    .eq('id', req.params.id)
    .eq('status', 'pending')
    .select()
    .single();
  if (error) return res.status(400).json({ error: 'Cannot confirm — payment not found or not pending' });
  res.json(data);
});

// ── PATCH refund payment (admin only) ──
router.patch('/:id/refund', auth, role('admin'), async (req, res) => {
  const { refund_reason } = req.body;
  if (!refund_reason || !refund_reason.trim()) {
    return res.status(400).json({ error: 'ต้องระบุเหตุผลการคืนเงิน' });
  }

  // Check payment exists and is paid
  const { data: payment } = await supabase
    .from('payments')
    .select('id, status')
    .eq('id', req.params.id)
    .single();
  if (!payment) return res.status(404).json({ error: 'Payment not found' });
  if (payment.status !== 'paid') return res.status(400).json({ error: 'คืนเงินได้เฉพาะรายการที่ชำระแล้วเท่านั้น' });

  const { data, error } = await supabase
    .from('payments')
    .update({
      status: 'refunded',
      refund_reason: refund_reason.trim(),
      refunded_at: new Date().toISOString(),
      updated_by: req.user.id
    })
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// ── DELETE — soft delete (admin only) ──
router.delete('/:id', auth, role('admin'), async (req, res) => {
  const { data, error } = await supabase
    .from('payments')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
      updated_by: req.user.id
    })
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Deleted successfully' });
});

module.exports = router;
