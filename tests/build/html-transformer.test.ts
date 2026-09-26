import { describe, it, expect, beforeEach } from 'vitest';
import { setConfig, setPageBundleMap, transformHtml, BuildConfig } from '../../src/build/html-transformer';

describe('html-transformer', () => {
  const dummyConfig: BuildConfig = {
    srcDir: '.',
    distDir: 'dist',
    assetsDir: 'assets',
    dbJsonPath: 'assets/db/db.json',
    translationPath: (lang) => `assets/lang/${lang}.json`,
    defaultLang: 'en',
    excludeDirs: [],
    removeScriptPatterns: [],
    baseUrl: 'https://fanhoard.org',
    staticFiles: [],
    passThroughHiddenDirs: [],
    footerTemplatePath: 'assets/template-html/footer-template.html',
    langs: ['en', 'th'],
    footerHtml: '<footer id="site-footer"><a href="/platform/privacy">Privacy</a></footer>'
  };

  beforeEach(() => {
    setConfig(dummyConfig);
    setPageBundleMap({
      'home/index.html': '/assets/home-12345.js'
    });
  });

  it('sets html lang attribute and static config', () => {
    const inputHtml = '<!DOCTYPE html><html><head></head><body><h1>Hello</h1></body></html>';
    const output = transformHtml(inputHtml, 'en', {}, 'home/index.html', { default_language: 'en' });

    expect(output).toContain('<html lang="en" data-fv-built="en">');
    expect(output).toContain('window.__fvStaticConfig=');
  });

  it('translates elements with data-translate attributes', () => {
    const inputHtml = '<div><h1 data-translate="app.title">Original Title</h1></div>';
    const translations = { 'app.title': 'FanHoard Title' };
    const output = transformHtml(inputHtml, 'en', translations, 'home/index.html');

    expect(output).toContain('FanHoard Title');
    expect(output).not.toContain('data-translate=');
  });

  it('injects footer template if present in config', () => {
    const inputHtml = '<html><head></head><body><div id="footer-placeholder"></div></body></html>';
    const output = transformHtml(inputHtml, 'en', {}, 'home/index.html');

    expect(output).toContain('site-footer');
    expect(output).toContain('/platform/privacy');
  });
});
