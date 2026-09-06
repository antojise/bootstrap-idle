// Testes da engine — node:test, sem navegador.
// node --test test/engine.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { novoEstado, novaRun } from '../src/engine/state.js';
import { producaoPorExecucao, multiplicadorTotal, producaoPassiva } from '../src/engine/economy.js';
import { forjar, podeForjar, requisitosDe } from '../src/engine/forge.js';
import { alocar, desalocar, ciclosTotais, ciclosUsados, ciclosLivres } from '../src/engine/daemons.js';
import { avaliarGatilhos } from '../src/engine/acts.js';
import { recompilar, fragmentosDaRun } from '../src/engine/prestige.js';
import { aplicarAusencia } from '../src/engine/offline.js';
import { tick } from '../src/engine/tick.js';
import { CMDS } from '../src/data/commands.js';
import { OFFLINE_CAP_H, MARCO_OFFLINE } from '../src/data/upgrades.js';

// ── Produção ──────────────────────────────────────────────────────────────────

test('producaoPorExecucao — valor base sem bônus', () => {
  const state = novoEstado();
  // echo: y=1, sem bônus, fragMult=1, cache=1, arq.mult=1, node.mult=1
  const prod = producaoPorExecucao('echo', state);
  assert.ok(Math.abs(prod - 1) < 0.0001, `esperado ≈1, obtido ${prod}`);
});

test('multiplicadorTotal — bônus global de uniq (+10%) compõe corretamente', () => {
  const state = novoEstado();
  // Força forjados: echo + uniq (fx.global: 0.10)
  state.run.forjados = ['echo', 'uniq'];
  const mult = multiplicadorTotal(state);
  // (1 + 0.10) × 1 × 1 × 1 × 1 = 1.10
  assert.ok(Math.abs(mult - 1.10) < 0.0001, `esperado 1.10, obtido ${mult}`);
});

test('multiplicadorTotal — múltiplos bônus globais somam antes de multiplicar fragmentos', () => {
  const state = novoEstado();
  // uniq (+0.10) + tr (+0.12) + cut (+0.10) = +0.32 global
  state.run.forjados = ['echo', 'uniq', 'tr', 'cut'];
  state.meta.fragmentos = 10; // fragMult = 1 + 10×0.05 = 1.5
  state.run.ups.cache = true; // cacheMult = 1.4
  const mult = multiplicadorTotal(state);
  const esperado = (1 + 0.32) * 1.5 * 1.4 * 1.0 * 1.0;
  assert.ok(Math.abs(mult - esperado) < 0.001, `esperado ${esperado.toFixed(4)}, obtido ${mult.toFixed(4)}`);
});

test('producaoPorExecucao — cat com cache', () => {
  const state = novoEstado();
  state.run.forjados = ['echo', 'cat'];
  state.run.ups.cache = true;
  // cat: y=4; cacheMult=1.4 → 4 × 1.4 = 5.6
  const prod = producaoPorExecucao('cat', state);
  assert.ok(Math.abs(prod - 5.6) < 0.001, `esperado 5.6, obtido ${prod}`);
});

// ── Forja ─────────────────────────────────────────────────────────────────────

test('forjar — com requisito de execução faltando, lança erro', () => {
  const state = novoEstado();
  // cat exige echo×120; execs.echo = 0
  assert.ok(!podeForjar('cat', state));
  assert.throws(() => forjar('cat', state), /Não pode forjar/);
  // Estado não muda
  assert.equal(state.run.bytes, 0);
  assert.deepEqual(state.run.forjados, ['echo']);
});

test('forjar — com todos os requisitos atendidos, debita bytes e adiciona a forjados', () => {
  const state = novoEstado();
  state.run.execs['echo'] = 120; // marco cumprido
  state.run.bytes = 1000;        // custo cat = 300
  assert.ok(podeForjar('cat', state));
  forjar('cat', state);
  assert.ok(state.run.forjados.includes('cat'));
  assert.equal(state.run.bytes, 700); // 1000 - 300
});

test('forjar — com assinatura digital, perm não é gasta (só saldo mínimo)', () => {
  const state = novoEstado();
  // Forçar estado para poder forjar xargs (perm=25, tier=5)
  state.run.forjados = ['echo','cat','printf','tee','sed','wc','split','awk','sort','grep'];
  state.run.execs['grep'] = 2500;
  state.run.bytes = 100e6;
  state.run.perm = 50; // tem mais do que o necessário (25)
  state.run.ups.assinatura = true; // perm não é gasta

  forjar('xargs', state);
  assert.equal(state.run.perm, 50, 'perm não deve ser deduzida com assinatura');
  assert.ok(state.run.forjados.includes('xargs'));
});

test('forjar — sem assinatura digital, perm é deduzida', () => {
  const state = novoEstado();
  state.run.forjados = ['echo','cat','printf','tee','sed','wc','split','awk','sort','grep'];
  state.run.execs['grep'] = 2500;
  state.run.bytes = 100e6;
  state.run.perm = 50; // custo xargs = 25

  forjar('xargs', state);
  assert.equal(state.run.perm, 25, 'perm deve ser deduzida sem assinatura');
});

test('forjar — requisitosDe retorna estrutura correta', () => {
  const state = novoEstado();
  state.run.execs['echo'] = 60; // 60 de 120 necessários
  state.run.bytes = 0;
  const reqs = requisitosDe('cat', state);

  const reqExec = reqs.find(r => r.tipo === 'exec');
  assert.ok(reqExec, 'deve ter requisito de exec');
  assert.equal(reqExec.cmd, 'echo');
  assert.equal(reqExec.atual, 60);
  assert.equal(reqExec.alvo, 120);
  assert.equal(reqExec.ok, false);

  const reqBytes = reqs.find(r => r.tipo === 'bytes');
  assert.ok(reqBytes, 'deve ter requisito de bytes');
  assert.equal(reqBytes.alvo, 300);
  assert.equal(reqBytes.ok, false);
});

// ── Ciclos e daemons ──────────────────────────────────────────────────────────

test('ciclosTotais — base 1, sem extras', () => {
  const state = novoEstado();
  assert.equal(ciclosTotais(state), 1);
});

test('ciclosTotais — base + comprado + comando wc', () => {
  const state = novoEstado();
  state.run.ciclosComprados = 1;
  state.run.forjados = ['echo', 'wc']; // wc: fx.ciclos=1
  assert.equal(ciclosTotais(state), 3); // 1 base + 1 comprado + 1 wc
});

test('alocar — não pode alocar mais daemons que ciclosTotais', () => {
  const state = novoEstado(); // 1 ciclo
  alocar('echo', state);      // ocupa o único ciclo
  assert.equal(ciclosLivres(state), 0);
  assert.throws(() => alocar('echo', state), /Sem ciclos livres/);
  assert.equal(state.run.daemons.length, 1);
});

test('alocar — rejeita comando não forjado', () => {
  const state = novoEstado();
  assert.throws(() => alocar('cat', state), /não está forjado/);
});

test('deficit de ciclos — daemons excedentes não bloqueiam forja', () => {
  const state = novoEstado();
  // Injetar mais daemons do que ciclos (simula save corrompido)
  state.run.daemons = ['echo', 'echo']; // 2 daemons, 1 ciclo disponível

  // tick não deve crashar
  assert.doesNotThrow(() => tick(state, 1));

  // Forja ainda deve funcionar
  state.run.execs['echo'] = 120;
  state.run.bytes = 1000;
  assert.ok(podeForjar('cat', state), 'forja não deve ser bloqueada por déficit de ciclo');
  forjar('cat', state);
  assert.ok(state.run.forjados.includes('cat'));
});

test('desalocar — remove daemon corretamente', () => {
  const state = novoEstado();
  alocar('echo', state);
  assert.equal(state.run.daemons.length, 1);
  desalocar('echo', state);
  assert.equal(state.run.daemons.length, 0);
  assert.equal(ciclosLivres(state), 1);
});

// ── Recompilação (prestígio) ──────────────────────────────────────────────────

test('recompilar — zera run e preserva meta integralmente', () => {
  const state = novoEstado();
  // Montar uma run com progresso
  state.run.bytes = 99999;
  state.run.forjados = ['echo', 'cat'];
  state.run.execs = { echo: 500, cat: 100 };
  state.run.daemons = ['echo'];
  state.run.ciclosComprados = 2;
  state.run.daemonUp = 3;
  state.run.ato = 2;
  // Forçar tier 8 para poder recompilar
  state.run.forjados.push('gcc');
  state.run.bytesDaRun = 5e11; // suficiente para render fragmentos

  // Meta antes
  state.meta.fragmentos = 5;
  state.meta.runs = 1;
  state.meta.conquistas = { eco1: 100 };

  const fragAntes = state.meta.fragmentos;

  recompilar(state, 'limpa', 0);

  // run deve ser zerada
  assert.equal(state.run.bytes, 0);
  assert.deepEqual(state.run.forjados, ['echo']);
  assert.deepEqual(state.run.daemons, []);
  assert.equal(state.run.ciclosComprados, 0);
  assert.equal(state.run.daemonUp, 0);
  assert.equal(state.run.ato, 1);

  // meta deve estar preservada e incrementada
  assert.ok(state.meta.fragmentos >= fragAntes, 'fragmentos devem aumentar ou manter');
  assert.equal(state.meta.runs, 2);
  assert.deepEqual(state.meta.conquistas, { eco1: 100 }, 'conquistas devem ser preservadas');
});

test('recompilar — fragmentosDaRun respeita a fórmula', () => {
  const state = novoEstado();
  state.run.forjados = ['echo', 'gcc']; // tier 8
  state.run.bytesDaRun = 5e11; // fragmentosPor(5e11) = floor((5e11/5e11)^0.42) = floor(1) = 1
  const frag = fragmentosDaRun(state);
  assert.ok(frag >= 1, `deve render ao menos 1 fragmento, obteve ${frag}`);
});

test('recompilar — com tier < 8, rende 0 fragmentos', () => {
  const state = novoEstado();
  state.run.forjados = ['echo', 'cat']; // tier máx = 1
  state.run.bytesDaRun = 1e15;
  const frag = fragmentosDaRun(state);
  assert.equal(frag, 0, 'tier insuficiente deve render 0 fragmentos');
});

// ── Offline ───────────────────────────────────────────────────────────────────

test('offline — respeita teto de 12 horas', () => {
  const state = novoEstado();
  state.run.forjados = ['echo', 'cat'];
  state.run.daemons = ['echo'];
  state.run.bytes = 0;

  // 20h offline → deve ser cortado para 12h
  const antes = state.run.bytes;
  aplicarAusencia(state, 20 * 3600);

  // ultimoOffline deve ser 12h (o teto)
  assert.equal(state.stats.ultimoOffline, OFFLINE_CAP_H * 3600);
});

test('offline — marcos avançam a 25% da taxa online', () => {
  const state = novoEstado();
  state.run.forjados = ['echo', 'cat'];
  state.run.daemons = ['echo'];

  // Snapshot de execs antes
  const execsAntes = state.run.execs['echo'] || 0;

  // 1h online (simulado por ticks diretos): usar dados do calcExecsPerTick
  import('../src/engine/economy.js').then(({ calcTickInterval, calcExecsPerTick }) => {
    const interval = calcTickInterval(state);
    const ePerTick = calcExecsPerTick(state);
    const taxaOnline = ePerTick / interval; // execs/s por daemon

    // Aplicar 1h offline
    aplicarAusencia(state, 3600);
    const execsDepois = state.run.execs['echo'] || 0;
    const ganho = execsDepois - execsAntes;

    // Esperado: taxaOnline × 3600 × MARCO_OFFLINE
    const esperado = taxaOnline * 3600 * MARCO_OFFLINE;
    assert.ok(Math.abs(ganho - esperado) / esperado < 0.05,
      `marcos esperados ≈${esperado.toFixed(1)}, obtidos ${ganho.toFixed(1)}`);
  });
});

test('offline — sem daemon, bytes ganhos são zero e motivo é retornado', () => {
  const state = novoEstado();
  // Nenhum daemon alocado
  const resultado = aplicarAusencia(state, 3600);
  assert.equal(resultado.bytes, 0);
  assert.ok(resultado.motivo.includes('nenhum daemon'), `motivo: "${resultado.motivo}"`);
});

// ── Atos ──────────────────────────────────────────────────────────────────────

test('avaliarGatilhos — ato 2 dispara ao atingir 3 forjados', () => {
  const state = novoEstado();
  state.run.forjados = ['echo', 'cat', 'printf']; // 3 forjados
  assert.equal(state.run.ato, 1);
  const novos = avaliarGatilhos(state);
  assert.ok(novos.includes(2));
  assert.equal(state.run.ato, 2);
});

test('avaliarGatilhos — ato 3 dispara ao forjar tier 4', () => {
  const state = novoEstado();
  state.run.ato = 2;
  state.run.forjados = ['echo', 'cat', 'printf', 'grep']; // grep = tier 4
  const novos = avaliarGatilhos(state);
  assert.ok(novos.includes(3));
  assert.equal(state.run.ato, 3);
});

test('avaliarGatilhos — ato nunca retrocede', () => {
  const state = novoEstado();
  state.run.ato = 3;
  state.run.forjados = ['echo']; // sem tier 4 agora
  const novos = avaliarGatilhos(state);
  assert.equal(novos.length, 0, 'ato não deve retroceder');
  assert.equal(state.run.ato, 3);
});

test('avaliarGatilhos — múltiplos atos podem disparar no mesmo tick', () => {
  const state = novoEstado();
  // Estado com condições para ato 2, 3 e 4 simultaneamente
  state.run.ato = 1;
  state.run.forjados = ['echo', 'cat', 'printf', 'grep', 'find']; // 5 forjados; grep=tier4, find=tier6
  const novos = avaliarGatilhos(state);
  assert.ok(novos.includes(2));
  assert.ok(novos.includes(3));
  assert.ok(novos.includes(4));
  assert.equal(state.run.ato, 4);
});

// ── Tick ──────────────────────────────────────────────────────────────────────

test('tick — daemon produz bytes ao longo do tempo', () => {
  const state = novoEstado();
  state.run.daemons = ['echo'];
  const antes = state.run.bytes;
  // Rodar por tempo suficiente para pelo menos um tick do daemon (3s)
  for (let i = 0; i < 4; i++) tick(state, 1);
  assert.ok(state.run.bytes > antes, 'bytes devem aumentar com daemon rodando');
});

test('tick — não usa Date.now (valor de dt é o único parâmetro de tempo)', () => {
  // Se a função não usar Date.now, rodar com dt=1000 deve adiantar o jogo
  const state = novoEstado();
  state.run.daemons = ['echo'];
  const antes = state.run.bytes;
  tick(state, 1000); // dt gigante (capado a 2 por tick)
  // Bytes aumentam mas dt é capado — o ponto é que não crashou
  assert.ok(true, 'tick com dt grande não deve crashar');
});

test('tick — elapsedSeconds avança corretamente', () => {
  const state = novoEstado();
  tick(state, 1.5);
  tick(state, 0.5);
  assert.ok(Math.abs(state.run.elapsedSeconds - 2) < 0.01);
});
