# Referências destrinchadas

## Parte 1 — O que faz um idle funcionar

Pesquisa em fontes de design de incrementais mais análise das obras. Sete mecanismos:

### 1. O loop de três tempos
Ação → recurso → capacidade de agir mais. Simples assim, e tudo o mais é camada em cima.
O erro comum é adicionar camadas antes que o jogador tenha sentido o loop base funcionar.

### 2. Revelação progressiva (a lição do Universal Paperclips)
O Paperclips começa com **um botão**: "Make Paperclip". Nada mais na tela. Preço aparece
depois. Autoclickers depois. Pesquisa depois. Cada sistema surge quando o anterior já é
natural, e **a interface se transforma junto**: no fim há contadores de drones, exploração
espacial e combate galáctico onde antes havia um botão.

Duas consequências práticas:
- O jogo ensina **por consequência**, não por tutorial. Você aprende o mercado mexendo no
  preço e vendo o que acontece.
- A escala da UI *é* a narrativa. Ver a tela ficar complexa é sentir que você cresceu.

### 3. A primeira sessão é onde se perde mais gente
"Mais jogadores abandonam nos minutos iniciais do que em qualquer outro ponto." Portanto:
competência em segundos, não em minutos. O primeiro toque tem que produzir algo. A primeira
decisão real deve chegar em menos de dois minutos.

### 4. Camadas espaçadas no tempo certo
"Assim que o crescimento de uma camada é dominado, outra abre." Cedo demais confunde; tarde
demais entedia. O gatilho não é o relógio — é o domínio da camada anterior, medido por um
marco concreto.

### 5. Números grandes como fantasia
Kittens Game equilibra para que você tenha sempre um surto de crescimento mas **nunca se
sinta confortável**. O Paperclips deixa um contador em `0,000000000000%` por horas antes da
aceleração exponencial. O tamanho do número é o prêmio emocional; a legibilidade dele é
obrigação do designer (sufixos k/M/G/T, nunca notação científica crua na tela principal).

### 6. Recompensa de retorno
Voltar e encontrar um monte de recurso acumulado é, por si só, a recompensa. Mas se o
offline render igual ao online, não há razão para abrir o app.

### 7. Prestígio recontextualiza
Um prestígio que só dá `×1,2` é uma planilha. Um prestígio que **troca as regras** — outra
espécie, outra arquitetura, outro conjunto de restrições — é um jogo novo com conhecimento
antigo, que é a sensação boa.

## Parte 2 — All the Mods To The Sky, destrinchado

O modpack começa você numa ilha flutuante com uma árvore. O gate inicial é o **Ex Deorum**:
peneirar terra, quebrar folhas, repetir. O guia oficial reconhece que "os estágios iniciais
podem parecer tediosos por causa dessa mecânica, mas a progressão acelera rápido quando
você estabelece um fluxo de recursos".

Sete mecanismos que dão para roubar:

**1. Ex Nihilo — o tédio proposital.** O começo é braçal de propósito. A primeira máquina
que automatiza a peneira é um alívio físico. A automação do late game só tem peso emocional
porque o começo foi na lama.
→ **No BOOTSTRAP:** o Ato I é clique manual puro. O `↑ histórico` chega em ~25 segundos e é
o primeiro alívio; os daemons, aos ~4 minutos, são a catarse.

**2. Receitas visíveis, logística difícil.** O JEI mostra a receita da ATM Star inteira
desde sempre. Você sabe que precisa de um núcleo de antimatéria; o que você não tem é a
cadeia de produção. **A dificuldade é executar, não descobrir.**
→ **No BOOTSTRAP:** a árvore inteira é visível e navegável desde o minuto 1, com custos e
marcos exatos em cada nó. Este é o ponto que o pré-alpha errou.

**3. Gargalos em cadeia.** Resolver a produção de minério revela que a energia não
acompanha. Resolver a energia revela que o armazenamento não acompanha. Cada solução
espetacular cria o próximo problema, uma escala acima.
→ **No BOOTSTRAP:** clique → daemons → ciclos → permissões → assinatura → latência da rede.

**4. Muros de paradigma.** O muro não é "precisa de 10× mais". É "seu gerador básico não
serve mais, construa um reator". Você **abandona** um sistema inteiro em vez de escalá-lo.
→ **No BOOTSTRAP:** o Departamento de Permissões tem teto no nível 6. Depois dele, nenhum
upgrade adianta — só a assinatura digital, que muda a regra (permissão deixa de ser gasta e
vira saldo mínimo exigido).

**5. Diversificação de método.** Ferro por peneira, depois por semente (Mystical
Agriculture), depois por abelha (Productive Bees), depois por laser. Mesmo recurso, métodos
visualmente diferentes ao longo do jogo.
→ **No BOOTSTRAP:** bytes vêm do dedo, depois de daemons, depois de daemons em lote, depois
de nós remotos com regras próprias (espelho arriscado, nó frio lento mas gerador de
permissão, orbital rápido mas com marcos lentos).

**6. Unobtainium e singularidades.** Recursos que quebram a matemática do balanceamento, e
que exigem condensar milhões de itens básicos. Isso dá **utilidade eterna à fábrica do
começo**, que de outro modo ficaria obsoleta.
→ **No BOOTSTRAP:** o marco final do `kernel` exige 160.000 execuções de `ld` e `rsync`, e
os fragmentos de prestígio saem do total de bytes da run — o que faz cada daemon antigo
continuar contando até o fim.

**7. Questbook.** O ATM literalmente te diz o que fazer em seguida, com uma lista.
→ **No BOOTSTRAP:** o painel PRÓXIMO PASSO, sempre visível, sempre com um objetivo concreto
e a barra de progresso dele. Nunca existe o estado "não sei o que fazer".

## Parte 3 — Autópsia do pré-alpha

O feedback foi: *"não entendi nada, mecânicas confusas e estranhas"*. As causas, em ordem
de gravidade:

| # | Erro | Por quê aconteceu | Correção na v2 |
|---|---|---|---|
| 1 | **Crafting cego** — combinar dois ícones e torcer | Achei que o mistério do ATM era descobrir receitas. Não é: o JEI mostra tudo. | Árvore visível com requisitos contados. Zero adivinhação. |
| 2 | **Cinco sistemas na primeira tela** — bytes, selos, ciclos, combinar, protocolar, tudo junto | Entreguei o jogo inteiro no minuto zero | Cinco Atos. Cada um revela uma coisa. A primeira tela tem um botão. |
| 3 | **Nenhum objetivo visível** | Sem questbook, sem "próximo passo" | Painel PRÓXIMO PASSO permanente |
| 4 | **Zero feedback** — números mudavam, nada acontecia na tela | Sem animação, sem som, sem juice | Documento 07: partículas, contadores que correm, pulso do botão, glitch do terminal |
| 5 | **Vocabulário sem fantasia** — "protocolar", "selos" | Termos de processo sem ficção que os justifique | O kernel *acorda* e passa a exigir permissão. O log narra em primeira pessoa. |
| 6 | **Progresso invisível** | Marcos só existiam implicitamente | Toda barra de progresso do jogo mostra `atual / alvo` em número |

### Fontes

- [How to design idle games — Machinations](https://machinations.io/articles/idle-games-and-how-to-design-them)
- [How to Design an Idle or Incremental Game — Bugnet](https://bugnet.io/blog/how-to-design-an-idle-or-incremental-game)
- [2017: Universal Paperclips — IF50](https://if50.substack.com/p/2017-universal-paperclips)
- [Three Incremental Games and the maths that power them — Voice Magazine](https://www.voicemag.uk/blog/8661/three-incremental-games-and-the-fascinating-maths-that-power-them)
- [ATM9 To The Sky Guide](https://joshfr-tt71.github.io/atm9-guide/)
- [All the Mods 10: To the Sky — CurseForge](https://www.curseforge.com/minecraft/modpacks/all-the-mods-10-sky)
