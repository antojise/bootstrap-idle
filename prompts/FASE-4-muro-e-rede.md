# FASE 4 — Atos III e IV: o muro e a rede

```
Continuando o BOOTSTRAP. O loop de automação está completo (fase 3).
Leia CLAUDE.md, GDD/02-ECONOMIA.md e GDD/03-PROGRESSAO.md.

Esta fase entrega o meio-jogo: o muro de permissões e a segunda dimensão de decisão.

## ATO III — O Kernel

Dispara ao forjar um comando de tier 4. Revela o recurso PERMISSÕES.

1. Emissão passiva de permissões, com nível do Departamento e a curva de GDD/02.
   O nível PARA no 6 — 47s por permissão, 1.819 por dia no máximo absoluto.

2. Os nós de tier ≥5 da árvore passam a exibir o requisito de permissão. Como a árvore
   sempre mostrou tudo, o jogador já viu esse número antes; agora ele passa a contar.

3. A melhoria ASSINATURA DIGITAL muda a REGRA, não o número: permissões deixam de ser
   gastas e passam a ser um saldo mínimo exigido. Antes: pagar 24.000 acumulados. Depois:
   ter 12.000 no bolso. Deixe isso explícito na descrição da melhoria.

4. O log narra o muro quando ele morde. Quando o jogador ficar bloqueado só por falta de
   permissão por mais de ~20 minutos, uma linha no log reconhece isso — sem dar a solução:
   "o kernel não responde. ele emite no ritmo dele."

## ATO IV — A Rede

Dispara ao forjar um comando de tier 6. Revela os NÓS.

5. Seção REDE dentro da aba SISTEMA. Quatro nós com regras próprias (GDD/02-ECONOMIA.md):
   local (estável), espelho (+120% mas perde ticks), frio (−45% mas +50% de permissão),
   orbital (+300% mas marcos 2,5× mais lentos).

6. O nó atual afeta produção, marcos e emissão de permissão. A escolha do nó frio no meio
   do muro do Ato III deve ser uma decisão real e dolorosa — verifique que ela é viável e
   que a UI deixa a troca óbvia.

7. Quando o espelho perde um tick por dessincronia, isso é VISÍVEL: um flash vermelho
   curto no card e uma linha no log. Um custo invisível não é um custo, é um bug.

## Critérios de aceite

- Rodar `node tools/sim.js`: o Ato III cai no dia 1 e o Ato IV por volta do dia 1,5.
- O muro é real: em algum ponto o jogador tem bytes sobrando e não pode forjar por falta
  de permissão. Confirme isso jogando com o save adiantado.
- Comprar a assinatura digital destrava visivelmente, mas NÃO trivializa — o kernel ainda
  exige 12.000 de saldo. Se ela resolver o jogo em minutos, o balanceamento regrediu para
  o bug documentado em GDD/09-BALANCEAMENTO.md.
- Trocar de nó muda a produção na hora e o efeito é legível na tela.
- Fragmentos e conquistas ainda não existem.
```
