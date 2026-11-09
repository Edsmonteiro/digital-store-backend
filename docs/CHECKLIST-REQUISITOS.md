# Conferência dos requisitos do repositório oficial

Fonte: https://github.com/digitalcollegebr/projeto-backend

## Seção 01 — Banco de dados

| Requisito | Implementação |
|---|---|
| Usuários | `users`: id, firstname, surname, email, hash bcrypt, timestamps |
| Categorias | `categories`: id, name, slug, use_in_menu, timestamps |
| Produtos | `products`: id, enabled, name, slug, use_in_menu, stock, description, price, price_with_discount, timestamps |
| Imagens | `product_images`: id, product_id, enabled, path |
| Opções | `product_options`: id, product_id, title, shape, radius, type, values |
| Produtos × categorias | `product_categories`: product_id, category_id, chave composta |

As seis tabelas são criadas com `migrations/20261109000100-initial-tables.js`. Todas as relações possuem chaves estrangeiras e exclusão em cascata quando o produto é removido. O banco é MySQL, via Sequelize.

## Seção 02 — Usuários

- `GET /v1/user/:id` — consulta, sem expor a senha.
- `POST /v1/user` — cadastro, `password` e `confirmPassword`, hash bcrypt.
- `PUT /v1/user/:id` — atualização com JWT, somente o dono.
- `DELETE /v1/user/:id` — exclusão com JWT, somente o dono.

## Seção 03 — Categorias

- `GET /v1/category/search` — `limit`, `page`, `fields`, `use_in_menu`.
- `GET /v1/category/:id` — detalhe.
- `POST /v1/category` — criação.
- `PUT /v1/category/:id` — edição.
- `DELETE /v1/category/:id` — exclusão.

## Seção 04 — Produtos

- `GET /v1/product/search` — `limit`, `page`, `fields`, `match`, `category_ids`, `price-range`, `option[id]`.
- `GET /v1/product/:id` — retorna categoria, imagens e opções.
- `POST /v1/product` — cria produto e associações em transação.
- `PUT /v1/product/:id` — altera atributos, categorias, imagens e opções, inclusive `deleted:true` para exclusão parcial.
- `DELETE /v1/product/:id` — exclui produto e relações.

## Seção 05 — JWT

- `POST /v1/user/token` — autentica por email/senha e retorna `{ "token": "..." }`.
- Proteção JWT Bearer nas alterações de categorias e produtos; em usuário, aplica autorização apenas ao titular.
- Cadastro de usuário e geração do token ficam públicos necessariamente para permitir o primeiro acesso.

## Divergências e decisões explícitas

1. A especificação menciona `400` se faltar token, mas também pede `401` em vários endpoints protegidos. Esta implementação utiliza **401**, mais apropriado para ausência ou invalidade de credenciais. A autorização de outra conta retorna **403**.
2. Alguns exemplos da documentação original têm JSON inválido (vírgula final, objetos sem vírgula), e alternam entre `value` e `values` nas opções. A API aceita ambos na entrada e normaliza para `values` na resposta.
3. Imagens base64 são gravadas em `/public/media` com caminho relativo em `path`. Também são aceitas URLs HTTPS, o que permite os assets públicos da Digital College.
4. `radius` é INTEGER no MySQL. A API aceita `4` e `"4px"` no payload, convertendo este último para 4.
5. `price_with_discount: 0` indica ausência de promoção, como nos exemplos oficiais.
6. O contrato de Back-end não define marca, gênero nem avaliação. Esses campos do Front-end atual não foram adicionados ao esquema acadêmico.
7. A documentação exige FLOAT para os preços; o modelo preserva FLOAT. Em sistemas financeiros reais, DECIMAL seria preferível.

## Requisitos de qualidade

- Separação por `routes`, `controllers`, `services`, `models`, `middleware` e `utils`.
- Tratamento padronizado de erros com status HTTP corretos.
- Swagger UI em `/api-docs`, OpenAPI JSON em `/openapi.json`.
- Jest e Supertest em `tests/`, testes com banco real habilitados por `RUN_DB_TESTS=1`.
- GitHub Actions com MySQL 8.4, migrations e testes.
- Arquivo `.env.example` e README com passo a passo.

## Validação ainda necessária

- Instalar dependências com npm.
- Executar migrations e Jest em ambiente com MySQL disponível.
- Confirmar todos os testes e Swagger no Windows antes da entrega.
- Criar e publicar o repositório GitHub do Back-end.
