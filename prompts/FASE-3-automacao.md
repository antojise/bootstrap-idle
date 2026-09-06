# FASE 3 — Ato II: automação

```
Continuando o BOOTSTRAP. O Ato I está jogável (fase 2).
Leia CLAUDE.md, GDD/02-ECONOMIA.md e GDD/03-PROGRESSAO.md.

Esta fase entrega o loop completo do jogo: automação, escassez de ciclos e retorno offline.
É a fase mais importante do projeto — é aqui que o jogo passa a ser um jogo.

## O que construir

1. Transição de Ato. Ao forjar o 3º comando, dispara o Ato II:
   - a tela escurece por 400ms
   - o texto do ato é datilografado no log ("a máquina lembra como repetir sozinha")
   - a aba SISTEMA entra deslizando, com um marcador de novidade
   Faça um mecanismo GENÉRICO de transição de ato — os atos III, IV e V usam o mesmo.

2. src/ui/system.js — a aba SISTEMA, com duas seções nesta fase:
   - DAEMONS: grade dos comandos forjados; tocar aloca/desaloca; contador `2/3 ciclos`
     no topo; um comando que está travando um marco ganha o marcador `⟐ gargalo`.
     Esse marcador é o que ensina a decisão central do jogo sem explicá-la em texto.
   - CICLOS E MELHORIAS: comprar ciclo, acelerar daemons, e as melhorias do Ato I e II.
     Cada melhoria mostra a dor que responde (o campo `resolve` dos dados).

3. Produção passiva no loop, e o modal de retorno offline: tempo fora, bytes ganhos com
   o número correndo do zero, e o motivo quando o ganho for zero ("nenhum daemon alocado").
   Teto de 12h. Bytes a 30% (100% com daemon persistente), marcos a 25%.

4. Feedback visual mínimo desta fase (a fase 6 faz o resto):
   - o contador de bytes CONTA até o valor novo em ~250ms, nunca salta
   - o card de um daemon dá um flash de 120ms quando ele executa
   - tentar alocar sem ciclo livre: shake horizontal no contador de ciclos

## Regra que não se quebra

O teto de ciclos é 7 (1 base + 4 comprados + 2 de comandos). Se o ritmo parecer ruim,
NÃO aumente esse teto — a escassez é a única decisão interessante e permanente do jogo.
Mexa em velocidade de daemon ou em custos.

## Critérios de aceite

- Jogando do zero: Ato II chega em menos de 6 minutos e a primeira alocação de daemon
  produz bytes visivelmente sem tocar na tela.
- Com 1 ciclo e 3 comandos forjados, o jogo deixa claro que só um pode rodar.
- O marcador `⟐ gargalo` aparece no comando cujo marco está travando a próxima forja.
- Fechar o app por 10 minutos e voltar mostra o modal com o ganho correto (30% dos bytes).
- Nada de permissões, rede, fragmentos ou conquistas na tela.
- Testes de engine e validate continuam passando.
```
