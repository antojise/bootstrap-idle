// Daemons — ciclos, alocação e gargalos.
// Nenhuma referência a document, window, localStorage ou Date.now().

import { CMDS, ORDER } from '../data/commands.js';
import { CICLOS_BASE } from '../data/upgrades.js';
import { ciclosConquistas } from './economy.js';

// Total de ciclos disponíveis: base + comprados + de comandos + de conquistas
export function ciclosTotais(state) {
  const { run } = state;
  let total = CICLOS_BASE + run.ciclosComprados;

  // Ciclos extras de comandos forjados (wc e paste cada +1)
  for (const cmd of run.forjados) {
    if (CMDS[cmd]?.fx?.ciclos) total += CMDS[cmd].fx.ciclos;
  }

  // Ciclos extras de conquistas (achievement 'todos': +1)
  total += ciclosConquistas(state);

  return total;
}

// Número de ciclos em uso (limitado ao total disponível para não crashar)
export function ciclosUsados(state) {
  return Math.min(state.run.daemons.length, ciclosTotais(state));
}

// Ciclos livres
export function ciclosLivres(state) {
  return Math.max(0, ciclosTotais(state) - state.run.daemons.length);
}

// Aloca um daemon para o comando. Lança erro se não houver ciclo livre ou o comando não estiver forjado.
export function alocar(cmd, state) {
  if (!state.run.forjados.includes(cmd)) {
    throw new Error(`${cmd} não está forjado.`);
  }
  if (ciclosLivres(state) === 0) {
    throw new Error('Sem ciclos livres para alocar.');
  }
  state.run.daemons.push(cmd);
}

// Desaloca o daemon do comando. Sem erro se não estiver alocado.
export function desalocar(cmd, state) {
  const idx = state.run.daemons.indexOf(cmd);
  if (idx !== -1) {
    state.run.daemons.splice(idx, 1);
    // Remove deadlock se houver
    delete state.run.deadlocks[cmd];
  }
}

// Retorna o conjunto de comandos cujo daemon está em déficit (daemons > slots disponíveis).
// O déficit não bloqueia forja — apenas os daemons excedentes não produzem.
export function daemonsEmDeficit(state) {
  const total = ciclosTotais(state);
  if (state.run.daemons.length <= total) return [];
  return state.run.daemons.slice(total); // os excedentes
}

// Gargalos: comandos que estão sendo farmados por nenhum daemon mas são necessários
// para o progresso da próxima forja. Indica onde alocar um ciclo livre.
export function gargalos(state) {
  const { run } = state;
  const { forjados, daemons, execs, ato } = run;
  const resultado = new Set();

  for (const cmd of ORDER) {
    if (forjados.includes(cmd)) continue;
    if (CMDS[cmd].ato > ato) continue; // ainda não visível

    for (const [pai, necessario] of Object.entries(CMDS[cmd].req)) {
      const atual = execs[pai] || 0;
      // Este pai é gargalo se: (a) marco não cumprido E (b) pai não tem daemon alocado
      if (atual < necessario && !daemons.includes(pai) && forjados.includes(pai)) {
        resultado.add(pai);
      }
    }
  }

  return [...resultado];
}
