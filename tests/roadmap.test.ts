import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Roadmap Page PLSys Progressive Loading Integration', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    const plsysCode = fs.readFileSync(path.resolve(__dirname, '../assets/js/loading-system/plsys.js'), 'utf-8');
    eval(plsysCode);
  });

  it('renders roadmap feature list through PLSys with aria-busy contract', async () => {
    document.body.innerHTML = `
      <section id="features">
        <ul id="feature-list"></ul>
      </section>
    `;

    const featureList = document.getElementById('feature-list') as HTMLElement;
    const mockRoadmapData = {
      current_stage: 1,
      stages: [
        {
          stage_number: 1,
          version: '3.0.0',
          features: [{ feature: { en: 'Progressive Loading System', th: 'ระบบโหลดแบบก้าวหน้า' } }]
        }
      ]
    };

    const fetcher = () => Promise.resolve(mockRoadmapData);
    const renderer = (data: typeof mockRoadmapData) => {
      featureList.innerHTML = `<li>${data.stages[0].features[0].feature.en}</li>`;
    };

    const loadPromise = (window as any).PLSys.load(featureList, fetcher, renderer, { key: 'roadmap:test' });

    expect(featureList.getAttribute('aria-busy')).toBe('true');

    await loadPromise;

    expect(featureList.getAttribute('aria-busy')).toBe('false');
    expect(featureList.innerHTML).toContain('Progressive Loading System');
  });

  it('handles fetch failure on roadmap page with retry boundary', async () => {
    document.body.innerHTML = `<ul id="feature-list"></ul>`;
    const featureList = document.getElementById('feature-list') as HTMLElement;

    const fetcher = () => Promise.reject(new Error('Failed to load current-stage.json'));

    try {
      await (window as any).PLSys.load(featureList, fetcher, () => {}, { key: 'roadmap:test:fail' });
    } catch (_) {}

    expect(featureList.getAttribute('aria-busy')).toBe('false');
    const errBoundary = featureList.querySelector('.pl-error-boundary');
    expect(errBoundary).not.toBeNull();
    expect(errBoundary?.textContent).toContain('Failed to load current-stage.json');
  });
});
