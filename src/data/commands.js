// Comandos — única fonte de verdade dos 25 nós da árvore.
// y     = bytes por execução
// tier  = camada visual e ordem de revelação
// req   = { cmd: N } — marcos de execução (vida inteira, nunca consumido)
// bytes = custo em bytes para forjar (0 = grátis, só para echo)
// perm  = custo em permissões (0 em tier < 5)
// ato   = em que ato o nó fica visível
// fx    = efeito passivo permanente ao forjar

export const CMDS = {
  // ── ATO I ── o vazio, uma instrução, os primeiros ecos
  echo:   { tier: 0, y: 1,       ato: 1, req: {},                             bytes: 0,      perm: 0,
            nome: 'echo',   desc: 'escreve um byte no vazio' },
  cat:    { tier: 1, y: 4,       ato: 1, req: { echo: 120 },                  bytes: 300,    perm: 0,
            nome: 'cat',    desc: 'concatena o que já existe' },
  printf: { tier: 1, y: 7,       ato: 1, req: { echo: 300 },                  bytes: 900,    perm: 0,
            nome: 'printf', desc: 'formata antes de escrever' },

  // ── ATO II ── automação: os daemons acordam
  tee:    { tier: 2, y: 20,      ato: 2, req: { cat: 500 },                   bytes: 6000,   perm: 0,
            nome: 'tee',    desc: 'escreve em dois lugares de uma vez' },
  sed:    { tier: 2, y: 32,      ato: 2, req: { printf: 500 },                bytes: 9000,   perm: 0,
            nome: 'sed',    desc: 'substitui em fluxo' },
  wc:     { tier: 2, y: 45,      ato: 2, req: { cat: 600, printf: 300 },      bytes: 15000,  perm: 0,
            nome: 'wc',     desc: 'conta o que passou', fx: { ciclos: 1 } },

  split:  { tier: 3, y: 110,     ato: 2, req: { tee: 900 },                   bytes: 60000,  perm: 0,
            nome: 'split',  desc: 'quebra em pedaços paralelos' },
  awk:    { tier: 3, y: 180,     ato: 2, req: { sed: 900 },                   bytes: 90000,  perm: 0,
            nome: 'awk',    desc: 'processa campo a campo' },
  sort:   { tier: 3, y: 260,     ato: 2, req: { wc: 800 },                    bytes: 150000, perm: 0,
            nome: 'sort',   desc: 'ordena — e ordem vale bytes' },

  // ── ATO III ── o kernel acorda e começa a exigir permissão
  grep:   { tier: 4, y: 650,     ato: 3, req: { awk: 1500 },                  bytes: 900000, perm: 0,
            nome: 'grep',   desc: 'acha agulha em petabyte' },
  uniq:   { tier: 4, y: 900,     ato: 3, req: { sort: 1500 },                 bytes: 1.5e6,  perm: 0,
            nome: 'uniq',   desc: 'colapsa o redundante', fx: { global: 0.10 } },
  tr:     { tier: 4, y: 1300,    ato: 3, req: { split: 1800 },                bytes: 2.5e6,  perm: 0,
            nome: 'tr',     desc: 'troca um símbolo por outro', fx: { global: 0.12 } },

  xargs:  { tier: 5, y: 3200,    ato: 3, req: { grep: 2500 },                 bytes: 9e6,    perm: 25,
            nome: 'xargs',  desc: 'transforma lista em execução' },
  join:   { tier: 5, y: 4500,    ato: 3, req: { uniq: 2500 },                 bytes: 15e6,   perm: 30,
            nome: 'join',   desc: 'cruza duas tabelas' },
  cut:    { tier: 5, y: 6000,    ato: 3, req: { tr: 2800 },                   bytes: 25e6,   perm: 45,
            nome: 'cut',    desc: 'fica só com o que importa', fx: { global: 0.10 } },

  // ── ATO IV ── a rede: a máquina descobre que não está sozinha
  find:   { tier: 6, y: 15000,   ato: 4, req: { xargs: 16000 },               bytes: 120e6,  perm: 90,
            nome: 'find',   desc: 'varre a árvore inteira' },
  diff:   { tier: 6, y: 21000,   ato: 4, req: { join: 16000 },                bytes: 200e6,  perm: 120,
            nome: 'diff',   desc: 'só o que mudou importa' },
  paste:  { tier: 6, y: 28000,   ato: 4, req: { cut: 18000 },                 bytes: 320e6,  perm: 150,
            nome: 'paste',  desc: 'costura fluxos lado a lado', fx: { ciclos: 1 } },

  make:   { tier: 7, y: 70000,   ato: 4, req: { find: 28000 },                bytes: 1.5e9,  perm: 350,
            nome: 'make',   desc: 'reconstrói só o que está sujo' },
  patch:  { tier: 7, y: 95000,   ato: 4, req: { diff: 28000 },                bytes: 2.5e9,  perm: 450,
            nome: 'patch',  desc: 'aplica a diferença', fx: { global: 0.15 } },

  // ── ATO V ── recompilação: a máquina se reconstrói
  gcc:    { tier: 8, y: 300000,  ato: 5, req: { make: 50000 },                bytes: 15e9,   perm: 1100,
            nome: 'gcc',    desc: 'traduz intenção em máquina' },
  git:    { tier: 8, y: 420000,  ato: 5, req: { patch: 50000 },               bytes: 25e9,   perm: 1400,
            nome: 'git',    desc: 'lembra de tudo, para sempre' },

  ld:     { tier: 9, y: 1.4e6,   ato: 5, req: { gcc: 90000 },                 bytes: 150e9,  perm: 3500,
            nome: 'ld',     desc: 'costura os objetos num só' },
  rsync:  { tier: 9, y: 1.9e6,   ato: 5, req: { git: 90000 },                 bytes: 240e9,  perm: 4500,
            nome: 'rsync',  desc: 'move só o delta, e move rápido', fx: { global: 0.25 } },

  kernel: { tier: 10, y: 8e6,    ato: 5, req: { ld: 160000, rsync: 160000 },  bytes: 2e12,   perm: 12000,
            nome: 'kernel', desc: 'o que roda embaixo de todo o resto', fx: { global: 1.0 } },
};

export const ORDER = Object.keys(CMDS);

// Mapa tier → [cmds]
export const TIERS = ORDER.reduce((m, c) => {
  (m[CMDS[c].tier] ??= []).push(c);
  return m;
}, {});

export const parentsOf = (c) => Object.keys(CMDS[c].req);
export const childrenOf = (c) => ORDER.filter(x => CMDS[x].req[c] !== undefined);
