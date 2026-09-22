const express = require('express');
const Device = require('../../models/Device');
const { isValidDevicePassword, DEVICE_PASSWORD_HINT } = require('../../utils/password');
const { requireStaffSession, requireAdmin } = require('../../middleware/auth');
const { formatHktDateTime } = require('../../utils/timezone');
const { resetAllDevicePasswordsAndEmail } = require('../../services/devicePasswordReset');

const router = express.Router();

router.use(requireStaffSession, requireAdmin);

async function renderDevices(res, { error = null, success = null, status = 200 } = {}) {
  const devices = await Device.find().sort({ device_id: 1 }).lean();
  return res.status(status).render('devices', {
    title: 'Device 管理',
    devices: devices.map((d) => ({
      ...d,
      createdAtHkt: formatHktDateTime(d.createdAt),
    })),
    passwordHint: DEVICE_PASSWORD_HINT,
    error,
    success,
  });
}

router.get('/', async (req, res) => {
  if (req.query.success === 'password') {
    return renderDevices(res, { success: '密碼已更新' });
  }
  if (req.query.success === 'toggle') {
    return renderDevices(res, { success: '狀態已更新' });
  }
  if (req.query.success === 'emailed') {
    return renderDevices(res, { success: '已重設全部 Device 密碼並寄出 email' });
  }
  if (req.query.error === 'password') {
    return renderDevices(res, { error: DEVICE_PASSWORD_HINT, status: 400 });
  }
  if (req.query.error === 'notfound') {
    return renderDevices(res, { error: '找不到 Device', status: 400 });
  }
  if (req.query.error === 'server') {
    return renderDevices(res, { error: '操作失敗', status: 400 });
  }
  return renderDevices(res);
});

router.post('/', async (req, res) => {
  try {
    const { device_id, password, label } = req.body || {};
    if (!device_id || !password) {
      return renderDevices(res, {
        error: '請填寫 device_id 與 password',
        status: 400,
      });
    }
    if (!isValidDevicePassword(password)) {
      return renderDevices(res, {
        error: DEVICE_PASSWORD_HINT,
        status: 400,
      });
    }

    await Device.create({
      device_id: String(device_id).trim(),
      passwordHash: await Device.hashPassword(password),
      label: label ? String(label).trim() : '',
      active: true,
    });

    return renderDevices(res, { success: 'Device 已建立' });
  } catch (err) {
    if (err && err.code === 11000) {
      return renderDevices(res, { error: 'device_id 已存在', status: 400 });
    }
    console.error('create device', err);
    return renderDevices(res, { error: '建立失敗', status: 500 });
  }
});

router.post('/reset-and-email', async (req, res) => {
  try {
    const result = await resetAllDevicePasswordsAndEmail('manual');
    return renderDevices(res, {
      success: `已重設 ${result.count} 個 Device 密碼，並寄到 target_email（device_id 未改動）`,
    });
  } catch (err) {
    console.error('reset-and-email', err);
    return renderDevices(res, {
      error: err.message || '重設並寄信失敗',
      status: 500,
    });
  }
});

router.post('/:id/password', async (req, res) => {
  try {
    const { password } = req.body || {};
    if (!isValidDevicePassword(password)) {
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
