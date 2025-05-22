const express = require('express');
const session = require('express-session');
const passport = require('./auth');
const app = express();

// Кореневий маршрут — автоматичний редирект на Google OAuth
app.get('/', (req, res) => {
  res.redirect('/auth/google');
});

// Для сумісності зі старим UI — /login також веде на Google OAuth
app.get('/login', (req, res) => {
  res.redirect('/auth/google');
});


app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

// Маршрути для аутентифікації
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Успішна аутентифікація, перенаправлення на панель керування.
    res.redirect('/panel');
  }
);

// Захищений маршрут
app.get('/panel', ensureAuthenticated, function(req, res){
  res.send(`Привіт, ${req.user.displayName}`);
});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login');
}

app.listen(8080, () => {
  console.log('Сервер запущено на https та http:8080');
});

app.get('/api/user', auth, (req, res) => {
  res.json({ name: req.user.displayName || 'User' });
});

app.get('/api/status', auth, (req, res) => {
  // Поки що фейкове значення:
  res.json({ value: 'OK (stub)' });
});

