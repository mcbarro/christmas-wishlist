import fs from 'node:fs';
import path from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

function normalizeBase(value) {
  if (!value) return '/';
  let base = value.startsWith('/') ? value : `/${value}`;
  if (!base.endsWith('/')) base += '/';
  return base;
}

/**
 * GitHub Pages serves 404.html for unknown paths. The SPA redirect script needs
 * to know the deployment base path, which is only known at build time.
 */
function githubPages404Plugin(base) {
  return {
    name: 'github-pages-404-base',
    closeBundle() {
      const file = path.resolve(process.cwd(), 'dist', '404.html');
      if (!fs.existsSync(file)) return;
      const basePath = base === '/' ? '' : base.replace(/\/$/, '');
      const html = fs.readFileSync(file, 'utf8').replaceAll('__BASE_PATH__', basePath);
      fs.writeFileSync(file, html);
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const base = normalizeBase(env.VITE_BASE_PATH || '/');

  return {
    base,
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        strategies: 'injectManifest',
        srcDir: 'src',
        filename: 'sw.js',
        manifest: {
          id: base,
          name: 'Christmas Wishlist',
          short_name: 'Wishlist',
          description:
            'A family wishlist with no accounts. Add wishes, share product links and reserve gifts.',
          lang: 'en',
          theme_color: '#dc2626',
          background_color: '#0b1020',
          display: 'standalone',
          start_url: base,
          scope: base,
          icons: [
            {
              src: 'icon-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'icon-maskable-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
            {
              src: 'icon.svg',
              sizes: 'any',
              type: 'image/svg+xml',
              purpose: 'any',
            },
          ],
          share_target: {
            action: `${base}share`,
            method: 'GET',
            params: {
              title: 'title',
              text: 'text',
              url: 'url',
            },
          },
        },
        injectManifest: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        },
        devOptions: {
          enabled: false,
        },
      }),
      githubPages404Plugin(base),
    ],
    server: {
      host: true,
    },
  };
});
