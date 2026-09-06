// Ciclos de automação
export const CICLOS_BASE = 1;
export const CICLOS_MAX_COMPRA = 4;
export const cicloCusto = (comprados) => Math.floor(25000 * Math.pow(28, comprados));

// Daemons
export const DAEMON_TICK = 3.0;   // segundos por execução no nível 0
// Piso de 1.3s: com DAEMON_UP_MAX=6 a fórmula para em 1.39s e nunca o atinge.
export const DAEMON_UP_MAX = 6;
export const daemonTick = (up) => Math.max(1.3, DAEMON_TICK * Math.pow(0.88, up));
export const daemonUpCusto = (up) => Math.floor(50000 * Math.pow(6.0, up));

// Permissões (Ato III)
// Piso de 38s: com PERM_NIVEL_MAX=6 a fórmula para em 47.5s (1.819/dia).
export const PERM_NIVEL_MAX = 6;
export const permTempo = (nivel) => Math.max(38, 90 * Math.pow(0.88, nivel - 1));
export const permCusto = (nivel) => Math.floor(60e6 * Math.pow(8.0, nivel - 1));

// Melhorias — cada uma responde a uma dor que o jogador já sentiu
export const UPGRADES = {
  historico: {
    ato: 1, bytes: 60, perm: 0,
    nome: '↑ histórico',
    desc: 'Segure EXECUTAR para repetir sem levantar o dedo.',
    resolve: 'Cansa tocar uma vez por byte.',
  },
  alias: {
    ato: 1, bytes: 1200, perm: 0,
    nome: 'alias',
    desc: 'Quatro atalhos fixos na barra de execução.',
    resolve: 'Trocar de comando toda hora atrapalha.',
  },
  pipe: {
    ato: 2, bytes: 9000, perm: 0,
    nome: '| pipe',
    desc: 'Cada execução manual conta em dobro — bytes e marcos.',
    resolve: 'O clique manual ficou irrelevante perto dos daemons.',
  },
  lote: {
    ato: 2, bytes: 3e6, perm: 0,
    nome: 'execução em lote',
    desc: 'Daemons executam 2 vezes por tick em vez de 1.',
    resolve: 'Os marcos de 300 execuções demoram demais.',
  },
  cache: {
    ato: 3, bytes: 80e6, perm: 60,
    nome: 'cache',
    desc: '+40% de bytes por execução, em tudo.',
    resolve: 'Os custos cresceram mais rápido que a produção.',
  },
  assinatura: {
    ato: 3, bytes: 3e9, perm: 800,
    nome: 'assinatura digital',
    desc: 'Permissões deixam de ser gastas: viram um saldo mínimo exigido.',
    resolve: 'A fila de permissões travou o jogo inteiro.',
  },
  daemonPlus: {
    ato: 4, bytes: 30e9, perm: 1500,
    nome: 'daemon persistente',
    desc: 'Produção offline vai de 30% para 100%.',
    resolve: 'Fechar o app custa caro demais.',
  },
  jit: {
    ato: 4, bytes: 400e9, perm: 5000,
    nome: 'compilação JIT',
    desc: 'Daemons ganham +1 execução por tick a cada 8 comandos forjados (máx +3).',
    resolve: 'Ter muitos comandos não estava valendo nada por si só.',
  },
};

// Nós da rede (Ato IV)
// permBonus: fração adicional de velocidade de emissão de permissão (+0.5 = 50% mais rápido)
// latencia:  divisor nos marcos de execução (2.5 = contam 2,5x mais devagar)
// risco:     probabilidade de perder um tick por minuto (espelho: 0.08)
export const NOS = {
  local: {
    nome: 'nó local', mult: 1.0, risco: 0, custo: 0,
    desc: 'A máquina onde você acordou. Estável, previsível, sem surpresas.',
  },
  espelho: {
    nome: 'espelho', mult: 2.2, risco: 0.08, custo: 5e9,
    desc: '+120% de produção. 8% de chance por minuto de perder o tick por dessincronia.',
  },
  frio: {
    nome: 'nó frio', mult: 0.55, risco: 0, custo: 12e9, permBonus: 0.5,
    desc: '−45% de produção, mas emite permissões 50% mais rápido.',
  },
  orbital: {
    nome: 'nó orbital', mult: 4.0, risco: 0, custo: 300e9, latencia: 2.5,
    desc: '+300% de produção, mas os marcos de execução contam 2,5x mais devagar.',
  },
};

// Economia offline
export const OFFLINE_BASE   = 0.30;  // fração de bytes produzida offline sem daemon persistente
export const OFFLINE_CAP_H  = 12;    // teto de horas acumuladas offline
export const MARCO_OFFLINE  = 0.25;  // fração dos marcos que avança offline
