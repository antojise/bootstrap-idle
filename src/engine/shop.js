// Loja — toda compra que a UI oferece, em um lugar só.
// Nenhuma referência a document, window, localStorage ou Date.now().
//
// Regra de permissão: normalmente ela é GASTA. Com a melhoria `assinatura` ela
// vira saldo mínimo exigido e não sai da conta. Forja e loja seguem a mesma regra,
// senão o jogador paga duas vezes pela mesma melhoria.

import {
  UPGRADES, NOS,
  cicloCusto, CICLOS_MAX_COMPRA,
  daemonUpCusto, DAEMON_UP_MAX, daemonTick,
  permCusto, PERM_NIVEL_MAX,
} from '../data/upgrades.js';

const permEhSaldo = (state) => !!state.run.ups.assinatura;

function podePagar(state, bytes, perm) {
  return state.run.bytes >= bytes && (perm <= 0 || state.run.perm >= perm);
}

function pagar(state, bytes, perm) {
  state.run.bytes -= bytes;
  if (perm > 0 && !permEhSaldo(state)) state.run.perm -= perm;
}

// ── Ciclos (slots de daemon) ─────────────────────────────────────────────────

// Próxima compra de ciclo, ou null se o teto de compras já foi atingido.
export function cicloProximo(state) {
  const c = state.run.ciclosComprados;
  if (c >= CICLOS_MAX_COMPRA) return null;
  return { nivel: c + 1, de: CICLOS_MAX_COMPRA, bytes: cicloCusto(c), perm: 0 };
}

export function podeComprarCiclo(state) {
  const p = cicloProximo(state);
  return !!p && podePagar(state, p.bytes, 0);
}

export function comprarCiclo(state) {
  const p = cicloProximo(state);
  if (!p || !podePagar(state, p.bytes, 0)) return false;
  pagar(state, p.bytes, 0);
  state.run.ciclosComprados++;
  return true;
}

// ── Velocidade dos daemons ───────────────────────────────────────────────────

export function daemonUpProximo(state) {
  const u = state.run.daemonUp;
  if (u >= DAEMON_UP_MAX) return null;
  return {
    nivel: u + 1, de: DAEMON_UP_MAX,
    bytes: daemonUpCusto(u), perm: 0,
    deSeg: daemonTick(u), paraSeg: daemonTick(u + 1),
  };
}

export function podeComprarDaemonUp(state) {
  const p = daemonUpProximo(state);
  return !!p && podePagar(state, p.bytes, 0);
}

export function comprarDaemonUp(state) {
  const p = daemonUpProximo(state);
  if (!p || !podePagar(state, p.bytes, 0)) return false;
  pagar(state, p.bytes, 0);
  state.run.daemonUp++;
  return true;
}

// ── Nível do kernel (emissão de permissão) — Ato III ─────────────────────────

export function permProximo(state) {
  const n = state.run.permNivel;
  if (n >= PERM_NIVEL_MAX) return null;
  return { nivel: n + 1, de: PERM_NIVEL_MAX, bytes: permCusto(n), perm: 0 };
}

export function podeComprarPerm(state) {
  const p = permProximo(state);
  return !!p && state.run.ato >= 3 && podePagar(state, p.bytes, 0);
}

export function comprarPerm(state) {
  if (!podeComprarPerm(state)) return false;
  const p = permProximo(state);
  pagar(state, p.bytes, 0);
  state.run.permNivel++;
  return true;
}

// ── Melhorias ────────────────────────────────────────────────────────────────

// Melhorias que já existem para o jogador (ato liberado). Nunca mostra as futuras.
export function upgradesVisiveis(state) {
  return Object.keys(UPGRADES).filter(id => UPGRADES[id].ato <= state.run.ato);
}

export function podeComprarUpgrade(id, state) {
  const up = UPGRADES[id];
  if (!up) return false;
  if (state.run.ups[id]) return false;
  if (up.ato > state.run.ato) return false;
  return podePagar(state, up.bytes, up.perm);
}

export function comprarUpgrade(id, state) {
  if (!podeComprarUpgrade(id, state)) return false;
  const up = UPGRADES[id];
  pagar(state, up.bytes, up.perm);
  state.run.ups[id] = true;
  return true;
}

// ── Nós da rede — Ato IV ─────────────────────────────────────────────────────

export function nosVisiveis(state) {
  return state.run.ato >= 4 ? Object.keys(NOS) : ['local'];
}

export function podeAbrirNo(id, state) {
  const no = NOS[id];
  if (!no) return false;
  if (state.run.nosAbertos.includes(id)) return false;
  if (state.run.ato < 4) return false;
  return podePagar(state, no.custo, 0);
}

export function abrirNo(id, state) {
  if (!podeAbrirNo(id, state)) return false;
  pagar(state, NOS[id].custo, 0);
  state.run.nosAbertos.push(id);
  return true;
}

// Mudar o nó ativo. Só entre nós já abertos.
export function trocarNo(id, state) {
  if (!state.run.nosAbertos.includes(id)) return false;
  state.run.noAtual = id;
  return true;
}
