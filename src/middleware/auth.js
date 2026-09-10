const jwt = require('jsonwebtoken');

function requireDeviceJwt(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ ok: false, error: '缺少授權 token' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.type !== 'device') {
      return res.status(401).json({ ok: false, error: '無效的 token 類型' });
    }
    req.device = { device_id: payload.device_id };
    return next();
  } catch (err) {
    return res.status(401).json({ ok: false, error: 'token 無效或已過期' });
  }
}

function requireStaffSession(req, res, next) {
  const token = req.cookies?.dashboard_token;
  if (!token) {
    if (req.accepts('html')) {
      return res.redirect('/dashboard/login');
    }
    return res.status(401).json({ ok: false, error: '未登入' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.type !== 'staff') {
      throw new Error('invalid type');
    }
    req.staff = {
      id: payload.sub,
      username: payload.username,
      role: payload.role,
    };
    res.locals.staff = req.staff;
    res.locals.eventName = process.env.EVENT_NAME || '尋寶挑戰百萬賞';
    return next();
  } catch (err) {
    res.clearCookie('dashboard_token');
    if (req.accepts('html')) {
      return res.redirect('/dashboard/login');
    }
    return res.status(401).json({ ok: false, error: '登入已過期' });
  }
}

function requireAdmin(req, res, next) {
  if (!req.staff || req.staff.role !== 'admin') {
    if (req.accepts('html')) {
      return res.status(403).render('error', {
        title: '無權限',
        message: '此功能僅限管理員使用',
      });
    }
    return res.status(403).json({ ok: false, error: '僅限管理員' });
  }
  return next();
}

module.exports = {
  requireDeviceJwt,
  requireStaffSession,
  requireAdmin,
};
