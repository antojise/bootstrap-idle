# FASE 2 — Ato I jogável

```
Continuando o BOOTSTRAP. A engine e os dados estão prontos e testados (fase 1).
Leia CLAUDE.md, GDD/07-UX-ONBOARDING.md e GDD/04-ARVORE-E-FORJA.md.

Agora o jogo abre e é jogável até o fim do Ato I — os primeiros ~4 minutos.

## O que construir

1. index.html — casca mínima, mobile-first. viewport com viewport-fit=cover,
   theme-color, sem zoom por duplo toque, sem seleção de texto.

2. Tema visual: terminal de fósforo âmbar sobre preto profundo, monoespaçado.
   CSS custom properties para tudo. Um único arquivo de tema.

3. src/ui/terminal.js — a aba TERMINAL:
   - log narrativo, máx 60 linhas, última em destaque, texto em minúsculas
   - painel PRÓXIMO PASSO: UM objetivo, o mais próximo de ser concluído, com barra e
     números (`awk 847 / 1.500`). Nunca vazio, nunca com dois objetivos.
   - botão EXECUTAR: largura total, 56px, no terço inferior. Segurar auto-repete DEPOIS
     de comprado o ↑ histórico (antes, não).

4. src/ui/tree.js — a aba ÁRVORE:
   - os 25 nós, rolagem vertical, tiers empilhados, 3 colunas para os 3 ramos, linhas
     ligando pais a filhos
   - 4 estados visuais: forjado / disponível / em progresso / futuro (esmaecido a 35%)
   - TODO nó mostra seus requisitos com número e barra, inclusive os de tier 10 no
     minuto 1. Nunca `???`.
   - tocar num nó abre a Forja com o layout de GDD/04-ARVORE-E-FORJA.md

5. src/save.js — localStorage, autosave 5s + visibilitychange + pagehide, campo de
   versão com função de migração, tudo em try/catch (localStorage lança em janela
   privada e o jogo precisa abrir mesmo assim).

6. src/ui/app.js — monta, roteia abas, agenda repintura.
   IMPORTANTE: cada seção declara uma impressão digital do que exibe e só redesenha
   quando ela muda. Redesenhar tudo a cada tick recria os botões debaixo do dedo do
   jogador — isso foi um bug real.

7. src/main.js — boot, loop com requestAnimationFrame e dt real (nunca setInterval).

## O que NÃO pode existir nesta fase

Ciclos, daemons, permissões, rede, fragmentos, conquistas, abas SISTEMA e PERFIL.
Nem desabilitados, nem cinza, nem em zero. Eles não existem ainda.

## Deploy

Esta é a primeira fase com algo jogável, então é aqui que o jogo vai para o ar.
Leia GDD/11-DEPLOY.md e siga-o à risca — em especial o vercel.json com os headers de
Cache-Control para /sw.js e /index.html. Sem eles, o celular fica preso numa versão antiga
e o pipeline inteiro parece quebrado quando não está.

Crie o vercel.json agora, mesmo que o service worker só entre na Fase 7. Depois me diga o
que falta para conectar o repositório na Vercel (Framework: Other, Build Command vazio,
Output Directory: ".").

## Critérios de aceite

- A primeira tela tem: log, PRÓXIMO PASSO, botão EXECUTAR, contador de bytes e a aba
  ÁRVORE. Mais nada.
- A sequência de GDD/07-UX-ONBOARDING.md acontece: primeiro toque produz, PRÓXIMO PASSO
  aparece com o ↑ histórico, comprar habilita segurar, o objetivo troca para forjar cat.
- Forjar cat funciona e leva menos de 3 minutos jogando de verdade.
- Recarregar a página preserva o progresso.
- Zero erros de console.
- `grep -rE "document|window" src/engine/` continua vazio.
```
