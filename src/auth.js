require('dotenv').config();

function auth(req, res, next) {
  if (req.session && req.session.auth) return next();
  res.redirect('/login');
}

function loginCheck(login, password) {
  return login === process.env.ADMIN_LOGIN && password === process.env.ADMIN_PASS;
}

module.exports = { auth, loginCheck };
