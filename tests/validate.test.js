const V = require('../src/utils/validate');

describe('Validação de entradas da API', () => {
  test('paginação padrão e busca sem limite', () => {
    expect(V.pagination({})).toEqual({ limit: 12, page: 1 });
    expect(V.pagination({ limit: '-1', page: '20' })).toEqual({ limit: -1, page: 1 });
    expect(() => V.pagination({ limit: '101' })).toThrow();
    expect(() => V.pagination({ page: '0' })).toThrow();
  });
  test('e-mail normalizado e senha confirmada', () => {
    const u = V.userPayload({ firstname: ' Ana ', surname: ' Silva', email: 'ANA@Example.Com', password: 'SenhaSegura123', confirmPassword: 'SenhaSegura123' }, true);
    expect(u.email).toBe('ana@example.com');
    expect(u.firstname).toBe('Ana');
    expect(() => V.userPayload({ firstname: 'A', surname: 'B', email: 'ana@example.com', password: '12345678', confirmPassword: 'outro' }, true)).toThrow();
  });
  test('impede valores inválidos em produtos', () => {
    const body = { name: 'Tênis', slug: 'tenis', price: 100, price_with_discount: 80, category_ids: [1, 2] };
    expect(V.productPayload(body, true).category_ids).toEqual([1, 2]);
    expect(() => V.productPayload({ ...body, price: -1 }, true)).toThrow();
    expect(() => V.productPayload({ ...body, category_ids: [1, 1] }, true)).toThrow();
    expect(() => V.productPayload({ ...body, slug: '../../exploit' }, true)).toThrow();
  });
  test('opções aceitam radius em px e values/value', () => {
    const normalized = V.optionPayload({ title: 'Tamanho', shape: 'square', radius: '4px', type: 'text', value: ['P', 'M'] });
    expect(normalized.radius).toBe(4);
    expect(normalized.values).toBe('P,M');
  });
  test('identificador deve ser positivo', () => {
    expect(V.id('12')).toBe(12);
    for (const bad of ['0', '-1', '1.2', 'abc']) expect(() => V.id(bad)).toThrow();
  });
});
