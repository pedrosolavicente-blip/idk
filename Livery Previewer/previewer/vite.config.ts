import { defineConfig } from 'vite'
import path from 'path'
import fs from 'fs'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

import { cloudflare } from "@cloudflare/vite-plugin";

const serveGlbsPlugin = {
  name: 'serve-parent-glbs',
  configureServer(server: any) {
    server.middlewares.use((req: any, res: any, next: any) => {
      const url: string = req.url ?? '';
      if (!url.endsWith('.glb')) return next();
      const filename = decodeURIComponent(url.slice(1));
      const filepath = path.resolve(__dirname, '..', filename);
      if (fs.existsSync(filepath)) {
        res.setHeader('Content-Type', 'model/gltf-binary');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        fs.createReadStream(filepath).pipe(res);
      } else {
        next();
      }
    });
  },
};

export default defineConfig({
  base: '/previewer/',
  plugins: [react(), tailwindcss(), serveGlbsPlugin, cloudflare()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      // Proxy R2 asset requests through localhost so CORS isn't an issue in dev
      '/r2-proxy': {
        target: 'https://pub-13c1fc73579544bdb2eb07e28434bd74.r2.dev',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/r2-proxy/, ''),
      },
    },
  },
})
