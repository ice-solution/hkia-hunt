const express = require('express');
const GameConfig = require('../../models/GameConfig');
const { requireDeviceJwt } = require('../../middleware/auth');

const router = express.Router();

router.get('/', requireDeviceJwt, async (req, res) => {
  try {
    const config = await GameConfig.getGlobal();
    return res.json({
      ok: true,
      config: {
        max_timer: config.max_timer,
        answer_timer: config.answer_timer,
        circle_radius: config.circle_radius,
      },
    });
  } catch (err) {
    console.error('GET /game-config', err);
    return res.status(500).json({ ok: false, error: '伺服器錯誤' });
  }
});

module.exports = router;
