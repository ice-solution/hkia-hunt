const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
const DEVICE_PASSWORD_REGEX = /^\d{6}$/;

function isValidPassword(password) {
  return typeof password === 'string' && PASSWORD_REGEX.test(password);
}

function isValidDevicePassword(password) {
  return typeof password === 'string' && DEVICE_PASSWORD_REGEX.test(password);
}

const PASSWORD_HINT = '密碼至少 8 位，需包含大寫、小寫、數字與符號';
const DEVICE_PASSWORD_HINT = 'Device 密碼須為 6 位數字';

module.exports = {
  isValidPassword,
  isValidDevicePassword,
  PASSWORD_HINT,
  DEVICE_PASSWORD_HINT,
  PASSWORD_REGEX,
  DEVICE_PASSWORD_REGEX,
};
