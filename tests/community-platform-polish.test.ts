import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Community & Platform Pages Polish', () => {
  const repoRoot = path.resolve(__dirname, '..');

  it('verifies community/index.html has correct title and links', () => {
    const content = fs.readFileSync(path.join(repoRoot, 'community/index.html'), 'utf8');
    expect(content).toContain('data-translate="others.community-text"');
    expect(content).toContain('href="./contact/"');
    expect(content).toContain('href="./report/"');
    expect(content).toContain('class="skip-link fv-skip-link"');
  });

  it('verifies assets/lang/en.json has correct official email spelling', () => {
    const content = fs.readFileSync(path.join(repoRoot, 'assets/lang/en.json'), 'utf8');
    expect(content).toContain('fanhoard.official@gmail.com');
    expect(content).not.toContain('fanhoard.offical@gmail.com');
  });

  it('verifies all community and platform pages contain required accessibility landmarks', () => {
    const pages = [
      'community/index.html',
      'community/report/index.html',
      'community/contact/index.html',
      'platform/about/index.html',
      'platform/license/index.html',
      'platform/privacy/index.html',
      'platform/roadmap/index.html',
      'platform/whats_new/index.html',
      'home/index.html',
    ];

    pages.forEach((pagePath) => {
      const fullPath = path.join(repoRoot, pagePath);
      expect(fs.existsSync(fullPath)).toBe(true);
      const content = fs.readFileSync(fullPath, 'utf8');

      // Skip link
      expect(content).toContain('class="skip-link fv-skip-link"');
      // Main landmark with role="main" or <main>
      expect(content).toContain('<main');
      // Footer mount or footer element
      expect(content).toContain('fv-footer');
    });
  });

  it('verifies report form script includes aria-invalid and aria-describedby error handling', () => {
    const content = fs.readFileSync(path.join(repoRoot, 'community/report/index.html'), 'utf8');
    expect(content).toContain("field.setAttribute('aria-invalid', 'true')");
    expect(content).toContain("field.setAttribute('aria-describedby', errorId)");
    expect(content).toContain("el.setAttribute('aria-invalid', 'false')");
    expect(content).toContain("el.removeAttribute('aria-describedby')");
    expect(content).toContain('firstInvalidEl.focus()');
    expect(content).toContain("window.addEventListener('fv:langchange', refreshSelects)");
  });

  it('verifies contact page script includes dynamic language change listeners', () => {
    const content = fs.readFileSync(path.join(repoRoot, 'community/contact/index.html'), 'utf8');
    expect(content).toContain("window.addEventListener('fv:langchange'");
    expect(content).toContain("window.addEventListener('languageChange'");
  });
});
