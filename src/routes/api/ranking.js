const express = require('express');
const GameLog = require('../../models/GameLog');
const { requireDeviceJwt } = require('../../middleware/auth');

const router = express.Router();

router.get('/', requireDeviceJwt, async (req, res) => {
  try {
    const aggregated = await GameLog.aggregate([
      {
        $group: {
          _id: '$device_id',
          score: { $sum: '$correct' },
          plays: { $sum: 1 },
        },
      },
      { $sort: { score: -1, _id: 1 } },
      { $limit: 10 },
    ]);

    const ranking = [];
    let lastScore = null;
    let denseRank = 0;

    for (const row of aggregated) {
      if (lastScore === null || row.score !== lastScore) {
        denseRank += 1;
        lastScore = row.score;
      }
      ranking.push({
        rank: denseRank,
        device_id: row._id,
        score: row.score,
        plays: row.plays,
      });
    }

    return res.json({
      ok: true,
      ranking,
    });
  } catch (err) {
    console.error('GET /ranking', err);
    return res.status(500).json({ ok: false, error: '伺服器錯誤' });
  }
});

module.exports = router;
