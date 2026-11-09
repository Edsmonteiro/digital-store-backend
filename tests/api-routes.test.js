// Testes HTTP sem conexão MySQL: validam roteamento, status e middleware.
// Os testes de CRUD com banco real estão em integration.test.js.
process.env.JWT_SECRET = 'unit-tests-very-long-secret-key-123456789';
process.env.CORS_ORIGIN = 'http://localhost:5173';
const jwt = require('jsonwebtoken');
const request = require('supertest');

jest.mock('../src/services/userService', () => ({
  get: jest.fn(async id => ({ id: Number(id), firstname: 'Edson', surname: 'Monteiro', email: 'edson@test.dev' })),
  create: jest.fn(async body => ({ id: 1, firstname: body.firstname, surname: body.surname, email: body.email })),
  update: jest.fn(async () => {}), remove: jest.fn(async () => {})
}));
jest.mock('../src/services/authService', () => ({ login: jest.fn(async () => ({ token: 'token-de-teste' })) }));
jest.mock('../src/services/categoryService', () => ({
  search: jest.fn(async () => ({ data: [], total: 0, limit: 12, page: 1 })),
  get: jest.fn(async id => ({ id: Number(id), name: 'Calçados', slug: 'calcados', use_in_menu: true })),
  create: jest.fn(async input => ({ id: 1, ...input })), update: jest.fn(async () => {}), remove: jest.fn(async () => {})
}));
jest.mock('../src/services/productService', () => ({
  search: jest.fn(async () => ({ data: [], total: 0, limit: 12, page: 1 })),
  get: jest.fn(async id => ({ id: Number(id), name: 'Tênis' })),
  create: jest.fn(async () => ({ id: 1, name: 'Tênis' })), update: jest.fn(async () => {}), remove: jest.fn(async () => {})
}));
const app = require('../src/app');
const bearer = () => `Bearer ${jwt.sign({email:'edson@test.dev'}, process.env.JWT_SECRET, {subject:'1', expiresIn:'1h'})}`;

describe('Endpoints REST e autenticação', () => {
  test('health responde 200', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });
  test('GET e POST públicos', async () => {
    expect((await request(app).get('/v1/category/search')).status).toBe(200);
    expect((await request(app).get('/v1/product/1')).status).toBe(200);
    expect((await request(app).get('/v1/user/1')).body).not.toHaveProperty('password');
    const created = await request(app).post('/v1/user').send({ firstname: 'Edson', surname: 'Monteiro', email: 'edson@test.dev', password: 'SenhaSegura123', confirmPassword: 'SenhaSegura123' });
    expect(created.status).toBe(201);
    expect((await request(app).post('/v1/user/token').send({ email:'edson@test.dev',password:'SenhaSegura123' })).body.token).toBeDefined();
  });
  test('POST protegido rejeita requisições sem token', async () => {
    const response = await request(app).post('/v1/category').send({ name: 'Tênis', slug: 'tenis' });
    expect(response.status).toBe(401);
  });
  test('requisição autenticada permite criar e editar categoria', async () => {
    const created = await request(app).post('/v1/category').set('Authorization', bearer()).send({ name: 'Calçados', slug: 'calcados' });
    expect(created.status).toBe(201);
    const edited = await request(app).put('/v1/category/1').set('Authorization', bearer()).send({ name: 'Roupas' });
    expect(edited.status).toBe(204);
    expect(edited.text).toBe('');
  });
  test('impede alteração em outro usuário', async () => {
    const response = await request(app).delete('/v1/user/2').set('Authorization', bearer());
    expect(response.status).toBe(403);
  });
  test('token malformado responde 401', async () => {
    const response = await request(app).delete('/v1/product/1').set('Authorization', 'Bearer inválido');
    expect(response.status).toBe(401);
  });
  test('rota desconhecida retorna 404', async () => {
    expect((await request(app).get('/v1/nao-existe')).status).toBe(404);
  });
  test('Swagger JSON está disponível', async () => {
    const response = await request(app).get('/openapi.json');
    expect(response.status).toBe(200);
    expect(response.body.paths['/v1/product/{id}']).toBeDefined();
  });
});
