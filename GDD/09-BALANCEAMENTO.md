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
| **Permissão não era emitida com o app fechado** | Do dia 3 ao 14 o único bloqueio era `perm`, em todos os perfis. Ninguém chegava ao Ato V. O Ato III virava sala de espera com a tela ligada. |

## Alvos de ritmo

Os alvos são **bandas, não pontos**. Chegar cedo demais reprova igual a chegar tarde: um Ato
que abre antes de o jogador sentir a dor que ele resolve não é alívio, é ruído.

O veredito sai de **um** perfil, o `Regular` (1 h/dia). Cobrar a mesma data de quem joga 2 h
por dia e de quem joga 3 min não é alvo, é fantasia — o de 2 h tem que ir na frente mesmo.
Os outros três perfis são diagnóstico: mostram a forma da curva, não aprovam nada.

| Marco | Banda | `Regular` | `Ativo` | `Raro` | `Casual` |
|---|---|---|---|---|---|
| Ato II (automação) | < 6 min | 2,5 min | 2,5 min | 2,5 min | 2,5 min |
| Ato III (o muro) | até dia 1 | 30 min | 20 min | dia 1,0 | dia 3 |
| Ato IV (rede) | até dia 2 | dia 1,0 | 1,3 h | dia 2,0 | dia 6 |
| Ato V (prestígio) | dia 4–6 | dia 4,0 | dia 3,1 | dia 5,0 | dia 12 |
| `kernel` | dia 9–14 | dia 12,0 | dia 11,1 | dia 13,0 | não chega |

`Ativo` abre o Ato V um dia antes da banda e `Casual` (42 min de tela em 14 dias) fica para
trás em tudo. As duas coisas são a curva funcionando, não defeito.

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
`MARCO_OFFLINE` (hoje `0,25`). Se mostrar que o meio-jogo arrasta **ou corre**, a alavanca é
`OFFLINE_PERM` (hoje `0,65`), depois `permTempo` / `PERM_NIVEL_MAX`. Mexer em `y` dos
comandos é o último recurso — muda tudo de uma vez e é difícil de raciocinar.

`OFFLINE_PERM` move Ato IV, Ato V e `kernel` juntos e é a alavanca mais sensível do jogo: a
`1,00` o Ato V abre no dia 2, a `0,35` o `kernel` não é alcançado em 14 dias por ninguém.

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
