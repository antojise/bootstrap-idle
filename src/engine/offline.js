// Offline — aplica a produção acumulada durante ausência do jogador.
// Nenhuma referência a document, window, localStorage ou Date.now().

import { ARQUITETURAS } from '../data/prestige.js';
import { OFFLINE_BASE, OFFLINE_CAP_H, MARCO_OFFLINE } from '../data/upgrades.js';
import { producaoPassiva, calcTickInterval, calcExecsPerTick } from './economy.js';

// Aplica produção de `segundos` offline ao estado.
// Muta state diretamente. Retorna { bytes, execs } ganhos para exibição no modal.
export function aplicarAusencia(state, segundos) {
  const { run, meta, stats } = state;

  // Teto de 12 horas
  const capSegundos = OFFLINE_CAP_H * 3600;
  segundos = Math.min(segundos, capSegundos);
  if (segundos <= 0) return { bytes: 0, execs: 0, motivo: '' };

  stats.ultimoOffline = segundos;

  // ── Bytes offline ──────────────────────────────────────────────────────────
  const arq = ARQUITETURAS[meta.arquitetura];

  // Daemon persistente ou arquitetura Fria: offline 100%; senão 30%
  let fatorOffline = OFFLINE_BASE;
  if (run.ups.daemonPlus)          fatorOffline = 1.0;
  else if (arq?.offline != null)   fatorOffline = arq.offline;

  const taxa = producaoPassiva(state); // bytes/s com todos os daemons
  const bytesGanhos = taxa * segundos * fatorOffline;

  if (bytesGanhos > 0) {
    run.bytes        += bytesGanhos;
    run.bytesDaRun   += bytesGanhos;
    stats.bytesTotal += bytesGanhos;
  }

  // ── Marcos offline (25%) ───────────────────────────────────────────────────
  // Marco não avança com orbital (latência), mas o MARCO_OFFLINE é aplicado de qualquer forma.
  // Execuções por daemon por segundo
  const interval      = calcTickInterval(state);
  const execsPerTick  = calcExecsPerTick(state);
  const execPerDaemon = execsPerTick / interval; // execuções/s por daemon

  let execsGanhos = 0;
  if (run.daemons.length > 0) {
    const execPorDaemon = execPerDaemon * segundos * MARCO_OFFLINE;
    for (const cmd of run.daemons) {
      run.execs[cmd]   = (run.execs[cmd] || 0) + execPorDaemon;
      stats.execTotal  += execPorDaemon;
      execsGanhos      += execPorDaemon;
    }
  }

  // Motivo quando ganho é zero
  let motivo = '';
  if (bytesGanhos === 0 && run.daemons.length === 0) {
    motivo = 'nenhum daemon alocado';
  }

  return { bytes: bytesGanhos, execs: execsGanhos, motivo };
}
