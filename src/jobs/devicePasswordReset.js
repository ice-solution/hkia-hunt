const cron = require('node-cron');
const JobState = require('../models/JobState');
const {
  resetAllDevicePasswordsAndEmail,
  isScheduledResetDay,
} = require('../services/devicePasswordReset');
const { formatHktDate } = require('../utils/timezone');

const JOB_KEY = 'device_password_email';
let running = false;

async function getJobState() {
  let state = await JobState.findOne({ key: JOB_KEY });
  if (!state) {
    state = await JobState.create({ key: JOB_KEY, lastScheduledResetDate: '' });
  }
  return state;
}

async function runScheduledResetIfDue() {
  const today = formatHktDate();
  if (!isScheduledResetDay(today)) {
    return;
  }

  const state = await getJobState();
  if (state.lastScheduledResetDate === today) {
    return;
  }

  if (running) {
    return;
  }
  running = true;
  try {
    console.log(`[device-password-reset] scheduled run for ${today} (HKT)`);
    const result = await resetAllDevicePasswordsAndEmail('scheduled');
    state.lastScheduledResetDate = today;
    await state.save();
    console.log(
      `[device-password-reset] emailed ${result.count} device password(s) to target_email`
    );
  } catch (err) {
    console.error('[device-password-reset] scheduled run failed:', err.message || err);
  } finally {
    running = false;
  }
}

function startDevicePasswordResetScheduler() {
  // Every day 18:00 Asia/Hong_Kong; logic decides even days from 2026-09-24
  cron.schedule(
    '0 18 * * *',
    () => {
      runScheduledResetIfDue().catch((err) => {
        console.error('[device-password-reset] cron error:', err);
      });
    },
    { timezone: 'Asia/Hong_Kong' }
  );
  console.log(
    '[device-password-reset] scheduler ready: every 2 days from 2026-09-24 at 18:00 HKT'
  );
}

module.exports = { startDevicePasswordResetScheduler, runScheduledResetIfDue };
