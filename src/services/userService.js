const bcrypt = require('bcrypt');
const { User } = require('../models');
const { ApiError } = require('../utils/errors');
const { id, userPayload } = require('../utils/validate');

function publicUser(user) { return { id: user.id, firstname: user.firstname, surname: user.surname, email: user.email }; }

async function get(idParam) {
  const user = await User.findByPk(id(idParam));
  if (!user) throw new ApiError(404, 'Usuário não encontrado.');
  return publicUser(user);
}
async function create(body) {
  const data = userPayload(body, true);
  const duplicate = await User.findOne({ where: { email: data.email } });
  if (duplicate) throw new ApiError(409, 'E-mail já cadastrado.');
  const hashed = await bcrypt.hash(data.password, 12);
  const created = await User.create({ ...data, password: hashed });
  return publicUser(created);
}
async function update(idParam, body) {
  const data = userPayload(body);
  const user = await User.findByPk(id(idParam));
  if (!user) throw new ApiError(404, 'Usuário não encontrado.');
  await user.update(data);
}
async function remove(idParam) {
  const user = await User.findByPk(id(idParam));
  if (!user) throw new ApiError(404, 'Usuário não encontrado.');
  await user.destroy();
}
module.exports = { get, create, update, remove };
