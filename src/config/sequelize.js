const { Sequelize } = require('sequelize');
const environments = require('./database.cjs');
const environment = process.env.NODE_ENV || 'development';
const settings = environments[environment] || environments.development;
module.exports = new Sequelize(settings.database, settings.username, settings.password, settings);
