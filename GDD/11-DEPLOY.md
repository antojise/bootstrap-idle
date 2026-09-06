# Deploy e atualização no celular

## A decisão

**Hospedagem: Vercel.** A conta já existe (`antonio-jose-s-projects`, plano Hobby, 1 projeto
em uso de 200 permitidos). O jogo é estático — não tem servidor, não tem banco, não encosta
em nenhum outro projeto da conta.

Ressalva registrada: o plano Hobby permite **uso pessoal, não comercial**. Enquanto o jogo
for gratuito, tudo bem. Se um dia for monetizado, a migração natural é Cloudflare Pages, que
permite uso comercial no plano free e serve o mesmo conteúdo estático sem nenhuma mudança de
código.

## O pipeline

```
Claude Code edita  →  git commit  →  git push
                                        ↓
                              Vercel builda (~20s)
                                        ↓
                       você abre o app no celular: versão nova
```

Sem etapa manual. O único momento em que alguém clica em alguma coisa é na configuração
inicial, uma vez.

## Configuração inicial (uma vez, no fim da Fase 2)

1. **Repositório** — o Claude Code cria na sua máquina:
   ```bash
   git init && git add -A && git commit -m "fase 1: fundação"
   gh repo create bootstrap-idle --public --source=. --push
   ```
   Se o `gh` não estiver instalado, criar o repo vazio em github.com/new e:
   ```bash
   git remote add origin https://github.com/antojise/bootstrap-idle.git
   git push -u origin main
   ```

2. **Vercel** — conectar o repositório. Como o jogo não tem build:
   - Framework Preset: **Other**
   - Build Command: vazio
   - Output Directory: `.` (a raiz)
   - Install Command: vazio

3. **Instalar no celular** — abrir a URL no Chrome Android → menu → *Adicionar à tela
   inicial*.

## `vercel.json` — o arquivo que evita a armadilha

Crie na raiz do repositório:

```json
{
  "headers": [
    {
      "source": "/sw.js",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=0, must-revalidate" }]
    },
    {
      "source": "/index.html",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=0, must-revalidate" }]
    }
  ]
}
```

**Por que isso importa mais do que parece.** O navegador cacheia o `sw.js` como qualquer
outro arquivo. Se ele cachear o service worker, o celular nunca descobre que existe versão
nova — você faz push, a Vercel builda, e o telefone continua mostrando a versão antiga. O
jogador acha que o jogo travou; você acha que o deploy falhou. Nenhum dos dois é verdade.

Esses dois headers são o que fazem o "commit → celular atualiza" realmente funcionar.

## Service worker: network-first, sempre

```js
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(r => { const c = r.clone();
                   caches.open(CACHE).then(k => k.put(e.request, c)).catch(() => {});
                   return r; })
      .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});
```

Rede primeiro, cache como rede de segurança. O contrário (cache-first, que é o padrão da
maioria dos tutoriais de PWA) prende o celular numa versão antiga de um jeito que nem
fechar o app resolve.

Junto com `skipWaiting()` no install e `clients.claim()` no activate, a versão nova assume
na próxima abertura.

## Avisar o jogador da versão nova

Um idle fica aberto por muito tempo. Quando um SW novo assume enquanto a página está aberta,
o código em memória é o velho e os assets são os novos — dá para dar errado de formas
difíceis de depurar. Detecte e avise:

```js
navigator.serviceWorker.register('sw.js').then(reg => {
  reg.addEventListener('updatefound', () => {
    const novo = reg.installing;
    novo.addEventListener('statechange', () => {
      if (novo.state === 'installed' && navigator.serviceWorker.controller) {
        // não recarregue sozinho: o jogador pode estar no meio de uma decisão
        mostrarToast('nova versão disponível — toque para atualizar', () => {
          salvar(); location.reload();
        });
      }
    });
  });
});
```

Salvar antes de recarregar não é opcional: um reload que perde 20 minutos de progresso é
pior do que não ter atualização nenhuma.

## Ambientes

A Vercel cria uma URL de preview a cada branch. Vale usar:

- `main` → produção, a URL que fica no seu celular
- qualquer outra branch → preview, para testar uma fase antes de ela virar a versão oficial

Assim dá para o Claude Code trabalhar numa fase inteira sem quebrar o jogo que você está
jogando.

## Checagem depois do primeiro deploy

- A URL abre no desktop sem erro de console
- O ícone e o nome aparecem certos ao adicionar à tela inicial
- O app abre em tela cheia, sem barra de navegador
- Ativar modo avião e abrir: o jogo carrega do cache
- Fazer um push com uma mudança visível e confirmar que ela chega ao celular
