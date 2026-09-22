const cron = require('node-cron');
const {
  resetAllDevicePasswordsAndEmail,
  isEmailSendEnabled,
  isOver48HoursSinceLastReset,
  getJobState,
} = require('../services/devicePasswordReset');
const { formatHktDateTime } = require('../utils/timezone');

let running = false;

async function runScheduledResetIfDue() {
  if (!isEmailSendEnabled()) {
    console.log('[device-password-reset] skipped: send_email is off');
    return;
  }

  const overdue = await isOver48HoursSinceLastReset();
  if (!overdue) {
    const state = await getJobState();
    console.log(
      `[device-password-reset] skipped: last reset at ${
        state.lastResetAt ? formatHktDateTime(state.lastResetAt) : 'never'
      } HKT (< 48h)`
    );
    return;
  }

  if (running) {
    return;
  }
  running = true;
  try {
    console.log('[device-password-reset] scheduled run (≥48h since last reset)');
    const result = await resetAllDevicePasswordsAndEmail('scheduled');
    console.log(
      `[device-password-reset] emailed ${result.count} device password(s); lastResetAt=${formatHktDateTime(result.lastResetAt)} HKT`
    );
  } catch (err) {
    console.error('[device-password-reset] scheduled run failed:', err.message || err);
  } finally {
    running = false;
  }
}

function startDevicePasswordResetScheduler() {
  // Every day 18:00 Asia/Hong_Kong → if send_email=on and ≥48h since last reset (manual counts)
  cron.schedule(
    '0 18 * * *',
    () => {
      runScheduledResetIfDue().catch((err) => {
        console.error('[device-password-reset] cron error:', err);
      });
    },
    { timezone: 'Asia/Hong_Kong' }
  );

  const flag = isEmailSendEnabled() ? 'on' : 'off';
  console.log(
    `[device-password-reset] scheduler ready: daily 18:00 HKT, send if ≥48h since last reset (send_email=${flag})`
  );
}

module.exports = { startDevicePasswordResetScheduler, runScheduledResetIfDue };
