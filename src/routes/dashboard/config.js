const express = require('express');
const GameConfig = require('../../models/GameConfig');
const { requireStaffSession, requireAdmin } = require('../../middleware/auth');

const router = express.Router();

router.use(requireStaffSession, requireAdmin);

router.get('/', async (req, res) => {
  const config = await GameConfig.getGlobal();
  return res.render('config', {
    title: 'Game Config',
    config,
    error: null,
    success: null,
  });
});

router.post('/', async (req, res) => {
  try {
    const max_timer = Number(req.body.max_timer);
    const answer_timer = Number(req.body.answer_timer);
    const circle_radius = Number(req.body.circle_radius);

    if (!Number.isFinite(max_timer) || max_timer < 1) {
      const config = await GameConfig.getGlobal();
      return res.status(400).render('config', {
        title: 'Game Config',
        config,
        error: 'max_timer 須為 >= 1 的秒數',
        success: null,
      });
    }
    if (!Number.isFinite(answer_timer) || answer_timer < 1) {
      const config = await GameConfig.getGlobal();
      return res.status(400).render('config', {
        title: 'Game Config',
        config,
        error: 'answer_timer 須為 >= 1 的秒數',
        success: null,
      });
    }
    if (!Number.isFinite(circle_radius) || circle_radius <= 0) {
      const config = await GameConfig.getGlobal();
      return res.status(400).render('config', {
        title: 'Game Config',
        config,
        error: 'circle_radius 須為 > 0 的 float',
        success: null,
      });
    }

    const config = await GameConfig.getGlobal();
    config.max_timer = max_timer;
    config.answer_timer = answer_timer;
    config.circle_radius = circle_radius;
    await config.save();

    return res.render('config', {
      title: 'Game Config',
      config,
      error: null,
      success: '設定已儲存',
    });
  } catch (err) {
    console.error('update config', err);
    const config = await GameConfig.getGlobal();
    return res.status(500).render('config', {
      title: 'Game Config',
      config,
      error: '儲存失敗',
      success: null,
    });
  }
});

module.exports = router;
