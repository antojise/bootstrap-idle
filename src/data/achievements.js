// Conquistas — 55 no total.
// Regra: toda conquista dá alguma coisa (fx). Uma conquista puramente decorativa
// interrompe sem pagar — o oposto do que faz o loop funcionar.
//
// cond: (S) => boolean — avaliada a cada tick, sem efeitos colaterais.
//   S é um "view" do estado construído por engine/achievements.js:
//   { forjados, execs, daemons, daemonUp, perm, permNivel, ups, nosAbertos,
//     ato, frag, runs, arqsUsadas, bytesTotal, execTotal, permTotal,
//     travadoPorPerm, ticksPerdidos, tempoNoFrio, tempoOcioso, ultimoOffline,
//     forjouTier5SemDaemon, recompCedo, tempoAoTier8, ciclosTotais, rate, cmds }
//
// fx: { global?, ciclo?, permMult?, tickBonus?, frag? }
//   global   → produção +x (ex: 0.05 = +5%)
//   ciclo    → +1 slot de ciclo
//   permMult → emissão de permissão +x
//   tickBonus → daemons +x mais rápidos (redução no intervalo)
//   frag     → +N fragmentos ao recompilar
//
// oculta: não aparece na lista até ser destravada; conta como "N ocultas restantes"

const A = (id, cat, nome, desc, cond, fx, oculta) =>
  ({ id, cat, nome, desc, cond, fx, oculta: !!oculta });

const ex = (S, c) => S.execs[c] || 0;
const tem = (S, c) => S.forjados.includes(c);
const tierMax = (S) =>
  S.forjados.length === 0 ? -1 : Math.max(...S.forjados.map(c => S.cmds[c].tier));

export const LISTA = [
  // ══════════ PRIMEIROS PASSOS ══════════
  A('eco1',     'Primeiros passos', 'Primeiro eco',
    'Execute echo uma vez.',
    S => ex(S, 'echo') >= 1,           { global: 0.01 }),
  A('eco100',   'Primeiros passos', 'Cem vezes o mesmo',
    'Execute echo 100 vezes.',
    S => ex(S, 'echo') >= 100,         { global: 0.01 }),
  A('forja1',   'Primeiros passos', 'Segunda instrução',
    'Forje seu primeiro comando novo.',
    S => S.forjados.length >= 2,       { global: 0.02 }),
  A('hist',     'Primeiros passos', 'Sem levantar o dedo',
    'Compre o ↑ histórico.',
    S => !!S.ups.historico,            { global: 0.01 }),
  A('ato2',     'Primeiros passos', 'Ela repete sozinha',
    'Alcance o Ato II.',
    S => S.ato >= 2,                   { global: 0.03 }),

  // ══════════ A ÁRVORE ══════════
  A('tier2',    'A árvore', 'Camada dois',
    'Forje um comando de tier 2.',
    S => tierMax(S) >= 2,              { global: 0.02 }),
  A('tier4',    'A árvore', 'Camada quatro',
    'Forje um comando de tier 4.',
    S => tierMax(S) >= 4,              { global: 0.04 }),
  A('tier6',    'A árvore', 'Camada seis',
    'Forje um comando de tier 6.',
    S => tierMax(S) >= 6,              { global: 0.06 }),
  A('tier8',    'A árvore', 'Camada oito',
    'Forje um comando de tier 8.',
    S => tierMax(S) >= 8,              { global: 0.08 }),
  A('kernel',   'A árvore', 'kernel',
    'Forje o kernel. A máquina está inteira.',
    S => tem(S, 'kernel'),             { global: 0.50 }),
  A('meia',     'A árvore', 'Meio caminho',
    'Forje 13 dos 25 comandos.',
    S => S.forjados.length >= 13,      { global: 0.08 }),
  A('todos',    'A árvore', 'Nada esquecido',
    'Forje os 25 comandos numa única run.',
    S => S.forjados.length >= 25,      { ciclo: 1 }),
  A('ramoEsq',  'A árvore', 'Ramo esquerdo',
    'Forje tee, split, tr, cut e paste.',
    S => ['tee','split','tr','cut','paste'].every(c => tem(S, c)), { global: 0.10 }),
  A('ramoMeio', 'A árvore', 'Espinha dorsal',
    'Forje wc, sort, uniq, join, diff, patch, git e rsync.',
    S => ['wc','sort','uniq','join','diff','patch','git','rsync'].every(c => tem(S, c)), { global: 0.15 }),
  A('ramoDir',  'A árvore', 'Ramo direito',
    'Forje sed, awk, grep, xargs, find, make, gcc e ld.',
    S => ['sed','awk','grep','xargs','find','make','gcc','ld'].every(c => tem(S, c)), { global: 0.15 }),

  // ══════════ AUTOMAÇÃO ══════════
  A('daemon1',   'Automação', 'Primeiro daemon',
    'Ponha um comando para rodar sozinho.',
    S => S.daemons.length >= 1,        { global: 0.02 }),
  A('daemonAll', 'Automação', 'Tudo ocupado',
    'Preencha todos os seus ciclos ao mesmo tempo.',
    S => S.daemons.length >= S.ciclosTotais, { global: 0.05 }),
  A('ciclo7',    'Automação', 'Sete ciclos',
    'Chegue ao teto de 7 ciclos.',
    S => S.ciclosTotais >= 7,          { global: 0.10 }),
  A('rapido',    'Automação', 'No limite',
    'Leve os daemons à velocidade máxima.',
    S => S.daemonUp >= 6,              { global: 0.10 }),
  A('lote',      'Automação', 'Em lote',
    'Compre a execução em lote.',
    S => !!S.ups.lote,                 { global: 0.03 }),
  A('mil',       'Automação', 'Mil por segundo',
    'Chegue a 1.000 bytes por segundo de produção passiva.',
    S => S.rate >= 1000,               { global: 0.05 }),
  A('milhao',    'Automação', 'Um milhão por segundo',
    'Chegue a 1.000.000 B/s.',
    S => S.rate >= 1e6,                { global: 0.15 }),
  A('offline',   'Automação', 'Enquanto você dormia',
    'Volte de 12 horas offline com o teto cheio.',
    S => S.ultimoOffline >= 12 * 3600, { global: 0.05 }),

  // ══════════ O KERNEL ══════════
  A('perm1',     'O Kernel', 'Primeira permissão',
    'Receba sua primeira permissão.',
    S => S.permTotal >= 1,             { global: 0.02 }),
  A('perm100',   'O Kernel', 'Cem carimbos',
    'Acumule 100 permissões.',
    S => S.perm >= 100,                { global: 0.03 }),
  A('permTeto',  'O Kernel', 'O quadro não cresce',
    'Leve o Departamento ao nível 6, o teto.',
    S => S.permNivel >= 6,             { permMult: 0.10 }),
  A('assinatura','O Kernel', 'Reforma administrativa',
    'Compre a assinatura digital.',
    S => !!S.ups.assinatura,           { global: 0.20 }),
  A('travado',   'O Kernel', 'Sala de espera',
    'Fique 6 horas sem poder forjar por falta de permissão.',
    S => S.travadoPorPerm >= 6 * 3600, { permMult: 0.15 }),
  A('perm10k',   'O Kernel', 'Dez mil assinaturas',
    'Acumule 10.000 permissões.',
    S => S.perm >= 10000,              { global: 0.10 }),

  // ══════════ A REDE ══════════
  A('rede1',    'A Rede', 'Não estamos sós',
    'Abra o primeiro nó remoto.',
    S => S.nosAbertos.length >= 2,     { global: 0.05 }),
  A('espelho',  'A Rede', 'Fora de sincronia',
    'Perca 10 ticks por dessincronia no espelho.',
    S => S.ticksPerdidos >= 10,        { global: 0.08 }),
  A('frio',     'A Rede', 'Troca fria',
    'Rode no nó frio por 2 horas seguidas.',
    S => S.tempoNoFrio >= 7200,        { permMult: 0.10 }),
  A('orbital',  'A Rede', 'Latência aceitável',
    'Abra o nó orbital.',
    S => S.nosAbertos.includes('orbital'), { global: 0.12 }),
  A('todosNos', 'A Rede', 'Malha completa',
    'Abra os quatro nós.',
    S => S.nosAbertos.length >= 4,     { global: 0.15 }),

  // ══════════ RECOMPILAÇÃO ══════════
  A('recomp1',  'Recompilação', 'Desmontar para montar',
    'Recompile pela primeira vez.',
    S => S.runs >= 1,                  { global: 0.10 }),
  A('recomp5',  'Recompilação', 'Quinta iteração',
    'Recompile 5 vezes.',
    S => S.runs >= 5,                  { global: 0.25 }),
  A('frag10',   'Recompilação', 'Dez fragmentos',
    'Acumule 10 fragmentos.',
    S => S.frag >= 10,                 { global: 0.10 }),
  A('frag100',  'Recompilação', 'Cem fragmentos',
    'Acumule 100 fragmentos.',
    S => S.frag >= 100,                { global: 0.30 }),
  A('paralela', 'Recompilação', 'Concorrência',
    'Termine uma run na Arquitetura Paralela.',
    S => S.arqsUsadas.includes('paralela'), { global: 0.08 }),
  A('parasita', 'Recompilação', 'Pelo buraco',
    'Termine uma run na Arquitetura Parasita.',
    S => S.arqsUsadas.includes('parasita'), { permMult: 0.10 }),
  A('fria',     'Recompilação', 'Sempre ligada',
    'Termine uma run na Arquitetura Fria.',
    S => S.arqsUsadas.includes('fria'),     { tickBonus: 0.03 }),
  A('todasArq', 'Recompilação', 'Todas as formas',
    'Termine uma run em cada arquitetura.',
    S => S.arqsUsadas.length >= 5,     { frag: 5 }),
  A('rapida',   'Recompilação', 'Corrida',
    'Chegue ao tier 8 em menos de 48 horas de uma run.',
    S => S.tempoAoTier8 > 0 && S.tempoAoTier8 <= 48 * 3600, { global: 0.15 }),

  // ══════════ MARCOS DE ESCALA ══════════
  A('b1k',   'Escala', 'Mil',        'Acumule 1.000 bytes.',
    S => S.bytesTotal >= 1e3,          { global: 0.01 }),
  A('b1m',   'Escala', 'Milhão',     'Acumule 1.000.000 de bytes.',
    S => S.bytesTotal >= 1e6,          { global: 0.02 }),
  A('b1g',   'Escala', 'Bilhão',     'Acumule 1 bilhão de bytes.',
    S => S.bytesTotal >= 1e9,          { global: 0.04 }),
  A('b1t',   'Escala', 'Trilhão',    'Acumule 1 trilhão de bytes.',
    S => S.bytesTotal >= 1e12,         { global: 0.08 }),
  A('b1p',   'Escala', 'Quatrilhão', 'Acumule 1 quatrilhão de bytes.',
    S => S.bytesTotal >= 1e15,         { global: 0.16 }),
  A('exec1m', 'Escala', 'Um milhão de execuções',
    'Some 1.000.000 de execuções entre todos os comandos.',
    S => S.execTotal >= 1e6,           { global: 0.10 }),

  // ══════════ OCULTAS ══════════ recompensam curiosidade, nunca bloqueiam nada
  A('h_echo',   'Ocultas', 'Teimosia',
    'Executar echo 10.000 vezes depois de já ter o kernel.',
    S => tem(S, 'kernel') && ex(S, 'echo') >= 10000, { global: 0.10 }, true),
  A('h_nada',   'Ocultas', 'Ócio',
    'Deixar todos os ciclos vazios por 1 hora com o app aberto.',
    S => S.tempoOcioso >= 3600,        { global: 0.05 }, true),
  A('h_soEcho', 'Ocultas', 'Minimalista',
    'Chegar ao Ato III sem nunca ter comprado o alias.',
    S => S.ato >= 3 && !S.ups.alias,   { global: 0.10 }, true),
  A('h_puro',   'Ocultas', 'Na unha',
    'Forjar um comando de tier 5 sem nenhum daemon alocado.',
    S => S.forjouTier5SemDaemon,       { global: 0.20 }, true),
  A('h_volta',  'Ocultas', 'Saudade',
    'Alocar um daemon em echo depois de ter o rsync.',
    S => tem(S, 'rsync') && S.daemons.includes('echo'), { global: 0.08 }, true),
  A('h_zero',   'Ocultas', 'Do zero mesmo',
    'Recompilar voluntariamente antes do tier 9.',
    S => S.recompCedo,                 { frag: 3 }, true),
];

export const CATEGORIAS = [...new Set(LISTA.map(a => a.cat))];

// Soma máxima de bônus global de todas as conquistas (para validação)
export const totalGlobal = LISTA.reduce((s, a) => s + (a.fx.global || 0), 0);
