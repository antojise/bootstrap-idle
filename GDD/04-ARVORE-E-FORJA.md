# Árvore de comandos e a Forja

## Como um comando é forjado

Três requisitos, todos visíveis desde o primeiro minuto do jogo:

1. **Marco de execução** — o comando-pai precisa ter sido executado N vezes. É um contador de
   vida inteira (não é consumo: nada é gasto). Execuções manuais e de daemon contam igual;
   offline conta 25%.
2. **Bytes** — pagos na forja.
3. **Permissões** — só a partir do tier 5.

O marco é o gargalo dominante. Bytes financiam infraestrutura; o marco é o que custa tempo e
o que obriga a escolher onde os 7 ciclos vão.

## O nó na tela

```
┌─────────────────────────────────────────────┐
│  grep                          tier 4       │
│  acha agulha em petabyte                    │
│                                             │
│  ⟐ executar awk 1.500×                      │
│    847 / 1.500  ████████░░░░░░░░  56%       │
│  ⟐ 900k bytes                               │
│    412k / 900k  ██████░░░░░░░░░░  46%       │
│                                             │
│  rende 650 B por execução                   │
│  abre: xargs                                │
│                          [ FORJAR ]         │
└─────────────────────────────────────────────┘
```

Nada aqui é `???`. O jogador vê o que falta, quanto falta e o que ganha.

## Tabela completa

| Ato | Tier | Comando | B/exec | Marco exigido | Bytes | Permissões | Efeito passivo |
|:---:|:----:|---------|-------:|---------------|------:|-----------:|----------------|
| 1 | 0 | **`echo`** | 1 | — | — | — | — |
| 1 | 1 | **`cat`** | 4 | `echo` ×120 | 300 | — | — |
| 1 | 1 | **`printf`** | 7 | `echo` ×300 | 900 | — | — |
| 2 | 2 | **`tee`** | 20 | `cat` ×500 | 6.00k | — | — |
| 2 | 2 | **`sed`** | 32 | `printf` ×500 | 9.00k | — | — |
| 2 | 2 | **`wc`** | 45 | `cat` ×600<br>`printf` ×300 | 15.0k | — | +1 ciclo |
| 2 | 3 | **`split`** | 110 | `tee` ×900 | 60.0k | — | — |
| 2 | 3 | **`awk`** | 180 | `sed` ×900 | 90.0k | — | — |
| 2 | 3 | **`sort`** | 260 | `wc` ×800 | 150k | — | — |
| 3 | 4 | **`grep`** | 650 | `awk` ×1.500 | 900k | — | — |
| 3 | 4 | **`uniq`** | 900 | `sort` ×1.500 | 1.50M | — | +10% produção global |
| 3 | 4 | **`tr`** | 1.30k | `split` ×1.800 | 2.50M | — | +12% produção global |
| 3 | 5 | **`xargs`** | 3.20k | `grep` ×2.500 | 9.00M | 25 | — |
| 3 | 5 | **`join`** | 4.50k | `uniq` ×2.500 | 15.0M | 30 | — |
| 3 | 5 | **`cut`** | 6.00k | `tr` ×2.800 | 25.0M | 45 | +10% produção global |
| 4 | 6 | **`find`** | 15.0k | `xargs` ×16.000 | 120M | 90 | — |
| 4 | 6 | **`diff`** | 21.0k | `join` ×16.000 | 200M | 120 | — |
| 4 | 6 | **`paste`** | 28.0k | `cut` ×18.000 | 320M | 150 | +1 ciclo |
| 4 | 7 | **`make`** | 70.0k | `find` ×28.000 | 1.50G | 350 | — |
| 4 | 7 | **`patch`** | 95.0k | `diff` ×28.000 | 2.50G | 450 | +15% produção global |
| 5 | 8 | **`gcc`** | 300k | `make` ×50.000 | 15.0G | 1100 | — |
| 5 | 8 | **`git`** | 420k | `patch` ×50.000 | 25.0G | 1400 | — |
| 5 | 9 | **`ld`** | 1.40M | `gcc` ×90.000 | 150G | 3500 | — |
| 5 | 9 | **`rsync`** | 1.90M | `git` ×90.000 | 240G | 4500 | +25% produção global |
| 5 | 10 | **`kernel`** | 8.00M | `ld` ×160.000<br>`rsync` ×160.000 | 2.00T | 12000 | — |

## Topologia

A árvore tem **três ramos paralelos** que nascem no Ato II e só se fundem no `kernel`:

```
                    echo
                   ╱     ╲
                cat       printf
               ╱   ╲     ╱      ╲
            tee     wc          sed
             │       │           │
           split    sort        awk
             │       │           │
            tr      uniq        grep
             │       │           │
            cut     join        xargs
             │       │           │
          paste     diff        find
                     │           │
                   patch       make
                     │           │
                    git         gcc
                     │           │
                  rsync         ld
                      ╲         ╱
                       ╲       ╱
                        kernel
```

Três ramos e **sete ciclos** é a tensão central: você nunca consegue farmar os três ao mesmo
tempo com folga. O ramo do meio (`wc → sort → uniq → join → diff → patch → git → rsync`) é o
mais longo e concentra os bônus globais — quem o prioriza ganha produção; quem prioriza os
laterais chega mais cedo aos ciclos extras.

`paste` é a única folha do jogo (não abre nada), e existe por causa do `+1 ciclo`. Um comando
que não leva a lugar nenhum e não tem efeito passivo não deve existir — o validador em
`sim.js` reprova isso automaticamente.

## Regras estruturais (validadas por código)

`node sim.js` roda estas checagens antes de qualquer simulação, e falha ruidosamente:

- Todo comando é alcançável a partir de `echo`
- Nenhum comando exige um pai de tier igual ou maior (sem ciclos no grafo)
- Nenhum comando exige um pai que só aparece num Ato posterior
- Nenhum comando rende menos que seu pai (forjar nunca é downgrade)
- Todo comando de tier ≥ 5 custa permissão; nenhum de tier < 5 custa
- Nenhuma folha sem efeito passivo

Estas regras existem porque a v1 tinha um bug que só a validação de grafo pegaria: duas
receitas mapeadas para a mesma chave tornavam metade da árvore inalcançável, e isso não
aparece jogando.
