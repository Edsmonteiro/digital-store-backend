const users = require('../services/userService');
const auth = require('../services/authService');
module.exports = {
  get: async (req, res) => res.json(await users.get(req.params.id)),
  create: async (req, res) => res.status(201).json(await users.create(req.body)),
  update: async (req, res) => { await users.update(req.params.id, req.body); res.status(204).end(); },
  remove: async (req, res) => { await users.remove(req.params.id); res.status(204).end(); },
  token: async (req, res) => res.json(await auth.login(req.body))
};
