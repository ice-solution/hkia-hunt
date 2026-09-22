const crypto = require('crypto');
const nodemailer = require('nodemailer');
const Device = require('../models/Device');
const JobState = require('../models/JobState');
const { formatHktDate, formatHktDateTime } = require('../utils/timezone');

const JOB_KEY = 'device_password_email';
const INTERVAL_MS = 48 * 60 * 60 * 1000;

function randomDevicePassword() {
  return String(crypto.randomInt(0, 1000000)).padStart(6, '0');
}

function buildPasswordEmailBody(pairs) {
  const lines = ['以下是新的 重設密碼：', ''];
  for (const { device_id, password } of pairs) {
    lines.push(`${device_id}:`);
    lines.push(password);
    lines.push('');
  }
  return lines.join('\n').trimEnd() + '\n';
}

function getMailConfig() {
  const user = process.env.gmail_ac || process.env.GMAIL_AC;
  const pass = process.env.gmail_pw || process.env.GMAIL_PW;
  const to = process.env.target_email || process.env.TARGET_EMAIL;
  return { user, pass, to };
}

/** .env send_email=on|off (also true/false/1/0) */
function isEmailSendEnabled() {
  const raw = String(process.env.send_email || process.env.SEND_EMAIL || 'off')
    .trim()
    .toLowerCase();
  return raw === 'on' || raw === 'true' || raw === '1' || raw === 'yes';
}

async function getJobState() {
  let state = await JobState.findOne({ key: JOB_KEY });
  if (!state) {
    state = await JobState.create({ key: JOB_KEY, lastResetAt: null });
  }
  return state;
}

async function markLastResetAt(when = new Date()) {
  const state = await getJobState();
  state.lastResetAt = when;
  await state.save();
  return state.lastResetAt;
}

/** true if never sent, or last send was >= 48 hours ago */
async function isOver48HoursSinceLastReset(now = new Date()) {
  const state = await getJobState();
  if (!state.lastResetAt) {
    return true;
  }
  return now.getTime() - new Date(state.lastResetAt).getTime() >= INTERVAL_MS;
}

async function sendPasswordEmail(pairs, reason) {
  const { user, pass, to } = getMailConfig();
  if (!user || !pass || !to) {
    throw new Error('缺少 gmail_ac / gmail_pw / target_email（.env）');
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });

  const eventName = process.env.EVENT_NAME || '尋寶挑戰百萬賞';
  const when = formatHktDateTime(new Date());
  const subject = `【${eventName}】Device 密碼重設（${reason} · ${when} HKT）`;

  await transporter.sendMail({
    from: `"${eventName}" <${user}>`,
    to,
    subject,
    text: buildPasswordEmailBody(pairs),
  });
}

/**
 * Reset ALL device passwords (device_id unchanged) and email plaintext passwords.
 * Updates lastResetAt so the 48h clock restarts (manual and scheduled).
 * @param {'manual'|'scheduled'} reason
 */
async function resetAllDevicePasswordsAndEmail(reason = 'manual') {
  const devices = await Device.find().sort({ device_id: 1 });
  if (!devices.length) {
    throw new Error('目前沒有任何 device');
  }

  const pairs = [];
  for (const device of devices) {
    const password = randomDevicePassword();
    device.passwordHash = await Device.hashPassword(password);
    await device.save();
    pairs.push({ device_id: device.device_id, password });
  }

  await sendPasswordEmail(pairs, reason === 'scheduled' ? '自動排程' : '手動重設');
  const lastResetAt = await markLastResetAt(new Date());

  return {
    count: pairs.length,
    deviceIds: pairs.map((p) => p.device_id),
    date: formatHktDate(),
    lastResetAt,
  };
}

module.exports = {
  JOB_KEY,
  INTERVAL_MS,
  randomDevicePassword,
  buildPasswordEmailBody,
  resetAllDevicePasswordsAndEmail,
  isEmailSendEnabled,
  isOver48HoursSinceLastReset,
  getJobState,
  getMailConfig,
};
