// middleware/role.middleware.js
// ใช้หลัง auth.middleware เสมอ เช่น router.delete('/', auth, role('admin'), handler)

const role = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      error: `Access denied. Required role: ${allowedRoles.join(' or ')}. Your role: ${req.user.role}`
    });
  }
  next();
};

module.exports = role;
