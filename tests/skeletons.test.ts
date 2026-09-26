import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('PLSys CSS Skeletons & Geometry Guards', () => {
  const cssPath = path.join(__dirname, '../assets/css/skeletons.css');
  const tokensCssPath = path.join(__dirname, '../assets/css/tokens.css');
  const loadingSysCssPath = path.join(__dirname, '../assets/css/loading-system.css');

  it('skeletons.css exists and contains required CLS=0 geometry guards', () => {
    expect(fs.existsSync(cssPath)).toBe(true);
    const css = fs.readFileSync(cssPath, 'utf8');

    // Geometry guards
    expect(css).toContain('.pl-card-skeleton');
    expect(css).toContain('aspect-ratio: 14 / 9');
    expect(css).toContain('min-height: 180px');

    expect(css).toContain('.pl-pill-skeleton');
    expect(css).toContain('height: 36px');

    expect(css).toContain('.pl-timeline-skeleton');
    expect(css).toContain('min-height: 72px');

    expect(css).toContain('.pl-button-skeleton');
    expect(css).toContain('height: 40px');

    expect(css).toContain('.pl-grid-skeleton');
    expect(css).toContain('grid-template-columns: repeat(auto-fill, minmax(220px, 1fr))');
  });

  it('contains shimmer animation and reduced-motion static fill variant (WCAG 2.1)', () => {
    const css = fs.readFileSync(cssPath, 'utf8');

    expect(css).toContain('@keyframes pl-shimmer');
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    expect(css).toContain('animation: none !important');
    expect(css).toContain('background: var(--pl-skeleton-static)');
  });

  it('contains top progress bar and error boundary retry styles', () => {
    const css = fs.readFileSync(cssPath, 'utf8');

    expect(css).toContain('#pl-top-progress');
    expect(css).toContain('.pl-error-boundary');
    expect(css).toContain('.pl-retry-btn');
  });

  it('is wired into stylesheet load paths (tokens.css and loading-system.css)', () => {
    const tokensCss = fs.readFileSync(tokensCssPath, 'utf8');
    const loadingSysCss = fs.readFileSync(loadingSysCssPath, 'utf8');

    expect(tokensCss).toContain('skeletons.css');
    expect(loadingSysCss).toContain('skeletons.css');
  });
});
