const { ApiError } = require('./errors');

function fail(field, message = 'inválido') { throw new ApiError(400, `Campo ${field} ${message}.`); }
function object(value, field = 'corpo') {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(field);
  return value;
}
function text(value, field, { min = 1, max = 255 } = {}) {
  if (typeof value !== 'string') fail(field);
  const result = value.trim();
  if (result.length < min || result.length > max) fail(field);
  return result;
}
function optionalText(value, field, max = 5000) {
  if (value === undefined || value === null) return null;
  return text(value, field, { min: 0, max });
}
function email(value) {
  const val = text(value, 'email', { max: 255 }).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) fail('email');
  return val;
}
function slug(value) {
  const val = text(value, 'slug', { max: 255 }).toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(val)) fail('slug');
  return val;
}
function boolean(value, field) { if (typeof value !== 'boolean') fail(field); return value; }
function money(value, field) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) fail(field);
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
function integer(value, field, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  if (!Number.isInteger(value) || value < min || value > max) fail(field);
  return value;
}
function id(value, field = 'id') {
  const number = Number(value);
  if (!/^\d+$/.test(String(value)) || !Number.isSafeInteger(number) || number < 1) fail(field);
  return number;
}
function idList(value, field) {
  if (!Array.isArray(value)) fail(field);
  const list = value.map(v => id(v, field));
  if (new Set(list).size !== list.length) fail(field, 'contém itens repetidos');
  return list;
}
function pagination(query) {
  const rawLimit = String(query.limit ?? '12'), rawPage = String(query.page ?? '1');
  if (!/^(?:-1|\d+)$/.test(rawLimit) || !/^\d+$/.test(rawPage)) fail('paginação');
  const limit = Number(rawLimit), page = Number(rawPage);
  if (limit !== -1 && (limit < 1 || limit > 100)) fail('limit', 'deve estar entre 1 e 100, ou ser -1');
  if (!Number.isSafeInteger(page) || page < 1) fail('page');
  return { limit, page: limit === -1 ? 1 : page };
}
function fields(raw, allowed) {
  if (raw === undefined) return null;
  if (typeof raw !== 'string') fail('fields');
  const names = raw.split(',').map(x => x.trim()).filter(Boolean);
  if (!names.length || names.some(name => !allowed.includes(name))) fail('fields');
  return [...new Set(names)];
}
function userPayload(body, create = false) {
  object(body);
  const out = {};
  for (const key of ['firstname', 'surname']) {
    if (create || body[key] !== undefined) out[key] = text(body[key], key, { max: 100 });
  }
  if (create || body.email !== undefined) out.email = email(body.email);
  if (create) {
    const password = text(body.password, 'password', { min: 8, max: 72 });
    if (password !== body.confirmPassword) fail('confirmPassword', 'não confere com password');
    out.password = password;
  } else if (!Object.keys(out).length) fail('corpo', 'está vazio');
  return out;
}
function categoryPayload(body, create = false) {
  object(body); const out = {};
  if (create || body.name !== undefined) out.name = text(body.name, 'name', { max: 120 });
  if (create || body.slug !== undefined) out.slug = slug(body.slug);
  if (body.use_in_menu !== undefined) out.use_in_menu = boolean(body.use_in_menu, 'use_in_menu');
  if (!create && !Object.keys(out).length) fail('corpo', 'está vazio');
  return out;
}
function optionPayload(body, partial = false) {
  object(body, 'options'); const out = {};
  if (!partial || body.title !== undefined) out.title = text(body.title, 'options.title', { max: 120 });
  if (body.shape !== undefined) {
    if (!['square', 'circle'].includes(body.shape)) fail('options.shape');
    out.shape = body.shape;
  }
  if (body.type !== undefined) {
    if (!['text', 'color'].includes(body.type)) fail('options.type');
    out.type = body.type;
  }
  if (body.radius !== undefined) {
    const radius = typeof body.radius === 'string' && /^\d+px$/.test(body.radius) ? Number(body.radius.slice(0, -2)) : body.radius;
    out.radius = integer(radius, 'options.radius', { max: 999 });
  }
  const values = body.values ?? body.value;
  if (!partial || values !== undefined) {
    if (!Array.isArray(values) || !values.length || values.length > 30) fail('options.values');
    const arr = values.map(x => text(x, 'options.values', { max: 100 }));
    if (arr.join(',').length > 1000 || arr.some(x => x.includes(','))) fail('options.values');
    out.values = arr.join(',');
  }
  return out;
}
function productPayload(body, create = false) {
  object(body); const out = {};
  if (create || body.name !== undefined) out.name = text(body.name, 'name');
  if (create || body.slug !== undefined) out.slug = slug(body.slug);
  if (create || body.price !== undefined) out.price = money(body.price, 'price');
  if (create || body.price_with_discount !== undefined) out.price_with_discount = money(body.price_with_discount, 'price_with_discount');
  if (body.enabled !== undefined) out.enabled = boolean(body.enabled, 'enabled');
  if (body.use_in_menu !== undefined) out.use_in_menu = boolean(body.use_in_menu, 'use_in_menu');
  if (body.stock !== undefined) out.stock = integer(body.stock, 'stock');
  if (body.description !== undefined) out.description = optionalText(body.description, 'description');
  if (create && !Array.isArray(body.category_ids)) fail('category_ids');
  if (body.category_ids !== undefined) out.category_ids = idList(body.category_ids, 'category_ids');
  if (body.images !== undefined) {
    if (!Array.isArray(body.images) || body.images.length > 20) fail('images');
    out.images = body.images.map(value => object(value, 'images'));
  }
  if (body.options !== undefined) {
    if (!Array.isArray(body.options) || body.options.length > 30) fail('options');
    out.options = body.options.map(value => object(value, 'options'));
  }
  if (!create && !Object.keys(out).length) fail('corpo', 'está vazio');
  if (out.price_with_discount > 0 && out.price !== undefined && out.price_with_discount > out.price) fail('price_with_discount', 'não pode superar price');
  return out;
}
module.exports = { fail, object, text, email, slug, boolean, money, integer, id, idList, pagination, fields, userPayload, categoryPayload, productPayload, optionPayload };
