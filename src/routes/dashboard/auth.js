const express = require('express');
const jwt = require('jsonwebtoken');
const Staff = require('../../models/Staff');
const { isValidPassword, PASSWORD_HINT } = require('../../utils/password');
const { requireStaffSession, requireAdmin } = require('../../middleware/auth');

const router = express.Router();

router.get('/login', (req, res) => {
  if (req.cookies?.dashboard_token) {
    return res.redirect('/dashboard');
  }
  return res.render('login', {
    title: '後台登入',
    error: null,
    layout: false,
  });
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).render('login', {
        title: '後台登入',
        error: '請輸入帳號與密碼',
        layout: false,
      });
    }

    const staff = await Staff.findOne({ username: String(username).trim() });
    if (!staff || !staff.active) {
      return res.status(401).render('login', {
        title: '後台登入',
        error: '帳號或密碼錯誤',
        layout: false,
      });
    }

    const match = await staff.comparePassword(password);
    if (!match) {
      return res.status(401).render('login', {
        title: '後台登入',
        error: '帳號或密碼錯誤',
        layout: false,
      });
    }

    const token = jwt.sign(
      {
        type: 'staff',
        sub: staff._id.toString(),
        username: staff.username,
        role: staff.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.cookie('dashboard_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 12 * 60 * 60 * 1000,
    });

    return res.redirect('/dashboard');
  } catch (err) {
    console.error('dashboard login', err);
    return res.status(500).render('login', {
      title: '後台登入',
      error: '伺服器錯誤',
      layout: false,
    });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('dashboard_token');
  return res.redirect('/dashboard/login');
});

router.get('/accounts', requireStaffSession, requireAdmin, async (req, res) => {
  const accounts = await Staff.find().sort({ createdAt: 1 }).lean();
  return res.render('accounts', {
    title: '帳號管理',
    accounts,
    passwordHint: PASSWORD_HINT,
    error: null,
    success: null,
  });
});

router.post('/accounts', requireStaffSession, requireAdmin, async (req, res) => {
  const accounts = await Staff.find().sort({ createdAt: 1 }).lean();
  try {
    const { username, password, role } = req.body || {};
    if (!username || !password) {
      return res.status(400).render('accounts', {
        title: '帳號管理',
        accounts,
        passwordHint: PASSWORD_HINT,
        error: '請填寫帳號與密碼',
        success: null,
      });
    }
    if (!isValidPassword(password)) {
      return res.status(400).render('accounts', {
        title: '帳號管理',
        accounts,
        passwordHint: PASSWORD_HINT,
        error: PASSWORD_HINT,
        success: null,
      });
    }
    const safeRole = role === 'admin' ? 'admin' : 'staff';
    await Staff.create({
      username: String(username).trim(),
      passwordHash: await Staff.hashPassword(password),
      role: safeRole,
      active: true,
    });
    const refreshed = await Staff.find().sort({ createdAt: 1 }).lean();
    return res.render('accounts', {
      title: '帳號管理',
      accounts: refreshed,
      passwordHint: PASSWORD_HINT,
      error: null,
      success: '帳號已建立',
    });
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(400).render('accounts', {
        title: '帳號管理',
        accounts,
        passwordHint: PASSWORD_HINT,
        error: '帳號已存在',
        success: null,
      });
    }
    console.error('create account', err);
    return res.status(500).render('accounts', {
      title: '帳號管理',
      accounts,
      passwordHint: PASSWORD_HINT,
      error: '建立失敗',
      success: null,
    });
  }
});

module.exports = router;
