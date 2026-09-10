const express = require('express');
const GameLog = require('../../models/GameLog');
const { requireDeviceJwt } = require('../../middleware/auth');
const { generateRefId } = require('../../utils/refId');

const router = express.Router();

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}:\d{2}$/;
const TOTAL_SCORE = 20;

router.post('/', requireDeviceJwt, async (req, res) => {
  try {
    const body = req.body || {};
    const {
      gamedate,
      start_time,
      end_time,
      game_visual_no,
      correct,
      incorrect,
      completion_time,
    } = body;

    if (!gamedate || !DATE_RE.test(gamedate)) {
      return res.status(400).json({ ok: false, error: 'gamedate 格式須為 YYYY-MM-DD' });
    }
    if (!start_time || !TIME_RE.test(start_time)) {
      return res.status(400).json({ ok: false, error: 'start_time 格式須為 HH:mm:ss' });
    }
    if (!end_time || !TIME_RE.test(end_time)) {
      return res.status(400).json({ ok: false, error: 'end_time 格式須為 HH:mm:ss' });
    }

    const visualNo = Number(game_visual_no);
    const correctN = Number(correct);
    const incorrectN = Number(incorrect);
    const completionN = Number(completion_time);

    if (!Number.isFinite(visualNo)) {
      return res.status(400).json({ ok: false, error: 'game_visual_no 須為數字' });
    }
    if (!Number.isInteger(correctN) || correctN < 0 || correctN > TOTAL_SCORE) {
      return res.status(400).json({ ok: false, error: `correct 須為 0–${TOTAL_SCORE} 整數` });
    }
    if (!Number.isInteger(incorrectN) || incorrectN < 0 || incorrectN > TOTAL_SCORE) {
      return res.status(400).json({ ok: false, error: `incorrect 須為 0–${TOTAL_SCORE} 整數` });
    }
    if (correctN + incorrectN !== TOTAL_SCORE) {
      return res.status(400).json({
        ok: false,
        error: `correct + incorrect 必須等於 ${TOTAL_SCORE}`,
      });
    }
    if (!Number.isFinite(completionN) || completionN < 0) {
      return res.status(400).json({ ok: false, error: 'completion_time 須為 >= 0 的秒數' });
    }

    const device_id = req.device.device_id;

    let ref_id;
    let created = null;
    for (let attempt = 0; attempt < 8; attempt += 1) {
      ref_id = generateRefId();
      try {
        created = await GameLog.create({
          ref_id,
          device_id,
          gamedate,
          start_time,
          end_time,
          game_visual_no: visualNo,
          correct: correctN,
          incorrect: incorrectN,
          completion_time: completionN,
        });
        break;
      } catch (err) {
        if (err && err.code === 11000) {
          continue;
        }
        throw err;
      }
    }

    if (!created) {
      return res.status(500).json({ ok: false, error: '無法產生唯一 ref_id' });
    }

    return res.status(201).json({
      ok: true,
      ref_id: created.ref_id,
    });
  } catch (err) {
    console.error('POST /game-log', err);
    return res.status(500).json({ ok: false, error: '伺服器錯誤' });
  }
});

module.exports = router;
