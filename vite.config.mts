import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  build: {
    // S6: ห้าม vite ยัด CSS เล็กเป็น data: URL — production CSP (style-src 'self') บล็อก data:
    // เคสจริง: top-navigation-bar.css (1.7KB) ถูกยัดเป็น data:text/css แล้วโดนบล็อกเงียบๆ ทุกหน้า
    assetsInlineLimit: (filePath) => (filePath.endsWith('.css') ? false : 4096),
    outDir: 'dist',
    emptyOutDir: true,
    manifest: 'manifest.json',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      input: {
        error404: resolve(import.meta.dirname, '404.html'),
        home: resolve(import.meta.dirname, 'home/page.html'),
        search: resolve(import.meta.dirname, 'search/page.html'),
        setting: resolve(import.meta.dirname, 'setting/page.html'),
        community: resolve(import.meta.dirname, 'community/page.html'),
        contact: resolve(import.meta.dirname, 'community/contact/page.html'),
        report: resolve(import.meta.dirname, 'community/report/page.html'),
        about: resolve(import.meta.dirname, 'platform/about/page.html'),
        license: resolve(import.meta.dirname, 'platform/license/page.html'),
        privacy: resolve(import.meta.dirname, 'platform/privacy/page.html'),
        roadmap: resolve(import.meta.dirname, 'platform/roadmap/page.html'),
        whats_new: resolve(import.meta.dirname, 'platform/whats_new/page.html'),
        discover: resolve(import.meta.dirname, 'data/verse/discover/page.html'),
        scope: resolve(import.meta.dirname, 'data/verse/scope/page.html'),
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
