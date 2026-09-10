const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

function isValidPassword(password) {
  return typeof password === 'string' && PASSWORD_REGEX.test(password);
}

const PASSWORD_HINT = '密碼至少 8 位，需包含大寫、小寫、數字與符號';

module.exports = { isValidPassword, PASSWORD_HINT, PASSWORD_REGEX };
