// Conquistas — avaliação das condições a cada tick.
// Nenhuma referência a document, window, localStorage ou Date.now().

import { CMDS } from '../data/commands.js';
import { LISTA } from '../data/achievements.js';
import { ciclosTotais } from './daemons.js';
import { producaoPassiva } from './economy.js';

// Avalia todas as conquistas não obtidas. Muta meta.conquistas para as novas.
// Retorna array de ids recém-desbloqueados.
export function avaliar(state) {
  const novos = [];
  const S = buildView(state);

  for (const ach of LISTA) {
    if (state.meta.conquistas[ach.id] !== undefined) continue;
    try {
      if (ach.cond(S)) {
        state.meta.conquistas[ach.id] = state.run.elapsedSeconds;
        novos.push(ach.id);
      }
    } catch {
      // Condição com erro não trava o jogo
    }
  }

  return novos;
}

// Constrói o "view" do estado que as condições de conquista recebem.
// Todas as propriedades aqui são leitura — as condições não devem mutar nada.
function buildView(state) {
  const { run, meta, stats } = state;
  return {
    // Estado da run
    forjados:    run.forjados,
    execs:       run.execs,
    daemons:     run.daemons,
    daemonUp:    run.daemonUp,
    perm:        run.perm,
    permNivel:   run.permNivel,
    ups:         run.ups,
    nosAbertos:  run.nosAbertos,
    ato:         run.ato,
    tempoAoTier8: run.tempoAoTier8,

    // Meta (atravessa recompilação)
    frag:        meta.fragmentos,
    runs:        meta.runs,
    arqsUsadas:  meta.arqsUsadas,

    // Stats cumulativos
    bytesTotal:              stats.bytesTotal,
    execTotal:               stats.execTotal,
    permTotal:               stats.permTotal,
    travadoPorPerm:          stats.travadoPorPerm,
    ticksPerdidos:           stats.ticksPerdidos,
    tempoNoFrio:             stats.tempoNoFrio,
    tempoOcioso:             stats.tempoOcioso,
    ultimoOffline:           stats.ultimoOffline,
    forjouTier5SemDaemon:    stats.forjouTier5SemDaemon,
    recompCedo:              stats.recompCedo,

    // Computados
    ciclosTotais: ciclosTotais(state),
    rate:         producaoPassiva(state),

    // Acesso aos dados dos comandos (usado por tierMax nas condições)
    cmds: CMDS,
  };
}
