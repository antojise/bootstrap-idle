// Atos — avaliação de gatilhos de progressão.
// Nenhuma referência a document, window, localStorage ou Date.now().

import { CMDS } from '../data/commands.js';
import { ATOS } from '../data/acts.js';

export function atoAtual(state) {
  return state.run.ato;
}

// Verifica se algum ato novo foi desbloqueado. Muta state.run.ato.
// Retorna array com os números dos atos recém-ativados (pode ser vazio).
// Atos são sequenciais e nunca retrocedem.
export function avaliarGatilhos(state) {
  const { run } = state;
  const novos = [];

  for (let n = run.ato + 1; n <= 5; n++) {
    const ato = ATOS.find(a => a.n === n);
    if (!ato) break;

    if (!satisfazGatilho(ato.gatilho, run)) break; // atos são sequenciais

    run.ato = n;
    novos.push(n);
  }

  return novos;
}

function satisfazGatilho(gatilho, run) {
  if (gatilho === 'início') return true;

  if (gatilho.forjados !== undefined) {
    return run.forjados.length >= gatilho.forjados;
  }

  if (gatilho.tier !== undefined) {
    if (run.forjados.length === 0) return false;
    const maxTier = Math.max(...run.forjados.map(c => CMDS[c].tier));
    return maxTier >= gatilho.tier;
  }

  return false;
}
