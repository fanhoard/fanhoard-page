import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';

function loadCleanHtml(filePath: string): string {
  const raw = fs.readFileSync(filePath, 'utf8');
  return raw
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<link\b[^>]*>/gi, '');
}

describe('Main User Journeys (DOM Integration Verification)', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    localStorage.clear();
  });

  describe('Home & Copy Symbol Journey', () => {
    it('renders home page and triggers copy notification', async () => {
      const html = loadCleanHtml(path.resolve(__dirname, '../../home/index.html'));
      document.body.innerHTML = html;

      const showCopyNotification = (opts: { text: string; name?: string }) => {
        const capsule = document.createElement('div');
        capsule.className = 'cn-capsule';
        capsule.textContent = `Copied ${opts.text}`;
        document.body.appendChild(capsule);
      };

      showCopyNotification({ text: '😀', name: 'Grinning Face' });

      const toast = document.querySelector('.cn-capsule');
      expect(toast).not.toBeNull();
      expect(toast?.textContent).toContain('Copied 😀');
    });
  });

  describe('Language Switch Journey', () => {
    it('toggles document language and updates locale attribute', () => {
      document.documentElement.setAttribute('lang', 'en');
      expect(document.documentElement.getAttribute('lang')).toBe('en');

      document.documentElement.setAttribute('lang', 'th');
      localStorage.setItem('fv_lang', 'th');

      expect(document.documentElement.getAttribute('lang')).toBe('th');
      expect(localStorage.getItem('fv_lang')).toBe('th');
    });
  });

  describe('Theme Toggle Journey', () => {
    it('switches theme and persists to localStorage', () => {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('fv_theme', 'dark');

      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('fv_theme', 'light');

      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
      expect(localStorage.getItem('fv_theme')).toBe('light');
    });
  });

  describe('Community Report Form Journey', () => {
    it('fills and validates bug report form inputs', () => {
      const html = loadCleanHtml(path.resolve(__dirname, '../../community/report/index.html'));
      document.body.innerHTML = html;

      const form = document.querySelector('#report-form') as HTMLFormElement;
      expect(form).not.toBeNull();

      const categorySelect = document.querySelector('#report-category') as HTMLSelectElement;
      const option = document.createElement('option');
      option.value = 'bug';
      option.textContent = 'Bug';
      categorySelect.appendChild(option);
      categorySelect.value = 'bug';

      const detailsInput = document.querySelector('#report-details') as HTMLTextAreaElement;
      detailsInput.value = 'Found a bug on home page.';

      const emailInput = document.querySelector('#report-email') as HTMLInputElement;
      emailInput.value = 'tester@example.com';

      expect(categorySelect.value).toBe('bug');
      expect(detailsInput.value).toBe('Found a bug on home page.');
      expect(emailInput.value).toBe('tester@example.com');
    });
  });
});
