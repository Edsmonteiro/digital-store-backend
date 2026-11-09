const { Op } = require('sequelize');
const { sequelize, Product, Category, ProductImage, ProductOption, ProductCategory } = require('../models');
const { ApiError } = require('../utils/errors');
const validate = require('../utils/validate');
const media = require('./imageStorage');
const { optionFiltersFromUrl } = require('../utils/optionFilters');

const publicFields = ['enabled', 'name', 'slug', 'stock', 'description', 'price', 'price_with_discount', 'category_ids', 'images', 'options', 'use_in_menu'];
const associations = [
  { model: Category, as: 'categories', through: { attributes: [] }, attributes: ['id'] },
  { model: ProductImage, as: 'images' },
  { model: ProductOption, as: 'options' }
];
function serialize(product, request, selectedFields = null) {
  const plain = product.get({ plain: true });
  const output = {
    id: plain.id, enabled: Boolean(plain.enabled), name: plain.name, slug: plain.slug,
    stock: plain.stock, description: plain.description, price: plain.price,
    price_with_discount: plain.price_with_discount, use_in_menu: Boolean(plain.use_in_menu),
    category_ids: (plain.categories || []).map(category => category.id).sort((a, b) => a - b),
    images: (plain.images || []).sort((a, b) => a.id - b.id).map(image => ({ id: image.id, content: media.publicUrl(image.path, request), enabled: Boolean(image.enabled) })),
    options: (plain.options || []).sort((a, b) => a.id - b.id).map(option => ({ id: option.id, title: option.title, shape: option.shape, radius: option.radius, type: option.type, values: option.values.split(',') }))
  };
  return selectedFields ? Object.fromEntries(Object.entries(output).filter(([key]) => key === 'id' || selectedFields.includes(key))) : output;
}
async function findProduct(idValue, transaction) {
  const row = await Product.findByPk(validate.id(idValue), { include: associations, transaction });
  if (!row) throw new ApiError(404, 'Produto não encontrado.');
  return row;
}
async function get(idValue, request) { return serialize(await findProduct(idValue), request); }
function parseCsvIds(raw, name) {
  if (typeof raw !== 'string' || !/^\d+(?:,\d+)*$/.test(raw)) validate.fail(name);
  return validate.idList(raw.split(','), name);
}
async function search(query, request) {
  const { limit, page } = validate.pagination(query);
  const selectedFields = validate.fields(query.fields, publicFields);
  const where = {};
  if (query.match !== undefined) {
    const match = validate.text(query.match, 'match', { max: 120 });
    const escaped = match.replace(/[\\%_]/g, '\\$&');
    where[Op.or] = [{ name: { [Op.like]: `%${escaped}%` } }, { description: { [Op.like]: `%${escaped}%` } }];
  }
  if (query['price-range'] !== undefined) {
    const match = /^(\d+(?:\.\d{1,2})?)-(\d+(?:\.\d{1,2})?)$/.exec(String(query['price-range']));
    if (!match) validate.fail('price-range');
    const min = Number(match[1]), max = Number(match[2]);
    if (!Number.isFinite(min) || !Number.isFinite(max) || min > max) validate.fail('price-range');
    where.price = { [Op.between]: [min, max] };
  }
  let matchingIds = null;
  if (query.category_ids !== undefined) {
    const ids = parseCsvIds(query.category_ids, 'category_ids');
    const links = await ProductCategory.findAll({ where: { category_id: { [Op.in]: ids } }, attributes: ['product_id'] });
    matchingIds = new Set(links.map(row => row.product_id));
  }
  // Usa as chaves originais da URL para preservar o ID em option[<id>].
  // O parser padrão do Express converte IDs numéricos pequenos em índices de array.
  for (const { id, values } of optionFiltersFromUrl(request.originalUrl)) {
    const matching = await ProductOption.findAll({ where: { id }, attributes: ['product_id', 'values'] });
    const matched = new Set(matching.filter(option => values.some(value => option.values.split(',').includes(value))).map(option => option.product_id));
    matchingIds = matchingIds ? new Set([...matchingIds].filter(productId => matched.has(productId))) : matched;
  }
  if (matchingIds) where.id = { [Op.in]: [...matchingIds] };
  const { rows, count } = await Product.findAndCountAll({
    where, attributes: ['id'], order: [['id', 'ASC']], ...(limit === -1 ? {} : { limit, offset: (page - 1) * limit })
  });
  const ids = rows.map(row => row.id);
  if (!ids.length) return { data: [], total: count, limit, page };
  const products = await Product.findAll({ where: { id: { [Op.in]: ids } }, include: associations });
  const byId = new Map(products.map(product => [product.id, product]));
  return { data: ids.map(productId => serialize(byId.get(productId), request, selectedFields)), total: count, limit, page };
}
async function verifyCategories(categoryIds, transaction) {
  const count = await Category.count({ where: { id: { [Op.in]: categoryIds } }, transaction });
  if (count !== categoryIds.length) throw new ApiError(400, 'Uma ou mais categorias não existem.');
}
async function handleImages(productId, incoming, transaction, created, removed) {
  for (const input of incoming) {
    if (input.id !== undefined) {
      const current = await ProductImage.findOne({ where: { id: validate.id(input.id, 'images.id'), product_id: productId }, transaction });
      if (!current) throw new ApiError(400, 'Imagem não pertence ao produto.');
      if (input.deleted === true) {
        await current.destroy({ transaction });
        removed.push(current.path);
        continue;
      }
      const updates = {};
      if (input.content !== undefined) {
        // Uma imagem existente só pode ser reutilizada se já pertencer ao produto.
        const reusedLocal = typeof input.content === 'string' && input.content.startsWith('/media/');
        const nextPath = await media.saveImage(input, created);
        if (reusedLocal && nextPath !== current.path) {
          const owned = await ProductImage.findOne({ where: { product_id: productId, path: nextPath }, transaction });
          if (!owned) throw new ApiError(400, 'Imagem local informada não pertence a este produto.');
        }
        if (current.path !== nextPath) removed.push(current.path);
        updates.path = nextPath;
      }
      if (input.enabled !== undefined) updates.enabled = validate.boolean(input.enabled, 'images.enabled');
      if (!Object.keys(updates).length) throw new ApiError(400, 'Imagem sem alterações.');
      await current.update(updates, { transaction });
    } else {
      if (input.deleted) throw new ApiError(400, 'Imagem nova não pode ser excluída.');
      if (typeof input.content === 'string' && input.content.startsWith('/media/')) throw new ApiError(400, 'Use o ID para reutilizar uma imagem local.');
      const nextPath = await media.saveImage(input, created);
      await ProductImage.create({ product_id: productId, enabled: input.enabled === undefined ? false : validate.boolean(input.enabled, 'images.enabled'), path: nextPath }, { transaction });
    }
  }
}
async function handleOptions(productId, incoming, transaction) {
  for (const input of incoming) {
    if (input.id !== undefined) {
      const current = await ProductOption.findOne({ where: { id: validate.id(input.id, 'options.id'), product_id: productId }, transaction });
      if (!current) throw new ApiError(400, 'Opção não pertence ao produto.');
      if (input.deleted === true) { await current.destroy({ transaction }); continue; }
      const data = validate.optionPayload(input, true);
      if (!Object.keys(data).length) throw new ApiError(400, 'Opção sem alterações.');
      await current.update(data, { transaction });
    } else {
      if (input.deleted) throw new ApiError(400, 'Opção nova não pode ser excluída.');
      await ProductOption.create({ product_id: productId, ...validate.optionPayload(input) }, { transaction });
    }
  }
}
async function mutate(action, idValue, body, request) {
  const data = validate.productPayload(body, action === 'create');
  const categories = data.category_ids; const images = data.images; const options = data.options;
  delete data.category_ids; delete data.images; delete data.options;
  const createdFiles = []; const removedFiles = [];
  let productId;
  try {
    await sequelize.transaction(async transaction => {
      let product;
      if (action === 'create') product = await Product.create(data, { transaction });
      else { product = await Product.findByPk(validate.id(idValue), { transaction });
        if (!product) throw new ApiError(404, 'Produto não encontrado.');
        const nextPrice = data.price ?? product.price;
        const nextDiscount = data.price_with_discount ?? product.price_with_discount;
        if (nextDiscount > 0 && nextDiscount > nextPrice) validate.fail('price_with_discount', 'não pode superar price');
        await product.update(data, { transaction });
      }
      productId = product.id;
      if (categories !== undefined) {
        await verifyCategories(categories, transaction);
        await product.setCategories(categories, { transaction });
      }
      if (images !== undefined) await handleImages(productId, images, transaction, createdFiles, removedFiles);
      if (options !== undefined) await handleOptions(productId, options, transaction);
    });
  } catch (err) {
    await Promise.allSettled(createdFiles.map(media.deleteImage));
    throw err;
  }
  await Promise.allSettled(removedFiles.map(media.deleteImage));
  return get(productId, request);
}
async function create(body, request) { return mutate('create', null, body, request); }
async function update(idParam, body, request) { await mutate('update', idParam, body, request); }
async function remove(idParam) {
  const row = await Product.findByPk(validate.id(idParam), { include: [{ model: ProductImage, as: 'images' }] });
  if (!row) throw new ApiError(404, 'Produto não encontrado.');
  await row.destroy();
  await Promise.allSettled(row.images.map(image => media.deleteImage(image.path)));
}
module.exports = { search, get, create, update, remove, serialize };
