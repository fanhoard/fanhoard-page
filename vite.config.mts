import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      input: {
        index: resolve(import.meta.dirname, 'index.html'),
        home: resolve(import.meta.dirname, 'home/index.html'),
        search: resolve(import.meta.dirname, 'search/index.html'),
        setting: resolve(import.meta.dirname, 'setting/index.html'),
        community: resolve(import.meta.dirname, 'community/index.html'),
        contact: resolve(import.meta.dirname, 'community/contact/index.html'),
        report: resolve(import.meta.dirname, 'community/report/index.html'),
        about: resolve(import.meta.dirname, 'platform/about/index.html'),
        license: resolve(import.meta.dirname, 'platform/license/index.html'),
        privacy: resolve(import.meta.dirname, 'platform/privacy/index.html'),
        roadmap: resolve(import.meta.dirname, 'platform/roadmap/index.html'),
        whats_new: resolve(import.meta.dirname, 'platform/whats_new/index.html'),
        discover: resolve(import.meta.dirname, 'data/verse/discover/index.html'),
        scope: resolve(import.meta.dirname, 'data/verse/scope/index.html'),
      },
      output: {
        entryFileNames: 'assets/js/[name]-[hash].js',
        chunkFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'assets/css/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
  },
});
