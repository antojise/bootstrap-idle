# FASE 1 — Fundação

```
Você vai construir a fundação do BOOTSTRAP, um jogo idle de terminal para Android (PWA).
Leia CLAUDE.md e GDD/00-VISAO.md, GDD/08-ARQUITETURA.md e GDD/09-BALANCEAMENTO.md antes
de escrever qualquer código.

Esta fase NÃO entrega nada jogável. Ela entrega a engine pura, os dados e os testes — e
isso é intencional: é o que permite descobrir erros de economia antes de existir uma tela.

## O que construir

1. Estrutura de pastas exatamente como em GDD/08-ARQUITETURA.md.

2. src/data/ — quebre o data.js e o achievements.js da raiz nos módulos ES:
   commands.js, acts.js, upgrades.js, prestige.js, achievements.js.
   Os NÚMEROS não mudam. Só a organização. Exporte com `export const`.

3. src/engine/ — a engine pura. Regra absoluta: nenhum arquivo aqui pode importar de ui/,
   nem referenciar document, window, localStorage ou Date.now(). O tempo entra como
   parâmetro.
   - state.js    novoEstado(), novaRun(), validarEstado()
   - economy.js  producaoPorExecucao(), producaoPassiva(), multiplicadorTotal(), custos
   - forge.js    requisitosDe(cmd, state) → [{tipo, atual, alvo, ok}], podeForjar(), forjar()
   - daemons.js  ciclosTotais(), ciclosUsados(), alocar(), desalocar(), gargalos()
   - acts.js     atoAtual(state), avaliarGatilhos(state)
   - achievements.js  avaliar(state) → ids recém-obtidas
   - prestige.js fragmentosDaRun(), recompilar(state, arquitetura)
   - offline.js  aplicarAusencia(state, segundos)
   - tick.js     tick(state, dt) — muta o estado e devolve eventos

4. tools/validate.js — as 8 regras de invariância de GDD/09-BALANCEAMENTO.md.
   Saída legível, exit code 1 se qualquer uma falhar.

5. tools/sim.js — simulador de tempo real com o app fechado entre sessões. Quatro perfis
   (6×20min, 4×15min, 2×8min, 1×3min por dia), 14 dias. Imprime a linha do tempo dos atos
   e das forjas, e a tabela comparativa dos perfis.

6. tools/gen-docs.js — regera as tabelas de GDD/02, 03, 04, 05 e 06 a partir de src/data/.

7. test/engine.test.js — node:test, cobrindo:
   - produção bate com a fórmula de GDD/02-ECONOMIA.md e os multiplicadores compõem na
     ordem certa
   - forjar com requisito faltando é recusado; com requisito completo debita bytes e
     permissões corretamente
   - nunca é possível alocar mais daemons que ciclos; déficit de ciclos PAUSA daemons e
     nunca bloqueia forja (isso foi um beco sem saída numa versão anterior)
   - recompilar zera state.run e preserva state.meta integralmente
   - offline respeita o teto de 12h e conta marcos a 25%
   - avaliação de ato dispara no gatilho certo e nunca retrocede

8. Versionamento. Crie .gitignore (node_modules, .DS_Store, .vercel), inicialize o
   repositório e faça o primeiro commit. Se o gh CLI estiver disponível e autenticado,
   crie o repositório remoto público `bootstrap-idle` e faça push. Se não estiver, deixe
   o commit local pronto e me diga exatamente o comando que falta rodar.

## Critérios de aceite

- `node tools/validate.js` passa e imprime as 8 regras verificadas
- `node tools/sim.js` roda e os marcos de ritmo batem com a tabela de
  GDD/09-BALANCEAMENTO.md (Ato II < 6min, Ato III no dia 1, kernel dia 9–14)
- `node --test test/engine.test.js` passa
- `grep -rE "document|window|localStorage|Date\.now" src/engine/` não retorna nada
- Nenhum número aparece duplicado entre src/data/ e src/engine/
- `git log` mostra o commit inicial

Não escreva nenhuma linha de UI nesta fase. Nem index.html.
```
