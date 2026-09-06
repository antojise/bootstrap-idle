// Economia — produção, multiplicadores, execução de comandos.
// Nenhuma referência a document, window, localStorage ou Date.now().

import { CMDS, ORDER } from '../data/commands.js';
import { ARQUITETURAS, fragMult as calcFragMult } from '../data/prestige.js';
import { NOS, daemonTick, DAEMON_TICK } from '../data/upgrades.js';
import { LISTA as ACHIEVEMENTS } from '../data/achievements.js';

// ── Multiplicadores ──────────────────────────────────────────────────────────

// Soma de todos os bônus globais permanentes das conquistas desbloqueadas
function bonusConquistas(state) {
  let bonus = 0;
  for (const ach of ACHIEVEMENTS) {
    if (state.meta.conquistas[ach.id] !== undefined && ach.fx.global) {
      bonus += ach.fx.global;
    }
  }
  return bonus;
}

// Soma dos bônus globais dos comandos forjados (fx.global)
function bonusForjados(forjados) {
  let bonus = 0;
  for (const cmd of forjados) {
    if (CMDS[cmd]?.fx?.global) bonus += CMDS[cmd].fx.global;
  }
  return bonus;
}

// Multiplicador total de produção:
// y × (1 + globalBonus) × fragMult × cacheMult × arqMult × nodeMult
export function multiplicadorTotal(state) {
  const { run, meta } = state;
  const global = bonusForjados(run.forjados) + bonusConquistas(state);
  const frag   = calcFragMult(meta.fragmentos);
  const cache  = run.ups.cache ? 1.4 : 1.0;
  const arq    = ARQUITETURAS[meta.arquitetura]?.mult ?? 1.0;
  const node   = NOS[run.noAtual]?.mult ?? 1.0;
  return (1 + global) * frag * cache * arq * node;
}

// Bytes produzidos por uma execução de `cmd`
export function producaoPorExecucao(cmd, state) {
  return CMDS[cmd].y * multiplicadorTotal(state);
}

// Segundos por tick do daemon (considerando arquitetura e conquistas)
export function calcTickInterval(state) {
  const { run, meta } = state;
  let interval = daemonTick(run.daemonUp);

  // Arquitetura Fria: daemons 30% mais rápidos (tickBonus: 0.7 = multiplica o intervalo)
  const arq = ARQUITETURAS[meta.arquitetura];
  if (arq?.tickBonus) interval *= arq.tickBonus;

  // Conquistas com tickBonus reduzem o intervalo (ex: 0.03 = 3% mais rápido)
  let achBonus = 0;
  for (const ach of ACHIEVEMENTS) {
    if (state.meta.conquistas[ach.id] !== undefined && ach.fx.tickBonus) {
      achBonus += ach.fx.tickBonus;
    }
  }
  if (achBonus > 0) interval *= Math.max(0.1, 1 - achBonus);

  // Piso absoluto
  return Math.max(0.5, interval);
}

// Execuções por tick (base + lote + JIT)
export function calcExecsPerTick(state) {
  const { run } = state;
  let execs = 1;
  if (run.ups.lote) execs += 1;
  if (run.ups.jit) execs += Math.min(3, Math.floor(run.forjados.length / 8));
  return execs;
}

// Taxa de produção passiva em bytes/segundo (todos os daemons ativos)
export function producaoPassiva(state) {
  const { run } = state;
  if (run.daemons.length === 0) return 0;

  const interval    = calcTickInterval(state);
  const execsPerTick = calcExecsPerTick(state);
  const activeDaemons = daemsAtivos(state);

  let total = 0;
  for (const cmd of activeDaemons) {
    total += producaoPorExecucao(cmd, state) * execsPerTick;
  }
  return total / interval;
}

// Daemons que não estão em deadlock (paralela)
export function daemsAtivos(state) {
  const { run } = state;
  return run.daemons.filter(cmd => !(run.deadlocks[cmd] > 0));
}

// ── Execução ─────────────────────────────────────────────────────────────────

// Registra a execução de `cmd` pelo número de vezes indicado.
// `marcoMult` afeta apenas o contador de execuções (não os bytes), ex: orbital = 1/2.5.
// Retorna os bytes produzidos.
export function executarCmd(cmd, state, count = 1, marcoMult = 1) {
  const { run, stats } = state;
  const bytes = producaoPorExecucao(cmd, state) * count;

  run.bytes      += bytes;
  run.bytesDaRun += bytes;
  stats.bytesTotal += bytes;

  const execsEfetivas = count * marcoMult;
  run.execs[cmd]   = (run.execs[cmd] || 0) + execsEfetivas;
  stats.execTotal  += execsEfetivas;

  return bytes;
}

// ── Ciclos extras de conquistas ───────────────────────────────────────────────

// Ciclos extras concedidos por conquistas desbloqueadas (fx.ciclo)
export function ciclosConquistas(state) {
  let extra = 0;
  for (const ach of ACHIEVEMENTS) {
    if (state.meta.conquistas[ach.id] !== undefined && ach.fx.ciclo) {
      extra += ach.fx.ciclo;
    }
  }
  return extra;
}

// Bônus de emissão de permissão das conquistas (fx.permMult)
export function permMultConquistas(state) {
  let bonus = 0;
  for (const ach of ACHIEVEMENTS) {
    if (state.meta.conquistas[ach.id] !== undefined && ach.fx.permMult) {
      bonus += ach.fx.permMult;
    }
  }
  return bonus;
}
