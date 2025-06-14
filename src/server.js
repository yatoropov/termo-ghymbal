require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('./auth');
const path = require('path');
const bodyParser = require('body-parser');
const { sendGimbalCommand } = require('./mqtt'); // Підключаємо mqtt.js
const { getGimbalStatus } = require('./mqtt'); // Connection Status Ghymbal

const app = express();

// ---- Middleware ----
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.urlencoded({ extended: true }));

// !!! Ось тут головна зміна:
app.use(express.static(path.join(__dirname, '..', 'public')));

// ---- Utils ----
function isAllowedUser(email) {
  const allowed = process.env.ALLOWED_USERS
    ? process.env.ALLOWED_USERS.split(',').map(e => e.trim().toLowerCase())
    : [];
  return allowed.includes(email.toLowerCase());
}

function ensureAuthenticated(req, res, next) {
  if (req.session.auth) return next();
  if (req.isAuthenticated()) {
    if (!isAllowedUser(req.user.emails[0].value)) {
      return res.status(403).send('<h2>Вибачте, ви не маєте доступу!</h2>');
    }
    return next();
  }
  res.redirect('/login');
}

// ---- Роути ----
app.get('/', (req, res) => {
  res.redirect('/login');
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'login.html'));
});

app.post('/login/local', (req, res) => {
  const { login, password } = req.body;
  if (
    login === process.env.ADMIN_LOGIN &&
    password === process.env.ADMIN_PASS
  ) {
    req.session.auth = true;
    req.session.displayName = login;
    return res.redirect('/panel');
  }
  res.redirect('/login?error=1');
});

// Google OAuth 2.0
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    if (!isAllowedUser(req.user.emails[0].value)) {
      req.logout(() => {
        res.status(403).send('<h2>Вибачте, ви не маєте доступу!</h2>');
      });
    } else {
      res.redirect('/panel');
    }
  }
);

app.get('/logout', (req, res) => {
  req.logout(() => {
    req.session.destroy(() => {
      res.redirect('/login');
    });
  });
});

// ---- Захищені роути ----
app.get('/panel', ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'panel.html'));
});

// API — ім'я юзера
app.get('/api/user', ensureAuthenticated, (req, res) => {
  let name = 'User';
  if (req.session.auth) {
    name = req.session.displayName || 'Admin';
  } else if (req.isAuthenticated()) {
    name = req.user.displayName || req.user.emails[0].value;
  }
  res.json({ name });
});

// API — статус гімбалу (stub, можна оновити потім)
app.get('/api/status', ensureAuthenticated, (req, res) => {
  res.json(getGimbalStatus());
});

// API для ESP — передаємо команду на MQTT

app.post('/api/gimbal', ensureAuthenticated, (req, res) => {
  const { cmd, speed } = req.body;
  if (!cmd || !['LEFT', 'RIGHT', 'UP', 'DOWN'].includes(cmd)) {
    return res.status(400).json({ ok: false, error: 'Invalid command' });
  }
  // додай швидкість: left:mid, up:fast тощо
  sendGimbalCommand(cmd.toLowerCase() + (speed ? ':' + speed : ''));
  res.json({ ok: true });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log('Сервер запущено на порту', PORT);
});
