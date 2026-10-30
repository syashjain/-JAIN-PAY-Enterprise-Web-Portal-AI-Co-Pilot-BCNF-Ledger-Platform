import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRootDir = path.resolve(__dirname);
const projectSrcDir = path.resolve(projectRootDir, 'src');

/**
 * Diagnostic plugin that outputs structured initialization, module verification,
 * alias mapping verification, and build lifecycle telemetry to identify server
 * or bundler startup issues.
 */
function jainPayBuildDiagnosticsPlugin(): Plugin {
  let startTime = 0;

  return {
    name: 'jain-pay-build-diagnostics',
    configResolved(resolvedConfig) {
      const entryFiles = ['index.html', 'src/main.tsx', 'src/App.tsx', 'src/index.css'];
      const verificationStatus = entryFiles
        .map((relPath) => {
          const fullPath = path.resolve(resolvedConfig.root, relPath);
          return `${relPath}:${fs.existsSync(fullPath) ? 'OK' : 'MISSING'}`;
        })
        .join(', ');

      const aliasSummary = `@ -> ${projectRootDir} (${fs.existsSync(projectRootDir) ? 'OK' : 'MISSING'}), @src -> ${projectSrcDir} (${fs.existsSync(projectSrcDir) ? 'OK' : 'MISSING'})`;

      console.info(
        `[JAIN-PAY VITE DIAGNOSTICS] Config resolved | command=${resolvedConfig.command} | mode=${resolvedConfig.mode} | host=${resolvedConfig.server.host ?? '0.0.0.0'}:${resolvedConfig.server.port ?? 3000}`
      );
      console.info(
        `[JAIN-PAY VITE DIAGNOSTICS] Alias mapping check | ${aliasSummary}`
      );
      console.info(
        `[JAIN-PAY VITE DIAGNOSTICS] Entry graph check | ${verificationStatus}`
      );
    },
    configureServer(server) {
      console.info(
        '[JAIN-PAY VITE DIAGNOSTICS] Initializing Vite dev server middleware...'
      );
      if (server.httpServer) {
        server.httpServer.once('listening', () => {
          const address = server.httpServer?.address();
          const bindInfo =
            typeof address === 'string'
              ? address
              : `${address?.address ?? '0.0.0.0'}:${address?.port ?? 3000}`;
          console.info(
            `[JAIN-PAY VITE DIAGNOSTICS] Dev server listening and ready at http://${bindInfo}`
          );
        });
        server.httpServer.on('error', (err: NodeJS.ErrnoException) => {
          console.error(
            `[JAIN-PAY VITE DIAGNOSTICS] Dev server socket error (code=${err.code ?? 'UNKNOWN'}): ${err.message}`
          );
        });
      } else {
        console.info(
          '[JAIN-PAY VITE DIAGNOSTICS] Vite running in Express middlewareMode (bound to host HTTP server on port 3000).'
        );
      }
    },
    buildStart() {
      startTime = Date.now();
      console.info(
        '[JAIN-PAY VITE DIAGNOSTICS] Build pipeline started — transforming module graph (src/main.tsx -> src/App.tsx)...'
      );
    },
    buildEnd(error) {
      const elapsedMs = Date.now() - startTime;
      if (error) {
        console.error(
          `[JAIN-PAY VITE DIAGNOSTICS] Build failed after ${elapsedMs}ms: ${error.message}`
        );
      } else {
        console.info(
          `[JAIN-PAY VITE DIAGNOSTICS] Module graph transformed cleanly in ${elapsedMs}ms (status: verified).`
        );
      }
    },
    closeBundle() {
      console.info(
        '[JAIN-PAY VITE DIAGNOSTICS] Production bundle finalized in dist/ (sourcemap: false).'
      );
    },
  };
}

export default defineConfig({
  root: projectRootDir,
  plugins: [jainPayBuildDiagnosticsPlugin(), react(), tailwindcss()],
  resolve: {
    alias: {
      '@src': projectSrcDir,
      '@': projectRootDir,
    },
  },
  server: {
    port: 3000,
    strictPort: true,
    host: '0.0.0.0',
    allowedHosts: true,
    cors: true,
    // HMR is disabled in AI Studio via DISABLE_HMR env var.
    // Do not modify—file watching is disabled to prevent flickering during agent edits.
    hmr: process.env.DISABLE_HMR !== 'true',
    // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
    watch: process.env.DISABLE_HMR === 'true' ? null : {},
  },
  preview: {
    port: 3000,
    strictPort: true,
    host: '0.0.0.0',
    allowedHosts: true,
  },
  build: {
    sourcemap: false,
    target: 'es2022',
  },
});

