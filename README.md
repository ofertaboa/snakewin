# SnakeWin — Site 100% estático (espelho do snakewin.online)

Cópia estática completa do site `https://www.snakewin.online`, com **HTML, JavaScript, CSS,
imagens, áudios e vídeos baixados localmente**. Funciona sem servidor de aplicação:
basta servir arquivos estáticos.

## Rotas

| Rota | Arquivo |
|---|---|
| `/` | `index.html` |
| `/jogar` | `jogar/index.html` |
| `/login` | `login/index.html` |
| `/cadastro` | `cadastro/index.html` |
| `/roleta` | `roleta/index.html` |
| `/bonus` | `bonus/index.html` |
| `/termos` | `termos/index.html` |
| `/gerente/login` | `gerente/login/index.html` |
| `/gerente`, `/gerente/comissoes`, `/gerente/criar-demo`, `/gerente/indicados`, `/gerente/indicar`, `/gerente/meus-saques`, `/gerente/notificacoes`, `/gerente/perfil` | `307 → /gerente/login` (idêntico ao original) |
| qualquer outra rota | `404.html` |

O site original também responde 404 para `/jogo`, `/jogos`, `/premios`, `/indicar`,
`/perfil`, `/entrar`, `/home`, `/app`, `/sobre`, `/privacidade`, `/ajuda`, `/faq`,
`/suporte`, `/resgatar`, `/recovery`, `robots.txt` e `sitemap.xml` — aqui essas rotas
caem no `404.html`.

## Rodar localmente

```
INICIAR-LOCAL.bat
```

ou

```
node tools/server.js
```

Abra <http://localhost:8080>. Use `set PORT=3000` para trocar a porta.

O `tools/server.js` implementa os mesmos 307 do `/gerente/*`, MIME correto
(`.MP3`, `.m3u8`, `.webmanifest`) e loga requisições 404 no console.

## Deploy — Netlify

1. Conecte o repositório em <https://app.netlify.com>, **ou** arraste esta pasta em
   <https://app.netlify.com/drop>.
2. Build command: *(vazio)* — Publish directory: `.` (já definido em `netlify.toml`).
3. Os redirects do `/gerente/*` estão em `_redirects` e o `404.html` é servido
   automaticamente.

## Deploy — Cloudflare Pages

1. <https://dash.cloudflare.com> → **Workers & Pages** → **Create** → **Pages**.
2. Conecte o repositório. Framework preset: **None**. Build command: *(vazio)*.
   **Build output directory: `.`**
3. Ou pela CLI: `npx wrangler pages deploy .` (o `wrangler.toml` já está configurado
   com `pages_build_output_dir = "."`).
4. `_redirects` e `404.html` são lidos automaticamente pelo Pages.

## Deploy — GitHub Pages

Publicação por upload das raiz do repositório. Como as rotas são diretórios com
`index.html`, funciona sem configuração extra; os redirects do `/gerente/*` **não**
são suportados pelo Pages (essas URLs cairão no `404.html`).

## Ajustes técnicos aplicados

### 1. Otimizador de imagens do Next (`/_next/image`)

O `/_next/image` **não existe** em hospedagem estática — era a causa das imagens
quebradas. Em vez de ligar `unoptimized`, que gerava erro de hidratação (React #418),
o **loader** de `next/image` foi corrigido em 7 chunks (`tools/rebuild.js`) para
retornar o `src` original, e o HTML foi reescrito preservando os descritores do
`srcset` (`1x`/`2x`/`640w`).

**Nunca execute `tools/patch.js`** (versão antiga com `unoptimized:!0`) — quebra
todas as páginas com erro de hidratação.

### 2. Redirects do painel de gerente

O site original serve **307 → `/gerente/login`** para as 8 rotas internas do painel
(não autenticado). Como estáticamente não há middleware do Next, esses redirects
estão em `_redirects` e no `tools/server.js`. As pastas duplicadas dessas rotas
foram removidas para que o redirect não seja "sombreado" pelo arquivo.

### 3. Áudios

12 efeitos sonoros **não existem no servidor de origem** (dão 404 também no site
produção) e foram preenchidos com uma cópia de `audio/speaks/coin.mp3` apenas para
eliminar 404 no console:

```
audio/broken.MP3  audio/bubble.MP3  audio/cashout.mp3  audio/defeat.mp3
audio/encaixe.MP3 audio/pop01.MP3   audio/pop02.MP3    audio/pop03.MP3
audio/pop04.MP3   audio/selection.MP3  audio/swtch.MP3  audio/win.mp3
```

O código usa `.play().catch(...)`, então áudios faltando não quebram a página.

`imagens/assetsjogoimg/edge-asset.png` e `planta2/planta3.png` são 404 reais da
origem (referências falsas no código).

### 4. Chamadas de API

O front faz chamadas que exigem backend e **não existem aqui** — elas falham
silenciosamente (a UI continua utilizável):

```
/api/broadcast  /api/deposits/pix  /api/gerente/resolve-login
/api/login/resolve-login  /api/session/ip
```

O login do painel usa o Supabase (`chexxsnckubgzvtchgsy.supabase.co`) direto do
cliente; isso funciona, mas depende do CORS daquele projeto.

### 5. Aviso cosmético

`/roleta`, `/login`, `/termos` e `/bonus` logam
*"resource was preloaded using link preload but not used"* — cosmético, do bundle
original, não afeta nada.

## Estrutura

```
├─ index.html            homepage
├─ 404.html              página de erro com botão "Acessar agora"
├─ _redirects            redirects Netlify / Cloudflare Pages
├─ netlify.toml          config Netlify (publish = ".")
├─ wrangler.toml         config wrangler (pages_build_output_dir = ".")
├─ INICIAR-LOCAL.bat     sobe o servidor local
├─ favicon.ico, manifest.webmanifest
├─ _next/                JS/CSS do bundle Next.js (loaders corrigidos)
├─ imagens/              todas as imagens (incl. painel-xp, asset-roleta, folhas)
├─ audio/                efeitos + voices
├─ bonus/ cadastro/ gerente/ jogar/ login/ roleta/ termos/   HTML de cada rota
└─ tools/                scripts de espelhamento/verificação
   ├─ server.js          servidor estático local (porta 8080)
   ├─ rebuild.js         re-baixa HTML/JS e reaplica os patches
   ├─ check.js           smoke test: rotas + redirects + 84 refs
   ├─ mirror.js          crawler que baixa o site original
   └─ ...                enrich, scan, inspect, find, diffdom
```

## Verificação

```
node tools/check.js
```

Esperado: `8 rotas 200`, `8 redirects 307 OK`, `84 refs`, `FALHAS: 0`.
