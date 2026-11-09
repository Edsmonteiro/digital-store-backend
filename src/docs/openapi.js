const id = { name: 'id', in: 'path', required: true, schema: { type: 'integer', minimum: 1 }, description: 'Identificador numérico' };
const badRequest = { description: 'Requisição inválida' };
const unauthorized = { description: 'Token ausente, inválido ou expirado' };
const notFound = { description: 'Recurso não encontrado' };
const noContent = { description: 'Operação realizada sem corpo de resposta' };
const bearer = [{ bearerAuth: [] }];
const json = schema => ({ content: { 'application/json': { schema } } });
const ref = name => ({ $ref: `#/components/schemas/${name}` });
const query = (name, description, type = 'string') => ({ name, in: 'query', description, schema: { type } });
function body(schema) { return { required: true, ...json(ref(schema)) }; }
function mutation(summary, schema, responses, authenticated = true) {
  return { summary, tags: [schema === 'UserCreate' || schema === 'UserUpdate' ? 'Usuários' : schema === 'CategoryPayload' ? 'Categorias' : 'Produtos'],
    ...(authenticated ? { security: bearer } : {}), requestBody: body(schema), responses: { ...responses, 400: badRequest, ...(authenticated ? { 401: unauthorized } : {}) } };
}

module.exports = {
  openapi: '3.0.3',
  info: { title: 'Digital Store API', version: '1.0.0', description: 'Projeto acadêmico de Back-end da Digital College. Node.js, Express, Sequelize, MySQL, JWT e Jest. Cadastro e login são públicos; alterações exigem JWT.' },
  servers: [{ url: 'http://localhost:3333', description: 'Ambiente local' }],
  tags: [{ name: 'Usuários' }, { name: 'Categorias' }, { name: 'Produtos' }, { name: 'Autenticação' }, { name: 'Sistema' }],
  components: {
    securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
    schemas: {
      UserCreate: { type: 'object', required: ['firstname', 'surname', 'email', 'password', 'confirmPassword'], properties: {
        firstname: { type: 'string', example: 'Edson' }, surname: { type: 'string', example: 'Monteiro' }, email: { type: 'string', format: 'email', example: 'edson@example.com' },
        password: { type: 'string', format: 'password', minLength: 8, example: 'SenhaSegura123!' }, confirmPassword: { type: 'string', format: 'password', example: 'SenhaSegura123!' } } },
      UserUpdate: { type: 'object', properties: { firstname: { type: 'string' }, surname: { type: 'string' }, email: { type: 'string', format: 'email' } } },
      User: { type: 'object', properties: { id: { type: 'integer' }, firstname: { type: 'string' }, surname: { type: 'string' }, email: { type: 'string' } } },
      TokenRequest: { type: 'object', required: ['email', 'password'], properties: { email: { type: 'string', format: 'email' }, password: { type: 'string', format: 'password' } } },
      TokenResponse: { type: 'object', properties: { token: { type: 'string' } } },
      CategoryPayload: { type: 'object', required: ['name', 'slug'], properties: { name: { type: 'string', example: 'Calçados' }, slug: { type: 'string', example: 'calcados' }, use_in_menu: { type: 'boolean', default: false } } },
      Category: { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' }, slug: { type: 'string' }, use_in_menu: { type: 'boolean' } } },
      ImageInput: { type: 'object', properties: { id: { type: 'integer', description: 'Usado na atualização' }, type: { type: 'string', enum: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'] }, content: { type: 'string', description: 'Base64 da imagem ou URL HTTPS' }, enabled: { type: 'boolean' }, deleted: { type: 'boolean', description: 'Usado na atualização' } } },
      Image: { type: 'object', properties: { id: { type: 'integer' }, content: { type: 'string', format: 'uri' }, enabled: { type: 'boolean' } } },
      OptionInput: { type: 'object', properties: { id: { type: 'integer' }, title: { type: 'string', example: 'Tamanho' }, shape: { type: 'string', enum: ['square', 'circle'], default: 'square' }, radius: { oneOf: [{ type: 'integer' }, { type: 'string', example: '4px' }] }, type: { type: 'string', enum: ['text', 'color'], default: 'text' }, values: { type: 'array', items: { type: 'string' }, example: ['P', 'M', 'G'] }, deleted: { type: 'boolean' } } },
      Option: { type: 'object', properties: { id: { type: 'integer' }, title: { type: 'string' }, shape: { type: 'string' }, radius: { type: 'integer' }, type: { type: 'string' }, values: { type: 'array', items: { type: 'string' } } } },
      ProductPayload: { type: 'object', required: ['name', 'slug', 'price', 'price_with_discount', 'category_ids'], properties: {
        enabled: { type: 'boolean', default: false }, name: { type: 'string', example: 'Tênis Street Move' }, slug: { type: 'string', example: 'tenis-street-move' }, use_in_menu: { type: 'boolean' },
        stock: { type: 'integer', minimum: 0 }, description: { type: 'string' }, price: { type: 'number', example: 299.90 }, price_with_discount: { type: 'number', example: 219.90 },
        category_ids: { type: 'array', items: { type: 'integer' }, example: [1] }, images: { type: 'array', items: ref('ImageInput') }, options: { type: 'array', items: ref('OptionInput') }
      } },
      Product: { type: 'object', properties: { id: { type: 'integer' }, enabled: { type: 'boolean' }, name: { type: 'string' }, slug: { type: 'string' }, use_in_menu: { type: 'boolean' }, stock: { type: 'integer' }, description: { type: 'string' }, price: { type: 'number' }, price_with_discount: { type: 'number' }, category_ids: { type: 'array', items: { type: 'integer' } }, images: { type: 'array', items: ref('Image') }, options: { type: 'array', items: ref('Option') } } },
      PaginatedCategory: { type: 'object', properties: { data: { type: 'array', items: ref('Category') }, total: { type: 'integer' }, limit: { type: 'integer' }, page: { type: 'integer' } } },
      PaginatedProduct: { type: 'object', properties: { data: { type: 'array', items: ref('Product') }, total: { type: 'integer' }, limit: { type: 'integer' }, page: { type: 'integer' } } },
      Error: { type: 'object', properties: { error: { type: 'string' } } }
    }
  },
  paths: {
    '/health': { get: { tags: ['Sistema'], summary: 'Verifica a disponibilidade do processo', responses: { 200: { description: 'API em execução' } } } },
    '/v1/user': { post: { ...mutation('Cadastrar usuário', 'UserCreate', { 201: { description: 'Criado', ...json(ref('User')) } }, false), tags: ['Usuários'] } },
    '/v1/user/token': { post: { tags: ['Autenticação'], summary: 'Efetuar login e gerar JWT', requestBody: body('TokenRequest'), responses: { 200: { description: 'JWT', ...json(ref('TokenResponse')) }, 400: badRequest } } },
    '/v1/user/{id}': {
      get: { tags: ['Usuários'], summary: 'Buscar usuário por ID (sem senha)', parameters: [id], responses: { 200: { description: 'Encontrado', ...json(ref('User')) }, 404: notFound } },
      put: { ...mutation('Atualizar próprio usuário', 'UserUpdate', { 204: noContent, 403: { description: 'Tentativa de alterar outra conta' }, 404: notFound }), tags: ['Usuários'], parameters: [id] },
      delete: { tags: ['Usuários'], summary: 'Excluir o próprio usuário', security: bearer, parameters: [id], responses: { 204: noContent, 401: unauthorized, 403: { description: 'Acesso negado' }, 404: notFound } }
    },
    '/v1/category/search': { get: { tags: ['Categorias'], summary: 'Listar categorias com filtros, paginação e seleção de campos', parameters: [query('limit', 'Padrão 12, -1 retorna todos', 'integer'), query('page', 'Padrão 1', 'integer'), query('fields', 'Ex.: name,slug'), query('use_in_menu', 'true ou false', 'boolean')], responses: { 200: { description: 'Categorias', ...json(ref('PaginatedCategory')) }, 400: badRequest } } },
    '/v1/category': { post: mutation('Cadastrar categoria', 'CategoryPayload', { 201: { description: 'Criada', ...json(ref('Category')) } }) },
    '/v1/category/{id}': {
      get: { tags: ['Categorias'], summary: 'Buscar categoria pelo ID', parameters: [id], responses: { 200: { description: 'Encontrada', ...json(ref('Category')) }, 404: notFound } },
      put: { ...mutation('Atualizar categoria', 'CategoryPayload', { 204: noContent, 404: notFound }), parameters: [id] },
      delete: { tags: ['Categorias'], summary: 'Excluir categoria', security: bearer, parameters: [id], responses: { 204: noContent, 401: unauthorized, 404: notFound } }
    },
    '/v1/product/search': { get: { tags: ['Produtos'], summary: 'Pesquisar produtos', parameters: [query('limit', 'Padrão 12, -1 retorna todos', 'integer'), query('page', 'Padrão 1', 'integer'), query('fields', 'Ex.: name,images,price'), query('match', 'Procura no nome ou descrição'), query('category_ids', 'IDs separados por vírgula, ex.: 1,2'), query('price-range', 'Ex.: 100-200'), query('option[45]', 'Filtra valores da opção de ID 45, ex.: P,M')], responses: { 200: { description: 'Produtos', ...json(ref('PaginatedProduct')) }, 400: badRequest } } },
    '/v1/product': { post: mutation('Cadastrar produto, imagens, categorias e opções', 'ProductPayload', { 201: { description: 'Criado', ...json(ref('Product')) } }) },
    '/v1/product/{id}': {
      get: { tags: ['Produtos'], summary: 'Buscar produto pelo ID', parameters: [id], responses: { 200: { description: 'Encontrado', ...json(ref('Product')) }, 404: notFound } },
      put: { ...mutation('Atualizar produto e suas relações', 'ProductPayload', { 204: noContent, 404: notFound }), parameters: [id] },
      delete: { tags: ['Produtos'], summary: 'Excluir produto', security: bearer, parameters: [id], responses: { 204: noContent, 401: unauthorized, 404: notFound } }
    }
  }
};
