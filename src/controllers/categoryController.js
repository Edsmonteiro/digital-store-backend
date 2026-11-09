const categories = require('../services/categoryService');
module.exports = {
  search: async (req, res) => res.json(await categories.search(req.query)),
  get: async (req, res) => res.json(await categories.get(req.params.id)),
  create: async (req, res) => res.status(201).json(await categories.create(req.body)),
  update: async (req, res) => { await categories.update(req.params.id, req.body); res.status(204).end(); },
  remove: async (req, res) => { await categories.remove(req.params.id); res.status(204).end(); }
};
