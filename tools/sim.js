#!/usr/bin/env node
// Simulador de balanceamento — 14 dias de jogo, 4 perfis de jogador.
// Verifica se os marcos de ritmo de GDD/09-BALANCEAMENTO.md são atingidos.

import { CMDS, ORDER } from '../src/data/commands.js';
import { ATOS } from '../src/data/acts.js';
import { UPGRADES, NOS, cicloCusto, daemonUpCusto, permCusto,
         CICLOS_MAX_COMPRA, DAEMON_UP_MAX, PERM_NIVEL_MAX, OFFLINE_CAP_H } from '../src/data/upgrades.js';
import { novoEstado } from '../src/engine/state.js';
import { tick } from '../src/engine/tick.js';
import { forjar, podeForjar } from '../src/engine/forge.js';
import { alocar, desalocar, ciclosTotais, ciclosLivres } from '../src/engine/daemons.js';
import { aplicarAusencia } from '../src/engine/offline.js';
import { executarCmd } from '../src/engine/economy.js';

// ── Perfis de jogador ────────────────────────────────────────────────────────
const PERFIS = [
  { nome: 'Ativo',   sessoesPorDia: 6, minPorSessao: 20 },  // 2h/dia
  { nome: 'Regular', sessoesPorDia: 4, minPorSessao: 15 },  // 1h/dia
  { nome: 'Raro',    sessoesPorDia: 2, minPorSessao: 8  },  // 16min/dia
  { nome: 'Casual',  sessoesPorDia: 1, minPorSessao: 3  },  // 3min/dia
];

// ── Alvos de ritmo ───────────────────────────────────────────────────────────
const ALVOS = [
  { nome: 'Ato II',   alvo: 6 * 60,          desc: '< 6 min' },   // segundos na sessão
  { nome: 'Ato III',  alvo: 1 * 86400,        desc: 'dia 1' },
  { nome: 'Ato IV',   alvo: 2 * 86400,        desc: 'dia 2' },
  { nome: 'Ato V',    alvo: 4 * 86400,        desc: 'dia 4–6' },
  { nome: 'kernel',   alvo: 9 * 86400,        desc: 'dia 9–14' },
];

// ── Bot — clicks manuais por segundo (modelo do jogador) ────────────────────
// Antes de historico: 1 tap/s. Com historico: 4 taps/s (auto-repeat).
// O bot clica o comando mais útil naquele momento.
function botClick(state, dt) {
  const { run } = state;
  const clickRate = run.ups.historico ? 4 : 1; // taps/s
  const nClicks   = Math.floor(clickRate * dt);
  if (nClicks === 0) return;

  const alvoExec = melhorClickAlvo(state);
  if (!alvoExec) return;

  const multi = run.ups.pipe ? 2 : 1; // pipe: bytes e execs em dobro
  executarCmd(alvoExec, state, nClicks * multi, multi);
}

function melhorClickAlvo(state) {
  const { run } = state;
  // Procura o pai do próximo alvo de forja que mais precisa de execs
  for (const cmd of ORDER) {
    if (run.forjados.includes(cmd)) continue;
    if (CMDS[cmd].ato > run.ato) continue;
    for (const [pai, necessario] of Object.entries(CMDS[cmd].req)) {
      if ((run.execs[pai] || 0) < necessario && run.forjados.includes(pai)) {
        return pai;
      }
    }
  }
  // Fallback: melhor comando forjado
  return run.forjados.slice().sort((a, b) => CMDS[b].y - CMDS[a].y)[0];
}

// ── Bot — decisões em cada sessão ────────────────────────────────────────────
function botDecide(state) {
  const { run, meta } = state;

  // Forjar tudo que puder (em ordem de tier)
  for (const cmd of ORDER) {
    if (podeForjar(cmd, state)) {
      forjar(cmd, state);
    }
  }

  // Comprar ciclos
  while (run.ciclosComprados < CICLOS_MAX_COMPRA) {
    const custo = cicloCusto(run.ciclosComprados);
    if (run.bytes >= custo) {
      run.bytes -= custo;
      run.ciclosComprados++;
    } else break;
  }

  // Comprar velocidade de daemon
  while (run.daemonUp < DAEMON_UP_MAX) {
    const custo = daemonUpCusto(run.daemonUp);
    if (run.bytes >= custo) {
      run.bytes -= custo;
      run.daemonUp++;
    } else break;
  }

  // Comprar nível de permissão (Ato III+)
  if (run.ato >= 3) {
    while (run.permNivel < PERM_NIVEL_MAX) {
      const custo = permCusto(run.permNivel);
      if (run.bytes >= custo) {
        run.bytes -= custo;
        run.permNivel++;
      } else break;
    }
  }

  // Comprar melhorias disponíveis
  for (const [id, up] of Object.entries(UPGRADES)) {
    if (!run.ups[id] && run.ato >= up.ato && run.bytes >= up.bytes &&
        (!up.perm || run.perm >= up.perm)) {
      run.bytes -= up.bytes;
      if (up.perm && !run.ups.assinatura) run.perm -= up.perm;
      run.ups[id] = true;
    }
  }

  // Alocar daemons
  botReallocar(state);
}

function botReallocar(state) {
  const { run } = state;
  const total = ciclosTotais(state);
  if (total === 0) return;

  run.daemons = [];

  // Encontrar próximo alvo de forja (maior progresso percentual médio)
  let alvo = null;
  let melhorPct = -1;

  for (const cmd of ORDER) {
    if (run.forjados.includes(cmd)) continue;
    if (CMDS[cmd].ato > run.ato) continue;

    const reqs = Object.entries(CMDS[cmd].req);
    if (reqs.length === 0) continue;

    const pct = reqs.reduce((s, [p, n]) => s + Math.min(1, (run.execs[p] || 0) / n), 0) / reqs.length;
    if (pct > melhorPct) { melhorPct = pct; alvo = cmd; }
  }

  const alocados = [];

  // Alocar para pais do alvo que precisam de mais execuções
  if (alvo) {
    const pais = Object.entries(CMDS[alvo].req)
      .filter(([p, n]) => (run.execs[p] || 0) < n && run.forjados.includes(p))
      .sort((a, b) => {
        const ra = (run.execs[a[0]] || 0) / a[1];
        const rb = (run.execs[b[0]] || 0) / b[1];
        return ra - rb; // mais atrasado primeiro
      });

    for (const [p] of pais) {
      if (alocados.length >= total) break;
      alocados.push(p);
    }
  }

  // Preencher slots restantes com maior y disponível
  const restantes = run.forjados
    .filter(c => !alocados.includes(c))
    .sort((a, b) => CMDS[b].y - CMDS[a].y);

  for (const cmd of restantes) {
    if (alocados.length >= total) break;
    alocados.push(cmd);
  }

  run.daemons = alocados.slice(0, total);
}

// ── Simulação de um perfil por N dias ────────────────────────────────────────
function simularPerfil(perfil, dias) {
  const state = novoEstado();
  const marcos = {}; // { 'ato2': segundosAbsolutos, ... }
  const timeline = []; // [{ dia, evento }]
  let tempoAbsoluto = 0; // segundos totais de jogo real desde o início

  for (let dia = 1; dia <= dias; dia++) {
    const segundosDia = 86400;
    const sessaoDuracao = perfil.minPorSessao * 60;
    const intervaloEntreSessoes = (segundosDia - perfil.sessoesPorDia * sessaoDuracao)
      / perfil.sessoesPorDia;

    for (let s = 0; s < perfil.sessoesPorDia; s++) {
      // Offline antes da sessão
      if (tempoAbsoluto > 0 || s > 0) {
        const offline = Math.min(intervaloEntreSessoes, OFFLINE_CAP_H * 3600);
        if (offline > 0) aplicarAusencia(state, offline);
      }

      // Início da sessão: bot decide
      botDecide(state);

      // Rodar sessão (dt = 1s por passo)
      const passos = Math.floor(sessaoDuracao);
      for (let i = 0; i < passos; i++) {
        // Click manual antes do tick (o daemon toca por dt; o click é simultâneo)
        botClick(state, 1);
        const evt = tick(state, 1);

        // Verificar forjas e atos
        botDecide(state);

        // Registrar marcos
        if (evt.novosAtos.includes(2) && !marcos['ato2']) {
          marcos['ato2'] = tempoAbsoluto + i;
          timeline.push({ dia, tempo: tempoAbsoluto + i, evento: 'Ato II desbloqueado' });
        }
        if (evt.novosAtos.includes(3) && !marcos['ato3']) {
          marcos['ato3'] = tempoAbsoluto + i;
          timeline.push({ dia, tempo: tempoAbsoluto + i, evento: 'Ato III desbloqueado' });
        }
        if (evt.novosAtos.includes(4) && !marcos['ato4']) {
          marcos['ato4'] = tempoAbsoluto + i;
          timeline.push({ dia, tempo: tempoAbsoluto + i, evento: 'Ato IV desbloqueado' });
        }
        if (evt.novosAtos.includes(5) && !marcos['ato5']) {
          marcos['ato5'] = tempoAbsoluto + i;
          timeline.push({ dia, tempo: tempoAbsoluto + i, evento: 'Ato V desbloqueado' });
        }

        // Verificar forja do kernel
        if (state.run.forjados.includes('kernel') && !marcos['kernel']) {
          marcos['kernel'] = tempoAbsoluto + i;
          timeline.push({ dia, tempo: tempoAbsoluto + i, evento: 'kernel forjado!' });
        }
      }

      tempoAbsoluto += sessaoDuracao;
    }

    tempoAbsoluto += Math.max(0, segundosDia - perfil.sessoesPorDia * sessaoDuracao);
  }

  return { marcos, timeline };
}

// ── Formatação ───────────────────────────────────────────────────────────────
function fmtTempo(s) {
  if (s < 60) return `${s.toFixed(0)}s`;
  if (s < 3600) return `${(s / 60).toFixed(1)}min`;
  if (s < 86400) return `${(s / 3600).toFixed(1)}h`;
  return `dia ${(s / 86400).toFixed(1)}`;
}

function fmtAlvo(s, alvo) {
  const pct = s / alvo;
  if (pct <= 1.2) return '✓';
  if (pct <= 2.0) return '~';
  return '✗';
}

// ── Main ─────────────────────────────────────────────────────────────────────
console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║          BOOTSTRAP — Simulador de Balanceamento             ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

const DIAS = 14;
const resultados = [];

for (const perfil of PERFIS) {
  console.log(`\n── ${perfil.nome} (${perfil.sessoesPorDia}×${perfil.minPorSessao}min/dia) ──`);
  const { marcos, timeline } = simularPerfil(perfil, DIAS);

  // Timeline
  for (const ev of timeline) {
    console.log(`  dia ${String(ev.dia).padStart(2)} | ${fmtTempo(ev.tempo).padStart(8)} | ${ev.evento}`);
  }

  if (timeline.length === 0) console.log('  (nenhum marco atingido em 14 dias)');

  resultados.push({ perfil: perfil.nome, marcos });
}

// Tabela comparativa
console.log('\n\n── Tabela comparativa ──────────────────────────────────────────');
const cols = ['Ato II (<6min)', 'Ato III (dia 1)', 'Ato IV (dia 2)', 'Ato V (dia 4-6)', 'kernel (dia 9-14)'];
const chaves = ['ato2', 'ato3', 'ato4', 'ato5', 'kernel'];
const alvosRef = [6 * 60, 86400, 2 * 86400, 4 * 86400, 9 * 86400];

// Cabeçalho
const header = 'Perfil       ' + cols.map(c => c.padEnd(16)).join('');
console.log(header);
console.log('─'.repeat(header.length));

for (const { perfil, marcos } of resultados) {
  const linha = perfil.padEnd(13) + chaves.map((k, i) => {
    if (!marcos[k]) return '(não atingido)'.padEnd(16);
    const s = marcos[k];
    const status = fmtAlvo(s, alvosRef[i]);
    return `${status} ${fmtTempo(s)}`.padEnd(16);
  }).join('');
  console.log(linha);
}

console.log('\nLegenda: ✓ dentro do alvo  ~ até 2× o alvo  ✗ fora do alvo\n');
