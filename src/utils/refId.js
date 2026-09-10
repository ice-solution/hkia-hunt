const { formatHktYyyymmdd } = require('./timezone');

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function randomSuffix(length = 4) {
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return out;
}

/** Generate ref_id: yyyymmdd (GMT+8) + 4 alphanumeric chars */
function generateRefId(date = new Date()) {
  return `${formatHktYyyymmdd(date)}${randomSuffix(4)}`;
}

module.exports = { generateRefId };
