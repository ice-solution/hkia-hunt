const express = require('express');
const jwt = require('jsonwebtoken');
const Device = require('../../models/Device');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { device_id, password } = req.body || {};

    if (!device_id || !password) {
      return res.status(400).json({ ok: false, error: '需要 device_id 與 password' });
    }

    const device = await Device.findOne({ device_id: String(device_id).trim() });
    if (!device || !device.active) {
      return res.status(401).json({ ok: false, error: '帳號或密碼錯誤' });
    }

    const match = await device.comparePassword(password);
    if (!match) {
      return res.status(401).json({ ok: false, error: '帳號或密碼錯誤' });
    }

    const token = jwt.sign(
      { type: 'device', device_id: device.device_id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    return res.json({
      ok: true,
      token,
      expires_in: process.env.JWT_EXPIRES_IN || '24h',
      device_id: device.device_id,
    });
  } catch (err) {
    console.error('POST /login', err);
    return res.status(500).json({ ok: false, error: '伺服器錯誤' });
  }
});

module.exports = router;
