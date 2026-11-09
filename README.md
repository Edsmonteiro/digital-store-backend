# Digital Store — Back-end

API REST para o projeto final de Back-end da **Digital College**, desenvolvida por **Edson Monteiro**. O projeto implementa cadastro e gerenciamento de usuários, categorias e produtos, com autenticação JWT e banco MySQL.

**Referência da atividade:** [digitalcollegebr/projeto-backend](https://github.com/digitalcollegebr/projeto-backend)  
**Front-end já publicado:** [Digital Store na Vercel](https://digital-store-frontend-iota.vercel.app)  
**Repositório do Front-end:** [Edsmonteiro/digital-store-frontend](https://github.com/Edsmonteiro/digital-store-frontend)  
**Prazo acadêmico:** 20/11/2026

## Tecnologias

Node.js 20+, Express.js, MySQL 8, Sequelize ORM, Sequelize CLI (migrations), JWT, bcrypt, Jest, Supertest, Swagger UI, Dotenv e Nodemon. O MySQL pode ser executado localmente por Docker Compose.

## Preparando o projeto (Windows / VS Code)

**Pré-requisitos:** Node.js 20 ou superior, npm e MySQL 8.4 (ou Docker Desktop com Docker Compose).

1. Abra o terminal do VS Code dentro da pasta `digital-store-backend`.
2. Instale as dependências:

   ```powershell
   npm install
   ```

3. Crie o arquivo de configuração copiando o exemplo:

   ```powershell
   Copy-Item .env.example .env
   ```

4. Se for utilizar Docker, inicie o banco:

   ```powershell
   docker compose up -d
   ```

5. Edite o `.env` e coloque `DB_PASSWORD=local_dev_password` (somente para o Docker local indicado). Configure `JWT_SECRET` com um segredo aleatório de pelo menos 32 caracteres; nunca suba o `.env` ao GitHub. Se utilizar MySQL instalado diretamente, configure seu usuário, senha e banco no `.env`.
6. Crie as seis tabelas usando migrations e, opcionalmente, carregue as dez demonstrações da Digital Store:

   ```powershell
   npm run db:migrate
   npm run db:seed
   ```

7. Inicie o servidor:

   ```powershell
   npm run dev
   ```

A API será iniciada em `http://localhost:3333`. Acesse:

- **Documentação interativa Swagger:** http://localhost:3333/api-docs
- **Arquivo OpenAPI:** http://localhost:3333/openapi.json
- **Health check:** http://localhost:3333/health

Os dados de demonstração incluem as três categorias e dez produtos usados como referência no Front-end. A seed depende de conexão à internet para exibir as imagens, hospedadas no GitHub público da Digital College.

## Autenticação

Crie um usuário em `POST /v1/user` com `firstname`, `surname`, `email`, `password` e `confirmPassword` (mínimo de oito caracteres). Em seguida, envie email e senha para `POST /v1/user/token`.

Exemplo de resposta:

```json
{ "token": "SEU_JWT_AQUI" }
```

No Swagger, clique em **Authorize**, informe o JWT e teste os endpoints protegidos. Fora do Swagger, utilize o cabeçalho:

```text
Authorization: Bearer SEU_JWT_AQUI
```

Cadastro e login são públicos. A edição e a exclusão de usuários exigem autenticação do próprio titular. A escrita de categorias e produtos também exige JWT.

## Endpoints oficiais

| Método | Rota | Finalidade | JWT |
|---|---|---|---|
| GET | `/v1/user/:id` | Detalhar usuário | Não |
| POST | `/v1/user` | Cadastrar usuário | Não |
| PUT | `/v1/user/:id` | Atualizar próprio usuário | Sim |
| DELETE | `/v1/user/:id` | Excluir próprio usuário | Sim |
| POST | `/v1/user/token` | Gerar token JWT | Não |
| GET | `/v1/category/search` | Pesquisar categorias | Não |
| GET | `/v1/category/:id` | Detalhar categoria | Não |
| POST | `/v1/category` | Criar categoria | Sim |
| PUT | `/v1/category/:id` | Atualizar categoria | Sim |
| DELETE | `/v1/category/:id` | Excluir categoria | Sim |
| GET | `/v1/product/search` | Pesquisar produtos | Não |
| GET | `/v1/product/:id` | Detalhar produto | Não |
| POST | `/v1/product` | Criar produto com imagens, opções e categorias | Sim |
| PUT | `/v1/product/:id` | Atualizar produto e relações | Sim |
| DELETE | `/v1/product/:id` | Excluir produto | Sim |

### Pesquisa e paginação

**Categorias:** `?limit=12&page=1&fields=name,slug&use_in_menu=true`.  
**Produtos:** `?limit=12&page=1&match=Tênis&category_ids=1,2&price-range=100-400&option[45]=P,M&fields=name,images,price`.

`limit=-1` retorna todos os itens e ignora a paginação. Para paginação normal, o limite máximo é 100 por página. As respostas de busca seguem o formato `{ data, total, limit, page }`.

### Corpo de um produto

```json
{
  "enabled": true,
  "name": "Tênis Street Move",
  "slug": "tenis-street-move",
  "stock": 10,
  "description": "Tênis confortável para o dia a dia",
  "price": 299.90,
  "price_with_discount": 219.90,
  "category_ids": [1],
  "images": [
    {
      "type": "image/png",
      "content": "BASE64_DA_IMAGEM",
      "enabled": true
    }
  ],
  "options": [
    {
      "title": "Tamanho",
      "shape": "square",
      "radius": "4px",
      "type": "text",
      "values": ["P", "M", "G"]
    }
  ]
}
```

Na atualização, objetos de `images` e `options` com `id` permitem edição ou exclusão usando `"deleted": true`. Alterações compostas são efetuadas em transações. Imagens em base64 viram arquivos em `public/media`; também são aceitas URLs HTTPS. A pasta de mídia deve ser persistente caso o projeto seja hospedado.

## Banco de dados

Modelos e migration criam exatamente as seis tabelas indicadas no escopo: `users`, `categories`, `products`, `product_images`, `product_options` e `product_categories`. Os vínculos são implementados com chaves estrangeiras e associações Sequelize.

O projeto **não usa `sequelize.sync()` para criar tabelas**: o esquema é gerenciado por migrations versionadas, conforme solicitado. Use `npm run db:migrate:undo` para desfazer a última migration local quando necessário.

## Testes

```powershell
npm run check
npm test
```

`npm run check` verifica a sintaxe de todos os arquivos JavaScript. Os testes Jest básicos não exigem MySQL. Para executar os testes de integração reais, crie previamente o banco `digital_store_test` e configure `DB_TEST_NAME`, `DB_USER` e `DB_PASSWORD` no ambiente de teste. No PowerShell:

```powershell
$env:NODE_ENV="test"
$env:RUN_DB_TESTS="1"
npm run db:migrate
npm run test:integration
Remove-Item Env:\RUN_DB_TESTS
Remove-Item Env:\NODE_ENV
```

O GitHub Actions em `.github/workflows/test.yml` configura MySQL 8.4 automaticamente, executa migrations e todos os testes a cada push e Pull Request.

## Estrutura do código

```text
src/
  config/           MySQL, Sequelize e variáveis de ambiente
  controllers/      Camada HTTP e códigos de resposta
  docs/             Especificação OpenAPI/Swagger
  middleware/       JWT, Content-Type e erros
  models/           Seis modelos e associações
  routes/           Mapeamento dos endpoints /v1
  services/         Regras de negócio e persistência
  utils/            Validação e erros
  app.js            Configuração do Express
  server.js         Inicialização do servidor
migrations/          Criação versionada das tabelas
seeders/             Dez produtos demonstrativos
public/media/        Imagens enviadas em base64
tests/               Jest/Supertest, incluindo integração
.github/workflows/   CI com MySQL e testes
```

## Integração com o Front-end

O Front-end original permanece funcionando com o catálogo local; não foi substituído neste trabalho. A API foi criada separadamente e inclui uma seed de referência para permitir uma futura integração com a aplicação React. Veja [o mapeamento necessário](docs/INTEGRACAO-FRONTEND.md).

## Requisitos e decisões técnicas

Confira [o checklist completo](docs/CHECKLIST-REQUISITOS.md), incluindo todos os endpoints oficiais, regras de banco, autenticação e eventuais ambiguidades na documentação do curso.

Este é um projeto educacional. Para uso comercial, seriam necessários reforços de segurança, política de armazenamento de mídia persistente, observabilidade, controle de papéis e proteção contra abuso.

## Publicação no GitHub

O repositório do Back-end deve ser **separado** do Front-end, para não alterar a entrega já publicada. O nome recomendado é `Edsmonteiro/digital-store-backend`.

Com Git e GitHub CLI autenticados no Windows, execute dentro da pasta deste projeto:

```powershell
.\scripts\publicar-github.ps1
```

Se a política do PowerShell bloquear scripts, copie os comandos do arquivo e execute-os manualmente em vez de desativar a proteção global do sistema. Este script cria o repositório **somente se ainda não existir** e não reescreve branches existentes.

**Importante:** antes de enviar o link ao professor, confira se os testes do GitHub Actions terminaram com sucesso e se os secrets do `.env` não aparecem nos commits.
