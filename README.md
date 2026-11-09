# Digital Store — Back-end

Este é o Back-end que desenvolvi para a atividade de Node.js da Digital College. A proposta foi criar uma API para cadastrar usuários, categorias e produtos, guardar as informações no MySQL e proteger as operações de edição com JWT.

O projeto é separado da [loja em React](https://digital-store-frontend-iota.vercel.app), que continua usando um catálogo local.

**Atividade:** [digitalcollegebr/projeto-backend](https://github.com/digitalcollegebr/projeto-backend)  
**Front-end:** [código no GitHub](https://github.com/Edsmonteiro/digital-store-frontend)  
**Desenvolvido por:** Edson Monteiro

## Como organizei o projeto

Usei Node.js, Express, MySQL e Sequelize. As rotas recebem as requisições, os controllers cuidam das respostas HTTP e os services concentram o acesso aos dados e as regras do cadastro.

O banco tem as seis tabelas pedidas no exercício: `users`, `categories`, `products`, `product_images`, `product_options` e `product_categories`. A estrutura é criada por uma migration, sem `sequelize.sync()`.

Para autenticação, usei bcrypt para armazenar as senhas e JWT para autorizar alterações. A API também tem documentação Swagger e testes com Jest e Supertest.

## Rodando no Windows

É necessário ter Node.js 20 ou superior e MySQL 8. O `docker-compose.yml` já configura um MySQL 8.4 para desenvolvimento.

No terminal, dentro da pasta do projeto:

```powershell
npm install
Copy-Item .env.example .env
docker compose up -d
```

No arquivo `.env`, altere `DB_PASSWORD` para `local_dev_password` se estiver usando o Docker deste repositório. Também troque `JWT_SECRET` por uma chave aleatória com pelo menos 32 caracteres.

Depois:

```powershell
npm run db:migrate
npm run db:seed
npm run dev
```

A seed é opcional e coloca três categorias e dez produtos de exemplo no banco. As imagens são carregadas a partir do repositório público da Digital College.

Com o servidor iniciado:

- **Swagger:** http://localhost:3333/api-docs
- **OpenAPI em JSON:** http://localhost:3333/openapi.json
- **Verificação da API:** http://localhost:3333/health

O `.env` fica fora do Git. O arquivo `.env.example` serve apenas como modelo.

## Rotas disponíveis

| Método | Rota | O que faz |
|---|---|---|
| GET | `/v1/user/:id` | Busca um usuário, sem retornar a senha |
| POST | `/v1/user` | Cadastra usuário |
| PUT | `/v1/user/:id` | Atualiza a própria conta |
| DELETE | `/v1/user/:id` | Exclui a própria conta |
| POST | `/v1/user/token` | Faz login e devolve um JWT |
| GET | `/v1/category/search` | Lista e filtra categorias |
| GET | `/v1/category/:id` | Busca uma categoria |
| POST | `/v1/category` | Cria categoria |
| PUT | `/v1/category/:id` | Edita categoria |
| DELETE | `/v1/category/:id` | Exclui categoria |
| GET | `/v1/product/search` | Pesquisa produtos |
| GET | `/v1/product/:id` | Busca produto e suas relações |
| POST | `/v1/product` | Cadastra produto, imagens, opções e categorias |
| PUT | `/v1/product/:id` | Atualiza produto e relações |
| DELETE | `/v1/product/:id` | Exclui produto |

A busca de produtos aceita `match`, `category_ids`, `price-range`, `option[id]`, `fields`, `limit` e `page`. Para categorias, há `use_in_menu`, `fields`, `limit` e `page`. A listagem retorna `data`, `total`, `limit` e `page`; com `limit=-1`, retorna todos os registros.

Cadastro e login não precisam de token. Para editar ou excluir dados, envie o JWT no cabeçalho:

```text
Authorization: Bearer SEU_TOKEN
```

Para começar, crie o usuário em `POST /v1/user` com `firstname`, `surname`, `email`, `password` e `confirmPassword`. Depois use `POST /v1/user/token` com email e senha. No Swagger, o botão **Authorize** permite informar o token.

As imagens podem ser enviadas em base64 ou como URL HTTPS. Arquivos enviados ficam em `public/media`; em uma hospedagem real, essa pasta precisaria de armazenamento persistente. Na atualização, é possível informar `id` e `deleted: true` para remover imagens ou opções existentes.

## Testes

```powershell
npm run check
npm test
```

O teste de integração usa um banco separado, para não mexer nos produtos cadastrados durante o desenvolvimento. Crie o banco `digital_store_test`, dê acesso ao usuário do MySQL e, no **mesmo terminal PowerShell**, execute:

```powershell
$env:NODE_ENV = "test"
$env:RUN_DB_TESTS = "1"
$env:DB_TEST_NAME = "digital_store_test"
npm run db:migrate
npm run test:integration
Remove-Item Env:\NODE_ENV,Env:\RUN_DB_TESTS,Env:\DB_TEST_NAME -ErrorAction SilentlyContinue
```

O [GitHub Actions](https://github.com/Edsmonteiro/digital-store-backend/actions) também executa migrations e testes com MySQL 8.4 a cada atualização do repositório.

## Observações

O Back-end cumpre a parte de API do exercício, mas ainda não está conectado à loja React. Deixei anotado o que seria necessário para essa etapa em [docs/INTEGRACAO-FRONTEND.md](docs/INTEGRACAO-FRONTEND.md).

Em [docs/CHECKLIST-REQUISITOS.md](docs/CHECKLIST-REQUISITOS.md) estão os requisitos da atividade e algumas escolhas de implementação, como a resposta HTTP 401 para token ausente.

O código foi pensado para a atividade. Se fosse usado por uma loja real, ainda precisaria de controles adicionais de acesso, limites de requisição e armazenamento adequado das imagens.

Prazo da atividade: 20/11/2026.
