# Como usar estes prompts

Sete prompts, um por fase. Cada um é **autossuficiente**: dá para colar num Claude Code
limpo, sem contexto da conversa anterior.

## Preparo, uma vez só

```bash
mkdir bootstrap && cd bootstrap
git init
```

Copie para dentro:
- `CLAUDE.md` na raiz
- a pasta `GDD/` inteira
- `data.js` e `achievements.js` (a fase 1 os reorganiza em `src/data/`)

Abra o Claude Code na pasta. Ele lê o `CLAUDE.md` sozinho a cada sessão.

## Rodando

Uma fase por sessão. Cole o prompt inteiro, deixe terminar, **jogue o resultado**, e só
então vá para a próxima. Pular a etapa de jogar é como o pré-alpha foi construído.

Entre uma fase e outra:

```bash
git add -A && git commit -m "fase N: <o que entrou>"
```

Assim dá para voltar quando uma fase sair torta, sem perder as anteriores.

## Quando o resultado não for o esperado

Não reescreva o prompt inteiro. Diga o que está errado em uma frase e aponte o documento:

> O painel PRÓXIMO PASSO está mostrando três objetivos. Segundo `GDD/03-PROGRESSAO.md` ele
> mostra **um** — o mais próximo de ser concluído. Corrija.

O GDD é a autoridade. Se o Claude Code fizer algo que o contradiz, o GDD ganha — a menos que
você tenha mudado de ideia, e aí atualize o GDD primeiro.

## Se você quiser mudar o jogo

Mude o documento, depois peça a implementação. Documento e código andam juntos ou o
documento vira mentira em duas semanas.
