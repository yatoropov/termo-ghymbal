require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('./auth');
const path = require('path');
const bodyParser = require('body-parser');

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

app.use(express.static(path.join(__dirname, '..', 'public')));

// ---- Utils ----
function isAllowedUser(email) {
  const allowed = process.env.ALLOWED_USERS
    ? process.env.ALLOWED_USERS.split(',').map(e => e.trim().toLowerCase())
    : [];
  return allowed.includes(email.toLowerCase());
}

function ensureAuthenticated(req, res, next) {
  // Доступ мають або локально залогінені, або Google-юзери з allow-list
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

// Головна сторінка — редирект на логін
app.get('/', (req, res) => {
  res.redirect('/login');
});

// Сторінка логіну з формою
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'login.html'));
});

// Локальний логін (admin)
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
  // Можна красиво обробити error через query
  res.redirect('/login?error=1');
});

// Google OAuth 2.0
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Перевіряємо чи дозволено цього користувача
    if (!isAllowedUser(req.user.emails[0].value)) {
      req.logout(() => {
        res.status(403).send('<h2>Вибачте, ви не маєте доступу!</h2>');
      });
    } else {
      res.redirect('/panel');
    }
  }
);

// Логаут
app.get('/logout', (req, res) => {
  req.logout(() => {
    req.session.destroy(() => {
      res.redirect('/login');
    });
  });
});

// ---- Захищені роути ----

app.get('/panel', ensureAuthenticated, (req, res) => {
  // Віддаємо панель (frontend)
  res.sendFile(path.join(__dirname, '..', 'public', 'panel.html'));
});

// API — ім'я юзера (для відображення у фронті)
app.get('/api/user', ensureAuthenticated, (req, res) => {
  let name = 'User';
  if (req.session.auth) {
    name = req.session.displayName || 'Admin';
  } else if (req.isAuthenticated()) {
    name = req.user.displayName || req.user.emails[0].value;
  }
  res.json({ name });
});

// API — статус гімбалу (зараз фейковий)
app.get('/api/status', ensureAuthenticated, (req, res) => {
  res.json({ value: 'OK (stub)' });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log('Сервер запущено на порту', PORT);
});
