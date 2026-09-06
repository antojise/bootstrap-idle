#!/usr/bin/env node
// Gerador de documentação — regera as tabelas do GDD a partir de src/data/.
// Imprime as tabelas regeneradas no console com indicação de qual seção pertencem.
// Os números aqui são a fonte de verdade; editar as tabelas no GDD à mão as
// tornaria mentirosas sobre o código.

import { CMDS, ORDER } from '../src/data/commands.js';
import { UPGRADES, NOS, cicloCusto, daemonTick, daemonUpCusto,
         permTempo, permCusto, CICLOS_BASE, CICLOS_MAX_COMPRA,
         DAEMON_UP_MAX, PERM_NIVEL_MAX } from '../src/data/upgrades.js';
import { ARQUITETURAS, fragmentosPor } from '../src/data/prestige.js';
import { LISTA as ACHIEVEMENTS } from '../src/data/achievements.js';
import { ATOS } from '../src/data/acts.js';

function sep(titulo) {
  console.log('\n' + '═'.repeat(64));
  console.log(`  ${titulo}`);
  console.log('═'.repeat(64));
}

function fmt(n) {
  if (n === 0) return '—';
  if (n >= 1e12) return `${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9)  return `${(n / 1e9).toFixed(2)}G`;
  if (n >= 1e6)  return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3)  return `${(n / 1e3).toFixed(2)}k`;
  return String(n);
}

function fmtReq(req) {
  return Object.entries(req).map(([c, n]) => `\`${c}\` ×${n.toLocaleString()}`).join('<br>') || '—';
}

// ── GDD/04 — Tabela de comandos ──────────────────────────────────────────────
sep('GDD/04-ARVORE-E-FORJA.md — Tabela completa de comandos');
console.log('| Ato | Tier | Comando | B/exec | Marco exigido | Bytes | Permissões | Efeito passivo |');
console.log('|:---:|:----:|---------|-------:|---------------|------:|-----------:|----------------|');
for (const cmd of ORDER) {
  const d = CMDS[cmd];
  const fx = d.fx
    ? Object.entries(d.fx).map(([k, v]) => k === 'global' ? `+${(v*100).toFixed(0)}% produção global`
        : k === 'ciclos' ? `+${v} ciclo`
        : `${k}:${v}`).join(', ')
    : '—';
  const bytes = d.bytes === 0 ? '—' : fmt(d.bytes);
  const perm  = d.perm === 0  ? '—' : d.perm.toLocaleString();
  console.log(`| ${d.ato} | ${d.tier} | **\`${cmd}\`** | ${fmt(d.y)} | ${fmtReq(d.req)} | ${bytes} | ${perm} | ${fx} |`);
}

// ── GDD/02 — Ciclos ──────────────────────────────────────────────────────────
sep('GDD/02-ECONOMIA.md — Ciclos (capacidade de automação)');
console.log('| Compra | Custo |');
console.log('|:-:|---:|');
for (let i = 0; i < CICLOS_MAX_COMPRA; i++) {
  console.log(`| ${i + 1}º | ${fmt(cicloCusto(i))} B |`);
}
console.log(`\nTeto: **${CICLOS_BASE} base + ${CICLOS_MAX_COMPRA} comprados + 2 de comandos (wc, paste) + 1 de conquista = 8 ciclos** para 25 comandos.`);

// ── GDD/02 — Velocidade dos daemons ─────────────────────────────────────────
sep('GDD/02-ECONOMIA.md — Velocidade dos daemons');
console.log('| Nível | Segundos por execução | Custo |');
console.log('|:-:|:-:|---:|');
for (let up = 0; up <= DAEMON_UP_MAX; up++) {
  const custo = up === 0 ? 'inicial' : `${fmt(daemonUpCusto(up - 1))} B`;
  console.log(`| ${up} | ${daemonTick(up).toFixed(2)}s | ${custo} |`);
}

// ── GDD/02 — Permissões ──────────────────────────────────────────────────────
sep('GDD/02-ECONOMIA.md — Emissão de permissões (o muro do Ato III)');
console.log('| Nível do kernel | 1 permissão a cada | Custo do upgrade |');
console.log('|:-:|:-:|---:|');
for (let n = 1; n <= PERM_NIVEL_MAX; n++) {
  const custo = n === 1 ? 'inicial' : `${fmt(permCusto(n - 1))} B`;
  console.log(`| ${n} | ${permTempo(n).toFixed(0)}s | ${custo} |`);
}
const permDia = Math.floor(86400 / permTempo(PERM_NIVEL_MAX));
console.log(`\nTeto no nível ${PERM_NIVEL_MAX}: **${permDia.toLocaleString()} permissões por dia, no máximo absoluto.**`);

// ── GDD/02 — Melhorias ───────────────────────────────────────────────────────
sep('GDD/02-ECONOMIA.md — Melhorias');
console.log('| Melhoria | Ato | Bytes | § | O que faz | A dor que ela responde |');
console.log('|---|:-:|---:|--:|---|---|');
for (const [id, up] of Object.entries(UPGRADES)) {
  console.log(`| **${up.nome}** | ${up.ato} | ${fmt(up.bytes)} | ${up.perm || '—'} | ${up.desc} | *${up.resolve}* |`);
}

// ── GDD/02 — Nós da rede ─────────────────────────────────────────────────────
sep('GDD/02-ECONOMIA.md — Nós da rede (Ato IV)');
console.log('| Nó | Custo | Produção | Regra própria | Quando compensa |');
console.log('|---|---:|:-:|---|---|');
for (const [id, no] of Object.entries(NOS)) {
  const regra = no.risco ? `${(no.risco * 100).toFixed(0)}% de perder o tick por minuto`
    : no.permBonus ? `permissões ${(no.permBonus * 100).toFixed(0)}% mais rápido`
    : no.latencia ? `marcos contam ${no.latencia}× mais devagar`
    : 'nenhuma';
  console.log(`| **${no.nome}** | ${no.custo ? fmt(no.custo) : '—'} | ×${no.mult} | ${regra} | — |`);
}

// ── GDD/05 — Arquiteturas ────────────────────────────────────────────────────
sep('GDD/05-PRESTIGIO.md — Arquiteturas de recompilação');
console.log('| Arquitetura | Mult. | Destravan | Efeito | Quando |');
console.log('|---|:-:|:-:|---|---|');
for (const [id, arq] of Object.entries(ARQUITETURAS)) {
  console.log(`| **${arq.nome}** | ×${arq.mult} | ${arq.destrava} runs | ${arq.desc} | ${arq.quando} |`);
}

// ── GDD/06 — Conquistas resumo ───────────────────────────────────────────────
sep('GDD/06-CONQUISTAS.md — Totais');
const cats = {};
for (const a of ACHIEVEMENTS) {
  cats[a.cat] = (cats[a.cat] || 0) + 1;
}
console.log(`Total: ${ACHIEVEMENTS.length} conquistas`);
for (const [cat, n] of Object.entries(cats)) {
  const ocultas = ACHIEVEMENTS.filter(a => a.cat === cat && a.oculta).length;
  console.log(`  ${cat}: ${n}${ocultas ? ` (${ocultas} oculta${ocultas > 1 ? 's' : ''})` : ''}`);
}

// ── GDD/03 — Atos ────────────────────────────────────────────────────────────
sep('GDD/03-PROGRESSAO.md — Atos e gatilhos');
console.log('| Ato | Nome | Gatilho | Revela |');
console.log('|:-:|---|---|---|');
for (const ato of ATOS) {
  const gatilho = ato.gatilho === 'início' ? 'início do jogo'
    : ato.gatilho.forjados ? `${ato.gatilho.forjados} comandos forjados`
    : `tier ${ato.gatilho.tier} forjado`;
  console.log(`| ${ato.n} | **${ato.nome}** | ${gatilho} | ${ato.revela.join(', ')} |`);
}

console.log('\n\n✓ Documentação regerada com sucesso. Os números acima são a fonte de verdade.\n');
