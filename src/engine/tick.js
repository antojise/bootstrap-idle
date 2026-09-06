// Tick — um passo do loop de jogo.
// Nenhuma referência a document, window, localStorage ou Date.now().
// O tempo entra como parâmetro `dt` (segundos). A engine não acessa o relógio.

import { NOS } from '../data/upgrades.js';
import { ARQUITETURAS } from '../data/prestige.js';
import { executarCmd, calcTickInterval, calcExecsPerTick, tempoPorPermissao } from './economy.js';
import { ciclosTotais } from './daemons.js';
import { avaliarGatilhos } from './acts.js';
import { avaliar as avaliarConquistas } from './achievements.js';

// Limite de dt para um único tick. Acima disso a ausência deve ser tratada como offline.
const DT_CAP = 2;

// tick(state, dt) → { novosAtos: number[], novasConquistas: string[] }
// Muta o estado e devolve eventos para a UI renderizar.
export function tick(state, dt) {
  dt = Math.min(dt, DT_CAP);
  if (dt <= 0) return { novosAtos: [], novasConquistas: [] };

  const { run, meta, stats } = state;

  // ── Tempo da run ──────────────────────────────────────────────────────────
  run.elapsedSeconds += dt;

  // ── Daemons ───────────────────────────────────────────────────────────────
  const totalSlots  = ciclosTotais(state);
  // Daemons efetivos (limitados pelos slots — excedentes ficam pausados)
  const ativos = run.daemons.slice(0, totalSlots);

  if (ativos.length > 0) {
    const interval      = calcTickInterval(state);
    const execsPerTick  = calcExecsPerTick(state);
    const arq           = ARQUITETURAS[meta.arquitetura];
    const no            = NOS[run.noAtual];
    // Orbital: execs contam 2,5x mais devagar para marcos
    const marcoMult     = no?.latencia ? 1 / no.latencia : 1;

    run.daemonAcc += dt;

    while (run.daemonAcc >= interval) {
      run.daemonAcc -= interval;

      // Espelho: rolar dado por tick para perda de dessincronia
      if (no?.risco > 0) {
        const probPorTick = no.risco * (interval / 60);
        if (Math.random() < probPorTick) {
          stats.ticksPerdidos++;
          continue; // pula este tick — nenhum daemon executa
        }
      }

      // Paralela: rolar dado por tick para novo deadlock por daemon
      if (arq?.deadlock && run.ato >= 2) {
        for (const cmd of ativos) {
          if (!run.deadlocks[cmd] || run.deadlocks[cmd] <= 0) {
            const probPorTick = arq.deadlock.chance * (interval / 60);
            if (Math.random() < probPorTick) {
              run.deadlocks[cmd] = arq.deadlock.dur;
            }
          }
        }
      }

      // Executar cada daemon ativo (pula deadlocked)
      for (const cmd of ativos) {
        if (run.deadlocks[cmd] > 0) continue;
        executarCmd(cmd, state, execsPerTick, marcoMult);
      }
    }

    // Decrementar timers de deadlock (paralela)
    for (const cmd of Object.keys(run.deadlocks)) {
      if (run.deadlocks[cmd] > 0) {
        run.deadlocks[cmd] = Math.max(0, run.deadlocks[cmd] - dt);
      }
    }
  }

  // ── Rastrear ociosidade (todos os ciclos vazios) ──────────────────────────
  if (run.daemons.length === 0) {
    stats.tempoOcioso += dt;
  }

  // ── Permissões (Ato III+) ─────────────────────────────────────────────────
  if (run.ato >= 3) {
    const tempoEfetivo = tempoPorPermissao(state);

    run.permProg += dt;
    while (run.permProg >= tempoEfetivo) {
      run.permProg  -= tempoEfetivo;
      run.perm      += 1;
      stats.permTotal += 1;
    }

    // Rastrear tempo no nó frio
    if (run.noAtual === 'frio') {
      stats.tempoNoFrio += dt;
    }
  }

  // ── Gatilhos de ato ───────────────────────────────────────────────────────
  const novosAtos = avaliarGatilhos(state);

  // ── Conquistas ────────────────────────────────────────────────────────────
  const novasConquistas = avaliarConquistas(state);

  return { novosAtos, novasConquistas };
}

// Destrava um daemon em deadlock (paralela) ao toque do jogador.
export function destravarDeadlock(cmd, state) {
  if (state.run.deadlocks[cmd] > 0) {
    delete state.run.deadlocks[cmd];
    return true;
  }
  return false;
}
