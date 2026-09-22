const express = require('express');
const GameLog = require('../../models/GameLog');
const { requireStaffSession } = require('../../middleware/auth');
const { formatCompletionTime } = require('../../utils/timezone');

const router = express.Router();

router.use(requireStaffSession);

router.get('/', async (req, res) => {
  const aggregated = await GameLog.aggregate([
    {
      $group: {
        _id: '$device_id',
        correct: { $sum: '$correct' },
        completion_time: { $min: '$completion_time' },
        plays: { $sum: 1 },
      },
    },
    { $sort: { correct: -1, completion_time: 1, _id: 1 } },
  ]);

  const ranking = [];
  let lastKey = null;
  let denseRank = 0;

  for (const row of aggregated) {
    const key = `${row.correct}|${row.completion_time}`;
    if (lastKey === null || key !== lastKey) {
      denseRank += 1;
      lastKey = key;
    }
    ranking.push({
      rank: denseRank,
      device_id: row._id,
      correct: row.correct,
      completion_time: row.completion_time,
      completionLabel: formatCompletionTime(row.completion_time),
      plays: row.plays,
    });
  }

  return res.render('ranking', {
    title: '排行榜',
    ranking,
  });
});

module.exports = router;
