const jwt = require('jsonwebtoken');
const { ApiError } = require('../utils/errors');

function requireAuth(req, res, next) {
  const header = req.get('Authorization');
  if (!header || !/^Bearer \S+$/.test(header)) return next(new ApiError(401, 'Token Bearer obrigatório.'));
  try {
    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET, { algorithms: ['HS256'] });
    if (!Number.isInteger(Number(payload.sub)) || !payload.sub) throw new Error('sub inválido');
    req.user = { id: Number(payload.sub), email: payload.email };
    next();
  } catch {
    next(new ApiError(401, 'Token inválido ou expirado.'));
  }
}
function sameUser(req, res, next) {
  if (req.user.id !== Number(req.params.id)) return next(new ApiError(403, 'Não autorizado a alterar outro usuário.'));
  next();
}
module.exports = { requireAuth, sameUser };
