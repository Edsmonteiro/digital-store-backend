const { ApiError } = require('../utils/errors');
module.exports = (req, res, next) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && !req.is('application/json')) {
    return next(new ApiError(415, 'Envie Content-Type: application/json.'));
  }
  next();
};
