const express = require('express');
const Device = require('../../models/Device');
const { isValidPassword, PASSWORD_HINT } = require('../../utils/password');
const { requireStaffSession, requireAdmin } = require('../../middleware/auth');
const { formatHktDateTime } = require('../../utils/timezone');

const router = express.Router();

router.use(requireStaffSession, requireAdmin);

router.get('/', async (req, res) => {
  const devices = await Device.find().sort({ device_id: 1 }).lean();
  return res.render('devices', {
    title: 'Device 管理',
    devices: devices.map((d) => ({
      ...d,
      createdAtHkt: formatHktDateTime(d.createdAt),
    })),
    passwordHint: PASSWORD_HINT,
    error: null,
    success: null,
  });
});

router.post('/', async (req, res) => {
  const devices = await Device.find().sort({ device_id: 1 }).lean();
  const mapped = devices.map((d) => ({
    ...d,
    createdAtHkt: formatHktDateTime(d.createdAt),
  }));

  try {
    const { device_id, password, label } = req.body || {};
    if (!device_id || !password) {
      return res.status(400).render('devices', {
        title: 'Device 管理',
        devices: mapped,
        passwordHint: PASSWORD_HINT,
        error: '請填寫 device_id 與 password',
        success: null,
      });
    }
    if (!isValidPassword(password)) {
      return res.status(400).render('devices', {
        title: 'Device 管理',
        devices: mapped,
        passwordHint: PASSWORD_HINT,
        error: PASSWORD_HINT,
        success: null,
      });
    }

    await Device.create({
      device_id: String(device_id).trim(),
      passwordHash: await Device.hashPassword(password),
      label: label ? String(label).trim() : '',
      active: true,
    });

    const refreshed = await Device.find().sort({ device_id: 1 }).lean();
    return res.render('devices', {
      title: 'Device 管理',
      devices: refreshed.map((d) => ({
        ...d,
        createdAtHkt: formatHktDateTime(d.createdAt),
      })),
      passwordHint: PASSWORD_HINT,
      error: null,
      success: 'Device 已建立',
    });
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(400).render('devices', {
        title: 'Device 管理',
        devices: mapped,
        passwordHint: PASSWORD_HINT,
        error: 'device_id 已存在',
        success: null,
      });
    }
    console.error('create device', err);
    return res.status(500).render('devices', {
      title: 'Device 管理',
      devices: mapped,
      passwordHint: PASSWORD_HINT,
      error: '建立失敗',
      success: null,
    });
  }
});

router.post('/:id/password', async (req, res) => {
  try {
    const { password } = req.body || {};
    if (!isValidPassword(password)) {
      return res.status(400).redirect('/dashboard/devices?error=password');
    }
    const device = await Device.findById(req.params.id);
    if (!device) {
      return res.status(404).redirect('/dashboard/devices?error=notfound');
    }
    device.passwordHash = await Device.hashPassword(password);
    await device.save();
    return res.redirect('/dashboard/devices?success=password');
  } catch (err) {
    console.error('update device password', err);
    return res.redirect('/dashboard/devices?error=server');
  }
});

router.post('/:id/toggle', async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);
    if (!device) {
      return res.redirect('/dashboard/devices?error=notfound');
    }
    device.active = !device.active;
    await device.save();
    return res.redirect('/dashboard/devices?success=toggle');
  } catch (err) {
    console.error('toggle device', err);
    return res.redirect('/dashboard/devices?error=server');
  }
});

module.exports = router;
