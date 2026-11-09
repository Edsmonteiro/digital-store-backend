# Integração futura com o Front-end existente

Front-end já publicado: https://digital-store-frontend-iota.vercel.app
Repositório: https://github.com/Edsmonteiro/digital-store-frontend

O Front-end atual utiliza um catálogo local (`src/data/products.js`) por decisão da etapa acadêmica anterior. **Ele não foi alterado por este projeto de Back-end.**

## Como conectar posteriormente

1. Hospedar a API em ambiente que suporte Node.js e MySQL, configurar `PUBLIC_BASE_URL` e `CORS_ORIGIN` com o domínio do Front-end.
2. Publicar o catálogo de demonstração executando `npm run db:seed` no banco persistente.
3. Introduzir no Front-end uma variável `VITE_API_URL` apontando para a API publicada.
4. Substituir gradualmente os acessos de `src/lib/catalog.js` por chamadas a `GET /v1/product/search` e `GET /v1/product/:id`.
5. Fazer o mapeamento dos formatos de resposta antes de trocar o catálogo local; manter teste de regressão das três páginas e fallback de erro.

## Correspondência dos campos

| Front-end atual | API oficial | Adaptação necessária |
|---|---|---|
| `name` | `name` | Direto |
| `price` | `price` | Direto |
| `priceDiscount` | `price_with_discount` | Converter valor zero para `null` |
| `image` | `images[0].content` | Escolher imagem principal |
| `images` (strings) | `images` (objetos) | Mapear `item.content` |
| `sizes` | `options` com `title: Tamanho` | Usar `values` |
| `colors` | `options` com `title: Cor` | Usar `values` |
| `category` (texto) | `category_ids` | Resolver com `GET /v1/category/search` |
| `brand`, `gender`, `featured`, `stars`, `rating`, `reference` | Não constam no contrato oficial | Manter defaults locais ou evoluir a API após o professor aprovar |

A API segue o escopo de Back-end sem inventar colunas obrigatórias adicionais. Isso significa que **não existe integração automática completa** entre os dois projetos nesta versão.

## Exemplo simples de leitura

```js
const API_URL = import.meta.env.VITE_API_URL;
export async function fetchProducts() {
  const response = await fetch(`${API_URL}/v1/product/search?limit=-1`);
  if (!response.ok) throw new Error('Falha ao obter os produtos');
  const { data } = await response.json();
  return data;
}
```

Não publicar `JWT_SECRET` nem credenciais do MySQL no Front-end. Para alteração de produtos, os tokens devem ser gerados no login e enviados apenas para rotas protegidas.
