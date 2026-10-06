# _inativos

Páginas **preservadas no repositório mas fora do ar**.

Esta pasta está listada no [`.vercelignore`](../.vercelignore) da raiz: os arquivos
continuam versionados no Git, mas **não são publicados** pela Vercel.

Nada no site linkava para nenhum destes arquivos — todos já estavam órfãos.

---

## 1. Produtos com checkout desativado

Apontavam para `https://checkout.e-a.shop/...`, um domínio que **não existe mais**
(NXDOMAIN — não resolve em nenhum DNS). Qualquer clique em "Comprar" nessas páginas
não ia a lugar nenhum.

| Pasta | Checkout que estava configurado |
|---|---|
| `loja/produtos/arvore`    | `checkout.e-a.shop/VCCL1O8SCM6T` |
| `loja/produtos/bicicleta` | `checkout.e-a.shop/VCCL1O8SCM6N` |
| `loja/produtos/cafeteira` | `checkout.e-a.shop/VCCL1O8SCM6P` |
| `loja/produtos/tv-fire`   | `checkout.e-a.shop/VCCL1O8SCM6Q` |
| `loja/produtos/tv/armiz`  | `checkout.e-a.shop/VCCL1O8SCM75` |

## 2. Cópias antigas (`voltar.html`) e stubs

29 arquivos: `*/voltar.html`, `*/fonts/voltar.html` e `back2/produtos/tv/armiz`.

Além de órfãos, tinham:

- CSS e JS quebrados (`css/swiper-bundle.min.css`, `js/modal.js`, `js/s.js` — todos 404);
- erro de JavaScript que matava a página inteira (`Identifier 'mainSwiper' has already been declared`);
- gateways antigos: `checkout.pagamentosdia.shop` (back2) e `pay.pagaroficialseguro.com` (loja).

---

## Para reativar um produto

1. Mova a pasta de volta para `loja/produtos/`.
2. Troque o domínio de checkout para `https://checkout.brdance.lat/<ID>`
   (o padrão de todo o resto do site).
3. Adicione o card do produto na listagem de `loja/index.html`.
4. Confirme que a página carrega `/assets/tailwind.css` e `/assets/shell.css`
   (as páginas movidas ainda usavam o Tailwind por CDN).
