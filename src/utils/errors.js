const { UniqueConstraintError, ValidationError, ForeignKeyConstraintError, DatabaseError } = require('sequelize');

class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

function errorHandler(error, request, response, next) { // eslint-disable-line no-unused-vars
  if (response.headersSent) return next(error);
  if (error instanceof UniqueConstraintError) return response.status(409).json({ error: 'Já existe um registro com esses dados.' });
  if (error instanceof ForeignKeyConstraintError) return response.status(400).json({ error: 'Há referências relacionadas a este registro.' });
  if (error instanceof ValidationError) return response.status(400).json({ error: 'Dados inválidos.', details: error.errors.map(item => item.message) });
  if (error instanceof DatabaseError) {
    console.error('[database]', error.message);
    return response.status(500).json({ error: 'Erro de banco de dados.' });
  }
  if (error instanceof ApiError) {
    return response.status(error.status).json({ error: error.message, ...(error.details ? { details: error.details } : {}) });
  }
  if (error.status >= 400 && error.status < 500) {
    return response.status(error.status).json({ error: error.status === 404 ? 'Recurso não encontrado.' : 'Requisição inválida.' });
  }
  console.error('[unexpected]', error);
  return response.status(500).json({ error: 'Erro interno do servidor.' });
}
const asyncHandler = fn => (req, res, next) => Promise.resolve().then(() => fn(req, res, next)).catch(next);
module.exports = { ApiError, errorHandler, asyncHandler };
