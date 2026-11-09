require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const { ApiError, errorHandler } = require('./utils/errors');
const routes = require('./routes');
const docs = require('./docs/openapi');
const validateContent = require('./middleware/validateContent');
const path = require('path');

const app = express();
app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } }));
const origins = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',').map(x => x.trim());
app.use(cors({ origin(origin, cb) {
  if (!origin || origins.includes(origin)) cb(null, true);
  else cb(new ApiError(403, 'Origem não permitida pelo CORS.'));
}}));
app.use(express.json({ limit: '8mb' }));
app.use('/media', express.static(path.join(__dirname, '..', 'public', 'media'), { fallthrough: false }));
app.get('/health', (req, res) => res.json({ status: 'ok', name: 'digital-store-backend' }));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(docs, { explorer: true }));
app.get('/openapi.json', (req, res) => res.json(docs));
app.use(validateContent);
app.use('/v1', routes);
app.use((req, res, next) => next(new ApiError(404, 'Rota não encontrada.')));
app.use((err, req, res, next) => {
  if (err?.type === 'entity.too.large') return next(new ApiError(413, 'Payload excede o limite de 8MB.'));
  if (err instanceof SyntaxError && 'body' in err) return next(new ApiError(400, 'JSON inválido.'));
  next(err);
});
app.use(errorHandler);
module.exports = app;
