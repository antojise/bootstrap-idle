// BOOTSTRAP — camada de interface.
// A engine é pura: tudo que toca document, localStorage ou o relógio vive aqui.

import { novoEstado, validarEstado }        from '../src/engine/state.js';
import { tick, destravarDeadlock }          from '../src/engine/tick.js';
import { executarCmd, producaoPassiva, producaoPorExecucao,
         multiplicadorTotal, calcTickInterval, calcExecsPerTick } from '../src/engine/economy.js';
import { requisitosDe, podeForjar, forjar, cmdsVisiveis } from '../src/engine/forge.js';
import { ciclosTotais, ciclosUsados, ciclosLivres,
         alocar, desalocar, daemonsEmDeficit, gargalos } from '../src/engine/daemons.js';
import { aplicarAusencia }                  from '../src/engine/offline.js';
import { fragmentosDaRun, recompilar }      from '../src/engine/prestige.js';
import * as loja                            from '../src/engine/shop.js';
import { CMDS, ORDER, TIERS, parentsOf }    from '../src/data/commands.js';
import { ATOS }                             from '../src/data/acts.js';
import { UPGRADES, NOS, permTempo }         from '../src/data/upgrades.js';
import { ARQUITETURAS, RECOMP_MIN_TIER }    from '../src/data/prestige.js';
import { LISTA as CONQUISTAS, CATEGORIAS }  from '../src/data/achievements.js';
import { spriteSVG }                        from './sprites.js';

// ═══════════════════════════ formatação ═══════════════════════════

const UNI = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

function fmtB(n) {
  if (!isFinite(n)) return '∞';
  // Abaixo de 10 bytes as casas decimais importam: é a diferença entre
  // "0 B/s" e "0.48 B/s" na tela de daemons no começo do jogo.
  if (n < 1000) return (n >= 10 || Number.isInteger(n) ? Math.floor(n) : n.toFixed(2)) + ' B';
  let v = n, i = 0;
  while (v >= 1000 && i < UNI.length - 1) { v /= 1000; i++; }
  if (v >= 1000) return v.toExponential(2).replace('e+', 'e') + ' ' + UNI[i];
  return (v < 10 ? v.toFixed(2) : v < 100 ? v.toFixed(1) : Math.round(v)) + ' ' + UNI[i];
}

function fmtN(n) {
  n = Math.floor(n);
  if (n < 1000) return String(n);
  if (n < 1e6)  return (n / 1e3).toFixed(n < 1e4 ? 1 : 0) + 'k';
  if (n < 1e9)  return (n / 1e6).toFixed(n < 1e7 ? 1 : 0) + 'M';
  if (n < 1e12) return (n / 1e9).toFixed(1) + 'G';
  return (n / 1e12).toFixed(1) + 'T';
}

function fmtT(s) {
  s = Math.floor(s);
  if (s < 60) return s + 's';
  if (s < 3600) return Math.floor(s / 60) + 'min';
  if (s < 86400) return Math.floor(s / 3600) + 'h ' + Math.floor((s % 3600) / 60) + 'min';
  return Math.floor(s / 86400) + 'd ' + Math.floor((s % 86400) / 3600) + 'h';
}

// ═══════════════════════════ dom ═══════════════════════════

const $  = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

function el(tag, cls, html) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
}

// ═══════════════════════════ save ═══════════════════════════

const CHAVE = 'bootstrap_v2';
let state, primeiraVez = false;

function salvar() {
  try {
    localStorage.setItem(CHAVE, JSON.stringify({ ...state, _ts: Date.now() }));
  } catch { /* modo privado, cota cheia — o jogo continua rodando na memória */ }
}

function carregar() {
  let cru = null;
  try { cru = JSON.parse(localStorage.getItem(CHAVE) || 'null'); } catch {}
  if (!cru) { primeiraVez = true; return novoEstado(); }

  const ts = cru._ts || Date.now();
  const s  = validarEstado(cru);
  const fora = Math.floor((Date.now() - ts) / 1000);
  if (fora > 30) pendenteOffline = { s, fora };
  return s;
}

let pendenteOffline = null;

// ═══════════════════════════ efeitos ═══════════════════════════

const fx = $('#fx');
let semFx = false;

function numFlutuante(x, y, texto, ambar) {
  if (semFx && Math.random() > .4) return;
  const n = el('div', 'fx-num' + (ambar ? ' amb' : ''), texto);
  n.style.left = x + 'px';
  n.style.top  = y + 'px';
  fx.appendChild(n);
  setTimeout(() => n.remove(), 1050);
}

function toast(titulo, texto) {
  const t = el('div', 'toast', `<span class="t">${titulo}</span>${texto}`);
  $('#toasts').appendChild(t);
  setTimeout(() => t.remove(), 4000);
}

function tremer() {
  if (semFx) return;
  document.body.classList.add('treme');
  setTimeout(() => document.body.classList.remove('treme'), 320);
}

const LOG_MAX = 40;
function log(txt, tipo) {
  const c = $('#log');
  c.appendChild(el('div', tipo || '', txt));
  while (c.children.length > LOG_MAX) c.firstChild.remove();
  c.scrollTop = c.scrollHeight;
}

// Overlay grande — usado para ato novo, ganho offline e confirmação de recompilação.
let filaOverlay = [];
function abrirOverlay(o) { filaOverlay.push(o); if (filaOverlay.length === 1) desenhaOverlay(); }

function desenhaOverlay() {
  const o = filaOverlay[0];
  if (!o) { $('#ato-ov').classList.remove('on'); return; }
  $('#ov-n').textContent    = o.n || '';
  $('#ov-tit').textContent  = o.titulo;
  $('#ov-txt').textContent  = o.texto || '';
  $('#ov-rev').innerHTML    = o.rev || '';
  $('#ov-btn').textContent  = o.btn || 'CONTINUAR';
  $('#ov-btn').className    = 'btn ' + (o.classe || 'pri');
  $('#ato-ov').classList.add('on');
  $('#ov-btn').onclick = () => {
    if (o.aoConfirmar) o.aoConfirmar();
    filaOverlay.shift();
    desenhaOverlay();
  };
  $('#ov-cancel').style.display = o.cancelavel ? 'block' : 'none';
  $('#ov-cancel').onclick = () => { filaOverlay.shift(); desenhaOverlay(); };
}

// ═══════════════════════════ ações ═══════════════════════════

const marcoMult = () => {
  const no = NOS[state.run.noAtual];
  return no && no.latencia ? 1 / no.latencia : 1;
};

function cmdAtivo() {
  const c = state.cfg.cmdAtivo;
  if (c && state.run.forjados.includes(c)) return c;
  return melhorForjado();
}

function melhorForjado() {
  return [...state.run.forjados].sort((a, b) => CMDS[b].y - CMDS[a].y)[0] || 'echo';
}

function executar(cmd, ev) {
  const n = state.run.ups.pipe ? 2 : 1;
  const b = executarCmd(cmd, state, n, marcoMult());
  if (ev) {
    const r = ev.currentTarget.getBoundingClientRect();
    const x = (ev.clientX || r.left + r.width / 2) + (Math.random() * 40 - 20);
    numFlutuante(x, r.top + r.height * .35, '+' + fmtB(b));
  }
  return b;
}

function tentarForjar(cmd) {
  if (!podeForjar(cmd, state)) return false;
  forjar(cmd, state);
  tremer();
  log(`forjado: ${cmd} — ${CMDS[cmd].desc}`, 'ok');
  toast('COMANDO FORJADO', `${cmd} entrou na árvore.`);
  state.cfg.cmdAtivo = cmd;
  invalidarTudo();
  salvar();
  return true;
}

function alternarDaemon(cmd) {
  const { run } = state;
  if (run.deadlocks[cmd] > 0) {
    destravarDeadlock(cmd, state);
    log(`deadlock destravado em ${cmd}`, 'aviso');
    return;
  }
  if (run.daemons.includes(cmd)) {
    desalocar(cmd, state);
  } else if (ciclosLivres(state) > 0) {
    alocar(cmd, state);
  } else {
    toast('SEM CICLO LIVRE', 'Libere um daemon ou compre um ciclo em SISTEMA.');
    return;
  }
  invalidarTudo();
  salvar();
}

function comprar(fn, arg, rotulo) {
  const ok = arg !== undefined ? fn(arg, state) : fn(state);
  if (ok) {
    log(`comprado: ${rotulo}`, 'ok');
    tremer();
    invalidarTudo();
    salvar();
  }
  return ok;
}

// ═══════════════════════════ painéis ═══════════════════════════
// Cada painel constrói o DOM uma vez e depois só atualiza números.
// Redesenhar tudo a cada quadro recria o botão embaixo do dedo do jogador.

const P = {};
let atual = 'exec';

function invalidarTudo() { for (const k in P) P[k].sig = null; }

function trocarAba(id) {
  atual = id;
  $$('.painel').forEach(p => p.classList.toggle('on', p.id === 'p-' + id));
  $$('#nav button').forEach(b => b.classList.toggle('sel', b.dataset.aba === id));
  P[id].sig = null;
  render();
  $('#tela').scrollTop = 0;
}

// ── EXEC ─────────────────────────────────────────────────────────────────────

P.exec = {
  sig: null,
  chave: () => `${state.run.forjados.length}|${cmdAtivo()}|${!!state.run.ups.alias}|${state.run.ato}`,
  construir() {
    const cmd = cmdAtivo();
    const alvo = $('#exec-alvo');
    alvo.innerHTML =
      spriteSVG(cmd, { tam: 34 }) +
      `<div><div id="exec-nome">${cmd}</div><div id="exec-desc">${CMDS[cmd].desc}</div></div>` +
      `<div id="exec-y"><span id="exec-yv">—</span><small>POR TOQUE</small></div>`;

    $('#btn-exec-nome').textContent = cmd;

    // Barra de atalhos: só existe depois da melhoria `alias`.
    const bar = $('#alias');
    bar.classList.toggle('on', !!state.run.ups.alias);
    bar.innerHTML = '';
    if (state.run.ups.alias) {
      [...state.run.forjados].sort((a, b) => CMDS[b].y - CMDS[a].y).slice(0, 4).forEach(c => {
        const b = el('button', c === cmd ? 'sel' : '', spriteSVG(c, { tam: 18 }) + `<span>${c}</span>`);
        b.onclick = () => { state.cfg.cmdAtivo = c; P.exec.sig = null; render(); salvar(); };
        bar.appendChild(b);
      });
    }

    $('#ciclos-resumo').classList.toggle('on', state.run.ato >= 2);
  },
  atualizar() {
    const cmd = cmdAtivo();
    const yv = $('#exec-yv');
    if (yv) yv.textContent = fmtB(producaoPorExecucao(cmd, state) * (state.run.ups.pipe ? 2 : 1));

    if (state.run.ato >= 2) {
      const total = ciclosTotais(state), usados = state.run.daemons.length;
      const fila = $('#slot-fila');
      if (fila.children.length !== total) {
        fila.innerHTML = '';
        for (let i = 0; i < total; i++) fila.appendChild(el('div', 'slot'));
      }
      [...fila.children].forEach((s, i) => {
        const cmdD = state.run.daemons[i];
        s.className = 'slot' + (cmdD ? ' cheio' : '') + (state.run.deadlocks[cmdD] > 0 ? ' travado' : '');
        const svg = cmdD ? spriteSVG(cmdD, { tam: 20 }) : '';
        if (s.dataset.c !== (cmdD || '')) { s.innerHTML = svg; s.dataset.c = cmdD || ''; }
      });
      $('#ciclos-txt').innerHTML = usados > total
        ? `<span style="color:var(--red)">${usados}/${total} ciclos — ${usados - total} daemon(s) parado(s)</span>`
        : `${usados}/${total} ciclos em uso · ${fmtB(producaoPassiva(state))}/s passivo`;
    }
  },
};

// ── ÁRVORE ───────────────────────────────────────────────────────────────────

P.arvore = {
  sig: null,
  chave: () => `${state.run.ato}|${state.run.forjados.join()}`,
  refs: [],
  construir() {
    const c = $('#p-arvore');
    c.innerHTML = '';
    this.refs = [];

    const visiveis = cmdsVisiveis(state);
    const tiers = [...new Set(visiveis.map(x => CMDS[x].tier))].sort((a, b) => a - b);

    for (const t of tiers) {
      const lista = TIERS[t].filter(x => visiveis.includes(x));
      const bloco = el('div', 'tier');
      bloco.appendChild(el('div', 'tier-rot', `TIER ${t}`));
      const linha = el('div', 'tier-linha' + (lista.length === 1 ? ' um' : lista.length === 2 ? ' dois' : ''));
      for (const cmd of lista) {
        const no = el('button', 'no');
        no.innerHTML =
          `<span class="selo"></span><span class="daemon-dot" style="display:none"></span>` +
          spriteSVG(cmd, { tam: 30 }) +
          `<span class="no-nome">${cmd}</span>` +
          `<span class="no-sub"></span>` +
          `<span class="barra"><i style="width:0"></i></span>`;
        no.onclick = () => abrirFolha(cmd);
        linha.appendChild(no);
        this.refs.push({ cmd, no, selo: no.querySelector('.selo'), dot: no.querySelector('.daemon-dot'),
                         sub: no.querySelector('.no-sub'), barra: no.querySelector('.barra i') });
      }
      bloco.appendChild(linha);
      c.appendChild(bloco);
    }
  },
  atualizar() {
    const { run } = state;
    for (const r of this.refs) {
      const forj = run.forjados.includes(r.cmd);
      const pais = parentsOf(r.cmd);
      const paisOk = pais.every(p => run.forjados.includes(p));
      const pode = !forj && podeForjar(r.cmd, state);

      let cls = 'no';
      if (forj) cls += ' forjado';
      else if (pode) cls += ' pronto';
      else if (!paisOk) cls += ' bloq';
      if (r.no.className !== cls) r.no.className = cls;

      const temD = run.daemons.includes(r.cmd);
      r.dot.style.display = temD ? 'block' : 'none';

      if (forj) {
        r.selo.textContent = '✓';
        r.sub.textContent  = `${fmtN(run.execs[r.cmd] || 0)} exec`;
        r.barra.style.width = '100%';
      } else if (pode) {
        r.selo.textContent = '!';
        r.sub.textContent  = 'PRONTO PARA FORJAR';
        r.barra.style.width = '100%';
      } else {
        r.selo.textContent = '';
        const reqs = requisitosDe(r.cmd, state);
        const pior = reqs.reduce((a, b) => (a.atual / a.alvo <= b.atual / b.alvo ? a : b));
        const pct  = Math.min(100, (pior.atual / pior.alvo) * 100);
        r.sub.textContent = pior.tipo === 'exec'
          ? `${pior.cmd} ${fmtN(pior.atual)}/${fmtN(pior.alvo)}`
          : pior.tipo === 'bytes'
            ? `${fmtB(pior.atual)}/${fmtB(pior.alvo)}`
            : `⚿ ${fmtN(pior.atual)}/${fmtN(pior.alvo)}`;
        r.barra.style.width = pct.toFixed(1) + '%';
      }
    }
  },
};

// ── SISTEMA ──────────────────────────────────────────────────────────────────

P.sistema = {
  sig: null,
  chave: () => `${state.run.ato}|${state.run.forjados.join()}|${Object.keys(state.run.ups).join()}` +
               `|${state.run.ciclosComprados}|${state.run.daemonUp}|${state.run.permNivel}|${state.run.daemons.join()}`,
  construir() {
    const c = $('#p-sistema');
    c.innerHTML = '';

    // ── Automação ──
    c.appendChild(el('div', 'secao', 'CICLOS E VELOCIDADE'));

    const ciclo = loja.cicloProximo(state);
    c.appendChild(cartao({
      icone: '◍',
      titulo: `Ciclo de automação — ${ciclosTotais(state)} disponíveis`,
      desc: 'Cada ciclo segura um daemon rodando um comando sozinho.',
      dor: ciclo ? `Compra ${ciclo.nivel} de ${ciclo.de}.` : 'Todas as compras feitas. Os últimos ciclos vêm de wc, paste e conquistas.',
      bytes: ciclo && ciclo.bytes, perm: 0,
      feito: !ciclo,
      pode: loja.podeComprarCiclo(state),
      rotulo: ciclo ? 'COMPRAR' : 'NO TETO',
      acao: () => comprar(loja.comprarCiclo, undefined, 'ciclo'),
    }));

    const dup = loja.daemonUpProximo(state);
    c.appendChild(cartao({
      icone: '⏵',
      titulo: `Velocidade dos daemons — nível ${state.run.daemonUp}`,
      desc: dup ? `${dup.deSeg.toFixed(2)}s → ${dup.paraSeg.toFixed(2)}s por execução.`
                : `${calcTickInterval(state).toFixed(2)}s por execução. Nível máximo.`,
      dor: `${calcExecsPerTick(state)} execução(ões) por tick, por daemon.`,
      bytes: dup && dup.bytes, perm: 0,
      feito: !dup,
      pode: loja.podeComprarDaemonUp(state),
      rotulo: dup ? 'ACELERAR' : 'NO TETO',
      acao: () => comprar(loja.comprarDaemonUp, undefined, 'velocidade de daemon'),
    }));

    // ── Daemons ──
    c.appendChild(el('div', 'secao', 'DAEMONS'));
    const livres = ciclosLivres(state);
    const gar = gargalos(state);
    c.appendChild(el('div', 'card-desc', livres > 0
      ? `${livres} ciclo(s) livre(s).` + (gar.length ? ` Gargalo agora: ${gar.join(', ')}.` : '')
      : `Todos os ${ciclosTotais(state)} ciclos ocupados.` + (gar.length ? ` Ainda falta rodar: ${gar.join(', ')}.` : '')));

    const deficit = daemonsEmDeficit(state);
    [...state.run.forjados].sort((a, b) => CMDS[b].y - CMDS[a].y).forEach(cmd => {
      const on   = state.run.daemons.includes(cmd);
      const trav = state.run.deadlocks[cmd] > 0;
      const parado = deficit.includes(cmd);
      const taxa = producaoPorExecucao(cmd, state) * calcExecsPerTick(state) / calcTickInterval(state);
      const b = el('div', 'card' + (on && !parado ? ' feito' : gar.includes(cmd) ? ' pode' : ''));
      b.innerHTML =
        spriteSVG(cmd, { tam: 26, viva: on && !trav }) +
        `<div class="card-corpo">
           <div class="card-tit">${cmd}${gar.includes(cmd) ? ' <span style="color:var(--amber);font-size:10px">GARGALO</span>' : ''}</div>
           <div class="card-desc">${fmtB(taxa)}/s se automatizado · ${fmtN(state.run.execs[cmd] || 0)} exec</div>
           ${trav ? '<div class="card-dor" style="color:var(--red)">deadlock — toque para destravar</div>'
                  : parado ? '<div class="card-dor" style="color:var(--red)">sem ciclo — parado</div>' : ''}
         </div>`;
      const btn = el('button', 'btn ' + (trav ? 'perigo' : on ? 'ok' : 'pri'), trav ? 'DESTRAVAR' : on ? 'ATIVO' : 'ALOCAR');
      if (!on && livres === 0 && !trav) btn.classList.add('off');
      btn.onclick = () => alternarDaemon(cmd);
      b.appendChild(btn);
      c.appendChild(b);
    });

    // ── Melhorias ──
    const ups = loja.upgradesVisiveis(state);
    if (ups.length) {
      c.appendChild(el('div', 'secao', 'MELHORIAS'));
      for (const id of ups) {
        const u = UPGRADES[id];
        const tem = !!state.run.ups[id];
        c.appendChild(cartao({
          icone: '▚',
          titulo: u.nome,
          desc: u.desc,
          dor: tem ? 'Instalada.' : u.resolve,
          bytes: tem ? null : u.bytes,
          perm:  tem ? 0 : u.perm,
          feito: tem,
          pode: loja.podeComprarUpgrade(id, state),
          rotulo: tem ? 'ATIVA' : 'INSTALAR',
          acao: () => comprar(loja.comprarUpgrade, id, u.nome),
        }));
      }
    }

    // ── Kernel ──
    if (state.run.ato >= 3) {
      c.appendChild(el('div', 'secao', 'KERNEL — EMISSÃO DE PERMISSÃO'));
      const pp = loja.permProximo(state);
      c.appendChild(cartao({
        icone: '⚿',
        titulo: `Nível do kernel ${state.run.permNivel}`,
        desc: `1 permissão a cada ${permTempo(state.run.permNivel).toFixed(0)}s` +
              (pp ? ` → ${permTempo(pp.nivel).toFixed(0)}s.` : '. Nível máximo.'),
        dor: state.run.ups.assinatura
          ? 'Com assinatura digital, permissão não é gasta: é saldo mínimo.'
          : 'Permissão é gasta a cada forja de tier 5+.',
        bytes: pp && pp.bytes, perm: 0,
        feito: !pp,
        pode: loja.podeComprarPerm(state),
        rotulo: pp ? 'SUBIR NÍVEL' : 'NO TETO',
        acao: () => comprar(loja.comprarPerm, undefined, 'nível do kernel'),
      }));
      const p = el('div', '', `<div class="req"><div class="req-cab"><span class="lbl">próxima permissão</span>
        <span class="val" id="perm-eta">—</span></div><div class="barra cia"><i id="perm-barra" style="width:0"></i></div></div>`);
      c.appendChild(p);
    }
  },
  atualizar() {
    atualizarPrecos($('#p-sistema'));
    if (state.run.ato >= 3) {
      const t = permTempo(state.run.permNivel);
      const b = $('#perm-barra'), e = $('#perm-eta');
      if (b) b.style.width = Math.min(100, (state.run.permProg / t) * 100).toFixed(1) + '%';
      if (e) e.textContent = fmtT(Math.max(0, t - state.run.permProg));
    }
  },
};

// ── REDE ─────────────────────────────────────────────────────────────────────

P.rede = {
  sig: null,
  chave: () => `${state.run.nosAbertos.join()}|${state.run.noAtual}`,
  construir() {
    const c = $('#p-rede');
    c.innerHTML = '';
    c.appendChild(el('div', 'secao', 'NÓS DISPONÍVEIS'));
    c.appendChild(el('div', 'card-desc', 'A máquina roda em um nó por vez. Trocar é grátis; abrir um nó novo custa bytes.'));

    for (const id of loja.nosVisiveis(state)) {
      const no = NOS[id];
      const aberto = state.run.nosAbertos.includes(id);
      const ativo  = state.run.noAtual === id;
      c.appendChild(cartao({
        icone: ativo ? '◉' : aberto ? '○' : '◌',
        titulo: no.nome + (ativo ? '  ← ATIVO' : ''),
        desc: no.desc,
        dor: `produção ×${no.mult}`,
        bytes: aberto ? null : no.custo,
        perm: 0,
        feito: ativo,
        pode: aberto ? !ativo : loja.podeAbrirNo(id, state),
        rotulo: ativo ? 'EM USO' : aberto ? 'MIGRAR' : 'ABRIR',
        acao: () => {
          if (aberto) { loja.trocarNo(id, state); log(`migrou para ${no.nome}`, 'ok'); invalidarTudo(); salvar(); }
          else comprar(loja.abrirNo, id, no.nome);
        },
      }));
    }
  },
  atualizar() { atualizarPrecos($('#p-rede')); },
};

// ── RECOMPILAR ───────────────────────────────────────────────────────────────

P.recomp = {
  sig: null,
  chave: () => `${state.meta.runs}|${state.meta.arquitetura}|${state.run.forjados.length}`,
  construir() {
    const c = $('#p-recomp');
    c.innerHTML = '';
    c.appendChild(el('div', 'secao', 'ESTA RUN'));
    c.appendChild(el('div', '', `<div class="card"><div class="card-corpo">
        <div class="card-tit">Fragmentos ao recompilar</div>
        <div class="card-desc" id="rc-frag">—</div>
        <div class="card-dor" id="rc-info">—</div>
      </div></div>`));

    c.appendChild(el('div', 'secao', 'ARQUITETURA DA PRÓXIMA RUN'));
    for (const [id, a] of Object.entries(ARQUITETURAS)) {
      const liberada = state.meta.runs >= a.destrava;
      const card = el('div', 'card' + (liberada ? '' : ' bloq'));
      card.style.opacity = liberada ? '' : '.45';
      card.innerHTML = `<div class="card-corpo">
          <div class="card-tit">${a.nome} <span style="color:var(--violet)">×${a.mult}</span></div>
          <div class="card-desc">${a.desc}</div>
          <div class="card-dor">${liberada ? a.quando : `Destrava com ${a.destrava} recompilação(ões).`}</div>
        </div>`;
      const b = el('button', 'btn ' + (liberada ? 'pri' : 'off'), 'RECOMPILAR');
      if (liberada) b.onclick = () => confirmarRecompilacao(id, a);
      card.appendChild(b);
      c.appendChild(card);
    }
  },
  atualizar() {
    const f = fragmentosDaRun(state);
    const tierMax = Math.max(...state.run.forjados.map(x => CMDS[x].tier));
    const el1 = $('#rc-frag'), el2 = $('#rc-info');
    if (!el1) return;
    el1.innerHTML = `<span style="color:var(--violet);font-size:16px">◆ ${f}</span>` +
                    ` &nbsp;·&nbsp; acumulados: ${state.meta.fragmentos} (+${(state.meta.fragmentos * 5)}% produção)`;
    el2.textContent = tierMax < RECOMP_MIN_TIER
      ? `Você precisa de um comando tier ${RECOMP_MIN_TIER} forjado para recompilar. Maior atual: tier ${tierMax}.`
      : `${fmtB(state.run.bytesDaRun)} produzidos nesta run · ${state.meta.runs} recompilação(ões) até aqui.`;
  },
};

function confirmarRecompilacao(id, a) {
  const f = fragmentosDaRun(state);
  const tierMax = Math.max(...state.run.forjados.map(x => CMDS[x].tier));
  if (tierMax < RECOMP_MIN_TIER) {
    toast('AINDA NÃO', `Forje um comando tier ${RECOMP_MIN_TIER} antes de recompilar.`);
    return;
  }
  abrirOverlay({
    n: 'RECOMPILAÇÃO',
    titulo: a.nome,
    texto: `Você perde os ${state.run.forjados.length} comandos desta run, os bytes, os ciclos e as melhorias. ` +
           `Fragmentos e conquistas ficam.`,
    rev: `<span style="color:var(--violet)">+${f} fragmentos</span> · a próxima run roda em ${a.nome}`,
    btn: 'DESMONTAR E RECOMPILAR',
    classe: 'perigo',
    cancelavel: true,
    aoConfirmar: () => {
      recompilar(state, id, state.run.elapsedSeconds);
      log(`recompilado em ${a.nome} — +${f} fragmentos`, 'ok');
      state.cfg.cmdAtivo = 'echo';
      invalidarTudo();
      trocarAba('exec');
      salvar();
    },
  });
}

// ── MAIS (conquistas + ajustes) ──────────────────────────────────────────────

P.mais = {
  sig: null,
  chave: () => `${Object.keys(state.meta.conquistas).length}|${state.run.ato}`,
  construir() {
    const c = $('#p-mais');
    c.innerHTML = '';
    const got = state.meta.conquistas;
    const n = Object.keys(got).length;

    c.appendChild(el('div', 'secao', `CONQUISTAS — ${n}/${CONQUISTAS.length}`));
    for (const cat of CATEGORIAS) {
      const lista = CONQUISTAS.filter(a => a.cat === cat);
      const visiveis = lista.filter(a => !a.oculta || got[a.id] !== undefined);
      const ocultas = lista.length - visiveis.length;
      c.appendChild(el('div', 'card-desc', `<b style="color:var(--fg)">${cat}</b> — ${lista.filter(a => got[a.id] !== undefined).length}/${lista.length}`));
      for (const a of visiveis) {
        const tem = got[a.id] !== undefined;
        const efeitos = Object.entries(a.fx).map(([k, v]) =>
          k === 'global' ? `+${(v * 100).toFixed(0)}% prod` :
          k === 'ciclo' ? `+${v} ciclo` :
          k === 'permMult' ? `+${(v * 100).toFixed(0)}% ⚿` :
          k === 'tickBonus' ? `+${(v * 100).toFixed(0)}% vel` :
          k === 'frag' ? `+${v} ◆` : `${k}:${v}`).join(' ');
        c.appendChild(el('div', 'conq' + (tem ? ' got' : ''),
          `<span class="mk">${tem ? '✓' : '·'}</span>
           <span><span class="conq-n">${a.nome}</span><br><span class="conq-d">${a.desc}</span></span>
           <span class="conq-fx">${efeitos}</span>`));
      }
      if (ocultas > 0) c.appendChild(el('div', 'card-dor', `+ ${ocultas} oculta(s) nesta categoria.`));
    }

    c.appendChild(el('div', 'secao', 'NÚMEROS'));
    c.appendChild(el('div', '', `<div class="card"><div class="card-corpo card-desc" id="stats-box">—</div></div>`));

    c.appendChild(el('div', 'secao', 'AJUSTES'));
    const t = el('div', 'card');
    t.innerHTML = `<div class="card-corpo"><div class="card-tit">Reduzir movimento</div>
      <div class="card-desc">Desliga varredura, tremor e parte das animações.</div></div>`;
    const bt = el('button', 'btn ' + (state.cfg.reduzirMovimento ? 'ok' : ''), state.cfg.reduzirMovimento ? 'LIGADO' : 'DESLIGADO');
    bt.onclick = () => {
      state.cfg.reduzirMovimento = !state.cfg.reduzirMovimento;
      aplicarCfg(); salvar(); P.mais.sig = null; render();
    };
    t.appendChild(bt);
    c.appendChild(t);

    const z = el('div', 'card');
    z.innerHTML = `<div class="card-corpo"><div class="card-tit">Apagar tudo</div>
      <div class="card-desc">Volta ao primeiro byte. Não tem como desfazer.</div></div>`;
    const bz = el('button', 'btn perigo', 'APAGAR');
    bz.onclick = () => abrirOverlay({
      n: 'ATENÇÃO', titulo: 'APAGAR O SAVE',
      texto: 'Fragmentos, conquistas e progresso somem de vez.',
      btn: 'APAGAR', classe: 'perigo', cancelavel: true,
      aoConfirmar: () => { try { localStorage.removeItem(CHAVE); } catch {} location.reload(); },
    });
    z.appendChild(bz);
    c.appendChild(z);
  },
  atualizar() {
    const b = $('#stats-box');
    if (!b) return;
    const s = state.stats;
    b.innerHTML = [
      `bytes de todos os tempos: <b style="color:var(--green)">${fmtB(s.bytesTotal)}</b>`,
      `execuções: <b style="color:var(--fg)">${fmtN(s.execTotal)}</b>`,
      `tempo desta run: <b style="color:var(--fg)">${fmtT(state.run.elapsedSeconds)}</b>`,
      `multiplicador atual: <b style="color:var(--amber)">×${multiplicadorTotal(state).toFixed(2)}</b>`,
      state.run.ato >= 3 ? `permissões emitidas: <b style="color:var(--cyan)">${fmtN(s.permTotal)}</b>` : '',
      state.meta.runs ? `recompilações: <b style="color:var(--violet)">${state.meta.runs}</b>` : '',
    ].filter(Boolean).join('<br>');
  },
};

// ── cartão genérico de loja ──────────────────────────────────────────────────

function cartao({ icone, titulo, desc, dor, bytes, perm, feito, pode, rotulo, acao }) {
  const c = el('div', 'card' + (feito ? ' feito' : pode ? ' pode' : ''));
  const precos = [];
  if (bytes != null && bytes > 0) precos.push(`<span class="preco-b" data-b="${bytes}">${fmtB(bytes)}</span>`);
  if (perm > 0) precos.push(`<span class="preco-p" data-p="${perm}">⚿ ${perm}</span>`);
  c.innerHTML = `<div style="font-size:17px;color:var(--dim);width:20px;text-align:center">${icone}</div>
    <div class="card-corpo">
      <div class="card-tit">${titulo}</div>
      <div class="card-desc">${desc}</div>
      ${dor ? `<div class="card-dor">${dor}</div>` : ''}
      ${precos.length ? `<div class="card-preco">${precos.join('')}</div>` : ''}
    </div>`;
  const b = el('button', 'btn ' + (feito ? 'ok' : pode ? 'pri' : 'off'), rotulo);
  if (!feito && acao) b.onclick = () => { acao(); };
  c.appendChild(b);
  return c;
}

// Marca em vermelho o que o jogador ainda não pode pagar, sem reconstruir o cartão.
function atualizarPrecos(raiz) {
  raiz.querySelectorAll('[data-b]').forEach(s =>
    s.classList.toggle('falta', state.run.bytes < +s.dataset.b));
  raiz.querySelectorAll('[data-p]').forEach(s =>
    s.classList.toggle('falta', state.run.perm < +s.dataset.p));
}

// ═══════════════════════════ folha de detalhe ═══════════════════════════

let folhaCmd = null;

function abrirFolha(cmd) {
  folhaCmd = cmd;
  desenharFolha();
  $('#sheet').classList.add('on');
  $('#sheet-bg').classList.add('on');
}

function fecharFolha() {
  folhaCmd = null;
  $('#sheet').classList.remove('on');
  $('#sheet-bg').classList.remove('on');
}

function desenharFolha() {
  const cmd = folhaCmd;
  if (!cmd) return;
  const d = CMDS[cmd];
  const forj = state.run.forjados.includes(cmd);
  const corpo = $('#sheet-corpo');

  let html = `<div class="sheet-topo">${spriteSVG(cmd, { tam: 46 })}
      <div><h2>${cmd}</h2><p>${d.desc}</p></div></div>`;

  html += `<div class="card-desc" style="margin-bottom:12px">
      tier ${d.tier} · ${fmtB(producaoPorExecucao(cmd, state))} por execução
      ${forj ? ` · ${fmtN(state.run.execs[cmd] || 0)} execuções nesta run` : ''}
      ${d.fx ? `<br><span style="color:var(--amber)">efeito permanente: ${
        Object.entries(d.fx).map(([k, v]) => k === 'global' ? `+${(v * 100).toFixed(0)}% de produção global`
          : k === 'ciclos' ? `+${v} ciclo` : `${k} ${v}`).join(', ')}</span>` : ''}
    </div>`;

  if (!forj) {
    html += `<div class="secao">REQUISITOS</div>`;
    for (const r of requisitosDe(cmd, state)) {
      const pct = Math.min(100, (r.atual / r.alvo) * 100);
      const lbl = r.tipo === 'exec' ? `execute <b>${r.cmd}</b>`
                : r.tipo === 'bytes' ? 'bytes acumulados' : 'permissões';
      const val = r.tipo === 'bytes' ? `${fmtB(r.atual)} / ${fmtB(r.alvo)}`
                                     : `${fmtN(r.atual)} / ${fmtN(r.alvo)}`;
      html += `<div class="req ${r.ok ? 'ok' : ''}">
          <div class="req-cab"><span class="lbl">${lbl}</span><span class="val">${r.ok ? '✓ ' : ''}${val}</span></div>
          <div class="barra ${r.ok ? '' : r.tipo === 'perm' ? 'cia' : 'amb'}"><i style="width:${pct.toFixed(1)}%"></i></div>
        </div>`;
    }
  }

  corpo.innerHTML = html;

  const acoes = $('#sheet-acoes');
  acoes.innerHTML = '';

  if (!forj) {
    const pode = podeForjar(cmd, state);
    const b = el('button', 'btn larg ' + (pode ? 'pri' : 'off'), pode ? 'FORJAR' : 'REQUISITOS INCOMPLETOS');
    if (pode) b.onclick = () => { tentarForjar(cmd); desenharFolha(); };
    acoes.appendChild(b);
  } else {
    const b1 = el('button', 'btn larg', 'EXECUTAR MANUALMENTE');
    b1.onclick = (ev) => { executar(cmd, ev); state.cfg.cmdAtivo = cmd; P.exec.sig = null; };
    acoes.appendChild(b1);

    if (state.run.ato >= 2) {
      const on = state.run.daemons.includes(cmd);
      const trav = state.run.deadlocks[cmd] > 0;
      const b2 = el('button', 'btn larg ' + (trav ? 'perigo' : on ? 'ok' : 'pri'),
        trav ? 'DESTRAVAR DEADLOCK' : on ? 'DAEMON ATIVO — LIBERAR CICLO' : 'ALOCAR DAEMON');
      b2.style.marginTop = '7px';
      b2.onclick = () => { alternarDaemon(cmd); desenharFolha(); };
      acoes.appendChild(b2);
    }
  }
}

// ═══════════════════════════ hud e navegação ═══════════════════════════

let bytesAnt = 0;
const ROMANO = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V' };

function renderHud() {
  const b = $('#hud-bytes');
  b.textContent = fmtB(state.run.bytes);
  if (state.run.bytes > bytesAnt * 1.02) { b.classList.add('pulo'); setTimeout(() => b.classList.remove('pulo'), 190); }
  bytesAnt = state.run.bytes;

  $('#hud-taxa').innerHTML = `<b>${fmtB(producaoPassiva(state))}</b>/s`;
  const ato = ATOS.find(a => a.n === state.run.ato);
  $('#hud-ato').textContent = `ATO ${ROMANO[state.run.ato] || state.run.ato} — ${ato ? ato.nome.toUpperCase() : ''}`;

  const rc = $('#hud-recursos');
  const set = (sel, on, txt) => {
    const e = rc.querySelector(sel);
    e.classList.toggle('on', on);
    if (on) e.textContent = txt;
  };
  set('.r-ciclo', state.run.ato >= 2, `◍ ${ciclosUsados(state)}/${ciclosTotais(state)}`);
  set('.r-perm',  state.run.ato >= 3, `⚿ ${fmtN(state.run.perm)}`);
  set('.r-frag',  state.run.ato >= 5 || state.meta.fragmentos > 0, `◆ ${state.meta.fragmentos}`);
}

// Abas aparecem só quando o Ato correspondente chegou.
const ABAS = [
  { id: 'exec',    ic: '▶', nome: 'EXEC',   ato: 1 },
  { id: 'arvore',  ic: '⌘', nome: 'ÁRVORE', ato: 1 },
  { id: 'sistema', ic: '◍', nome: 'SISTEMA', ato: 2 },
  { id: 'rede',    ic: '⇄', nome: 'REDE',   ato: 4 },
  { id: 'recomp',  ic: '◆', nome: 'RECOMP', ato: 5 },
  { id: 'mais',    ic: '★', nome: 'MAIS',   ato: 1 },
];

function renderNav() {
  for (const a of ABAS) {
    const b = $(`#nav [data-aba="${a.id}"]`);
    b.classList.toggle('viv', state.run.ato >= a.ato);
    b.classList.toggle('tem', temAcao(a.id));
  }
}

function temAcao(id) {
  const { run } = state;
  switch (id) {
    case 'arvore':  return cmdsVisiveis(state).some(c => podeForjar(c, state));
    case 'sistema': return loja.podeComprarCiclo(state) || loja.podeComprarDaemonUp(state) ||
                           loja.podeComprarPerm(state) ||
                           loja.upgradesVisiveis(state).some(u => loja.podeComprarUpgrade(u, state)) ||
                           (ciclosLivres(state) > 0 && run.forjados.length > run.daemons.length);
    case 'rede':    return loja.nosVisiveis(state).some(n => loja.podeAbrirNo(n, state));
    case 'recomp':  return fragmentosDaRun(state) > 0;
    default: return false;
  }
}

function render() {
  renderHud();
  renderNav();
  const p = P[atual];
  if (p) {
    const k = p.chave();
    if (p.sig !== k) { p.sig = k; p.construir(); }
    p.atualizar();
  }
  if (folhaCmd) desenharFolha();
}

// ═══════════════════════════ laço ═══════════════════════════

const DT_LOGICA = 0.05;
const AUSENCIA_MIN = 20;   // acima disso não é lag: o app estava em segundo plano
let relogio = 0, acc = 0, accDaemonAnt = 0;

// O laço anda pelo relógio de parede, não por requestAnimationFrame.
// rAF para de disparar com a tela apagada ou o app em segundo plano — que é
// exatamente quando um idle não pode parar de contar.
function laco() {
  const agora = Date.now();
  if (!relogio) { relogio = agora; return; }
  let dt = (agora - relogio) / 1000;
  relogio = agora;

  if (dt > AUSENCIA_MIN) { recolherAusencia(dt); dt = 0; }
  dt = Math.min(dt, 5);
  acc += dt;

  let passos = 0;
  while (acc >= DT_LOGICA && passos < 200) {
    acc -= DT_LOGICA;
    passos++;
    const bAntes = state.run.bytes;
    const { novosAtos, novasConquistas } = tick(state, DT_LOGICA);

    if (state.run.daemonAcc < accDaemonAnt && state.run.daemons.length) {
      const ganho = state.run.bytes - bAntes;
      if (ganho > 0 && Math.random() < .55) {
        numFlutuante(innerWidth * (.2 + Math.random() * .6), innerHeight * .3, '+' + fmtB(ganho));
      }
      $$('#slot-fila .slot.cheio').forEach(s => {
        s.classList.add('bate');
        setTimeout(() => s.classList.remove('bate'), 350);
      });
    }
    accDaemonAnt = state.run.daemonAcc;

    for (const n of novosAtos) anunciarAto(n);
    for (const id of novasConquistas) {
      const a = CONQUISTAS.find(x => x.id === id);
      if (a) { toast('CONQUISTA', a.nome); log(`conquista: ${a.nome}`, 'ok'); }
      invalidarTudo();
    }
  }

  render();
}

// Tempo em segundo plano vira produção offline, com o mesmo redutor do jogo fechado.
function recolherAusencia(segundos) {
  const r = aplicarAusencia(state, segundos);
  if (r.bytes > 0) {
    log(`${fmtT(segundos)} em segundo plano → +${fmtB(r.bytes)}`, 'ok');
    if (segundos > 120) toast('DAEMONS CONTINUARAM', `+${fmtB(r.bytes)} em ${fmtT(segundos)}`);
  }
  salvar();
}

function anunciarAto(n) {
  const a = ATOS.find(x => x.n === n);
  if (!a) return;
  invalidarTudo();
  log(`>>> ATO ${n}: ${a.nome} <<<`, 'aviso');
  abrirOverlay({
    n: `ATO ${n}`,
    titulo: a.nome.toUpperCase(),
    texto: a.texto,
    rev: 'agora existe: ' + a.revela.join(' · '),
  });
}

// ═══════════════════════════ boot ═══════════════════════════

function aplicarCfg() {
  semFx = !!state.cfg.reduzirMovimento;
  document.body.classList.toggle('sem-fx', semFx);
}

const LINHAS_BOOT = [
  'BOOTSTRAP v0.2',
  '',
  'verificando memória.......... <b>vazia</b>',
  'montando sistema de arquivos. <b>falhou</b>',
  'carregando kernel............ <b>ausente</b>',
  'procurando instruções........ <b>1 encontrada</b>',
  '',
  '> echo',
  '',
  'uma instrução funciona.',
  'todo o resto está apagado.',
];

function rodarBoot(aoTerminar) {
  const alvo = $('#boot-linhas');
  if (!primeiraVez) { $('#boot').style.display = 'none'; aoTerminar(); return; }
  let i = 0;
  const passo = () => {
    if (i >= LINHAS_BOOT.length) {
      setTimeout(() => {
        $('#boot').classList.add('sai');
        setTimeout(() => { $('#boot').style.display = 'none'; aoTerminar(); }, 480);
      }, 700);
      return;
    }
    alvo.innerHTML = LINHAS_BOOT.slice(0, ++i).join('\n') + '<span class="cursor"></span>';
    setTimeout(passo, LINHAS_BOOT[i - 1] === '' ? 90 : 230);
  };
  passo();
  $('#boot').onclick = () => { $('#boot').style.display = 'none'; aoTerminar(); };
}

function iniciar() {
  state = carregar();
  aplicarCfg();

  // Ganho offline: aplicado depois do carregamento, com aviso explícito.
  if (pendenteOffline) {
    const { fora } = pendenteOffline;
    const r = aplicarAusencia(state, fora);
    if (r.bytes > 0) {
      abrirOverlay({
        n: 'ENQUANTO VOCÊ ESTAVA FORA',
        titulo: fmtT(fora),
        texto: `Os daemons continuaram rodando a ${state.run.ups.daemonPlus ? '100' : '30'}% da velocidade.`,
        rev: `<span style="color:var(--green);font-size:16px">+${fmtB(r.bytes)}</span>`,
        btn: 'RECOLHER',
      });
      log(`offline ${fmtT(fora)} → +${fmtB(r.bytes)}`, 'ok');
    } else if (r.motivo) {
      log(`offline ${fmtT(fora)} → nada (${r.motivo})`, 'aviso');
    }
    pendenteOffline = null;
  }

  // Botão de execução: toque simples, e repetição contínua com a melhoria `historico`.
  const btn = $('#btn-exec');
  let segurando = null;

  const disparar = (ev) => {
    const cmd = cmdAtivo();
    executar(cmd, ev);
    const r = btn.getBoundingClientRect();
    const o = el('span', 'onda');
    o.style.left = ((ev.clientX || r.left + r.width / 2) - r.left) + 'px';
    o.style.top  = ((ev.clientY || r.top + r.height / 2) - r.top) + 'px';
    btn.appendChild(o);
    setTimeout(() => o.remove(), 560);
  };

  btn.addEventListener('pointerdown', (ev) => {
    ev.preventDefault();
    disparar(ev);
    if (state.run.ups.historico) {
      segurando = setInterval(() => {
        const cmd = cmdAtivo();
        const b = executarCmd(cmd, state, state.run.ups.pipe ? 2 : 1, marcoMult());
        const r = btn.getBoundingClientRect();
        numFlutuante(r.left + r.width * (.25 + Math.random() * .5), r.top + 30, '+' + fmtB(b));
      }, 110);
    }
  });
  const soltar = () => { if (segurando) { clearInterval(segurando); segurando = null; } };
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(e => btn.addEventListener(e, soltar));

  $$('#nav button').forEach(b => b.onclick = () => trocarAba(b.dataset.aba));
  $('#sheet-bg').onclick = fecharFolha;
  $('#sheet-fechar').onclick = fecharFolha;

  // pagehide é o único evento confiável no Android para "o app está saindo".
  addEventListener('pagehide', salvar);
  addEventListener('visibilitychange', () => { document.hidden ? salvar() : laco(); });
  setInterval(salvar, 10000);

  trocarAba('exec');
  relogio = Date.now();
  setInterval(laco, 100);
  log('sistema iniciado.', 'ok');
}

rodarBoot(iniciar);

// Service worker: só registra em http(s), nunca em file://
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
