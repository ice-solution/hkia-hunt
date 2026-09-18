const express = require('express');
const GameLog = require('../../models/GameLog');
const Device = require('../../models/Device');
const { requireStaffSession } = require('../../middleware/auth');
const { formatHktDate } = require('../../utils/timezone');

const router = express.Router();

router.get('/', requireStaffSession, async (req, res) => {
  const today = formatHktDate();
  const [todayCount, deviceCount, totalLogs] = await Promise.all([
    GameLog.countDocuments({ gamedate: today }),
    Device.countDocuments({ active: true }),
    GameLog.countDocuments(),
  ]);

  return res.render('home', {
    title: 'Dashboard',
    today,
    todayCount,
    deviceCount,
    totalLogs,
    chartJson: JSON.stringify({
      labels: ['今日遊玩次數', '啟用 Device', '累計 Game Log'],
      values: [todayCount, deviceCount, totalLogs],
    }).replace(/</g, '\\u003c'),
  });
});

module.exports = router;
