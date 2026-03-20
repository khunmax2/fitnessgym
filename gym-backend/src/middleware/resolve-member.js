const supabase = require('../config/supabase');

/**
 * Resolve the real member_id for the current user.
 * Strategy: try members.id = users.id first, then fallback to email match.
 * Sets req.memberId on success.
 */
async function resolveMemberId(req) {
  // 1) Direct ID match (ideal case: members.id === users.id)
  const { data: byId } = await supabase
    .from('members')
    .select('id')
    .eq('id', req.user.id)
    .single();
  if (byId) { req.memberId = byId.id; return byId.id; }

  // 2) Fallback: match by email
  const { data: byEmail } = await supabase
    .from('members')
    .select('id')
    .eq('email', req.user.email)
    .single();
  if (byEmail) { req.memberId = byEmail.id; return byEmail.id; }

  return null;
}

module.exports = resolveMemberId;
