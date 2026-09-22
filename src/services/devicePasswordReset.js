const crypto = require('crypto');
const nodemailer = require('nodemailer');
const Device = require('../models/Device');
const { formatHktDate, formatHktDateTime } = require('../utils/timezone');

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

  return {
    count: pairs.length,
    deviceIds: pairs.map((p) => p.device_id),
    date: formatHktDate(),
  };
}

/**
 * Schedule days: from 2026-09-24 inclusive, every 2 calendar days (24,26,28…).
 */
function isScheduledResetDay(dateStr) {
  const start = '2026-09-24';
  if (!dateStr || dateStr < start) return false;
  const startMs = new Date(`${start}T12:00:00+08:00`).getTime();
  const dayMs = new Date(`${dateStr}T12:00:00+08:00`).getTime();
  const diffDays = Math.round((dayMs - startMs) / (24 * 60 * 60 * 1000));
  return diffDays >= 0 && diffDays % 2 === 0;
}

module.exports = {
  randomDevicePassword,
  buildPasswordEmailBody,
  resetAllDevicePasswordsAndEmail,
  isScheduledResetDay,
  getMailConfig,
};
