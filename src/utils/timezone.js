const HKT_OFFSET_MS = 8 * 60 * 60 * 1000;

/** Return a Date representing "wall clock" in GMT+8 for formatting. */
function toHktDate(date = new Date()) {
  return new Date(date.getTime() + HKT_OFFSET_MS);
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

/** yyyymmdd in GMT+8 */
function formatHktYyyymmdd(date = new Date()) {
  const d = toHktDate(date);
  return `${d.getUTCFullYear()}${pad2(d.getUTCMonth() + 1)}${pad2(d.getUTCDate())}`;
}

/** YYYY-MM-DD in GMT+8 */
function formatHktDate(date = new Date()) {
  const d = toHktDate(date);
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

/** YYYY-MM-DD HH:mm:ss in GMT+8 */
function formatHktDateTime(date = new Date()) {
  const d = toHktDate(date);
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())} ${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}:${pad2(d.getUTCSeconds())}`;
}

/** completion_time (seconds) → mm:ss.mmm, e.g. 65.5 → 01:05.500 */
function formatCompletionTime(seconds) {
  const n = Number(seconds);
  if (!Number.isFinite(n) || n < 0) return '00:00.000';
  const totalMs = Math.round(n * 1000);
  const mins = Math.floor(totalMs / 60000);
  const rem = totalMs % 60000;
  const secs = Math.floor(rem / 1000);
  const ms = rem % 1000;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
}

/** Inclusive YYYY-MM-DD list in GMT+8. */
function eachHktDate(from, to) {
  const dates = [];
  if (!from || !to || from > to) return dates;
  let cursor = new Date(`${from}T12:00:00+08:00`);
  const end = new Date(`${to}T12:00:00+08:00`);
  const limit = 400;
  while (cursor <= end && dates.length < limit) {
    dates.push(formatHktDate(cursor));
    cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
  }
  return dates;
}

function hktDateRangeToUtc(startDateStr, endDateStr) {
  const startUtc = new Date(`${startDateStr}T00:00:00+08:00`);
  const endUtc = new Date(`${endDateStr}T00:00:00+08:00`);
  endUtc.setUTCDate(endUtc.getUTCDate() + 1);
  return { startUtc, endUtc };
}

module.exports = {
  formatHktYyyymmdd,
  formatHktDate,
  formatHktDateTime,
  formatCompletionTime,
  eachHktDate,
  hktDateRangeToUtc,
};
