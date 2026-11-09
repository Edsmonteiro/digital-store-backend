# Conferência da atividade de Back-end

Enunciado: https://github.com/digitalcollegebr/projeto-backend

Usei esta lista para conferir o que foi pedido e registrar as diferenças que encontrei no enunciado.

## Banco de dados

As seis tabelas da atividade estão na migration `20261109000100-initial-tables.js`:

| Tabela | Dados principais |
|---|---|
| `users` | Nome, sobrenome, email e senha com hash |
| `categories` | Nome, slug e exibição no menu |
| `products` | Nome, slug, estoque, descrição e preços |
| `product_images` | Imagens vinculadas ao produto |
| `product_options` | Tamanho, cor e demais opções |
| `product_categories` | Relação entre produtos e categorias |

As ligações usam chaves estrangeiras. Ao excluir um produto, suas imagens, opções e vínculos com categorias também são removidos.

A migration `20261109000300-search-indexes.js` acrescenta um índice de preço e confere se a categoria já possui índice pelo MySQL antes de criar outro. Nos filtros de opções, a API consulta os IDs informados de uma vez e depois verifica a combinação de valores.

## Endpoints

**Usuários:** `GET /v1/user/:id`, `POST /v1/user`, `PUT /v1/user/:id`, `DELETE /v1/user/:id` e `POST /v1/user/token`.

**Categorias:** `GET /v1/category/search`, `GET /v1/category/:id`, `POST /v1/category`, `PUT /v1/category/:id` e `DELETE /v1/category/:id`.

**Produtos:** `GET /v1/product/search`, `GET /v1/product/:id`, `POST /v1/product`, `PUT /v1/product/:id` e `DELETE /v1/product/:id`.

O cadastro de produtos aceita categorias, imagens e opções. Na atualização também é possível remover uma imagem ou opção usando `deleted: true`. As buscas têm paginação e os filtros descritos no [README](../README.md).

## Autenticação

O login devolve um JWT. Cadastro e login são públicos; para criar, editar ou excluir categorias e produtos é preciso informar o token. Usuários só podem editar ou excluir a própria conta.

A senha é armazenada com bcrypt e não é devolvida nas consultas.

## Escolhas que vale explicar

- **Status HTTP:** o enunciado usa tanto 400 quanto 401 para token ausente. A API retorna 401 para falta de autenticação e 403 quando o usuário tenta alterar outra conta.
- **Opções de produto:** alguns exemplos trazem `value`, outros `values`. O código aceita os dois na entrada e responde com `values`.
- **Raio das opções:** aceita `4` e `"4px"`, guardando o número no banco.
- **Preços:** mantive FLOAT, como solicitado. Em um sistema financeiro de produção, escolheria DECIMAL.
- **Campos extras da loja:** marca, gênero e avaliação existem no catálogo do React, mas não foram acrescentados ao banco porque não fazem parte do contrato da atividade.
- **Imagens:** a API aceita base64 e URLs HTTPS. Imagens enviadas em base64 ficam em `public/media`.

## O que foi validado

- Migration executada em MySQL 8.4.
- Seed com produtos de exemplo.
- Fluxo completo de usuários, categorias e produtos em testes de integração.
- Busca por categoria e opções combinadas, paginação, parâmetros inválidos e índices testados com MySQL.
- Testes automatizados com Jest e Supertest.
- Swagger disponível em `/api-docs` e especificação em `/openapi.json`.
- GitHub Actions executando migrations e testes.
- Repositório público com `.env` ignorado.

O projeto ainda não possui deploy próprio da API. Isso não impede executar e testar o Back-end localmente, conforme o exercício.
