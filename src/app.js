const path = require('path');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const expressLayouts = require('express-ejs-layouts');

const loginRoutes = require('./routes/api/login');
const gameConfigRoutes = require('./routes/api/gameConfig');
const gameLogRoutes = require('./routes/api/gameLog');
const rankingRoutes = require('./routes/api/ranking');

const dashboardHome = require('./routes/dashboard/home');
const dashboardAuth = require('./routes/dashboard/auth');
const dashboardLogs = require('./routes/dashboard/logs');
const dashboardDevices = require('./routes/dashboard/devices');
const dashboardConfig = require('./routes/dashboard/config');

function createApp() {
  const app = express();

  // Cloudflare Flexible + Apache reverse proxy
  app.set('trust proxy', 1);

  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, '..', 'views'));
  app.use(expressLayouts);
  app.set('layout', 'layout');

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(express.static(path.join(__dirname, '..', 'public')));

  app.get('/', (req, res) => {
    res.redirect('/dashboard');
  });

  app.use('/login', loginRoutes);
  app.use('/api/login', loginRoutes);
  app.use('/game-config', gameConfigRoutes);
  app.use('/api/game-config', gameConfigRoutes);
  app.use('/game-log', gameLogRoutes);
  app.use('/api/game-log', gameLogRoutes);
  app.use('/ranking', rankingRoutes);
  app.use('/api/ranking', rankingRoutes);

  app.use('/dashboard', dashboardAuth);
  app.use('/dashboard', dashboardHome);
  app.use('/dashboard/logs', dashboardLogs);
  app.use('/dashboard/devices', dashboardDevices);
  app.use('/dashboard/config', dashboardConfig);

  app.use((req, res) => {
    if (req.path.startsWith('/dashboard')) {
      return res.status(404).render('error', {
        title: '找不到頁面',
        message: '路徑不存在',
        staff: res.locals.staff,
        eventName: process.env.EVENT_NAME || '尋寶挑戰百萬賞',
      });
    }
    return res.status(404).json({ ok: false, error: 'Not found' });
  });

  return app;
}

module.exports = { createApp };
