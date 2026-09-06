#!/usr/bin/env node
// Validador estrutural do grafo de comandos e das conquistas.
// Verifica as 8 regras de invariância de GDD/09-BALANCEAMENTO.md.
// Saída legível. Exit code 1 se qualquer regra falhar.

import { CMDS, ORDER, TIERS, parentsOf, childrenOf } from '../src/data/commands.js';
import { LISTA as ACHIEVEMENTS } from '../src/data/achievements.js';
import { CICLOS_BASE, CICLOS_MAX_COMPRA } from '../src/data/upgrades.js';

let falhas = 0;

function ok(msg) {
  console.log(`  ✓  ${msg}`);
}

function falha(msg) {
  console.error(`  ✗  ${msg}`);
  falhas++;
}

function regra(n, desc) {
  console.log(`\nRegra ${n}: ${desc}`);
}

// ────────────────────────────────────────────────────────────────────────────

regra(1, 'Todo comando é alcançável a partir de echo');
{
  // BFS a partir de echo
  const visitados = new Set(['echo']);
  const fila = ['echo'];
  while (fila.length) {
    const atual = fila.shift();
    for (const filho of childrenOf(atual)) {
      if (!visitados.has(filho)) {
        visitados.add(filho);
        fila.push(filho);
      }
    }
  }
  const inalcançaveis = ORDER.filter(c => !visitados.has(c));
  if (inalcançaveis.length === 0) {
    ok(`Todos os ${ORDER.length} comandos alcançáveis a partir de echo`);
  } else {
    falha(`Comandos inalcançáveis: ${inalcançaveis.join(', ')}`);
  }
}

// ────────────────────────────────────────────────────────────────────────────

regra(2, 'Nenhum comando exige pai de tier ≥ ao seu (sem ciclo no grafo)');
{
  let ok2 = true;
  for (const cmd of ORDER) {
    for (const pai of parentsOf(cmd)) {
      if (CMDS[pai].tier >= CMDS[cmd].tier) {
        falha(`${cmd} (tier ${CMDS[cmd].tier}) exige ${pai} (tier ${CMDS[pai].tier})`);
        ok2 = false;
      }
    }
  }
  if (ok2) ok('Nenhum ciclo de tier no grafo');
}

// ────────────────────────────────────────────────────────────────────────────

regra(3, 'Nenhum comando exige pai de Ato posterior ao seu');
{
  let ok3 = true;
  for (const cmd of ORDER) {
    for (const pai of parentsOf(cmd)) {
      if (CMDS[pai].ato > CMDS[cmd].ato) {
        falha(`${cmd} (ato ${CMDS[cmd].ato}) exige ${pai} (ato ${CMDS[pai].ato})`);
        ok3 = false;
      }
    }
  }
  if (ok3) ok('Todos os pais são de atos iguais ou anteriores');
}

// ────────────────────────────────────────────────────────────────────────────

regra(4, 'Nenhum comando rende menos que qualquer um dos seus pais');
{
  let ok4 = true;
  for (const cmd of ORDER) {
    for (const pai of parentsOf(cmd)) {
      if (CMDS[cmd].y <= CMDS[pai].y) {
        falha(`${cmd} (y=${CMDS[cmd].y}) não supera ${pai} (y=${CMDS[pai].y})`);
        ok4 = false;
      }
    }
  }
  if (ok4) ok('Toda forja é upgrade de produção');
}

// ────────────────────────────────────────────────────────────────────────────

regra(5, 'Todo comando de tier ≥ 5 custa permissão; nenhum abaixo disso custa');
{
  let ok5 = true;
  for (const cmd of ORDER) {
    const { tier, perm } = CMDS[cmd];
    if (tier >= 5 && perm === 0) {
      falha(`${cmd} (tier ${tier}) deveria custar permissão`);
      ok5 = false;
    }
    if (tier < 5 && perm > 0) {
      falha(`${cmd} (tier ${tier}) não deveria custar permissão`);
      ok5 = false;
    }
  }
  if (ok5) ok('Tier 5+ custa permissão; tier < 5 não custa');
}

// ────────────────────────────────────────────────────────────────────────────

regra(6, 'Nenhuma folha sem efeito passivo');
{
  let ok6 = true;
  for (const cmd of ORDER) {
    const filhos = childrenOf(cmd);
    if (filhos.length === 0) {
      // É uma folha — precisa ter fx
      if (!CMDS[cmd].fx || Object.keys(CMDS[cmd].fx).length === 0) {
        falha(`${cmd} é folha sem efeito passivo`);
        ok6 = false;
      }
    }
  }
  if (ok6) ok('Toda folha tem efeito passivo');
}

// ────────────────────────────────────────────────────────────────────────────

regra(7, 'O total de ciclos obteníveis é ≤ 8 (escassez é o design)');
{
  // Máximo possível: base + comprados + de comandos + de conquistas
  const ciclosDeComandos = ORDER.reduce((s, c) => s + (CMDS[c].fx?.ciclos || 0), 0);
  const ciclosDeConquistas = 1; // achievement 'todos' dá +1
  const totalMax = CICLOS_BASE + CICLOS_MAX_COMPRA + ciclosDeComandos + ciclosDeConquistas;

  if (totalMax <= 8) {
    ok(`Máximo de ciclos obteníveis: ${totalMax} (base=${CICLOS_BASE}, compra=${CICLOS_MAX_COMPRA}, cmds=${ciclosDeComandos}, conquistas=${ciclosDeConquistas})`);
  } else {
    falha(`Total de ciclos obteníveis (${totalMax}) excede o teto de 8`);
  }
}

// ────────────────────────────────────────────────────────────────────────────

regra(8, 'Nenhuma conquista destranca conteúdo — só acelera');
{
  // fx permitidos: global, ciclo, permMult, tickBonus, frag
  // fx proibidos: qualquer coisa que desbloqueie comando, ato ou upgrade
  const fxPermitidos = new Set(['global', 'ciclo', 'permMult', 'tickBonus', 'frag']);
  let ok8 = true;
  for (const ach of ACHIEVEMENTS) {
    for (const k of Object.keys(ach.fx)) {
      if (!fxPermitidos.has(k)) {
        falha(`Conquista '${ach.id}' tem fx proibido: '${k}'`);
        ok8 = false;
      }
    }
  }
  // Verificar que nenhuma conquista tem fx que referencia comandos ou atos
  if (ok8) {
    ok(`Todas as ${ACHIEVEMENTS.length} conquistas apenas aceleram (não destrancam conteúdo)`);
  }
}

// ────────────────────────────────────────────────────────────────────────────

console.log('\n' + '─'.repeat(60));
if (falhas === 0) {
  console.log(`\n✓ Todas as 8 regras passaram. O grafo está íntegro.\n`);
  process.exit(0);
} else {
  console.error(`\n✗ ${falhas} regra(s) falharam. Corrija antes de continuar.\n`);
  process.exit(1);
}
