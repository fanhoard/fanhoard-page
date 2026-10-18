import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '..');

describe('Version Notification UX & Parser Polish', () => {
  let versionCoreSource: string;
  let newJsSource: string;

  beforeEach(() => {
    versionCoreSource = fs.readFileSync(path.join(ROOT, 'assets/js/version-core.js'), 'utf8');
    newJsSource = fs.readFileSync(path.join(ROOT, 'assets/js/new.js'), 'utf8');
  });

  describe('Markdown Section Heading Classification & Multi-language Parsing', () => {
    it('version-core.js supports localized and descriptive ### headings', () => {
      expect(versionCoreSource).toContain('function classifySection(headingText)');
      expect(versionCoreSource).toMatch(/line\.match\(\/\^###\\s\+\(\.\+\)\$\/\)/);
    });

    it('new.js supports localized and descriptive ### headings', () => {
      expect(newJsSource).toContain('function classifySection(headingText)');
      expect(newJsSource).toMatch(/line\.match\(\/\^###\\s\+\(\.\+\)\$\/\)/);
    });

    it('parses EN current.md into non-empty sections and items', () => {
      const enMd = fs.readFileSync(path.join(ROOT, 'assets/md/en/current.md'), 'utf8');

      function classifySection(headingText: string) {
        var h = (headingText || '').toLowerCase();
        if (h.indexOf('new') >= 0 || h.indexOf('ใหม่') >= 0) return 'new';
        if (h.indexOf('fix') >= 0 || h.indexOf('แก้') >= 0 || h.indexOf('reliab') >= 0 || h.indexOf('ความเสถียร') >= 0) return 'fixed';
        if (h.indexOf('remove') >= 0 || h.indexOf('ลบ') >= 0) return 'removed';
        return 'improved';
      }

      function parseMD(mdText: string) {
        var result: { sections: any[] } = { sections: [] };
        var lines = mdText.split('\n'), cs: any = null, ci: any = null;
        for (var i = 0; i < lines.length; i++) {
          var line = lines[i];
          var hm = line.match(/^###\s+(.+)$/);
          if (hm) {
            if (ci && cs) cs.items.push(ci);
            if (cs) result.sections.push(cs);
            cs = { type: classifySection(hm[1].trim()), items: [] };
            ci = null;
            continue;
          }
          if (line.match(/^\s*-\s+\*\*/)) {
            if (ci && cs) cs.items.push(ci);
            var m = line.match(/^\s*-\s+\*\*(.+?)\*\*\s*(.*)?$/);
            ci = { title: m ? m[1].trim() : line, desc: m && m[2] ? m[2].trim() : '' };
            continue;
          }
        }
        if (ci && cs) cs.items.push(ci);
        if (cs) result.sections.push(cs);
        return result;
      }

      const parsed = parseMD(enMd);
      expect(parsed.sections.length).toBeGreaterThan(0);
      expect(parsed.sections[0].items.length).toBeGreaterThan(0);
      expect(parsed.sections[0].items[0].title).toBeTruthy();
    });

    it('parses TH current.md into non-empty sections and items', () => {
      const thMd = fs.readFileSync(path.join(ROOT, 'assets/md/th/current.md'), 'utf8');

      function classifySection(headingText: string) {
        var h = (headingText || '').toLowerCase();
        if (h.indexOf('new') >= 0 || h.indexOf('ใหม่') >= 0) return 'new';
        if (h.indexOf('fix') >= 0 || h.indexOf('แก้') >= 0 || h.indexOf('reliab') >= 0 || h.indexOf('ความเสถียร') >= 0) return 'fixed';
        if (h.indexOf('remove') >= 0 || h.indexOf('ลบ') >= 0) return 'removed';
        return 'improved';
      }

      function parseMD(mdText: string) {
        var result: { sections: any[] } = { sections: [] };
        var lines = mdText.split('\n'), cs: any = null, ci: any = null;
        for (var i = 0; i < lines.length; i++) {
          var line = lines[i];
          var hm = line.match(/^###\s+(.+)$/);
          if (hm) {
            if (ci && cs) cs.items.push(ci);
            if (cs) result.sections.push(cs);
            cs = { type: classifySection(hm[1].trim()), items: [] };
            ci = null;
            continue;
          }
          if (line.match(/^\s*-\s+\*\*/)) {
            if (ci && cs) cs.items.push(ci);
            var m = line.match(/^\s*-\s+\*\*(.+?)\*\*\s*(.*)?$/);
            ci = { title: m ? m[1].trim() : line, desc: m && m[2] ? m[2].trim() : '' };
            continue;
          }
        }
        if (ci && cs) cs.items.push(ci);
        if (cs) result.sections.push(cs);
        return result;
      }

      const parsed = parseMD(thMd);
      expect(parsed.sections.length).toBeGreaterThan(0);
      expect(parsed.sections[0].items.length).toBeGreaterThan(0);
    });
  });

  describe('Version String Normalization & Dismiss-Remember Logic', () => {
    it('normalizes v prefix in version-core.js version checking', () => {
      expect(versionCoreSource).toContain('function normVer(v)');
      expect(versionCoreSource).toContain('replace(/^v/i, \'\')');
      expect(versionCoreSource).toContain('KEY_DISMISSED + normVer');
    });

    it('sets dismissed version state when visiting whats_new page', () => {
      expect(newJsSource).toContain('localStorage.setItem(\'fv_dismissed_v\' + String(current.version).replace(/^v/i, \'\')');
    });

    it('sets dismissed version state when user clicks CTA button in modal', () => {
      expect(versionCoreSource).toMatch(/a\.addEventListener\('click',\s*function\(\)\{\s*setDismissed\(wn\.version\);/);
    });
  });

  describe('Notification Decision & Accessibility', () => {
    it('supports blocking attribute from frontmatter and defaults to non-blocking', () => {
      expect(versionCoreSource).toContain('blocking: false');
      expect(versionCoreSource).toMatch(/blocking:\s*["']?(false|true)["']?/i);
      expect(versionCoreSource).toContain('var isBlocking = wn.blocking === true;');
      expect(versionCoreSource).toContain('blocking:isBlocking');
    });

    it('includes accessibility and high contrast focus ring styling', () => {
      expect(versionCoreSource).toContain('.fv-update-cta:focus-visible');
      expect(versionCoreSource).toContain('.fv-update-dismiss-btn:focus-visible');
      expect(versionCoreSource).toContain('outline:2px solid #13b47f');
      expect(versionCoreSource).toContain('outline:2px solid #00FFAA');
    });

    it('listens to global language change events in version-core.js', () => {
      expect(versionCoreSource).toContain('addEventListener(\'languageChange\', onLangChange)');
      expect(versionCoreSource).toContain('addEventListener(\'fv:langchange\', onLangChange)');
    });
  });
});
