// Requer MySQL local com migrations aplicadas: RUN_DB_TESTS=1 npm test.
const run = process.env.RUN_DB_TESTS === '1';
if (run) {
  process.env.JWT_SECRET = 'test-database-secret-key-12345678901234567890';
  process.env.NODE_ENV = 'test';
}
const request = require('supertest');
const { sequelize } = require('../src/models');
const app = require('../src/app');
const suite = run ? describe : describe.skip;
suite('Integração MySQL: CRUD completo e relacionamentos', () => {
  beforeAll(async () => { await sequelize.authenticate(); });
  afterAll(async () => { await sequelize.close(); });
  test('fluxo real: usuários, categorias, produtos, imagens, opções e filtros', async () => {
    const unique = Date.now().toString(36);
    const createdUser = await request(app).post('/v1/user').send({
      firstname: 'Edson', surname: 'Teste', email: `edson+${unique}@example.com`, password: 'SenhaSegura123!', confirmPassword: 'SenhaSegura123!'
    });
    expect(createdUser.status).toBe(201);
    expect(createdUser.body).not.toHaveProperty('password');
    const userId = createdUser.body.id;
    const login = await request(app).post('/v1/user/token').send({ email: `edson+${unique}@example.com`, password: 'SenhaSegura123!' });
    expect(login.status).toBe(200);
    const header = `Bearer ${login.body.token}`;
    const category = await request(app).post('/v1/category').set('Authorization', header).send({ name: 'Calçados', slug: `calcados-${unique}`, use_in_menu: true });
    expect(category.status).toBe(201);
    const catId = category.body.id;
    const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/nwAAAABJRU5ErkJggg==';
    const product = await request(app).post('/v1/product').set('Authorization', header).send({
      enabled: true, name: 'Tênis para testes', slug: `tenis-testes-${unique}`, stock: 10,
      price: 129.90, price_with_discount: 99.90, category_ids: [catId],
      images: [{ type: 'image/png', content: png, enabled: true }],
      options: [{ title: 'Tamanho', shape: 'square', radius: '4px', type: 'text', values: ['P', 'M', 'G'] }]
    });
    expect(product.status).toBe(201);
    expect(product.body.category_ids).toContain(catId);
    expect(product.body.images).toHaveLength(1);
    expect(product.body.options).toHaveLength(1);
    const productId = product.body.id;
    const fetched = await request(app).get(`/v1/product/${productId}`);
    expect(fetched.status).toBe(200);
    expect(fetched.body.images[0].content).toContain('/media/');
    const search = await request(app).get(`/v1/product/search?category_ids=${catId}&match=Tênis&price-range=100-200`);
    expect(search.status).toBe(200);
    expect(search.body.data.some(item => item.id === productId)).toBe(true);
    const byOption = await request(app).get(`/v1/product/search?option[${product.body.options[0].id}]=M`);
    expect(byOption.status).toBe(200);
    expect(Array.isArray(byOption.body.data)).toBe(true);
    expect(byOption.body.data.some(item => item.id === productId)).toBe(true);
    const updated = await request(app).put(`/v1/product/${productId}`).set('Authorization', header).send({
      name: 'Tênis atualizado', stock: 12,
      images: [{ id: product.body.images[0].id, deleted: true }],
      options: [{ id: product.body.options[0].id, values: ['40', '41'] }]
    });
    expect(updated.status).toBe(204);
    const current = await request(app).get(`/v1/product/${productId}`);
    expect(current.body.name).toBe('Tênis atualizado');
    expect(current.body.images).toHaveLength(0);
    expect(current.body.options[0].values).toEqual(['40','41']);
    expect((await request(app).delete(`/v1/product/${productId}`).set('Authorization', header)).status).toBe(204);
    expect((await request(app).get(`/v1/product/${productId}`)).status).toBe(404);
    expect((await request(app).delete(`/v1/category/${catId}`).set('Authorization', header)).status).toBe(204);
    expect((await request(app).put(`/v1/user/${userId}`).set('Authorization', header).send({ firstname: 'Edson M.' })).status).toBe(204);
    expect((await request(app).delete(`/v1/user/${userId}`).set('Authorization', header)).status).toBe(204);
  }, 20000);
});
