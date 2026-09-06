# Prestígio — A Recompilação

## O que é

No Ato V o jogo revela que dá para se desmontar e voltar melhor. Zera bytes, comandos,
ciclos comprados, permissões, melhorias e nós. **Atravessam o reset:** fragmentos,
conquistas, e o conhecimento do jogador — que é o que mais importa.

## Fragmentos

```
fragmentos = floor( (bytes produzidos na run / 5×10¹¹) ^ 0,42 )
```

Cada fragmento dá **+5% de produção**, permanente e cumulativo.

O expoente `0,42` é o que impede a espiral: dobrar os bytes de uma run rende só ~34% mais
fragmentos. Sem ele, a segunda run trivializaria o jogo inteiro — foi exatamente o que
aconteceu no pré-alpha, onde uma run rendia 289 fragmentos.

Rendimento medido no simulador, 14 dias: **7 fragmentos** (dedicado) · **6** (médio) ·
**5** (casual) · **0** (ausente). Uma primeira recompilação bem jogada dá `×1,30`.

## Quando recompilar

O jogo **não** empurra. `kernel` é alcançável na primeira run, e chegar lá é um final
legítimo. O painel de recompilação mostra a conta honesta:

```
RECOMPILAR
esta run rendeu           6 fragmentos
você tem                 +2 fragmentos
depois da recompilação   8 fragmentos  ·  ×1,40 de produção

você perde: 21 comandos, 4 ciclos, 12.400 permissões, 3 nós
você mantém: fragmentos, conquistas, e saber onde pisar
```

## Arquiteturas

Aqui está a diferença entre um prestígio que é planilha e um que é jogo: a arquitetura muda
as **regras**, não só o multiplicador. Você escolhe uma ao recompilar.

| Arquitetura | Destrava | Produção | Regra | Quando escolher |
|---|:-:|:-:|---|---|
| **Arquitetura Limpa** | início | ×1 | Sem truques e sem penalidade. Tudo funciona como você já conhece. | *Primeira recompilação, ou quando você quer só sentir os fragmentos.* |
| **Arquitetura Paralela** | 1ª recomp. | ×2.4 | +140% de produção. A cada minuto, 5% de chance de um daemon travar por 12s. | *Você está presente, olhando a tela, e pode destravar na hora.* |
| **Arquitetura Parasita** | 1ª recomp. | ×0.5 | −50% de produção. Permissões rendem 4x e as 5 primeiras forjas não custam bytes. | *A run passada travou na permissão. Esta run passa direto pelo muro.* |
| **Arquitetura Fria** | 2ª recomp. | ×0.8 | −20% de produção, mas offline sempre 100% e daemons 30% mais rápidos. | *Você vai jogar em sessões curtas e deixar rodando o resto do dia.* |
| **Arquitetura Recursiva** | 4ª recomp. | ×1 | Produção normal, mas esta run rende +60% de fragmentos no fim. | *Run de investimento: você não quer avançar, quer capitalizar.* |

A **Parasita** é a mais importante do conjunto: ela existe para quem travou no muro de
permissão do Ato III. Produz metade, mas as permissões rendem 4× — a run seguinte atravessa
o muro que travou a anterior. É o prestígio funcionando como **resposta a um problema
concreto que o jogador viveu**, não como número maior.

A **Recursiva** é a run de investimento: não te leva mais longe, capitaliza. Só destrava na
4ª recompilação, quando o jogador já entende o ciclo bem o suficiente para querer otimizá-lo.

## O que o jogo diz

O texto do Ato V, no log, quando ele abre:

```
$ ────────────────────────────────
  você já sabe o suficiente para se reconstruir melhor.
  mas precisa se desmontar antes.
```

E depois de recompilar, na primeira execução da run nova:

```
$ echo
  1 byte. de novo.
  mas agora você sabe onde pisa.
```
