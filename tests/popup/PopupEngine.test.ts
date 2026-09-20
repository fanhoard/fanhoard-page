import { describe, it, expect, beforeEach } from 'vitest';

// Load popup modules into window.PopupModules
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

describe('PopupEngine XSS Hardening', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('Utils.sanitizeHTML strips script tags, event attributes, and dangerous URIs', () => {
    const Utils = (window as any).PopupModules.Utils;

    // Script tag stripping
    const xssScript = '<script>alert("XSS")</script><p>Safe content</p>';
    expect(Utils.sanitizeHTML(xssScript)).toBe('<p>Safe content</p>');

    // Inline event handler stripping
    const xssImg = '<img src="x" onerror="alert(1)">';
    expect(Utils.sanitizeHTML(xssImg)).toBe('<img src="x">');

    // Dangerous javascript: URI stripping
    const xssLink = '<a href="javascript:alert(1)">Click me</a>';
    expect(Utils.sanitizeHTML(xssLink)).toBe('<a>Click me</a>');

    // Safe inline SVG preserving
    const safeSvg = '<svg width="20" height="20"><line x1="0" y1="0" x2="10" y2="10"></line></svg>';
    expect(Utils.sanitizeHTML(safeSvg)).toContain('<svg');
  });

  it('Utils.escapeHTML encodes special HTML characters', () => {
    const Utils = (window as any).PopupModules.Utils;

    const input = '<script>alert("hello & welcome")</script>';
    expect(Utils.escapeHTML(input)).toBe('&lt;script&gt;alert(&quot;hello &amp; welcome&quot;)&lt;/script&gt;');
  });
});

describe('PopupEngine Rapid Toggle & Robustness', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    const State = (window as any).PopupModules.State;
    if (State && State.destroyAll) {
      State.destroyAll();
    }
  });

  it('Rapid open-close-open-close (x5) cleanly closes without sticking open', async () => {
    const PopupSystem = (window as any).PopupSystem;
    const State = (window as any).PopupModules.State;

    const popupId = 'rapid-test-popup';

    // Rapid toggle 5 times in quick succession
    for (let i = 0; i < 5; i++) {
      const pOpen = PopupSystem.open({ id: popupId, title: `Test ${i}`, body: `<p>Content ${i}</p>` });
      const pClose = PopupSystem.close(popupId);
      await Promise.all([pOpen, pClose]);
    }

    // Verify DOM and State are clean
    expect(document.querySelector(`[data-fp-id="${popupId}"]`)).toBeNull();
    expect(State.getInstance(popupId)).toBeNull();
    expect(State.getActiveCount()).toBe(0);
  });

  it('Normal open and close leaves DOM and State synchronized', async () => {
    const PopupSystem = (window as any).PopupSystem;
    const State = (window as any).PopupModules.State;

    const popupId = 'normal-test-popup';
    await PopupSystem.open({ id: popupId, title: 'Normal', body: '<p>Body</p>' });

    expect(State.getInstance(popupId)).not.toBeNull();
    expect(document.querySelector(`[data-fp-id="${popupId}"]`)).not.toBeNull();

    await PopupSystem.close(popupId);

    expect(State.getInstance(popupId)).toBeNull();
    expect(document.querySelector(`[data-fp-id="${popupId}"]`)).toBeNull();
    expect(State.getActiveCount()).toBe(0);
  });

  it('ESC key closes the topmost active popup cleanly', async () => {
    const PopupSystem = (window as any).PopupSystem;
    const State = (window as any).PopupModules.State;

    const popupId = 'esc-test-popup';
    await PopupSystem.open({ id: popupId, title: 'ESC Test', dismissOnEscape: true });

    expect(State.getInstance(popupId)).not.toBeNull();

    // Dispatch ESC keydown
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    // Wait for exit animation to complete (200ms exit + buffer)
    await new Promise(r => setTimeout(r, 350));

    expect(State.getInstance(popupId)).toBeNull();
    expect(document.querySelector(`[data-fp-id="${popupId}"]`)).toBeNull();
  });
});
