// Atos — cada um revela UMA coisa nova. A tela cresce com o jogador.
// Antes do ato, o sistema não existe na interface: sem aba, sem número, sem menção.

export const ATOS = [
  {
    n: 1, id: 'vazio', nome: 'O Vazio',
    revela: ['botão EXECUTAR', 'bytes', 'árvore de comandos'],
    gatilho: 'início',
    texto: 'Uma instrução funciona. Todo o resto está apagado.',
  },
  {
    n: 2, id: 'daemons', nome: 'Os Daemons',
    revela: ['ciclos', 'daemons (automação)', 'aba SISTEMA'],
    gatilho: { forjados: 3 },
    texto: 'A máquina lembra como repetir sozinha.',
  },
  {
    n: 3, id: 'kernel', nome: 'O Kernel',
    revela: ['permissões', 'fila de homologação'],
    gatilho: { tier: 4 },
    texto: 'Alguma coisa embaixo de você acordou. E ela quer autorizar o que você faz.',
  },
  {
    n: 4, id: 'rede', nome: 'A Rede',
    revela: ['nós remotos', 'sobrecarga', 'aba REDE'],
    gatilho: { tier: 6 },
    texto: 'Existem outras máquinas. Frias, mas existem.',
  },
  {
    n: 5, id: 'recomp', nome: 'A Recompilação',
    revela: ['fragmentos', 'arquiteturas', 'prestígio'],
    gatilho: { tier: 8 },
    texto: 'Você já sabe o suficiente para se reconstruir melhor. Mas precisa se desmontar antes.',
  },
];
