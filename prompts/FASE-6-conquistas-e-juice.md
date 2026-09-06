# FASE 6 — Conquistas e feedback

```
Continuando o BOOTSTRAP. O jogo está completo do Ato I ao V (fase 5).
Leia CLAUDE.md, GDD/06-CONQUISTAS.md e a seção "Feedback" de GDD/07-UX-ONBOARDING.md.

Esta fase não adiciona sistema novo. Ela faz o jogo PARECER vivo — e é a resposta direta
à crítica de que a versão anterior mudava números sem que nada acontecesse na tela.

## Conquistas

1. As 55 conquistas de src/data/achievements.js, avaliadas a cada tick pela engine
   (a função já existe desde a fase 1). Elas são permanentes entre recompilações.

2. O estado precisa expor os campos de `stats` listados em GDD/06-CONQUISTAS.md.
   Isole-os em state.stats — não espalhe pelo estado principal.

3. Aba PERFIL → CONQUISTAS: obtidas com data, pendentes com a condição. Toda conquista
   com progresso mensurável mostra a BARRA (`847 B/s → 1.000 B/s · 85%`). Isso transforma
   surpresa em objetivo. As 6 ocultas aparecem só como contagem: "6 ocultas restantes".

4. Toast no rodapé, 2,5s, sem modal, sem pausar. O jogo nunca interrompe para comemorar.

## Feedback visual

Implemente a tabela inteira de GDD/07-UX-ONBOARDING.md. Os itens que mais importam:

- partícula do botão até o contador a cada execução manual
- contador de bytes que CONTA até o valor novo, nunca salta
- nó forjado: flash branco e uma linha correndo do pai até ele em 600ms
- transição de ato: escurecer 400ms + texto datilografado + aba nova deslizando
- barra de marco com tick sutil a cada 25%
- glitch raro no log (a cada ~90s, uma linha tremula por 80ms)

Regras: nada acima de 600ms; nada bloqueia input; tudo respeita prefers-reduced-motion
(com ele, só o contador que corre permanece — sem partícula, sem shake, sem glitch).

## Som (opcional, mas desejável)

Sons curtos e discretos, gerados por WebAudio (sem arquivos): um clique seco na execução,
um tom ascendente na forja, um acorde curto na transição de ato. Desligado por padrão,
com um botão na aba PERFIL. Um idle que toca som sem o jogador pedir é desinstalado.

## Critérios de aceite

- Jogar 5 minutos e conseguir ao menos 6 conquistas, todas com toast e sem interrupção
- Nenhuma conquista destranca conteúdo — só acelera
- O total de ciclos vindo de conquista é exatamente 1
- Com prefers-reduced-motion ativo o jogo continua legível e nada pisca
- Performance: 60fps num Android médio com 7 daemons rodando. Se cair, o problema é
  repintura, não cálculo — verifique as impressões digitais das seções.
```
