# Build & CI/CD Subsystem Plan

**Subsystem Name:** Vite Bundler, SSG Pipeline, Vitest & CI/CD  
**Scope:** `fanhoard/fanhoard-page` & `Jeffy2600II/community-fanhoard`  

---

## 1. Target Build & CI/CD Architecture

The Build & CI/CD Subsystem establishes modern build tooling, static site generation, automated testing, and continuous integration gating across both repositories.

### Build & Automation Matrix
```
[ Code Commit / Pull Request ]
       │
       ▼
[ GitHub Actions CI ] (.github/workflows/ci.yml)
       ├── 1. npm run type-check (tsc --noEmit)
       ├── 2. npm run lint (ESLint + Prettier check)
       ├── 3. npm run test (Vitest unit & integration tests)
       ├── 4. npm run test:e2e (Playwright browser automation)
       └── 5. npm run build (Vite & Cheerio SSG build)
       │
       ▼ Pass
[ Automated Deployment ]
       ├── fanhoard-page ──► Cloudflare Pages
       └── community-fanhoard ──► Cloudflare Workers
```

---

## 2. Tooling Configuration

### Vite Config (`vite.config.ts` in `fanhoard-page`)
```typescript
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: 'dist',
    minify: 'terser',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        home: resolve(__dirname, 'home/index.html'),
        search: resolve(__dirname, 'search/index.html'),
        setting: resolve(__dirname, 'setting/index.html'),
        community: resolve(__dirname, 'community/index.html')
      }
    }
  }
});
```

### TypeScript SSG Pipeline (`src/build/ssg.ts`)
SSG generator parses source templates using `cheerio`, substitutes localized strings from `en.json` and `th.json`, injects shared header/footer snippets, and generates pre-rendered HTML into `dist/en/` and `dist/th/`.

---

## 3. Testing Infrastructure

1. **Vitest (Unit & Integration)**:
   - Configured in `vitest.config.ts`.
   - Executable via `npm run test`.
   - Generates code coverage report (`coverage/`).
2. **Playwright (End-to-End Browser Tests)**:
   - Configured in `playwright.config.ts`.
   - Tests critical workflows (symbol copying, language toggling, bug report submission).
   - Executable via `npm run test:e2e`.

---

## 4. Migration & Implementation Steps

1. **Phase 1**: Configure `tsconfig.json`, ESLint, and Prettier in both repos.
2. **Phase 2**: Build Vitest pool workers test suite in `community-fanhoard`.
3. **Phase 5**: Build Vite SSG bundler pipeline in `fanhoard-page`.
4. **Phase 6**: Configure `.github/workflows/ci.yml` gating PRs on type-check, lint, Vitest, Playwright, and build.
5. **Verification**: Submit test PR and verify GitHub Actions CI blocks PR on failing checks and passes on clean builds.
