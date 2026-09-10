require('dotenv').config();

const { createApp } = require('./app');
const { connectDb } = require('./config/db');
const { ensureBootstrap } = require('./bootstrap');

async function main() {
  const port = Number(process.env.PORT) || 3000;
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error('MONGODB_URI is required');
  }
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is required');
  }

  await connectDb(mongoUri);
  await ensureBootstrap();

  const app = createApp();
  app.listen(port, () => {
    console.log(`尋寶挑戰百萬賞 listening on http://localhost:${port}`);
    console.log(`Dashboard: http://localhost:${port}/dashboard`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
