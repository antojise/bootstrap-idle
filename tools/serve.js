#!/usr/bin/env node
// Servidor estático de desenvolvimento. ES modules exigem http — file:// não funciona.
// Uso: node tools/serve.js [porta]

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const PORTA = Number(process.argv[2]) || 8080;

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'text/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg':  'image/svg+xml',
};

createServer(async (req, res) => {
  let caminho = decodeURIComponent(req.url.split('?')[0]);
  if (caminho === '/') caminho = '/index.html';

  // Impede sair da raiz do projeto por ../
  const alvo = normalize(join(RAIZ, caminho));
  if (!alvo.startsWith(RAIZ)) { res.writeHead(403).end('403'); return; }

  try {
    const dados = await readFile(alvo);
    res.writeHead(200, {
      'Content-Type': TIPOS[extname(alvo)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    res.end(dados);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('404 ' + caminho);
  }
}).listen(PORTA, () => console.log(`BOOTSTRAP em http://localhost:${PORTA}`));
