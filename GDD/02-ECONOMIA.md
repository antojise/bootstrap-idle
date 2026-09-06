# Economia

Toda a economia vive em **`data.js`**, que é a única fonte de verdade: o jogo, o simulador de
balanceamento e os testes leem o mesmo arquivo. As tabelas abaixo foram **geradas a partir
dele** — se um número mudar no código, este documento é regerado, nunca editado à mão.

## Os quatro recursos

| Recurso | Símbolo | Aparece no | Papel | Como entra | Como sai |
|---|:-:|:-:|---|---|---|
| **bytes** | `B` | Ato I | moeda de tudo | execução manual + daemons | forjar comandos, ciclos, upgrades, nós |
| **ciclos** | `⟳` | Ato II | capacidade de automação | 1 base, comprados, 2 de comandos | ocupados por daemons (não são gastos) |
| **permissões** | `⚿` | Ato III | gate do meio-jogo | emissão passiva do kernel | forjar comandos de tier ≥ 5 |
| **fragmentos** | `✦` | Ato V | meta-progressão | recompilação | nada — só acumulam (+5% cada) |

Quatro recursos, revelados um por Ato. Nunca há mais de dois números novos na tela ao mesmo
tempo. **Não existe um quinto recurso** — a tentação de adicionar memória, entropia ou calor
é exatamente o erro que tornou o pré-alpha ilegível.

## Bytes

Produção por execução de um comando:

```
bytes = y(comando) × (1 + Σ bônus globais) × fragMult(fragmentos) × cacheMult × multDoNó
```

- `y(comando)` — valor base da tabela de comandos
- bônus globais — de `uniq` (+10%), `cut` (+10%), `tr` (+12%), `patch` (+15%), `rsync` (+25%)
- `fragMult` — `1 + fragmentos × 0,05`
- `cacheMult` — `1,40` com a melhoria **cache**, senão `1,00`
- `multDoNó` — 1,0 no nó local; ver tabela de nós

Execução manual com **| pipe** conta **em dobro** — tanto em bytes quanto em marcos.

## Ciclos, daemons e permissões — as curvas

### Ciclos (capacidade de automação)

| Compra | Custo |
|:-:|---:|
| 1º | 25.0k B |
| 2º | 700k B |
| 3º | 19.6M B |
| 4º | 549M B |

Teto: **1 base + 4 comprados + 2 de comandos (`wc`, `paste`) = 7 ciclos** para 25 comandos.

### Velocidade dos daemons

| Nível | Segundos por execução | Custo |
|:-:|:-:|---:|
| 0 | 3.00s | inicial |
| 1 | 2.64s | 50.0k B |
| 2 | 2.32s | 300k B |
| 3 | 2.04s | 1.80M B |
| 4 | 1.80s | 10.8M B |
| 5 | 1.58s | 64.8M B |
| 6 | 1.39s | 389M B |

### Emissão de permissões (o muro do Ato III)

| Nível do kernel | 1 permissão a cada | Custo do upgrade |
|:-:|:-:|---:|
| 1 | 90s | inicial |
| 2 | 79s | 60.0M B |
| 3 | 70s | 480M B |
| 4 | 61s | 3.84G B |
| 5 | 54s | 30.7G B |
| 6 | 47s | 246G B |

Teto no nível 6: **1819 permissões por dia, no máximo absoluto.** O `kernel` sozinho exige 12.000 — 6.6 dias de emissão ininterrupta. É esse número que faz a assinatura digital ser inevitável.


## Produção offline

| | Bytes | Marcos de execução |
|---|:-:|:-:|
| App aberto | 100% | 100% |
| App fechado | **30%** | **25%** |
| App fechado, com *daemon persistente* | **100%** | 25% |

Teto de **12 horas** acumuladas. Passou disso, o excedente é perdido — o que existe para dar
motivo de voltar, não para punir quem dorme.

A assimetria é deliberada e é o coração do design de retenção: **os bytes você recupera
dormindo; a árvore só anda depressa com você olhando.** Sem isso, o simulador mostrou que o
jogador de 3,7 h de tela chega exatamente no mesmo lugar que o de 28 h — e aí não existe
razão nenhuma para abrir o app.

## Melhorias

Cada melhoria existe para responder a uma dor específica que o jogador **já sentiu**. Ela é
oferecida logo depois de a dor aparecer, nunca antes — uma melhoria que resolve um problema
que o jogador ainda não teve é ruído na tela.

| Melhoria | Ato | Bytes | ⚿ | O que faz | A dor que ela responde |
|---|:-:|---:|--:|---|---|
| **↑ histórico** | 1 | 60 | — | Segure EXECUTAR para repetir sem levantar o dedo. | *Cansa tocar uma vez por byte.* |
| **alias** | 1 | 1.20k | — | Quatro atalhos fixos na barra de execução. | *Trocar de comando toda hora atrapalha.* |
| **| pipe** | 2 | 9.00k | — | Cada execução manual conta em dobro — bytes e marcos. | *O clique manual ficou irrelevante perto dos daemons.* |
| **execução em lote** | 2 | 3.00M | — | Daemons executam 2 vezes por tick em vez de 1. | *Os marcos de 300 execuções demoram demais.* |
| **cache** | 3 | 80.0M | 60 | +40% de bytes por execução, em tudo. | *Os custos cresceram mais rápido que a produção.* |
| **assinatura digital** | 3 | 3.00G | 800 | Permissões deixam de ser gastas: viram um saldo mínimo exigido. | *A fila de permissões travou o jogo inteiro.* |
| **daemon persistente** | 4 | 30.0G | 1500 | Produção offline vai de 30% para 100%. | *Fechar o app custa caro demais.* |
| **compilação JIT** | 4 | 400G | 5000 | Daemons ganham +1 execução por tick a cada 8 comandos forjados (máx +3). | *Ter muitos comandos não estava valendo nada por si só.* |

## Nós da rede (Ato IV)

A segunda dimensão de decisão. Cada daemon é alocado a um nó, e os nós têm regras
diferentes — não são só multiplicadores.

| Nó | Custo | Produção | Regra própria | Quando compensa |
|---|---:|:-:|---|---|
| **nó local** | — | ×1 | nenhuma | — |
| **espelho** | 5.00G | ×2.2 | 8% de perder o tick por minuto | — |
| **nó frio** | 12.0G | ×0.55 | permissões +50% mais rápido | — |
| **nó orbital** | 300G | ×4 | marcos contam 2.5× mais devagar | — |

O **nó frio** é o mais interessante: produz menos, mas gera permissão mais rápido. No meio
do muro do Ato III, trocar produção por permissão é uma escolha real e dolorosa.

## Sinks de bytes

Os bytes precisam ter para onde ir, ou viram um número decorativo. Em ordem de peso:

1. **Ciclos** — 25k, 700k, 20M, 550M. Quatro compras, escalando ×28. É o maior sink do jogo.
2. **Velocidade dos daemons** — 6 níveis, escalando ×6.
3. **Nível do kernel** — 5 upgrades, escalando ×8, e com teto.
4. **Nós da rede** — 5G, 12G, 300G.
5. **Forjar comandos** — o menor sink. Bytes quase nunca são o que trava uma forja; o marco é.

Essa ordem é intencional: **o jogador gasta bytes em infraestrutura, e gasta tempo em
progressão.** Se forjar fosse o maior sink, o jogo viraria "espere acumular", que é a
definição de tédio.
