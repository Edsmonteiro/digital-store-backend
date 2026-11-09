const products = require('../services/productService');
module.exports = {
  search: async (req, res) => res.json(await products.search(req.query, req)),
  get: async (req, res) => res.json(await products.get(req.params.id, req)),
  create: async (req, res) => res.status(201).json(await products.create(req.body, req)),
  update: async (req, res) => { await products.update(req.params.id, req.body, req); res.status(204).end(); },
  remove: async (req, res) => { await products.remove(req.params.id); res.status(204).end(); }
};
