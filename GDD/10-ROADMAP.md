# Roadmap de construção

Sete fases. Cada uma tem um prompt correspondente em `prompts/`, e cada uma termina com algo
**jogável** — nunca com "metade do sistema pronto".

| Fase | Entrega | Jogável ao fim? | Prompt |
|:-:|---|---|---|
| 1 | Fundação: estrutura, dados, engine pura, testes de engine | não (só testes) | `FASE-1` |
| 2 | Ato I completo: terminal, botão, árvore, forja, save + **primeiro deploy** | **sim** — os 4 primeiros minutos | `FASE-2` |
| 3 | Ato II: ciclos, daemons, melhorias, offline | **sim** — o loop inteiro | `FASE-3` |
| 4 | Atos III e IV: permissões, o muro, a rede | **sim** — o meio-jogo | `FASE-4` |
| 5 | Ato V: recompilação, fragmentos, arquiteturas | **sim** — jogo completo | `FASE-5` |
| 6 | Conquistas e feedback visual | **sim** — jogo com juice | `FASE-6` |
| 7 | PWA, polimento, acessibilidade, publicação | **sim** — lançável | `FASE-7` |

## Por que nesta ordem

A fase 1 não entrega nada jogável e isso é intencional: a engine pura com testes é o que
permite simular e descobrir erros de economia antes de existir uma única tela. O pré-alpha
foi construído na ordem inversa (tela primeiro, economia depois) e por isso os erros de
balanceamento só apareceram quando já havia UI para refazer.

Da fase 2 em diante, toda fase termina com o jogo abrindo e funcionando. Se uma fase quebrar
o jogo, ela não está pronta.

## Definição de pronto (vale para todas as fases)

- `node tools/validate.js` passa
- `node --test test/engine.test.js` passa
- O jogo abre no navegador sem erro de console
- A fase não introduziu nenhum elemento de UI de um Ato que ainda não chegou
- `node tools/gen-docs.js` rodado se algum dado mudou

## Depois do lançamento

Nesta ordem de prioridade:

1. **Telemetria local** — em que Ato o jogador para, quanto tempo entre sessões, qual marco
   trava. Sem isso, o balanceamento pós-lançamento é chute. Local, no próprio save, visível
   numa tela de estatísticas — sem servidor e sem coleta.
2. **Validar a curva com gente real** — o limite conhecido do simulador (documento 09).
3. **APK** via GitHub Actions embrulhando o mesmo PWA num WebView.
4. **Ato VI** — se e somente se os jogadores chegarem ao fim e pedirem mais. Não construir
   conteúdo para um problema que ninguém teve.
