// Forja — requisitos, verificação e execução de uma forja.
// Nenhuma referência a document, window, localStorage ou Date.now().

import { CMDS, ORDER } from '../data/commands.js';
import { ARQUITETURAS } from '../data/prestige.js';

// Retorna os requisitos de um comando no formato legível pela UI.
// [{tipo, cmd?, atual, alvo, ok}]
//   tipo: 'exec' | 'bytes' | 'perm'
//   cmd:  (apenas tipo 'exec') o comando pai cujas execuções contam
export function requisitosDe(cmd, state) {
  const { run } = state;
  const dados = CMDS[cmd];
  const reqs = [];

  // Marcos de execução
  for (const [pai, necessario] of Object.entries(dados.req)) {
    const atual = run.execs[pai] || 0;
    reqs.push({ tipo: 'exec', cmd: pai, atual, alvo: necessario, ok: atual >= necessario });
  }

  // Bytes (echo não custa nada)
  if (dados.bytes > 0) {
    reqs.push({ tipo: 'bytes', atual: run.bytes, alvo: dados.bytes, ok: run.bytes >= dados.bytes });
  }

  // Permissões (só tier ≥ 5)
  if (dados.perm > 0) {
    // Com assinatura: perm vira saldo mínimo exigido (não é gasta)
    reqs.push({ tipo: 'perm', atual: run.perm, alvo: dados.perm, ok: run.perm >= dados.perm });
  }

  return reqs;
}

// Verifica se um comando pode ser forjado agora.
export function podeForjar(cmd, state) {
  if (state.run.forjados.includes(cmd)) return false;
  return requisitosDe(cmd, state).every(r => r.ok);
}

// Executa a forja. Lança erro se não puder.
// Muta o estado: deduz bytes/perm, adiciona a forjados, aplica efeitos passivos.
export function forjar(cmd, state) {
  if (!podeForjar(cmd, state)) {
    throw new Error(`Não pode forjar ${cmd}: requisitos não atendidos.`);
  }

  const { run, meta, stats } = state;
  const dados = CMDS[cmd];

  // Custo em bytes (parasita: primeiras N forjas são grátis)
  let custoByte = dados.bytes;
  if (meta.arquitetura === 'parasita' && run.forjasGratis > 0) {
    custoByte = 0;
    run.forjasGratis--;
  }
  run.bytes -= custoByte;

  // Custo em permissões (apenas se NÃO tem assinatura — senão é saldo mínimo)
  if (dados.perm > 0 && !run.ups.assinatura) {
    run.perm -= dados.perm;
  }

  // Adiciona à lista de forjados
  run.forjados.push(cmd);

  // Efeito passivo: ciclos extras (fx.ciclos) — refletido automaticamente em ciclosTotais()
  // Efeito passivo: global bonus (fx.global) — refletido em multiplicadorTotal()

  // Conquista oculta: forjou tier 5 sem daemon
  if (dados.tier >= 5 && run.daemons.length === 0 && !stats.forjouTier5SemDaemon) {
    stats.forjouTier5SemDaemon = true;
  }

  // Registro do tempo ao tier 8
  if (dados.tier >= 8 && run.tempoAoTier8 === 0) {
    run.tempoAoTier8 = run.elapsedSeconds;
  }
}

// Lista de comandos visíveis para o jogador no ato atual (não filtra forjados)
export function cmdsVisiveis(state) {
  return ORDER.filter(c => CMDS[c].ato <= state.run.ato);
}
