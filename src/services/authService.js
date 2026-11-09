const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { ApiError } = require('../utils/errors');
const { email, text, object } = require('../utils/validate');

async function login(body) {
  object(body);
  const loginEmail = email(body.email);
  const password = text(body.password, 'password', { min: 1, max: 72 });
  const user = await User.findOne({ where: { email: loginEmail } });
  const valid = user && await bcrypt.compare(password, user.password);
  if (!valid) throw new ApiError(400, 'E-mail ou senha incorretos.');
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET ausente ou muito curto.');
  }
  const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, {
    algorithm: 'HS256', subject: String(user.id), expiresIn: process.env.JWT_EXPIRES_IN || '2h'
  });
  return { token };
}
module.exports = { login };
