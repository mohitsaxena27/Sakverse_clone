import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const API_URL = env.VITE_API_URL;
  const BACKEND_PORT = env.VITE_BACKEND_PORT;
  const FRONTEND_PORT = Number(env.VITE_FRONTEND_PORT || 5175);
  const PUBLIC_HOST = env.VITE_HOST || 'localhost'; // browser-facing hostname, e.g. tcg.saksoft.com

  return {
    plugins: [react()],
    server: {
      https: {
        key: fs.readFileSync(path.resolve('./certs/private.key')),
        cert: fs.readFileSync(path.resolve('./certs/certificate.crt')),
      },
      host: '0.0.0.0',        // BIND: always listen on all interfaces
      port: FRONTEND_PORT,
      hmr: {
        protocol: 'wss',
        host: PUBLIC_HOST,     // BROWSER-FACING: the actual hostname in the URL bar
        port: FRONTEND_PORT,
      },
      proxy: {
        '/sakverse': {
          target: `${API_URL.replace(/\/$/, '')}:${BACKEND_PORT}`,
          secure: false,        // backend uses a self-signed cert — same as nginx's proxy_ssl_verify off
          changeOrigin: true,
        },
        '/view': {              // your websocket stream endpoint needs this too
          target: `${API_URL.replace(/\/$/, '')}:${BACKEND_PORT}`,
          secure: false,
          changeOrigin: true,
          ws: true,              // <-- required for the websocket proxy to upgrade correctly
        },
      },
    },
  };
});
