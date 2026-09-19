import { describe, it, expect, beforeEach } from 'vitest';

// Load popup modules into window.PopupModules
import '../../assets/js/popup-modules/types.js';
import '../../assets/js/popup-modules/config.js';
import '../../assets/js/popup-modules/state.js';
import '../../assets/js/popup-modules/utils.js';

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
