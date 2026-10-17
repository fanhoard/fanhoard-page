import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '..');

describe('Version Pipeline Audit & Standard Verification', () => {
  describe('Release Artifacts & File Structure Consistency', () => {
    it('verifies assets/md/en/current.md and assets/md/th/current.md exist and match version', () => {
      const enPath = path.join(ROOT, 'assets/md/en/current.md');
      const thPath = path.join(ROOT, 'assets/md/th/current.md');

      expect(fs.existsSync(enPath)).toBe(true);
      expect(fs.existsSync(thPath)).toBe(true);

      const enContent = fs.readFileSync(enPath, 'utf8');
      const thContent = fs.readFileSync(thPath, 'utf8');

      const enVerMatch = enContent.match(/^version:\s*(.+)$/m);
      const thVerMatch = thContent.match(/^version:\s*(.+)$/m);

      expect(enVerMatch).not.toBeNull();
      expect(thVerMatch).not.toBeNull();
      expect(enVerMatch![1].trim()).toBe(thVerMatch![1].trim());
    });

    it('verifies assets/md/{en,th}/releases/ history folders contain v3.2.2 and v3.2.3', () => {
      const versions = ['v3.2.2.md', 'v3.2.3.md'];
      for (const lang of ['en', 'th']) {
        for (const ver of versions) {
          const filePath = path.join(ROOT, `assets/md/${lang}/releases/${ver}`);
          expect(fs.existsSync(filePath), `Missing ${filePath}`).toBe(true);
          const content = fs.readFileSync(filePath, 'utf8');
          expect(content).toContain('version:');
          expect(content).toContain('title:');
        }
      }
    });

    it('buildLedger คำนวณ Manifest จาก Ledger ได้ (ไม่ต้องมีไฟล์ index.json ใน git)', () => {
      const { buildLedger } = require('../scripts/release-ledger.js');
      for (const lang of ['en', 'th']) {
        const { manifest } = buildLedger(ROOT, lang);
        expect(Array.isArray(manifest.versions)).toBe(true);
        expect(manifest.versions.length).toBeGreaterThan(0);
        expect(manifest.versions.length).toBeLessThanOrEqual(7);
        const latestHistory = manifest.versions[0];
        expect(latestHistory.version).toBeTruthy();
        expect(latestHistory.hasDetails).toBe(true);
      }
    });

    it('buildLedger ให้ version.json ตรงกับรุ่นล่าสุดใน Ledger (ผ่าน seam ไม่ผ่านไฟล์)', () => {
      const { buildLedger } = require('../scripts/release-ledger.js');
      const { version } = buildLedger(ROOT, 'en');
      const ledgerFiles = fs.readdirSync(path.join(ROOT, 'assets/md/en/releases')).filter(f => /^v[0-9]/.test(f));
      const expected = ledgerFiles.map(f => f.replace(/^v|\.md$/g, '')).sort(require('../scripts/release-ledger.js').cmpVersion).pop();
      expect(version.version).toBe(expected);
    });
  });

  describe('Dynamic Loaders & Build Script Configuration', () => {
    it('verifies update-version.js includes search and fvl in DYNAMIC_LOADERS', () => {
      const scriptPath = path.join(ROOT, 'scripts/update-version.js');
      const scriptContent = fs.readFileSync(scriptPath, 'utf8');

      expect(scriptContent).toContain('assets/js/search-system/search.js');
      expect(scriptContent).toContain('assets/js/loading-system/fvl.js');
      expect(scriptContent).not.toContain('assets/js/search-ui.js');
    });
  });

  describe('version-core.js Logic Hardening', () => {
    let rawJs: string;

    beforeEach(() => {
      rawJs = fs.readFileSync(path.join(ROOT, 'assets/js/version-core.js'), 'utf8');
    });

    it('validates window.FvLang language against SUPPORTED_LANGS', () => {
      expect(rawJs).toContain('SUPPORTED_LANGS.indexOf(l) >= 0');
    });

    it('contains fallback to en when non-english current.md fetch fails', () => {
      expect(rawJs).toContain("Fallback to 'en' if non-english fetch failed");
    });

    it('supports frontmatter notify boolean with quotes or case variations', () => {
      expect(rawJs).toMatch(/notify:\s*["']?(false|true)["']?/i);
    });

    it('formats date properly in buildContent instead of accessing string.th/en', () => {
      expect(rawJs).toContain('TH_M = [');
      expect(rawJs).toContain('EN_M = [');
    });

    it('includes accessibility attributes ariaLabel and ariaDescribedBy for update modal', () => {
      expect(rawJs).toContain('ariaLabel:');
      expect(rawJs).toContain('ariaDescribedBy:');
      expect(rawJs).toContain('type="button"');
    });
  });
});
