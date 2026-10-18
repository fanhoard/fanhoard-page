import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('FVL Spinner-ONLY & Bare Display Modes', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.head.innerHTML = '';

    delete (window as any).FVL;
    delete (window as any).FLV;
    delete (window as any).FVLSpinner;
    delete (window as any).FVLModules;

    const fvlCode = fs.readFileSync(
      path.resolve(__dirname, '../assets/js/loading-system/fvl.js'),
      'utf-8'
    );
    const runScript = new Function('window', 'document', 'localStorage', fvlCode);
    runScript(window, document, window.localStorage);
  });

  afterEach(() => {
    if ((window as any).FVL && typeof (window as any).FVL.hideAll === 'function') {
      (window as any).FVL.hideAll();
    }
  });

  describe('Fullscreen Spinner-ONLY & Bare Modes', () => {
    it('omits message & text container DOM elements when spinnerOnly: true', () => {
      const FVL = (window as any).FVL;
      const handle = FVL.show({ mode: 'fullscreen', spinnerOnly: true, instant: true });

      const root = handle.element;
      expect(root.querySelector('.fvl-spinner')).not.toBeNull();
      expect(root.querySelector('.fvl-text')).toBeNull();
      expect(root.querySelector('.fvl-msg')).toBeNull();
      expect(root.querySelector('.fvl-sub')).toBeNull();
      expect(root.getAttribute('aria-label')).toBe('Loading');
    });

    it('applies fvl-bare and fvl-chromeless modifier classes when bare: true', () => {
      const FVL = (window as any).FVL;
      const handle = FVL.fullscreen({ bare: true, instant: true });

      const root = handle.element;
      expect(root.classList.contains('fvl-bare')).toBe(true);
      expect(root.classList.contains('fvl-chromeless')).toBe(true);
      expect(root.querySelector('.fvl-text')).toBeNull();
    });
  });

  describe('Scoped Spinner-ONLY, Bare & TargetSlot Modes', () => {
    it('omits message element in scoped mode when spinnerOnly: true', () => {
      const target = document.createElement('div');
      target.id = 'scoped-box';
      document.body.appendChild(target);

      const FVL = (window as any).FVL;
      const handle = FVL.scoped({ target: '#scoped-box', spinnerOnly: true, message: 'Should be omitted', instant: true });

      const inner = handle.element.querySelector('.fvl-scoped-inner');
      expect(inner).not.toBeNull();
      expect(inner.querySelector('.fvl-spinner')).not.toBeNull();
      expect(inner.querySelector('.fvl-msg')).toBeNull();
    });

    it('applies chromeless & bare modifier classes in scoped mode', () => {
      const target = document.createElement('div');
      target.id = 'scoped-box-2';
      document.body.appendChild(target);

      const FVL = (window as any).FVL;
      const handle = FVL.scoped({ target: '#scoped-box-2', bare: true, instant: true });

      expect(handle.element.classList.contains('fvl-bare')).toBe(true);
      expect(handle.element.classList.contains('fvl-chromeless')).toBe(true);
    });

    it('mounts into targetSlot when targetSlot option is provided', () => {
      const container = document.createElement('div');
      container.id = 'slot-container';
      const slot = document.createElement('div');
      slot.className = 'custom-slot';
      container.appendChild(slot);
      document.body.appendChild(container);

      const FVL = (window as any).FVL;
      const handle = FVL.scoped({ target: '#slot-container', targetSlot: '.custom-slot', bare: true, instant: true });

      expect(slot.querySelector('.fvl-scoped')).not.toBeNull();
      expect(container.getAttribute('aria-busy')).toBe('true');
    });
  });

  describe('Inline & Topbar Bare Modes', () => {
    it('renders chromeless inline spinner when bare: true', () => {
      const btn = document.createElement('button');
      btn.id = 'inline-btn';
      document.body.appendChild(btn);

      const FVL = (window as any).FVL;
      const handle = FVL.inline({ target: '#inline-btn', bare: true, instant: true });

      expect(handle.element.classList.contains('fvl-bare')).toBe(true);
      expect(handle.element.querySelector('.fvl-inline-msg')).toBeNull();
    });

    it('renders chromeless topbar indicator when bare: true', () => {
      const FVL = (window as any).FVL;
      const handle = FVL.topbar({ bare: true, instant: true });

      expect(handle.element.classList.contains('fvl-bare')).toBe(true);
      expect(handle.element.classList.contains('fvl-chromeless')).toBe(true);
    });
  });
});
