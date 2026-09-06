# FASE 5 — Ato V: a recompilação

```
Continuando o BOOTSTRAP. O meio-jogo está pronto (fase 4).
Leia CLAUDE.md e GDD/05-PRESTIGIO.md.

Esta fase fecha o jogo: ele passa a ter fim e a ter motivo para recomeçar.

## O que construir

1. Ato V dispara ao forjar um comando de tier 8. Revela fragmentos e a recompilação,
   na aba PERFIL.

2. Painel de recompilação com a conta HONESTA, no formato de GDD/05-PRESTIGIO.md:
   o que esta run rende, o que você já tem, o total depois — e, explicitamente, o que
   você perde (comandos, ciclos, permissões, nós). O jogo não vende o prestígio; ele
   mostra a conta e deixa o jogador decidir.

3. Escolha de arquitetura na recompilação. Cinco arquiteturas, cada uma mudando REGRAS:
   Limpa, Paralela (deadlocks reais que travam um daemon por 12s), Parasita (permissões
   4× — a resposta de quem travou no muro), Fria (offline sempre 100%), Recursiva
   (+60% de fragmentos). Cada card mostra o campo `quando` dos dados: em que situação
   aquela arquitetura é a escolha certa.

4. recompilar() já existe na engine desde a fase 1. Garanta que a UI só chama a engine:
   state.run = novaRun(), state.meta preservado. Se algum campo estiver no lado errado,
   o prestígio apaga o que não devia — teste isso.

5. O deadlock da Paralela precisa ser visível e destravável: o daemon travado fica
   vermelho, o log avisa, e tocar nele destrava na hora. É o que faz essa arquitetura
   recompensar quem está com o app aberto.

6. Texto de retorno após recompilar, na primeira execução da run nova:
   "1 byte. de novo. mas agora você sabe onde pisa."

## Critérios de aceite

- Uma run completa até tier 8 rende entre 4 e 8 fragmentos (confira com sim.js).
- Recompilar zera bytes, comandos, ciclos, permissões, melhorias e nós, e preserva
  fragmentos e estatísticas de vida inteira.
- A segunda run é perceptivelmente mais rápida, mas NÃO trivial — se ela terminar em
  minutos, o expoente 0,42 dos fragmentos foi quebrado.
- Escolher a Parasita realmente atravessa o muro de permissão que travou a run anterior.
- O jogo tem um fim: forjar o kernel produz um momento (log, animação) que reconhece isso.
```
