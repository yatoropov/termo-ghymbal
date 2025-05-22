const express = require('express');
const session = require('express-session');
require('dotenv').config();
const passport = require('./auth');
const path = require('path');

const app = express();

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

// Сервіс статичних файлів для фронтенду
app.use(express.static(path.join(__dirname, '..', 'public')));

// Кореневий маршрут — автоматичний редирект на Google OAuth
app.get('/', (req, res) => {
  res.redirect('/auth/google');
});

// Для сумісності зі старим UI — /login також веде на Google OAuth
app.get('/login', (req, res) => {
  res.redirect('/auth/google');
});

// Logout
app.get('/logout', (req, res) => {
  req.logout(() => {
    res.redirect('/');
  });
});

// Маршрути для аутентифікації
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/panel');
  }
);

// Захищений маршрут
app.get('/panel', ensureAuthenticated, function(req, res){
  // Надсилаємо panel.html (або можна згенерований HTML)
  res.sendFile(path.join(__dirname, '..', 'public', 'panel.html'));
});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login');
}

// API для фронтенду
app.get('/api/user', ensureAuthenticated, (req, res) => {
  res.json({ name: req.user.displayName || 'User' });
});

app.get('/api/status', ensureAuthenticated, (req, res) => {
  res.json({ value: 'OK (stub)' });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log('Сервер запущено на порту', PORT);
});
