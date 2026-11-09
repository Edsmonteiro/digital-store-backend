const { Category } = require('../models');
const { ApiError } = require('../utils/errors');
const { id, fields, pagination, categoryPayload } = require('../utils/validate');
const searchFields = ['name', 'slug', 'use_in_menu'];
const publicCategory = category => ({
  id: category.id, name: category.name, slug: category.slug, use_in_menu: Boolean(category.use_in_menu)
});
async function search(query) {
  const { limit, page } = pagination(query);
  const selection = fields(query.fields, searchFields);
  const where = {};
  if (query.use_in_menu !== undefined) {
    if (!['true', 'false'].includes(String(query.use_in_menu))) throw new ApiError(400, 'use_in_menu deve ser true ou false.');
    where.use_in_menu = query.use_in_menu === 'true';
  }
  const { rows, count } = await Category.findAndCountAll({
    where, order: [['id', 'ASC']], ...(limit === -1 ? {} : { limit, offset: (page - 1) * limit })
  });
  return { data: rows.map(row => {
    const record = publicCategory(row);
    return selection ? Object.fromEntries(Object.entries(record).filter(([key]) => key === 'id' || selection.includes(key))) : record;
  }), total: count, limit, page };
}
async function get(idParam) {
  const row = await Category.findByPk(id(idParam));
  if (!row) throw new ApiError(404, 'Categoria não encontrada.');
  return publicCategory(row);
}
async function create(body) {
  const data = categoryPayload(body, true);
  const row = await Category.create(data);
  return publicCategory(row);
}
async function update(idParam, body) {
  const data = categoryPayload(body);
  const row = await Category.findByPk(id(idParam));
  if (!row) throw new ApiError(404, 'Categoria não encontrada.');
  await row.update(data);
}
async function remove(idParam) {
  const row = await Category.findByPk(id(idParam));
  if (!row) throw new ApiError(404, 'Categoria não encontrada.');
  await row.destroy();
}
module.exports = { search, get, create, update, remove };
