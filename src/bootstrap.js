const Staff = require('./models/Staff');
const GameConfig = require('./models/GameConfig');
const { isValidPassword } = require('./utils/password');

async function ensureBootstrap() {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD;

  if (!password) {
    throw new Error('ADMIN_PASSWORD 必須在 .env 中設定');
  }

  if (!isValidPassword(password)) {
    console.warn(
      '警告：ADMIN_PASSWORD 不符合強度規則（建議至少 8 位且含大小寫、數字、符號）'
    );
  }

  let admin = await Staff.findOne({ username });
  if (!admin) {
    admin = await Staff.create({
      username,
      passwordHash: await Staff.hashPassword(password),
      role: 'admin',
      active: true,
    });
    console.log(`已建立 admin 帳號: ${username}`);
  } else if (admin.role !== 'admin') {
    admin.role = 'admin';
    await admin.save();
  }

  await GameConfig.getGlobal();
}

module.exports = { ensureBootstrap };
