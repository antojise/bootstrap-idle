// Prestígio — fragmentos e arquiteturas (Ato V)

// Fragmentos rendidos por uma run
// bytesDaRun = bytes acumulados durante a run (run.bytesDaRun)
export const fragmentosPor = (bytesDaRun) => Math.floor(Math.pow(bytesDaRun / 5e11, 0.42));

// Multiplicador de produção dos fragmentos acumulados: +5% por fragmento
export const fragMult = (f) => 1 + f * 0.05;

// Tier mínimo para poder recompilar
export const RECOMP_MIN_TIER = 8;

// Arquiteturas — cada uma muda REGRAS, não só números.
// mult:        multiplicador de produção base
// destrava:    número de runs necessárias para desbloquear (0 = disponível sempre)
// quando:      em que situação esta arquitetura é a escolha certa
export const ARQUITETURAS = {
  limpa: {
    nome: 'Arquitetura Limpa',
    mult: 1.0, destrava: 0,
    desc: 'Sem truques e sem penalidade. Tudo funciona como você já conhece.',
    quando: 'Primeira recompilação, ou quando você quer só sentir os fragmentos.',
  },
  paralela: {
    nome: 'Arquitetura Paralela',
    mult: 2.4, destrava: 1,
    deadlock: { chance: 0.05, dur: 12 }, // 5%/min de travar daemon por 12s
    desc: '+140% de produção. A cada minuto, 5% de chance de um daemon travar por 12s.',
    quando: 'Você está presente, olhando a tela, e pode destravar na hora.',
  },
  parasita: {
    nome: 'Arquitetura Parasita',
    mult: 0.5, destrava: 1, permMult: 4, forjaGratis: 5,
    desc: '−50% de produção. Permissões rendem 4x e as 5 primeiras forjas não custam bytes.',
    quando: 'A run passada travou na permissão. Esta run passa direto pelo muro.',
  },
  fria: {
    nome: 'Arquitetura Fria',
    mult: 0.8, destrava: 2, offline: 1.0, tickBonus: 0.7,
    desc: '−20% de produção, mas offline sempre 100% e daemons 30% mais rápidos.',
    quando: 'Você vai jogar em sessões curtas e deixar rodando o resto do dia.',
  },
  recursiva: {
    nome: 'Arquitetura Recursiva',
    mult: 1.0, destrava: 4, fragBonus: 0.6,
    desc: 'Produção normal, mas esta run rende +60% de fragmentos no fim.',
    quando: 'Run de investimento: você não quer avançar, quer capitalizar.',
  },
};
