# Arquitetura técnica

## Stack

Web/PWA modular, sem framework e sem build. ES modules nativos, servidos direto. A razão é
concreta: o jogo é um loop de estado e uma UI que redesenha seções — React aqui adiciona
build, dependências e um modelo de reconciliação que não paga por si nesse escopo. Se um dia
o projeto crescer para justificar, a fronteira `engine` ↔ `ui` já está desenhada para
permitir a troca sem tocar na lógica.

- **Runtime:** ES modules, sem transpilação
- **Estilo:** CSS puro com custom properties
- **Persistência:** `localStorage`
- **Distribuição:** PWA (manifest + service worker), instalável no Android
- **Testes:** Node para a engine, Playwright para a UI

## Estrutura de arquivos

```
bootstrap/
├─ index.html                 casca: <head>, containers das telas, imports
├─ manifest.json  sw.js  icon-{192,512,maskable}.png
│
├─ src/
│  ├─ data/
│  │  ├─ commands.js          os 25 comandos: tier, yield, req, custos, efeitos
│  │  ├─ acts.js              os 5 atos e seus gatilhos
│  │  ├─ upgrades.js          melhorias, ciclos, daemons, kernel, nós
│  │  ├─ prestige.js          fragmentos e arquiteturas
│  │  └─ achievements.js      as 55 conquistas
│  │
│  ├─ engine/                 ← NADA aqui toca o DOM
│  │  ├─ state.js             cria, valida e migra o estado
│  │  ├─ economy.js           produção, multiplicadores, custos
│  │  ├─ forge.js             requisitos, o que falta, forjar
│  │  ├─ daemons.js           alocação, ciclos, gargalos
│  │  ├─ acts.js              avaliação de gatilho de ato
│  │  ├─ achievements.js      avaliação das condições
│  │  ├─ prestige.js          recompilar
│  │  ├─ offline.js           cálculo do tempo ausente
│  │  └─ tick.js              o loop: um passo de dt
│  │
│  ├─ ui/                     ← só aqui existe document/window
│  │  ├─ app.js               monta, roteia abas, agenda repintura
│  │  ├─ terminal.js  tree.js  system.js  profile.js
│  │  ├─ components/          barra, nó, card de daemon, toast, modal
│  │  ├─ fx.js                partículas, contador que corre, flashes
│  │  └─ format.js            números, tempo, plural
│  │
│  ├─ save.js                 serialização, versionamento, migração
│  └─ main.js                 boot
│
├─ tools/
│  ├─ sim.js                  simulador de balanceamento
│  ├─ validate.js             regras estruturais do grafo
│  └─ gen-docs.js             regera as tabelas do GDD a partir dos dados
│
└─ test/
   ├─ engine.test.js          Node, sem navegador
   └─ ui.test.js              Playwright
```

## A regra arquitetural que não se quebra

**`engine/` é puro. Não importa nada de `ui/`, não toca `document`, `window`,
`localStorage` nem `Date.now()`.**

O tempo entra como parâmetro: `tick(state, dt)` devolve um estado novo. Por isso o
simulador consegue rodar 14 dias de jogo em segundos, e por isso os testes de economia rodam
em Node sem navegador. Foi o que permitiu descobrir, antes de qualquer código de tela, que a
assinatura digital resolvia o jogo inteiro em 90 segundos.

`ui/` lê o estado e desenha. Nunca calcula economia — se a UI precisa saber quanto custa
algo, ela pergunta para a engine.

## Formato do estado

```js
{
  v: 2,                          // versão do save, para migração
  t: { criado, ultimoTick, ultimoVisto },
  run: {                         // zerado pela recompilação
    bytes, bytesDaRun,
    forjados: ['echo', 'cat'],
    execs: { echo: 1240, cat: 88 },      // marcos, contador de vida da run
    daemons: ['cat'],
    ciclosComprados, daemonUp, permNivel,
    perm, permProg,
    ups: { historico: true },
    nosAbertos: ['local'], noAtual: 'local',
    ato: 2,
  },
  meta: {                        // atravessa a recompilação
    fragmentos, runs, arquitetura, arqsUsadas: [],
    conquistas: { eco1: 1714... },       // id → timestamp
  },
  stats: { bytesTotal, execTotal, permTotal, travadoPorPerm, ... },
  cfg: { som, reduzirMovimento, notacao },
}
```

`run` e `meta` separados não é organização, é semântica: **recompilar é
`state.run = novaRun()`**, e nada mais. Se um campo está no lugar errado, o prestígio apaga
o que não devia ou preserva o que não devia.

## O loop

```js
function frame() {
  const agora = performance.now();
  let dt = (agora - ultimo) / 1000;
  ultimo = agora;
  if (dt > 2) dt = 2;             // o resto é tratado como offline, não como tick gigante
  tick(estado, dt);               // engine pura
  ui.agendarRepintura();          // marca seções sujas; desenha no próximo rAF
  requestAnimationFrame(frame);
}
```

Duas armadilhas já conhecidas:

1. **Não usar `setInterval` para a economia.** O navegador suspende timers em aba oculta e o
   jogo perde tempo. Todo cálculo parte de `dt` real medido.
2. **Não redesenhar a tela inteira a cada tick.** Cada seção declara uma "impressão digital"
   do que mostra; se ela não mudou, não redesenha. Sem isso, os botões são recriados debaixo
   do dedo do jogador — bug real da v1.

## Save

- Autosave a cada 5s, em `visibilitychange` e em `pagehide`
- Campo `v` com migração explícita: `migrar(save)` roda de `v` até a versão atual
- Toda escrita e leitura em `try/catch` — `localStorage` lança em janela privada e o jogo
  precisa abrir mesmo assim, com estado novo
- `ultimoVisto` gravado **dentro** de `save()`, nunca só no tick: o handler de `pagehide`
  guarda a referência original da função, então reatribuir `save` depois não troca o handler
  (bug real da v1, achado por teste)

## Offline

```
ausente = min(agora - ultimoVisto, 12h)
bytes  += producaoPassiva × ausente × (daemonPersistente ? 1.0 : 0.30)
marcos += execucoesPassivas × ausente × 0.25
```

Modal de retorno com o tempo e o ganho, sempre — inclusive quando o ganho é zero, aí com o
motivo ("nenhum daemon alocado").

## Testes

**Engine (Node, rápido, roda em cada mudança):**
- validação do grafo: alcançabilidade, sem ciclos, sem downgrade, custo de permissão por tier
- economia: produção bate com a fórmula; multiplicadores compõem na ordem certa
- forja: requisito faltando impede; requisito completo permite; custos são debitados
- ciclos: nunca alocar mais daemons que ciclos; déficit pausa em vez de travar
- prestígio: `run` zera, `meta` sobrevive, fragmentos batem com a fórmula
- offline: teto de 12h aplicado; marcos a 25%
- save: round-trip preserva; migração de v1 para v2 não perde dados

**UI (Playwright, mobile viewport):**
- primeira tela mostra apenas botão, bytes e log — nenhuma aba além de TERMINAL e ÁRVORE
- nada de ciclos/permissões/rede visível antes do Ato correspondente
- os 90 segundos do onboarding acontecem na ordem documentada
- forjar pela UI atualiza árvore, log e PRÓXIMO PASSO
- reload preserva; retorno offline mostra o modal
- zero erros de console
