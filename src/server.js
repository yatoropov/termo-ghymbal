require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const { auth, loginCheck } = require('./auth');
const { sendGimbalCommand } = require('./mqtt');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
}));

app.use(express.static(path.join(__dirname, '..', 'public')));

// Login form
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'login.html'));
});

// Login logic
app.post('/login', (req, res) => {
  const { login, password } = req.body;
  if (loginCheck(login, password)) {
    req.session.auth = true;
    res.redirect('/panel');
  } else {
    res.send('Invalid login or password <a href="/login">Try again</a>');
  }
});

// Panel (protected)
app.get('/panel', auth, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'panel.html'));
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

// Gimbal control API (protected)
app.post('/api/gimbal', auth, (req, res) => {
  const { cmd } = req.body;
  if (cmd) {
    sendGimbalCommand(cmd);
    res.json({ status: 'ok', cmd });
  } else {
    res.json({ status: 'error', message: 'No command' });
  }
});

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
