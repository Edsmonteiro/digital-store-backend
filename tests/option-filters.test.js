const { optionFiltersFromUrl } = require('../src/utils/optionFilters');

describe('Filtros de opções pela query string', () => {
  test('preserva IDs pequenos que o parser do Express trata como índices', () => {
    expect(optionFiltersFromUrl('/v1/product/search?option[1]=M')).toEqual([{ id: 1, values: ['M'] }]);
    expect(optionFiltersFromUrl('/v1/product/search?option%5B12%5D=GG%2CPP')).toEqual([{ id: 12, values: ['GG', 'PP'] }]);
  });

  test('suporta IDs maiores, filtros combinados e parâmetros não relacionados', () => {
    expect(optionFiltersFromUrl('/v1/product/search?page=1&option[45]=G&option[99]=azul,preto')).toEqual([
      { id: 45, values: ['G'] }, { id: 99, values: ['azul', 'preto'] }
    ]);
  });

  test('rejeita filtros inválidos e repetidos', () => {
    for (const query of [
      '?option[]=M', '?option[0]=M', '?option[abc]=M', '?option=M',
      '?option[1]=', '?option[1]=M&option[1]=G'
    ]) {
      expect(() => optionFiltersFromUrl(`/v1/product/search${query}`)).toThrow();
    }
  });
});
