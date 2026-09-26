import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';

describe("What's New Page PLSys Progressive Loading Integration", () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    const plsysCode = fs.readFileSync(path.resolve(__dirname, '../assets/js/loading-system/plsys.js'), 'utf-8');
    eval(plsysCode);
  });

  it("renders release notes into #whats-new-container via PLSys with aria-busy contract", async () => {
    document.body.innerHTML = `
      <div id="fv-app" data-page="whats-new">
        <section id="whats-new-container" aria-label="Release notes"></section>
      </div>
    `;

    const container = document.getElementById('whats-new-container') as HTMLElement;
    const mockData = {
      currentRelease: { version: '3.0.3', date: '2026-09-22', title: 'PLSys Loading Update' },
      pastReleases: [{ version: '3.0.2', date: '2026-09-15' }]
    };

    const fetcher = () => Promise.resolve(mockData);
    const renderer = (data: typeof mockData) => {
      container.innerHTML = `<div class="wn-card">${data.currentRelease.title} v${data.currentRelease.version}</div>`;
    };

    const loadPromise = (window as any).PLSys.load(container, fetcher, renderer, { key: 'whats_new:test' });

    expect(container.getAttribute('aria-busy')).toBe('true');
    expect(container.querySelector('.pl-card-skeleton')).not.toBeNull();

    await loadPromise;

    expect(container.getAttribute('aria-busy')).toBe('false');
    expect(container.querySelector('.pl-card-skeleton')).toBeNull();
    expect(container.innerHTML).toContain('PLSys Loading Update v3.0.3');
  });

  it('presents retry UI when fetching release notes fails', async () => {
    document.body.innerHTML = `<section id="whats-new-container"></section>`;
    const container = document.getElementById('whats-new-container') as HTMLElement;

    const fetcher = () => Promise.reject(new Error('Failed to fetch release notes'));

    try {
      await (window as any).PLSys.load(container, fetcher, () => {}, { key: 'whats_new:test:fail' });
    } catch (_) {}

    expect(container.getAttribute('aria-busy')).toBe('false');
    const errBoundary = container.querySelector('.pl-error-boundary');
    expect(errBoundary).not.toBeNull();
    expect(errBoundary?.textContent).toContain('Failed to fetch release notes');
  });
});
