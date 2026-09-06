# Progressão

## Os cinco Atos

Um Ato revela **uma** coisa nova. O gatilho nunca é o relógio — é um marco que prova que o
jogador dominou a camada anterior. Antes do Ato, o sistema **não existe na interface**: sem
aba, sem número, sem menção, sem ícone cinza "bloqueado".

| Ato | Nome | Gatilho | O que aparece na tela | Momento típico |
|:---:|------|---------|----------------------|----------------|
| 1 | **O Vazio** | início | botão EXECUTAR, bytes, árvore de comandos | início |
| 2 | **Os Daemons** | 3 comandos forjados | ciclos, daemons (automação), aba SISTEMA | ~4 min |
| 3 | **O Kernel** | forjar algo de tier 4 | permissões, fila de homologação | ~12 h |
| 4 | **A Rede** | forjar algo de tier 6 | nós remotos, sobrecarga, aba REDE | ~1,5 dia |
| 5 | **A Recompilação** | forjar algo de tier 8 | fragmentos, arquiteturas, prestígio | ~4 dias |

Os tempos são do simulador (`node sim.js`), perfil de 4 sessões de 15 min por dia.

### Ato I — O Vazio
**Tela:** o log do terminal, um número (bytes), o botão EXECUTAR, a árvore.
**Não existe ainda:** ciclos, permissões, daemons, rede, abas.

O jogador toca EXECUTAR e ganha 1 byte. Aos ~25 segundos ele tem 60 bytes e o painel PRÓXIMO
PASSO oferece `↑ histórico`, que permite segurar o botão. Esse é o primeiro alívio, e ele
chega antes de o tédio virar abandono. Aos ~2 min forja `cat`, o primeiro comando novo — e a
árvore ganha um nó aceso.

### Ato II — Os Daemons
**Gatilho:** 3 comandos forjados. **Revela:** ciclos e daemons.

A catarse. O log diz: *"a máquina lembra como repetir sozinha."* O jogador aloca seu primeiro
daemon e vê o número subir sem tocar em nada. Imediatamente descobre que tem **1 ciclo** e
três comandos que gostaria de automatizar — e a decisão central do jogo nasce aqui.

### Ato III — O Kernel
**Gatilho:** forjar um comando de tier 4. **Revela:** permissões.

O muro. `xargs`, `join` e `cut` passam a exigir permissão, que é emitida lentamente e tem
**teto** — o Departamento para no nível 6, a 47 s por permissão, ou 1.819 por dia no máximo
absoluto. O `kernel` sozinho exige 12.000. Não existe upgrade que resolva; só a **assinatura
digital**, que muda a regra: permissão deixa de ser gasta e passa a ser um saldo mínimo
exigido. É a diferença entre pagar 24.000 acumulados e ter 12.000 no bolso.

Esse é o *muro de paradigma* do ATM traduzido: você não escala o gerador, você troca de
sistema.

### Ato IV — A Rede
**Gatilho:** forjar um comando de tier 6. **Revela:** nós remotos.

Segunda dimensão de decisão. Os mesmos daemons, alocados em máquinas com regras diferentes.
O nó frio troca produção por permissão — resposta direta ao muro do Ato III, mas com um
custo que dói.

### Ato V — A Recompilação
**Gatilho:** forjar um comando de tier 8. **Revela:** fragmentos e arquiteturas.

O jogo mostra que dá para recomeçar melhor. Não obriga: `kernel` é alcançável na primeira
run. Mas a partir daqui existe a pergunta "vale a pena zerar agora?", e ela tem resposta
diferente conforme o quanto você já acumulou.

## Curva medida

Do simulador, 14 dias, perfis diferentes:

| Perfil | Tempo de tela | Ato alcançado | Tier | Comandos | Fragmentos |
|---|---:|:-:|:-:|:-:|:-:|
| dedicado — 6×20 min/dia | 28,0 h | 5 | 10 | 25/25 | 7 |
| médio — 4×15 min/dia | 14,0 h | 5 | 10 | 25/25 | 6 |
| casual — 2×8 min/dia | 3,7 h | 5 | 10 | 25/25 | 5 |
| ausente — 1×3 min/dia | 0,7 h | 5 | 8 | 21/25 | 0 |

Marcos do jogador médio: Ato II aos 4 min · Ato III às 12 h · Ato IV em 1,5 dia ·
Ato V em 4 dias · `kernel` no dia 10.

**Leitura honesta destes números:** o jogo perdoa quem some — o casual chega ao fim, só
com menos fragmentos. Isso é uma escolha (não punir quem tem vida), mas está no limite: se
o teste com jogadores reais mostrar que jogar não parece valer a pena, a alavanca a mexer é
`MARCO_OFFLINE`, hoje em 0,25.

## O painel PRÓXIMO PASSO

Sempre visível, topo da tela, nunca vazio. Mostra **um** objetivo — o mais próximo de ser
concluído — com a barra e os números:

```
PRÓXIMO PASSO
forjar grep  ·  falta executar awk 653 vezes
awk   847 / 1.500   ████████░░░░░░░░  56%
```

Quando o objetivo mais próximo for uma melhoria ou um ciclo em vez de um comando, o painel
mostra isso. **Nunca existe o estado "não sei o que fazer".** Esta é a tradução direta do
questbook do ATM, e é o item que mais diretamente ataca o "não entendi nada".
