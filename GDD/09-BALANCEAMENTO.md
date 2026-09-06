# Balanceamento e verificação

## Como se balanceia este jogo

Não se balanceia jogando. Um idle leva dias por run; testar uma mudança de número jogando é
inviável. Balanceia-se com **um simulador que roda contra os mesmos dados do jogo**.

```
node tools/validate.js     # regras estruturais — falha ruidosamente
node tools/sim.js          # 14 dias de jogo em segundos, 4 perfis
```

O simulador modela tempo **real**, com o app fechado entre sessões, porque é assim que se
joga. Um simulador de sessão contínua mente sobre a curva.

## O que o simulador já pegou

Registro honesto dos erros que só apareceram por simular — nenhum deles apareceria jogando
em tempo hábil:

| Achado | Consequência se não fosse pego |
|---|---|
| `awk + sed` mapeado para dois resultados diferentes (v1) | Metade da árvore inalcançável. O jogo teria um teto invisível. |
| Assinatura digital resolvia o jogo em 90 segundos | 10,6 bilhões de bytes e 26 comandos num minuto e meio. |
| Déficit de ciclos travava a autorização para sempre | Beco sem saída permanente, save perdido. |
| Prestígio rendia 289 fragmentos numa run | Segunda run trivializava o jogo inteiro. |
| **17 ciclos para 25 comandos** | Nunca haveria escolha de alocação — a decisão central do jogo não existiria. |
| Marcos deixavam de ser gargalo depois do Ato III | Bytes e permissões dominavam, e ambos rendem offline: jogar não mudava nada. |

## Alvos de ritmo

| Marco | Alvo | Medido (perfil médio) |
|---|---|---|
| Primeiro alívio (`↑ histórico`) | < 40 s | ~25 s |
| Primeiro comando forjado | < 3 min | ~2 min |
| Ato II (automação) | < 6 min | ~4 min |
| Ato III (o muro) | dia 1 | ~12 h |
| Ato IV (rede) | dia 2 | ~1,5 dia |
| Ato V (prestígio) | dia 4–6 | ~4 dias |
| `kernel` | dia 9–14 | dia 10 |

## Limite conhecido do simulador

O bot toma decisões **ótimas e instantâneas** no primeiro segundo de cada sessão. Um jogador
real leva tempo para perceber que um marco virou gargalo e realocar. Por isso o simulador
mostra o perfil casual (3,7 h de tela) chegando quase no mesmo lugar do dedicado (28 h) —
ele não modela a diferença que realmente separa os dois, que é **velocidade de percepção**,
não throughput.

Consequência prática: **os números de ritmo acima são um piso, não uma previsão.** Um jogador
real será mais lento que o bot em todos os perfis. Essa diferença só se mede com gente real
jogando, e é a primeira coisa a validar depois do lançamento.

Se o teste mostrar que jogar ativamente não parece valer a pena, a alavanca é
`MARCO_OFFLINE` (hoje `0,25`). Se mostrar que o meio-jogo arrasta, a alavanca é
`permTempo` / `PERM_NIVEL_MAX`. Mexer em `y` dos comandos é o último recurso — muda tudo de
uma vez e é difícil de raciocinar.

## Regras de invariância

O `validate.js` roda antes de qualquer simulação e falha ruidosamente. As regras:

1. Todo comando é alcançável a partir de `echo`
2. Nenhum comando exige pai de tier ≥ ao seu (sem ciclo no grafo)
3. Nenhum comando exige pai de um Ato posterior ao seu
4. Nenhum comando rende menos que qualquer um dos seus pais
5. Todo comando de tier ≥ 5 custa permissão; nenhum abaixo disso custa
6. Nenhuma folha sem efeito passivo
7. O total de ciclos obteníveis é ≤ 8 (a escassez é o design; inflar é quebrar)
8. Nenhuma conquista destranca conteúdo — só acelera

## Quando mudar um número

1. Mude em `src/data/`
2. `node tools/validate.js` — precisa passar
3. `node tools/sim.js` — compare a tabela de ritmo com os alvos acima
4. `node tools/gen-docs.js` — regera as tabelas do GDD

Os documentos deste GDD com tabelas são **gerados**. Editar uma tabela à mão faz o documento
mentir sobre o código, que é pior do que não ter documento.
