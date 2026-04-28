#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { startPreviewMockServer } from './preview_mock_server.mjs';

const port = Number(process.env.PREVIEW_MOCK_PORT || 8011);
const server = startPreviewMockServer({ port });
const viteBin = resolve('node_modules/vite/bin/vite.js');
const vite = spawn(
  process.execPath,
  [viteBin, '--host', '0.0.0.0'],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      VITE_BACKEND_PROXY_TARGET: `http://127.0.0.1:${port}`,
    },
  },
);

function shutdown(signal) {
  server.close();
  if (!vite.killed) vite.kill(signal);
}

vite.on('exit', (code, signal) => {
  server.close(() => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code ?? 0);
  });
});

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
