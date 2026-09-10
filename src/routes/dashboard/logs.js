const express = require('express');
const ExcelJS = require('exceljs');
const GameLog = require('../../models/GameLog');
const { requireStaffSession } = require('../../middleware/auth');
const { formatHktDate, formatHktDateTime } = require('../../utils/timezone');

const router = express.Router();

router.use(requireStaffSession);

function buildQuery(from, to) {
  const filter = {};
  if (from && to) {
    filter.gamedate = { $gte: from, $lte: to };
  } else if (from) {
    filter.gamedate = from;
  }
  return filter;
}

router.get('/', async (req, res) => {
  const today = formatHktDate();
  const from = req.query.from || today;
  const to = req.query.to || today;
  const filter = buildQuery(from, to);

  const logs = await GameLog.find(filter).sort({ gamedate: -1, start_time: -1 }).lean();

  return res.render('logs', {
    title: '遊戲紀錄',
    from,
    to,
    logs: logs.map((log) => ({
      ...log,
      createdAtHkt: formatHktDateTime(log.createdAt),
    })),
  });
});

router.get('/export.xlsx', async (req, res) => {
  try {
    const today = formatHktDate();
    const from = req.query.from || today;
    const to = req.query.to || today;
    const filter = buildQuery(from, to);
    const logs = await GameLog.find(filter).sort({ gamedate: 1, start_time: 1 }).lean();

    const workbook = new ExcelJS.Workbook();
    workbook.creator = process.env.EVENT_NAME || '尋寶挑戰百萬賞';
    const sheet = workbook.addWorksheet('GameLogs');

    sheet.columns = [
      { header: 'ref_id', key: 'ref_id', width: 18 },
      { header: 'device_id', key: 'device_id', width: 16 },
      { header: 'gamedate', key: 'gamedate', width: 14 },
      { header: 'start_time', key: 'start_time', width: 12 },
      { header: 'end_time', key: 'end_time', width: 12 },
      { header: 'game_visual_no', key: 'game_visual_no', width: 16 },
      { header: 'correct', key: 'correct', width: 10 },
      { header: 'incorrect', key: 'incorrect', width: 10 },
      { header: 'completion_time', key: 'completion_time', width: 16 },
      { header: 'created_at_hkt', key: 'created_at_hkt', width: 22 },
    ];

    logs.forEach((log) => {
      sheet.addRow({
        ref_id: log.ref_id,
        device_id: log.device_id,
        gamedate: log.gamedate,
        start_time: log.start_time,
        end_time: log.end_time,
        game_visual_no: log.game_visual_no,
        correct: log.correct,
        incorrect: log.incorrect,
        completion_time: log.completion_time,
        created_at_hkt: formatHktDateTime(log.createdAt),
      });
    });

    sheet.getRow(1).font = { bold: true };

    const filename = `gamelogs_${from}_${to}.xlsx`;
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    return res.end();
  } catch (err) {
    console.error('export xlsx', err);
    return res.status(500).send('匯出失敗');
  }
});

module.exports = router;
