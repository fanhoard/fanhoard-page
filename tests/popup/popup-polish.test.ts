import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';

// Load popup modules into window.PopupModules
// Install the real shared scroll-lock core used by the application.
beforeAll(async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const code = fs.readFileSync(path.resolve(process.cwd(), 'assets/js/loading-system/fvl-modules/scroll-lock-core.js'), 'utf8');
  new Function('window', 'document', code)(window, document);
});

import '../../assets/js/popup-modules/types.js';
import '../../assets/js/popup-modules/config.js';
import '../../assets/js/popup-modules/state.js';
import '../../assets/js/popup-modules/utils.js';
import '../../assets/js/popup-modules/animator.js';
import '../../assets/js/popup-modules/renderer.js';
import '../../assets/js/popup-modules/theme.js';
import '../../assets/js/popup-modules/overlay.js';
import '../../assets/js/popup-modules/a11y.js';
import '../../assets/js/popup-modules/queue.js';
import '../../assets/js/popup-modules/engine.js';
import '../../assets/js/popup-modules/init.js';

describe('Popup System Polish (S5)', () => {
  beforeEach(() => {
    (window as any).ScrollLockCore?.reset();
    document.body.innerHTML = '';
    const State = (window as any).PopupModules.State;
    if (State && State.destroyAll) {
      State.destroyAll();
    }
  });

  describe('Option Merging & Timing Consistency', () => {
    it('Utils.mergeOptions respects type-specific preset timing', () => {
      const Utils = (window as any).PopupModules.Utils;

      const drawerOpts = Utils.mergeOptions({ type: 'drawer' }, Utils.getPreset('drawer'));
      expect(drawerOpts._enterDuration).toBe(300);
      expect(drawerOpts._exitDuration).toBe(250);

      const toastOpts = Utils.mergeOptions({ type: 'toast' }, Utils.getPreset('toast'));
      expect(toastOpts._enterDuration).toBe(250);
      expect(toastOpts._exitDuration).toBe(280);

      const sheetOpts = Utils.mergeOptions({ type: 'sheet' }, Utils.getPreset('sheet'));
      expect(sheetOpts._enterDuration).toBe(340);
      expect(sheetOpts._exitDuration).toBe(260);
    });

    it('CONFIG.A11Y exports AUTO_FOCUS_SELECTOR and FOCUS_DELAY_MS', () => {
      const CONFIG = (window as any).PopupModules.CONFIG;
      expect(CONFIG.A11Y.AUTO_FOCUS_SELECTOR).toBeDefined();
      expect(CONFIG.A11Y.AUTO_FOCUS_SELECTOR).toContain('button');
      expect(CONFIG.A11Y.FOCUS_DELAY_MS).toBe(30);
    });
  });

  describe('Focus Trap & Accessibility', () => {
    it('Focus trap cycles tab focus correctly between interactive elements including header close button', async () => {
      const PopupSystem = (window as any).PopupSystem;

      await PopupSystem.open({
        id: 'trap-test',
        body: '<input id="inp1" type="text"/><button id="btn1">Submit</button>',
        focusTrap: true,
      });

      const root = document.querySelector('[data-fp-id="trap-test"]') as HTMLElement;
      const closeBtn = root.querySelector('[data-fp-close]') as HTMLButtonElement;
      const input = document.getElementById('inp1') as HTMLInputElement;
      const button = document.getElementById('btn1') as HTMLButtonElement;

      expect(closeBtn).not.toBeNull();
      expect(input).not.toBeNull();
      expect(button).not.toBeNull();

      // Focus last element (button) and dispatch Tab -> should wrap to first element in root (closeBtn)
      button.focus();
      expect(document.activeElement).toBe(button);

      const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
      document.dispatchEvent(tabEvent);

      expect(tabEvent.defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(closeBtn);

      // Focus first element (closeBtn) and dispatch Shift+Tab -> should wrap to last element in root (button)
      closeBtn.focus();
      const shiftTabEvent = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true });
      document.dispatchEvent(shiftTabEvent);

      expect(shiftTabEvent.defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(button);

      await PopupSystem.close('trap-test');
    });

    it('Sets aria-modal, aria-live, and aria-atomic on rendered popups', async () => {
      const PopupSystem = (window as any).PopupSystem;

      await PopupSystem.open({ id: 'modal-a11y-test', title: 'A11y Test' });
      const modalEl = document.querySelector('[data-fp-id="modal-a11y-test"]');
      expect(modalEl?.getAttribute('aria-modal')).toBe('true');
      await PopupSystem.close('modal-a11y-test');

      await PopupSystem.toast('Processing...', { id: 'toast-a11y-test' });
      const toastEl = document.querySelector('[data-fp-id="toast-a11y-test"]');
      expect(toastEl?.getAttribute('aria-live')).toBe('polite');
      expect(toastEl?.getAttribute('aria-atomic')).toBe('true');
      await PopupSystem.close('toast-a11y-test');
    });
  });

  describe('ESC Key & Overlay Click Behavior', () => {
    it('Ignores Escape key when event default is prevented by child widget', async () => {
      const PopupSystem = (window as any).PopupSystem;
      const State = (window as any).PopupModules.State;

      const popupId = 'esc-prevented-test';
      await PopupSystem.open({ id: popupId, title: 'ESC Test', dismissOnEscape: true });

      // Dispatch ESC event with defaultPrevented = true
      const escEvt = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
      escEvt.preventDefault();
      document.dispatchEvent(escEvt);

      // Instance should remain open
      expect(State.getInstance(popupId)).not.toBeNull();

      await PopupSystem.close(popupId);
    });

    it('Backdrop click requires mousedown and click on overlay element', async () => {
      const PopupSystem = (window as any).PopupSystem;

      const popupId = 'backdrop-drag-test';
      await PopupSystem.open({ id: popupId, title: 'Backdrop Test', dismissOnOverlay: true });

      const overlayEl = document.querySelector('[data-fp-overlay]') as HTMLElement;
      const rootEl = document.querySelector('[data-fp-id="backdrop-drag-test"]') as HTMLElement;

      expect(overlayEl).not.toBeNull();
      expect(rootEl).not.toBeNull();

      // Mousedown on inner content, click on overlay (simulating text drag-release)
      rootEl.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      overlayEl.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

      // Should not have closed immediately
      const inst = (window as any).PopupModules.State.getInstance(popupId);
      expect(inst?.state).toBe('open');

      // Mousedown on overlay, click on overlay -> should close
      overlayEl.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      overlayEl.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

      await new Promise(r => setTimeout(r, 350));
      expect((window as any).PopupModules.State.getInstance(popupId)).toBeNull();
    });
  });

  describe('Toast Variants & Helpers', () => {
    it('Supports toast.success, toast.error, toast.warning, toast.info helpers', async () => {
      const PopupSystem = (window as any).PopupSystem;

      await PopupSystem.toast.success('Saved successfully!', { id: 'toast-success' });
      const elSuccess = document.querySelector('[data-fp-id="toast-success"]');
      expect(elSuccess?.classList.contains('fp-toast-success')).toBe(true);
      await PopupSystem.close('toast-success');

      await PopupSystem.toast.error('Operation failed!', { id: 'toast-error' });
      const elError = document.querySelector('[data-fp-id="toast-error"]');
      expect(elError?.classList.contains('fp-toast-error')).toBe(true);
      expect(elError?.getAttribute('aria-live')).toBe('assertive');
      await PopupSystem.close('toast-error');

      await PopupSystem.toast.warning('Check input values', { id: 'toast-warning' });
      const elWarning = document.querySelector('[data-fp-id="toast-warning"]');
      expect(elWarning?.classList.contains('fp-toast-warning')).toBe(true);
      await PopupSystem.close('toast-warning');

      await PopupSystem.toast.info('New version available', { id: 'toast-info' });
      const elInfo = document.querySelector('[data-fp-id="toast-info"]');
      expect(elInfo?.classList.contains('fp-toast-info')).toBe(true);
      await PopupSystem.close('toast-info');
    });
  });

  describe('Stacking Z-Index Increment', () => {
    it('Multiple stacked popups increment z-index by STACK_STEP (2)', async () => {
      const PopupSystem = (window as any).PopupSystem;
      const State = (window as any).PopupModules.State;

      await PopupSystem.open({ id: 'stack-1', title: 'Popup 1' });
      await PopupSystem.open({ id: 'stack-2', title: 'Popup 2' });

      const inst1 = State.getInstance('stack-1');
      const inst2 = State.getInstance('stack-2');

      expect(inst1.zIndex).toBe(600);
      expect(inst2.zIndex).toBe(602);

      await PopupSystem.close('stack-2');
      await PopupSystem.close('stack-1');
    });
  });
});
