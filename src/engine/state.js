// Estado do jogo — criação, migração e validação.
// Regra absoluta: nenhuma referência a document, window, localStorage ou Date.now().

// novaRun é zerada pela recompilação; meta atravessa o prestígio.
// Se um campo está no lugar errado, recompilar apaga o que não devia.

export function novaRun() {
  return {
    bytes: 0,
    bytesDaRun: 0,          // bytes acumulados nesta run (base dos fragmentos)
    forjados: ['echo'],      // echo já existe desde o início
    execs: {},               // { cmd: N } — contador de vida inteira da run
    daemons: [],             // comandos com daemon alocado
    daemonAcc: 0,            // acumulador de tempo para o tick dos daemons (segundos)
    deadlocks: {},           // { cmd: segundosRestantes } — paralela
    ciclosComprados: 0,
    daemonUp: 0,
    permNivel: 1,            // nível do kernel (emissão de permissão)
    perm: 0,
    permProg: 0,             // acumulador do timer de emissão de permissão
    ups: {},                 // { id: true } — melhorias compradas
    nosAbertos: ['local'],
    noAtual: 'local',
    ato: 1,
    elapsedSeconds: 0,       // segundos de jogo nesta run (avançado pelo tick)
    tempoAoTier8: 0,         // elapsedSeconds quando tier 8 foi primeiro forjado (0 = ainda não)
    forjasGratis: 0,         // parasita: forjas sem custo de bytes restantes
  };
}

export function novoEstado() {
  return {
    v: 2,
    t: { criado: 0, ultimoTick: 0, ultimoVisto: 0 },
    run: novaRun(),
    meta: {
      fragmentos: 0,
      runs: 0,
      arquitetura: 'limpa',
      arqsUsadas: [],
      conquistas: {},   // { id: elapsedSeconds quando foi obtida }
    },
    stats: {
      bytesTotal: 0,
      execTotal: 0,
      permTotal: 0,
      travadoPorPerm: 0,      // segundos bloqueado por falta de permissão (rastreado na UI)
      ticksPerdidos: 0,       // ticks perdidos no espelho
      tempoNoFrio: 0,         // segundos no nó frio (acumulado entre runs)
      tempoOcioso: 0,         // segundos com TODOS os ciclos vazios (acumulado entre runs)
      ultimoOffline: 0,       // duração do último período offline (segundos)
      forjouTier5SemDaemon: false,
      recompCedo: false,      // recompilou antes de atingir tier 9
    },
    cfg: { som: false, reduzirMovimento: false, notacao: 'auto' },
  };
}

// Valida e migra um save carregado. Retorna estado novo se o save for inválido.
export function validarEstado(raw) {
  if (!raw || typeof raw !== 'object') return novoEstado();

  // Migração de versão
  try {
    raw = migrar(raw);
  } catch {
    return novoEstado();
  }

  // Garantir que as seções principais existem
  if (!raw.run || typeof raw.run !== 'object') raw.run = novaRun();
  if (!raw.meta || typeof raw.meta !== 'object') {
    raw.meta = { fragmentos: 0, runs: 0, arquitetura: 'limpa', arqsUsadas: [], conquistas: {} };
  }
  if (!raw.stats || typeof raw.stats !== 'object') {
    raw.stats = {
      bytesTotal: 0, execTotal: 0, permTotal: 0, travadoPorPerm: 0,
      ticksPerdidos: 0, tempoNoFrio: 0, tempoOcioso: 0, ultimoOffline: 0,
      forjouTier5SemDaemon: false, recompCedo: false,
    };
  }
  if (!raw.cfg || typeof raw.cfg !== 'object') {
    raw.cfg = { som: false, reduzirMovimento: false, notacao: 'auto' };
  }

  // Garantir campos obrigatórios do run
  const r = raw.run;
  if (!Array.isArray(r.forjados)) r.forjados = ['echo'];
  if (!r.forjados.includes('echo')) r.forjados.unshift('echo');
  if (typeof r.execs !== 'object') r.execs = {};
  if (!Array.isArray(r.daemons)) r.daemons = [];
  if (!Array.isArray(r.nosAbertos)) r.nosAbertos = ['local'];
  if (!r.noAtual) r.noAtual = 'local';
  if (typeof r.ups !== 'object') r.ups = {};
  if (typeof r.deadlocks !== 'object') r.deadlocks = {};

  // Campos numéricos com fallback
  for (const k of ['bytes','bytesDaRun','daemonAcc','permProg','perm','ciclosComprados',
                    'daemonUp','permNivel','ato','elapsedSeconds','tempoAoTier8','forjasGratis']) {
    if (typeof r[k] !== 'number' || isNaN(r[k])) r[k] = k === 'permNivel' ? 1 : k === 'ato' ? 1 : 0;
  }

  // Meta
  const m = raw.meta;
  if (typeof m.fragmentos !== 'number') m.fragmentos = 0;
  if (typeof m.runs !== 'number') m.runs = 0;
  if (!m.arquitetura) m.arquitetura = 'limpa';
  if (!Array.isArray(m.arqsUsadas)) m.arqsUsadas = [];
  if (typeof m.conquistas !== 'object') m.conquistas = {};

  return raw;
}

function migrar(save) {
  // v1 → v2: reorganiza campos e adiciona seções faltando
  if (!save.v || save.v < 2) {
    return {
      v: 2,
      t: save.t || { criado: 0, ultimoTick: 0, ultimoVisto: 0 },
      run: novaRun(),
      meta: { fragmentos: 0, runs: 0, arquitetura: 'limpa', arqsUsadas: [], conquistas: {} },
      stats: {
        bytesTotal: 0, execTotal: 0, permTotal: 0, travadoPorPerm: 0,
        ticksPerdidos: 0, tempoNoFrio: 0, tempoOcioso: 0, ultimoOffline: 0,
        forjouTier5SemDaemon: false, recompCedo: false,
      },
      cfg: { som: false, reduzirMovimento: false, notacao: 'auto' },
    };
  }
  return save;
}
