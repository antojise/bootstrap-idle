# BOOTSTRAP — contexto do projeto

Idle de terminal para Android (PWA). Você acorda dentro de uma máquina apagada com uma única
instrução funcionando (`echo`) e reconstrói a si mesmo, comando por comando, até o `kernel`.

**Leia `GDD/00-VISAO.md` antes de qualquer coisa.** O GDD é a especificação; este arquivo é
só o resumo operacional.

## As regras que não se quebram

**1. Nada é escondido do jogador.**
Todo requisito é visível e contado desde o minuto 1 (`execute awk 1.500× · 847/1.500`).
Nunca existe `???`, nunca existe adivinhação. O difícil é conseguir, não descobrir. Uma
versão anterior deste jogo errou exatamente aqui e o resultado foi "não entendi nada".

**2. Um elemento só aparece quando o jogador precisa dele.**
Não existe aba cinza, cadeado, ou contador em zero de um recurso do Ato que ainda não
chegou. Antes do seu Ato, o sistema **não existe** na interface. Ver `GDD/03-PROGRESSAO.md`.

**3. `src/engine/` é puro.**
Não importa nada de `ui/`, não toca `document`, `window`, `localStorage` nem `Date.now()`.
O tempo entra como parâmetro: `tick(state, dt)`. É isso que permite simular 14 dias em
segundos e testar economia sem navegador.

**4. Os dados são a fonte de verdade.**
Números vivem em `src/data/`. Jogo, simulador, testes e as tabelas do GDD leem os mesmos
arquivos. Nunca duplique uma constante em `engine/` ou `ui/`.

**5. Sete ciclos para 25 comandos.**
A escassez de ciclos é a decisão central do jogo. Não infle esse teto para resolver
problema de ritmo — inflar mata a única escolha interessante que o jogador toma.

## Comandos

```
node tools/validate.js          # regras estruturais do grafo — precisa passar sempre
node tools/sim.js               # 14 dias de jogo em segundos, 4 perfis de jogador
node tools/gen-docs.js          # regera as tabelas do GDD a partir de src/data/
node --test test/engine.test.js # testes da engine, sem navegador
npx playwright test             # testes de UI, viewport mobile
python3 -m http.server 8080     # servir localmente (ES modules exigem http, não file://)
```

## Deploy

Vercel, conta `antonio-jose-s-projects` (Hobby). Jogo 100% estático: sem servidor, sem
banco, sem variável de ambiente. Framework Preset "Other", sem build command, output na
raiz. `push` na `main` publica.

O `vercel.json` com `Cache-Control: max-age=0, must-revalidate` em `/sw.js` e `/index.html`
NÃO é opcional — sem ele o celular nunca descobre que existe versão nova. Detalhes e a
armadilha inteira em `GDD/11-DEPLOY.md`.

## Definição de pronto

Antes de considerar qualquer tarefa concluída:

- `validate.js` passa
- testes de engine passam
- o jogo abre sem erro no console
- nenhum elemento de UI de um Ato futuro vazou para a tela
- se algum dado mudou: `sim.js` conferido contra os alvos de `GDD/09-BALANCEAMENTO.md` e
  `gen-docs.js` rodado

## Armadilhas já conhecidas (custaram bug na v1)

- `setInterval` para a economia: o navegador suspende timers em aba oculta. Use `dt` real.
- Redesenhar a tela inteira a cada tick: recria os botões debaixo do dedo do jogador.
- `window.addEventListener('pagehide', save)` guarda a referência da função; reatribuir
  `save` depois não troca o handler.
- Duas receitas para a mesma chave tornam metade da árvore inalcançável, e isso não aparece
  jogando — só na validação do grafo.

## Estilo

Português do Brasil em tudo que o jogador lê. Código e nomes de arquivo em inglês quando for
termo técnico consagrado, em português quando for domínio do jogo (`forjar`, `ciclos`,
`permissoes`). Comentário só onde o "porquê" não é óbvio pelo código.
