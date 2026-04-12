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
  plugins: [react(), tailwindcss(), serveGlbsPlugin, cloudflare()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/roblox-api': {
        target: 'https://apis.roblox.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/roblox-api/, ''),
      },
      '/roblox-auth': {
        target: 'https://auth.roblox.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/roblox-auth/, ''),
      },
      '/roblox-data': {
        target: 'https://data.roblox.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/roblox-data/, ''),
      },
    },
  },
})