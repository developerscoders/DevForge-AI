import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  // Cloud Run / AI Studio previews are served behind a proxy that does not
  // reliably forward Vite's HMR WebSocket upgrade. Disable HMR there so the
  // application itself remains usable instead of failing with a closed socket.
  const hostedPreview =
    Boolean(process.env.K_SERVICE) ||
    Boolean(process.env.CLOUD_RUN_JOB) ||
    process.env.AI_STUDIO === 'true';
  const disableHmr = process.env.DISABLE_HMR === 'true' || hostedPreview;

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: disableHmr ? false : undefined,
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
