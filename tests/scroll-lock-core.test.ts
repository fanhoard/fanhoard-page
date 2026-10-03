/**
 * tests/scroll-lock-core.test.ts — ScrollLockCore unit contract.
 *
 * The core is THE single scroll-lock authority for every screen-covering
 * overlay (FVL / PopupSystem / Search). These tests pin the contract the
 * e2e suite verifies in a real browser: ref-counting, owner tags,
 * forced release, effective-DOM observable state, and scrollable
 * exceptions. See fvl-modules/scroll-lock-core.js header for the API.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';
import { Window } from 'happy-dom';

function freshEnv() {
  const win = new Window() as any;
  win.innerWidth = 1280;
  const doc = win.document;
  Object.defineProperty(doc.documentElement, 'clientWidth', { value: 1265, configurable: true }); // 15px scrollbar
  const code = readFileSync(
    path.resolve(__dirname, '../assets/js/loading-system/fvl-modules/scroll-lock-core.js'),
    'utf-8'
  );
  const run = new Function('window', 'document', code);
  run(win, doc);
  return win;
}

describe('ScrollLockCore', () => {
  let win: any;
  beforeEach(() => {
    win = freshEnv();
  });

  it('exposes the frozen core API', () => {
    const core = win.ScrollLockCore;
    expect(core).toBeDefined();
    expect(Object.isFrozen(core)).toBe(true);
    for (const fn of ['lock', 'unlock', 'releaseAll', 'getLockCount', 'getState', 'allowScrollIn', 'reset']) {
      expect(typeof core[fn]).toBe('function');
    }
  });

  it('locks the page with effective DOM state and tracks the owner', () => {
    const core = win.ScrollLockCore;
    core.lock('popup');
    const st = core.getState();
    expect(st.locked).toBe(true);
    expect(st.count).toBe(1);
    expect(st.owners).toContain('popup');
    // Effective DOM state — not an internal flag
    expect(win.document.documentElement.hasAttribute('data-scroll-locked')).toBe(true);
    expect(win.document.body.style.position).toBe('fixed');
  });

  it('stacks multiple owners and only unlocks at zero', () => {
    const core = win.ScrollLockCore;
    core.lock('fvl');
    core.lock('popup');
    core.lock('search');
    expect(core.getLockCount()).toBe(3);

    core.unlock('popup');
    // FVL + search still hold the lock — closing one overlay must not
    // destroy the others' lock (the stacked-overlay bug class).
    expect(core.getState().locked).toBe(true);
    expect(core.getLockCount()).toBe(2);
    expect(core.getState().owners).toEqual(expect.arrayContaining(['fvl', 'search']));

    core.unlock('fvl');
    expect(core.getLockCount()).toBe(1);
    expect(win.document.documentElement.hasAttribute('data-scroll-locked')).toBe(true);

    core.unlock('search');
    expect(core.getState().locked).toBe(false);
    expect(win.document.documentElement.hasAttribute('data-scroll-locked')).toBe(false);
    expect(win.document.body.style.position).toBe('');
  });

  it('restores original body/html styles on unlock', () => {
    const core = win.ScrollLockCore;
    win.document.body.style.position = 'relative'; // pre-existing page style
    core.lock('popup');
    expect(win.document.body.style.position).toBe('fixed');
    core.unlock('popup');
    // Saved style restored — not blanked with '' (the old popup bug)
    expect(win.document.body.style.position).toBe('relative');
  });

  it('releaseAll drops every reference of one owner at once', () => {
    const core = win.ScrollLockCore;
    core.lock('popup');
    core.lock('popup');
    core.lock('fvl');
    core.releaseAll('popup');
    const st = core.getState();
    expect(st.count).toBe(1);
    expect(st.owners).toEqual(['fvl']);
    expect(st.locked).toBe(true);
  });

  it('over-unlock is a safe no-op', () => {
    const core = win.ScrollLockCore;
    core.lock('popup');
    core.unlock('popup');
    core.unlock('popup'); // must not throw or underflow
    expect(core.getLockCount()).toBe(0);
  });

  it('registers scrollable-inside-overlay selectors for guard exceptions', () => {
    const core = win.ScrollLockCore;
    core.allowScrollIn('.search-overlay-scrollable-content');
    core.allowScrollIn('.search-overlay-scrollable-content'); // idempotent
    core.lock('search');
    // Guard listeners must be attached while locked
    expect(win.document.body.style.overflow).toBe('hidden');
    core.unlock('search');
    expect(win.document.body.style.overflow).toBe('');
  });

  it('reset() force-clears everything (test/teardown escape hatch)', () => {
    const core = win.ScrollLockCore;
    core.lock('fvl');
    core.lock('popup');
    core.reset();
    expect(core.getLockCount()).toBe(0);
    expect(win.document.documentElement.hasAttribute('data-scroll-locked')).toBe(false);
    expect(win.document.body.style.position).toBe('');
  });
});
