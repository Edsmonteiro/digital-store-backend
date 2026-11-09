# Como conectar a API à loja React

Front-end já publicado: https://digital-store-frontend-iota.vercel.app
Repositório: https://github.com/Edsmonteiro/digital-store-frontend

A loja React ainda lê os produtos do arquivo `src/data/products.js`. Preferi manter essa parte como estava porque o Back-end foi uma atividade separada. Uma integração futura pode trocar esses dados locais pelas respostas da API, sem refazer as telas.

## Passos para uma integração futura

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

Alguns dados da loja, como marca e avaliação, não fazem parte da API exigida no curso. Antes de ligar os projetos, é preciso decidir de onde esses dados virão.

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
