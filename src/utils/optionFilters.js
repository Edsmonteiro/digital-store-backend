const validate = require('./validate');

// O parser de query do Express pode transformar `option[1]=M` em um array
// e perder o índice original. URLSearchParams preserva a chave recebida.
function optionFiltersFromUrl(originalUrl = '') {
  const questionMark = originalUrl.indexOf('?');
  if (questionMark < 0) return [];

  const params = new URLSearchParams(originalUrl.slice(questionMark + 1));
  const filters = [];
  const seen = new Set();

  for (const [key, rawValues] of params) {
    if (!key.startsWith('option')) continue;

    const match = /^option\[([1-9]\d*)\]$/.exec(key);
    if (!match) validate.fail('option');
    const id = validate.id(match[1], 'option id');
    if (seen.has(id)) validate.fail('option', 'não pode ser repetido');
    seen.add(id);

    const values = rawValues.split(',').map(value => validate.text(value, 'option value'));
    if (!values.length) validate.fail('option values');
    filters.push({ id, values });
    if (filters.length > 20) validate.fail('option', 'excede o limite de 20 filtros');
  }

  return filters;
}

module.exports = { optionFiltersFromUrl };
