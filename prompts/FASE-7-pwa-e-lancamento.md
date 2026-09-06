# FASE 7 — PWA, polimento e lançamento

```
Continuando o BOOTSTRAP. O jogo está completo e com feedback (fase 6).
Leia CLAUDE.md e GDD/08-ARQUITETURA.md.

Última fase: transformar o jogo num app instalável e publicável.

## PWA

1. manifest.json: nome, ícones 192/512/maskable, display standalone, orientação portrait,
   theme e background color do tema do jogo, start_url relativo.

2. sw.js com estratégia network-first e fallback para cache. Network-first e não
   cache-first: assim o jogador recebe atualizações sem precisar limpar dados, e continua
   abrindo offline. Versione o cache e limpe os antigos no activate.

3. Ícone: gere de verdade (não use placeholder). Prompt de terminal em âmbar sobre preto,
   legível a 48px.

4. Teste a instalação real: abrir no Chrome Android, "Adicionar à tela inicial", confirmar
   que abre em tela cheia sem barra de navegador e que o progresso persiste.

## Polimento

5. Acessibilidade: contraste mínimo 4,5:1, estado nunca comunicado só por cor, foco de
   teclado visível, alvos de toque ≥ 44px.

6. Estados de erro: save corrompido não pode impedir o jogo de abrir. Se JSON.parse falhar,
   comece um jogo novo e avise numa linha do log — sem modal de erro técnico.

7. Botão de exportar/importar save (texto em base64, para o jogador copiar). Idle sem
   backup de save perde jogador para sempre quando o navegador limpa dados.

8. Tela de estatísticas na aba PERFIL: tempo total, bytes de vida inteira, execuções,
   runs, tempo por ato. É a base da telemetria local do roadmap.

## Testes finais

9. test/ui.test.js em Playwright, viewport mobile:
   - a primeira tela mostra apenas TERMINAL + ÁRVORE, botão, bytes e log
   - nenhum elemento de Ato futuro visível antes do gatilho (teste ato por ato)
   - os 90 segundos do onboarding acontecem na ordem de GDD/07
   - reload preserva; retorno offline mostra o modal
   - export → import → estado idêntico
   - zero erros de console em toda a bateria

## Publicação

10. README.md na raiz: o que é o jogo, como jogar, como rodar localmente, como rodar os
    testes e o simulador.

11. Vercel: confirme que o vercel.json da Fase 2 está aplicando os headers de
    Cache-Control (verifique com `curl -I` na URL do sw.js em produção). Implemente a
    detecção de nova versão descrita em GDD/11-DEPLOY.md — toast avisando, e SALVAR antes
    de recarregar. Ponha a URL de produção no README.

## Critérios de aceite

- Lighthouse PWA: instalável, sem erro
- `curl -I <url>/sw.js` retorna `cache-control: public, max-age=0, must-revalidate`
- Um push com mudança visível chega ao celular sem precisar reinstalar o app
- Instalado no Android, abre offline e mantém o progresso
- Toda a bateria de testes passa
- `node tools/validate.js`, `sim.js` e `gen-docs.js` rodam limpos
- O README explica o jogo para alguém que nunca ouviu falar dele
```
