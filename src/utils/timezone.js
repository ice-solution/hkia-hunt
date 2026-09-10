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

/**
 * Parse a GMT+8 calendar date (YYYY-MM-DD) to UTC Date range [start, endExclusive).
 */
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
  hktDateRangeToUtc,
};
