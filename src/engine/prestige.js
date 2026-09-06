// Prestígio — cálculo de fragmentos e recompilação.
// Nenhuma referência a document, window, localStorage ou Date.now().

import { CMDS } from '../data/commands.js';
import { ARQUITETURAS, fragmentosPor, RECOMP_MIN_TIER } from '../data/prestige.js';
import { novaRun } from './state.js';

// Fragmentos que esta run vai render ao recompilar.
export function fragmentosDaRun(state) {
  const { run, meta } = state;
  const maxTier = run.forjados.length
    ? Math.max(...run.forjados.map(c => CMDS[c].tier))
    : 0;

  if (maxTier < RECOMP_MIN_TIER) return 0;

  let frag = fragmentosPor(run.bytesDaRun);

  // Arquitetura Recursiva: +60% de fragmentos
  const arq = ARQUITETURAS[meta.arquitetura];
  if (arq?.fragBonus) frag = Math.floor(frag * (1 + arq.fragBonus));

  // Conquista 'todasArq': +5 fragmentos ao recompilar (fx.frag aplicado no momento da forja, não aqui)
  // Os fragmentos de conquista (fx.frag) são bonus fixos — não dependem da run.

  return frag;
}

// Executa a recompilação. Muta state.
// arquitetura: id da arquitetura escolhida (ex: 'limpa')
// agoraSegundos: elapsedSeconds ou equivalente (passado pela UI/simulador, sem Date.now())
export function recompilar(state, arquitetura, agoraSegundos = 0) {
  const { run, meta, stats } = state;

  // Flag de recompilação cedo (antes do tier 9)
  const maxTier = run.forjados.length
    ? Math.max(...run.forjados.map(c => CMDS[c].tier))
    : 0;
  if (maxTier < 9) stats.recompCedo = true;

  // Calcular e adicionar fragmentos
  const frag = fragmentosDaRun(state);
  meta.fragmentos += frag;

  // Adicionar fragmentos de conquistas 'frag' desbloqueadas (ex: todasArq)
  // (esses fragmentos são concedidos uma única vez, quando a conquista é obtida —
  //  a engine de conquistas os registra como bonus acumulado; para simplificar,
  //  os tratamos como parte dos meta.fragmentos diretamente no momento do unlock)

  // Atualizar histórico da run
  meta.runs++;
  if (!meta.arqsUsadas.includes(meta.arquitetura)) {
    meta.arqsUsadas.push(meta.arquitetura);
  }
  meta.arquitetura = arquitetura;

  // Criar run nova
  const run2 = novaRun();
  run2.elapsedSeconds = agoraSegundos;
  run2.tempoRunInicio = agoraSegundos;

  // Parasita: primeiras 5 forjas são grátis em bytes
  if (arquitetura === 'parasita') {
    run2.forjasGratis = ARQUITETURAS.parasita.forjaGratis;
  }

  state.run = run2;
}
