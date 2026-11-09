const app = require('./app');
const { sequelize } = require('./models');
const port = Number(process.env.PORT || 3333);

(async () => {
  if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)) {
    throw new Error('Configure JWT_SECRET com pelo menos 32 caracteres antes de iniciar em produção.');
  }
  await sequelize.authenticate();
  console.info('Conexão MySQL validada.');
  const server = app.listen(port, () => console.info(`Digital Store API em http://localhost:${port}`));
  const shutdown = async () => {
    server.close(async () => { await sequelize.close(); process.exit(0); });
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
})().catch(error => { console.error('Falha ao iniciar:', error.message); process.exit(1); });
