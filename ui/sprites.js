// Sprites — cada comando ganha um glifo de pixel art gerado a partir do próprio nome.
//
// Por que gerado e não um pacote de PNG: são 25 comandos e o jogo é um terminal.
// Um sprite sheet de RPG pesaria megabytes e brigaria com a estética. Aqui o desenho
// é determinístico (o mesmo nome sempre gera o mesmo glifo), pesa zero e escala em
// qualquer resolução porque sai como SVG.

import { CMDS } from '../src/data/commands.js';

const GRID = 7;      // 7x7 pixels
const META = 4;      // gera 4 colunas e espelha — todo glifo fica simétrico

// FNV-1a: hash estável, mesmo resultado em qualquer navegador.
function hash(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

// xorshift32 — PRNG minúsculo, determinístico.
function rng(seed) {
  let s = seed || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5;  s >>>= 0;
    return s / 4294967296;
  };
}

// Paleta por tier: o glifo esquenta conforme o comando sobe na árvore.
export const CORES_TIER = [
  '#3f6212', // 0  echo — verde apagado
  '#4d7c0f', // 1
  '#65a30d', // 2
  '#4ade80', // 3
  '#22d3ee', // 4  o kernel acorda
  '#38bdf8', // 5
  '#818cf8', // 6  a rede
  '#a78bfa', // 7
  '#e879f9', // 8  recompilação
  '#fb923c', // 9
  '#fbbf24', // 10 kernel
];

export const corDoTier = (t) => CORES_TIER[Math.min(t, CORES_TIER.length - 1)];

const cache = new Map();

// Matriz booleana 7x7 simétrica, derivada do nome.
function matriz(nome) {
  if (cache.has(nome)) return cache.get(nome);
  const r = rng(hash(nome));
  const m = [];
  for (let y = 0; y < GRID; y++) {
    const linha = new Array(GRID).fill(false);
    for (let x = 0; x < META; x++) {
      // A coluna central e as bordas ficam mais raras: evita glifo virar borrão.
      const peso = x === 0 ? 0.42 : x === META - 1 ? 0.62 : 0.52;
      const on = r() < peso;
      linha[x] = on;
      linha[GRID - 1 - x] = on;
    }
    m.push(linha);
  }
  // Garantia: nenhum glifo sai vazio.
  if (!m.some(l => l.some(Boolean))) m[3][3] = true;
  cache.set(nome, m);
  return m;
}

// SVG do glifo. `viva` acende dois pixels extras que pulsam (daemon rodando).
export function spriteSVG(cmd, { tam = 28, viva = false } = {}) {
  const dados = CMDS[cmd];
  const cor = corDoTier(dados ? dados.tier : 0);
  const m = matriz(cmd);
  const p = 100 / GRID;
  let rects = '';
  let acesos = 0;
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      if (!m[y][x]) continue;
      acesos++;
      const pulsa = viva && acesos % 5 === 0;
      rects += `<rect x="${(x * p).toFixed(2)}" y="${(y * p).toFixed(2)}" `
             + `width="${p.toFixed(2)}" height="${p.toFixed(2)}"`
             + (pulsa ? ' class="px-viva"' : '') + '/>';
    }
  }
  return `<svg class="sprite" viewBox="0 0 100 100" width="${tam}" height="${tam}" `
       + `fill="${cor}" aria-hidden="true" shape-rendering="crispEdges">${rects}</svg>`;
}

// Ícone do app (PWA / favicon): o glifo do kernel dentro de uma moldura.
export function iconeApp(tam = 512) {
  const inner = spriteSVG('kernel', { tam: 100 });
  const corpo = inner.slice(inner.indexOf('>') + 1, inner.lastIndexOf('</svg>'));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${tam}" height="${tam}">`
       + `<rect width="100" height="100" fill="#0a0c0a"/>`
       + `<g transform="translate(14 14) scale(0.72)" fill="#fbbf24" shape-rendering="crispEdges">${corpo}</g>`
       + `</svg>`;
}
