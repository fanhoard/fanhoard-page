import { describe, it, expect, beforeEach } from 'vitest';

/**
 * Scoped-mode empty-target fallback (v3.0.9).
 * WHY: during a route swap the scoped overlay's target (#content-loading)
 * is emptied before the fetch completes; a zero-height target collapsed the
 * absolutely-positioned overlay and the user saw a blank content area.
 * FVL now holds a min-height on the target while shown when the target is
 * shorter than CONFIG.SCOPED_EMPTY_MIN_HEIGHT.THRESHOLD_PX, and restores the
 * original value on hide.
 */
describe('FVL scoped empty-target min-height fallback', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    const fvlPath = require.resolve('../assets/js/loading-system/fvl.js');
    delete require.cache[fvlPath];
    delete (window as any).FVL;
    delete (window as any).FVLModules;

    require('../assets/js/loading-system/fvl.js');
  });

  function loadFvl() {
    return (window as any).FVL;
  }

  it('applies fallback min-height to a collapsed (empty) scoped target while shown', () => {
    const FVL = loadFvl();
    const target = document.createElement('div');
    target.id = 'empty-target';
    // empty target: JSDOM reports offsetHeight 0 -> below threshold
    document.body.appendChild(target);

    expect(target.style.minHeight).toBe('');

    const handle = FVL.scoped({ target: '#empty-target', instant: true });
    expect(handle).toBeTruthy();
    // JSDOM offsetHeight is 0 -> fallback must engage
    expect(target.style.minHeight).toBe('60vh');
    expect(target.getAttribute('aria-busy')).toBe('true');
  });

  it('restores the original min-height when the scoped loader hides', async () => {
    const FVL = loadFvl();
    const target = document.createElement('div');
    target.id = 'empty-target-2';
    document.body.appendChild(target);

    const handle = FVL.scoped({ target: '#empty-target-2', instant: true });
    expect(target.style.minHeight).toBe('60vh');

    FVL.hide(handle.id);
    await new Promise((r) => setTimeout(r, 300)); // past LEAVE (180ms)
    expect(target.style.minHeight).toBe('');
  });

  it('restores a pre-existing custom min-height, not just clears it', async () => {
    const FVL = loadFvl();
    const target = document.createElement('div');
    target.id = 'custom-mh-target';
    target.style.minHeight = '200px';
    document.body.appendChild(target);

    const handle = FVL.scoped({ target: '#custom-mh-target', instant: true });
    expect(target.style.minHeight).toBe('60vh');

    FVL.hide(handle.id);
    await new Promise((r) => setTimeout(r, 300));
    expect(target.style.minHeight).toBe('200px');
  });

  it('does not clobber the fallback while another scoped instance holds the same target', async () => {
    const FVL = loadFvl();
    const target = document.createElement('div');
    target.id = 'shared-target';
    document.body.appendChild(target);

    const h1 = FVL.scoped({ target: '#shared-target', instant: true, id: 'scoped-a' });
    const h2 = FVL.scoped({ target: '#shared-target', instant: true, id: 'scoped-b' });
    expect(target.style.minHeight).toBe('60vh');

    // hide the first one: second still holds the target -> min-height kept
    FVL.hide(h1.id);
    await new Promise((r) => setTimeout(r, 300));
    expect(target.style.minHeight).toBe('60vh');

    // hide the second: nobody holds it -> restored
    FVL.hide(h2.id);
    await new Promise((r) => setTimeout(r, 300));
    expect(target.style.minHeight).toBe('');
  });

  it('leaves the config contract stable (SCOPED_EMPTY_MIN_HEIGHT frozen constants)', () => {
    const FVL = loadFvl();
    const fb = (window as any).FVLModules.CONFIG.SCOPED_EMPTY_MIN_HEIGHT;
    expect(fb.THRESHOLD_PX).toBe(240);
    expect(fb.MIN_HEIGHT).toBe('60vh');
    // public API untouched
    expect(typeof FVL.show).toBe('function');
    expect(typeof FVL.scoped).toBe('function');
    expect(typeof FVL.hide).toBe('function');
  });
});
