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

  test('filtros combinados, paginação e erros de entrada', async () => {
    const unique = Date.now().toString(36);
    const email = `filtros-${unique}@example.com`;

    const user = await request(app).post('/v1/user').send({
      firstname: 'Teste', surname: 'Filtros', email,
      password: 'SenhaSegura123!', confirmPassword: 'SenhaSegura123!'
    });
    expect(user.status).toBe(201);

    const login = await request(app).post('/v1/user/token').send({
      email, password: 'SenhaSegura123!'
    });
    expect(login.status).toBe(200);
    const authorization = `Bearer ${login.body.token}`;

    const category = await request(app).post('/v1/category')
      .set('Authorization', authorization)
      .send({ name: 'Teste filtros', slug: `filtros-${unique}`, use_in_menu: false });
    expect(category.status).toBe(201);
    const categoryId = category.body.id;

    const createProduct = (name, suffix, price, sizes) =>
      request(app).post('/v1/product')
        .set('Authorization', authorization)
        .send({
          enabled: true, name, slug: `${suffix}-${unique}`,
          stock: 5, price, price_with_discount: 0,
          category_ids: [categoryId],
          options: [
            { title: 'Tamanho', shape: 'square', radius: '4px', type: 'text', values: sizes },
            { title: 'Cor', shape: 'circle', radius: '50px', type: 'color', values: ['#111111', '#ffffff'] }
          ]
        });

    const first = await createProduct('Camiseta de teste A', 'camiseta-a', 95, ['M', 'G']);
    const second = await createProduct('Camiseta de teste B', 'camiseta-b', 115, ['P', 'GG']);
    expect(first.status).toBe(201);
    expect(second.status).toBe(201);

    const sizeA = first.body.options.find(option => option.title === 'Tamanho').id;
    const colorA = first.body.options.find(option => option.title === 'Cor').id;
    const sizeB = second.body.options.find(option => option.title === 'Tamanho').id;

    // Os filtros devem apontar para o mesmo produto, e não apenas ter algum valor parecido.
    const combined = await request(app).get(
      `/v1/product/search?category_ids=${categoryId}&option[${sizeA}]=M&option[${colorA}]=%23111111`
    );
    expect(combined.status).toBe(200);
    expect(combined.body.total).toBe(1);
    expect(combined.body.data.map(item => item.id)).toEqual([first.body.id]);

    const incompatible = await request(app).get(
      `/v1/product/search?option[${sizeA}]=M&option[${sizeB}]=GG`
    );
    expect(incompatible.status).toBe(200);
    expect(incompatible.body.total).toBe(0);
    expect(incompatible.body.data).toEqual([]);

    const page1 = await request(app).get(
      `/v1/product/search?category_ids=${categoryId}&limit=1&page=1&fields=name,price`
    );
    const page2 = await request(app).get(
      `/v1/product/search?category_ids=${categoryId}&limit=1&page=2&fields=name,price`
    );
    expect(page1.status).toBe(200);
    expect(page2.status).toBe(200);
    expect(page1.body.total).toBe(2);
    expect(page2.body.total).toBe(2);
    expect(page1.body.data).toHaveLength(1);
    expect(page2.body.data).toHaveLength(1);
    expect(page1.body.data[0].id).toBe(first.body.id);
    expect(page2.body.data[0].id).toBe(second.body.id);
    expect(Object.keys(page1.body.data[0]).sort()).toEqual(['id', 'name', 'price']);

    const all = await request(app).get(
      `/v1/product/search?category_ids=${categoryId}&limit=-1&page=20`
    );
    expect(all.status).toBe(200);
    expect(all.body.page).toBe(1);
    expect(all.body.total).toBe(2);
    expect(all.body.data).toHaveLength(2);

    for (const query of [
      '?page=0', '?limit=0', '?fields=desconhecido',
      '?price-range=200-100', '?option[0]=M',
      `?option[${sizeA}]=M&option[${sizeA}]=G`
    ]) {
      const response = await request(app).get(`/v1/product/search${query}`);
      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    }

    expect((await request(app).get('/v1/product/999999999')).status).toBe(404);
    expect((await request(app).post('/v1/product').send({
      name: 'Sem token'
    })).status).toBe(401);

    for (const id of [first.body.id, second.body.id]) {
      const removed = await request(app).delete(`/v1/product/${id}`)
        .set('Authorization', authorization);
      expect(removed.status).toBe(204);
    }
    expect((await request(app).delete(`/v1/category/${categoryId}`)
      .set('Authorization', authorization)).status).toBe(204);
    expect((await request(app).delete(`/v1/user/${user.body.id}`)
      .set('Authorization', authorization)).status).toBe(204);
  }, 30000);

  test('índices usados nos filtros estão presentes no MySQL', async () => {
    const [categoryIndex] = await sequelize.query(
      "SHOW INDEX FROM product_categories WHERE Key_name = 'idx_product_categories_category_id'"
    );
    const [priceIndex] = await sequelize.query(
      "SHOW INDEX FROM products WHERE Key_name = 'idx_products_price'"
    );
    expect(categoryIndex).toHaveLength(1);
    expect(priceIndex).toHaveLength(1);
  });
});
