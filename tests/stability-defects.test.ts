import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Part 2 Site-wide Stability & Defect Fixes', () => {
  const read = (relPath: string) => fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');

  it('High 1: router.js popstate has _navSequenceId guard', () => {
    const code = read('assets/js/nav-core-modules/router.js');
    expect(code).toContain('_navSequenceId');
    expect(code).toContain('if (seq !== this._navSequenceId) return;');
  });

  it('High 2: home.js fetchIdOrder returns empty array fallback on error', () => {
    const code = read('assets/js/home.js');
    expect(code).toContain('if (!r.ok) return [];');
    expect(code).toContain('catch (_) { return []; }');
  });

  it('High 3: data.js fetch wrapper handles AbortError gracefully', () => {
    const code = read('assets/js/nav-core-modules/data.js');
    expect(code).toContain("err.name === 'AbortError'");
    expect(code).toContain('return { ok: false, aborted: true };');
  });

  it('High 4: a11y.js tracks and cleans up focus trap listeners', () => {
    const code = read('assets/js/popup-modules/a11y.js');
    expect(code).toContain('_activeTraps = new Map()');
    expect(code).toContain('_activeTraps.delete(instanceId)');
  });

  it('High 5: content.js scroll persistence includes passive option and cleanup method', () => {
    const code = read('assets/js/nav-core-modules/content.js');
    expect(code).toContain('_cleanupScrollPersist()');
    expect(code).toContain("window.addEventListener('scroll', this._scrollPersistHandler, { passive: true });");
  });

  it('Medium 6: init.js throttles resize listener using requestAnimationFrame', () => {
    const code = read('assets/js/nav-core-modules/init.js');
    expect(code).toContain('_resizeRaf = requestAnimationFrame');
    expect(code).toContain('cancelAnimationFrame(_resizeRaf)');
  });

  it('Medium 7: data-loader.js validates response ok status before json parsing', () => {
    const code = read('assets/js/search-system/search-modules/data-loader.js');
    expect(code).toContain("if (!r.ok) throw new Error('HTTP ' + r.status);");
  });

  it('Medium 8 & 9: search.css, about.css, and layout.css include prefers-reduced-motion media queries', () => {
    expect(read('assets/css/search.css')).toContain('@media (prefers-reduced-motion: reduce)');
    expect(read('assets/css/about.css')).toContain('@media (prefers-reduced-motion: reduce)');
    expect(read('assets/css/layout.css')).toContain('@media (prefers-reduced-motion: reduce)');
  });

  it('Medium 10: home.js deduplicates fv:langchange listener binding', () => {
    const code = read('assets/js/home.js');
    expect(code).toContain('_langChangeHandler');
    expect(code).toContain('window.removeEventListener');
  });
});
