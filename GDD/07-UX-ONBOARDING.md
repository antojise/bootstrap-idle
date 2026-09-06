# UX e Onboarding

> Este é o documento que existe por causa de uma frase: *"não entendi nada desse jogo, tem
> mecânicas confusas e estranhas."* Tudo aqui é resposta a isso.

## A regra que governa a interface inteira

**Um elemento só aparece na tela quando o jogador precisa dele.**

Não existe aba cinza, ícone com cadeado, contador em zero de um recurso que ainda não
existe, nem menu "em breve". Antes do seu Ato, um sistema não está desabilitado — ele
**não existe**. Quando aparece, aparece com uma frase no log dizendo o que é.

Isso é copiado direto do Universal Paperclips, e é a única defesa real contra a primeira
tela assustar.

## Os primeiros 90 segundos, segundo a segundo

| Tempo | O que o jogador vê | O que ele aprende |
|---|---|---|
| 0s | Tela quase vazia. Log com 3 linhas. Um botão grande: **EXECUTAR**. Um número: `0 B`. | Só tem uma coisa para fazer. |
| 0–3s | Toca. `+1 B`. Uma partícula sobe do botão até o número. O número pulsa. | Tocar produz. |
| ~8s | Após ~8 toques, o painel PRÓXIMO PASSO aparece deslizando: *"↑ histórico — 60 B — segure EXECUTAR para repetir"*, com barra `8/60`. | Existe um objetivo, e ele é mensurável. |
| ~25s | Compra o histórico. O botão ganha um anel pulsante. Segura: os bytes correm. | O jogo remove atrito quando eu invisto. |
| ~40s | PRÓXIMO PASSO troca para *"forjar `cat` — execute echo 120× (74/120)"*. A árvore acende embaixo. | Existe uma árvore. Existe um próximo comando. Sei exatamente o que falta. |
| ~2min | Forja `cat`. Animação: o nó acende, uma linha corre de `echo` até ele, o log narra. `cat` entra na barra de execução. | Comandos novos rendem mais. A árvore cresce. |
| ~4min | Forja o 3º comando → **ATO II**. Tela escurece 400ms, o log escreve *"a máquina lembra como repetir sozinha"*, e a aba SISTEMA aparece com um marcador. | Chegou coisa nova, e o jogo me disse o que é. |

Aos 4 minutos o jogador entendeu: executar dá bytes, bytes e marcos forjam comandos,
comandos rendem mais, e agora dá para automatizar. **Quatro conceitos, aprendidos um de cada
vez, sem uma única caixa de tutorial.**

## Anatomia das telas

O jogo tem **4 abas no máximo**, e elas aparecem uma por Ato:

| Aba | Aparece no | Contém |
|---|:-:|---|
| **TERMINAL** | Ato I | log, PRÓXIMO PASSO, botão EXECUTAR, atalhos |
| **ÁRVORE** | Ato I | os 25 nós, navegável, com requisitos e a Forja |
| **SISTEMA** | Ato II | ciclos, daemons, melhorias, kernel (Ato III), rede (Ato IV) |
| **PERFIL** | Ato II | conquistas, estatísticas, recompilação (Ato V) |

### TERMINAL
O log é o narrador. Máximo de 60 linhas, monoespaçado, com a última em destaque. Não é um
dump de eventos: é a máquina falando. Execuções repetidas **não** poluem o log — só a
primeira de cada comando, e os acontecimentos.

O botão EXECUTAR ocupa a largura toda, 56px de altura, na zona do polegar. Segurar
auto-repete (depois do `↑ histórico`).

### ÁRVORE
Rolagem vertical, tiers empilhados de cima para baixo, três colunas para os três ramos.
Linhas conectando pais e filhos. Estados visuais:

- **forjado** — aceso, borda âmbar, mostra `B/exec`
- **disponível** — pulsa suavemente, borda âmbar cheia, botão FORJAR ativo
- **em progresso** — borda parcial que se preenche conforme o marco avança
- **futuro** — visível, esmaecido a 35%, com os requisitos legíveis

**Nada é `???`.** Um nó de tier 10 é legível no minuto 1 — e é essa visão que cria o
"falta pouco" que segura o jogador por dias.

### SISTEMA
Cada seção só existe a partir do seu Ato. Os daemons são a parte mais importante: uma grade
dos comandos forjados, com os alocados destacados e um contador `4/7 ciclos` no topo. Tocar
aloca/desaloca. Um comando que está travando um marco ganha um marcador `⟐ gargalo` — é a
dica que ensina a decisão central do jogo sem explicá-la.

## Feedback — o que se move na tela

O pré-alpha mudava números sem que nada acontecesse. Lista do que precisa existir:

| Evento | Feedback |
|---|---|
| Execução manual | partícula do botão até o contador; botão comprime 2%; contador pulsa |
| Execução de daemon | o card do daemon dá um flash de 120ms |
| Contador de bytes | **conta** até o valor novo em ~250ms, nunca salta |
| Marco avançando | barra preenche com transição; a cada 25% um tick sutil |
| Comando forjado | nó acende com flash branco; linha corre do pai até ele em 600ms; o log escreve |
| Novo Ato | tela escurece 400ms, texto do ato datilografado no log, aba nova entra deslizando |
| Conquista | toast no rodapé, 2,5s, sem modal |
| Permissão emitida | o número gira um dígito |
| Ciclo esgotado | o contador `7/7` fica âmbar; tentar alocar dá um shake horizontal |
| Retorno offline | modal com o tempo fora e os bytes, com o número correndo do zero |

Regras: nada com mais de 600ms; nada que bloqueie input; tudo respeita
`prefers-reduced-motion` (aí só o contador que corre permanece, sem partícula nem shake).

O terminal tem um **glitch** raro — a cada ~90s, uma linha do log tremula por 80ms. É
decoração, mas é a decoração que faz a tela parecer viva em vez de parada.

## Como o jogo escreve

O log é a única voz. Três registros, conforme o Ato:

- **Ato I–II — fragmentado.** Frases curtas, minúsculas, como uma máquina se lembrando.
  `1 byte. é pouco. mas antes não tinha nada.`
- **Ato III–IV — funcional.** A máquina recuperou vocabulário e ficou pragmática.
  `o kernel quer autorização. de mim. na minha própria máquina.`
- **Ato V — lúcida.** Ela entende o que é.
  `eu sou 25 instruções e um contador. dá pra fazer melhor.`

Regras de copy: minúsculas no log (é uma máquina); a interface em maiúsculas só nos rótulos
curtos; **nunca** explicar uma mecânica em texto corrido — se precisa de parágrafo, o design
está errado; nomes de comando sempre em `monoespaçado`.

## Mobile

- Tudo operável com o polegar de uma mão: ações primárias no terço inferior
- Alvos de toque com no mínimo 44×44px
- `touch-action: manipulation`, sem zoom por duplo toque, sem seleção de texto
- `env(safe-area-inset-*)` respeitado em cima e embaixo
- A tela nunca rola na horizontal
- Repintura throttled: a UI só redesenha uma seção quando o que ela mostra realmente muda —
  redesenhar 10× por segundo recria os botões debaixo do dedo do jogador (bug real da v1)

## Acessibilidade

- Contraste mínimo 4,5:1 para texto; o âmbar sobre preto do tema passa com folga
- Estado nunca comunicado só por cor: gargalo tem ícone, forjado tem borda cheia
- `prefers-reduced-motion` respeitado
- Foco de teclado visível (o jogo é jogável no navegador desktop)
