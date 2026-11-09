require('dotenv').config();

const defaults = {
  username: process.env.DB_USER || 'digital_store',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'digital_store',
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  dialect: 'mysql',
  logging: false,
  timezone: '-03:00',
  dialectOptions: { decimalNumbers: true }
};

module.exports = {
  development: { ...defaults },
  test: { ...defaults, database: process.env.DB_TEST_NAME || 'digital_store_test' },
  production: { ...defaults, logging: false }
};
