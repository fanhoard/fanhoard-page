/**
 * html-transformer.ts
 * Applies translations to a parsed HTML document using cheerio.
 */

import * as cheerio from 'cheerio';
import type { Element } from 'domhandler';
import { parseTranslation, normalizeParts, TranslationPart } from './marker-parser';

export interface BuildConfig {
  srcDir: string;
  distDir: string;
  assetsDir: string;
  dbJsonPath: string;
  translationPath: (lang: string) => string;
  defaultLang: string;
  excludeDirs: string[];
  removeScriptPatterns: string[];
  baseUrl: string;
  staticFiles: string[];
  passThroughHiddenDirs: string[];
  footerTemplatePath: string;
  langs?: string[];
  footerHtml?: string;
}

let _config: BuildConfig | null = null;

/**
 * Maps page source paths (e.g. 'data/verse/discover/index.html') to the hashed
 * Vite bundle URL emitted for that page's module scripts, so localized SSG
 * output references real built assets instead of raw TS sources.
 */
let _pageBundleMap: Record<string, string> = {};

export function setConfig(cfg: BuildConfig): void {
  _config = cfg;
}

export function setPageBundleMap(map: Record<string, string>): void {
  _pageBundleMap = map;
}

/**
 * Transforms source HTML by applying translations, injecting static config,
 * stripping unnecessary scripts, adding SEO tags, and injecting translated footer.
 */
export function transformHtml(
  html: string,
  lang: string,
  translations: Record<string, string>,
  srcFilePath: string,
  dbJson: Record<string, any> = {}
): string {
  const $ = cheerio.load(html, { xml: false });

  // 1. <html> attributes
  $('html').attr('lang', lang).attr('data-fv-built', lang);

  // 2. Inject window.__fvStaticConfig
  const staticConfig = _buildStaticConfig(lang, dbJson);
  $('head').prepend(
    `<script>window.__fvStaticConfig=${JSON.stringify(staticConfig)};</script>\n`
  );

  // 3. Translate [data-translate] elements
  $('[data-translate]').each((_, el) => {
    const $el = $(el);
    const key = $el.attr('data-translate');

    if (key && translations[key]) {
      const parts = normalizeParts(parseTranslation(translations[key]));
      $el.html(_partsToHtml($, $el, parts));
    }

    $el.removeAttr('data-translate')
      .removeAttr('data-original-text')
      .removeAttr('data-original-style')
      .removeAttr('data-translate-slot');
  });

  // 4. Translate <title data-translate="...">
  $('title[data-translate]').each((_, el) => {
    const $el = $(el);
    const key = $el.attr('data-translate');
    if (key && translations[key]) {
      $el.text(_stripMarkersToText(translations[key])).removeAttr('data-translate');
    }
  });

  // 5. Remove scripts that are unneeded on pre-built pages
  if (_config && _config.removeScriptPatterns) {
    const removePatterns = _config.removeScriptPatterns;
    $('script[src]').each((_, el) => {
      const src = $(el).attr('src') || '';
      if (removePatterns.some((p) => src.includes(p))) {
        $(el).remove();
      }
    });
  }

  // 5.5 Replace module scripts with the page's Vite bundle (mirrors Vite HTML output)
  const pageBundle = _pageBundleMap[srcFilePath];
  if (pageBundle) {
    let first = true;
    $('script[type="module"][src]').each((_, el) => {
      const $el = $(el);
      if (first) {
        $el.attr('src', pageBundle).attr('crossorigin', '');
        first = false;
      } else {
        $el.remove();
      }
    });
  }

  // 6. Remove body opacity:0
  const $body = $('body');
  const newStyle = ($body.attr('style') || '')
    .replace(/opacity\s*:\s*0\s*;?\s*/gi, '')
    .trim()
    .replace(/;$/, '');
  if (newStyle) $body.attr('style', newStyle);
  else $body.removeAttr('style');

  // 7. SEO hreflang + canonical
  _injectSeoTags($, lang, srcFilePath);

  // 8. Prefix internal links
  $('a[href]').each((_, el) => {
    const $el = $(el);
    const href = $el.attr('href') || '';
    if (_isInternalPath(href) && !_hasLangPrefix(href) && _shouldPrefix(href)) {
      const prefixed = `/${lang}${href.startsWith('/') ? href : '/' + href}`;
      $el.attr('href', _ensureTrailingSlash(prefixed));
    }
  });

  // 9. Inject translated footer
  if (_config && _config.footerHtml) {
    _injectFooter($, lang, translations);
  }

  return $.html();
}

/**
 * Parse footer-template.html, translate its [data-translate] elements,
 * prefix its internal links, then append to <body>.
 */
function _injectFooter(
  $: cheerio.CheerioAPI,
  lang: string,
  translations: Record<string, string>
): void {
  if (!$ || !_config?.footerHtml) return;
  if ($('footer.footer-minimal').length) return;

  const $footer = cheerio.load(_config.footerHtml, { xml: false });

  $footer('[data-translate]').each((_, el) => {
    const $el = $footer(el);
    const key = $el.attr('data-translate');

    if (key && translations[key]) {
      const parts = normalizeParts(parseTranslation(translations[key]));
      $el.html(_partsToHtml($footer, $el, parts));
    }

    $el.removeAttr('data-translate')
      .removeAttr('data-original-text')
      .removeAttr('data-original-style');
  });

  $footer('a[href]').each((_, el) => {
    const $el = $footer(el);
    const href = $el.attr('href') || '';
    if (_isInternalPath(href) && !_hasLangPrefix(href) && _shouldPrefix(href)) {
      const prefixed = `/${lang}${href.startsWith('/') ? href : '/' + href}`;
      $el.attr('href', _ensureTrailingSlash(prefixed));
    }
  });

  const footerHtml = $footer.html();
  $('body').append('\n' + footerHtml + '\n');
}

/**
 * Build a minimal config object to embed in the built page.
 */
function _buildStaticConfig(lang: string, dbJson: Record<string, any>): Record<string, any> {
  const langs: Record<string, any> = {};
  for (const [code, cfg] of Object.entries(dbJson)) {
    langs[code] = {
      buttonText: (cfg as any).buttonText || code.toUpperCase(),
      label: (cfg as any).label || code.toUpperCase(),
    };
  }
  return { lang, langs };
}

/**
 * SEO tags injection for canonical and hreflang.
 */
function _injectSeoTags($: cheerio.CheerioAPI, lang: string, srcFilePath: string): void {
  const canonPath = _deriveCanonicalPath(srcFilePath);
  if (!canonPath) return;

  $('link[hreflang]').remove();
  $('link[rel="canonical"]').remove();

  const langs = _config?.langs || ['en'];
  const baseUrl = (_config?.baseUrl || '').replace(/\/$/, '');
  const defLang = _config?.defaultLang || 'en';
  const head = $('head');

  langs.forEach((l) => {
    head.append(`<link rel="alternate" hreflang="${l}" href="${baseUrl}/${l}${canonPath}" />\n`);
  });
  head.append(`<link rel="alternate" hreflang="x-default" href="${baseUrl}/${defLang}${canonPath}" />\n`);
  head.append(`<link rel="canonical" href="${baseUrl}/${lang}${canonPath}" />\n`);
}

/**
 * Convert normalized parts -> HTML string.
 */
function _partsToHtml(
  $: cheerio.CheerioAPI,
  $el: cheerio.Cheerio<Element>,
  parts: TranslationPart[]
): string {
  const svgs = $el.find('svg').toArray() as Element[];
  const slots = $el.find('[data-translate-slot],[data-slot]').toArray() as Element[];
  const anchors = $el.find('a').toArray() as Element[];

  const usedSvgs = new Set<Element>();
  const usedSlots = new Set<Element>();
  const usedAnchors = new Set<Element>();

  function resolveSvg(id: string | null): Element | null {
    const pool = svgs.filter((s) => !usedSvgs.has(s));
    const found = id
      ? pool.find((s) => $(s).attr('id') === id || $(s).attr('data-svg-id') === id) || pool[0] || null
      : pool[0] || null;
    if (found) {
      usedSvgs.add(found);
      return found;
    }
    return null;
  }

  function resolveSlot(name: string | null): Element | null {
    const pool = slots.filter((s) => !usedSlots.has(s));
    const found = name
      ? pool.find((s) => $(s).attr('data-translate-slot') === name || $(s).attr('data-slot') === name) || null
      : pool.length === 1
      ? pool[0]
      : null;
    if (found) {
      usedSlots.add(found);
      return found;
    }
    return null;
  }

  function resolveAnchor(): Element | null {
    const pool = anchors.filter((a) => !usedAnchors.has(a));
    const found = pool[0] || null;
    if (found) {
      usedAnchors.add(found);
      return found;
    }
    return null;
  }

  let html = '';

  for (const part of parts) {
    switch (part.type) {
      case 'text':
        html += _escHtml(part.text);
        break;

      case 'html':
        html += part.html;
        break;

      case 'br':
        html += '<br>';
        break;

      case 'strong':
        html += `<strong>${_escHtml(part.text)}</strong>`;
        break;

      case 'svg':
      case 'lsvg': {
        const el = resolveSvg(part.id);
        if (el) html += $.html($(el));
        break;
      }

      case 'slot': {
        const el = resolveSlot(part.name);
        if (el) html += $.html($(el));
        break;
      }

      case 'a': {
        const el = resolveAnchor();
        if (el) {
          const $a = $(el).clone();
          if (part.translate && part.text != null) $a.text(part.text);
          html += $.html($a);
        } else {
          html += `<a>${part.translate ? _escHtml(part.text || '') : ''}</a>`;
        }
        break;
      }

      default:
        break;
    }
  }

  return html;
}

function _stripMarkersToText(str: string): string {
  return str
    .replace(/@br/g, ' ')
    .replace(/@strong(.*?)@/g, '$1')
    .replace(/@[a-z]+(?::([^@]*))?@/gi, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function _escHtml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function _deriveCanonicalPath(srcFilePath: string): string | null {
  if (!srcFilePath) return null;
  let p = srcFilePath.replace(/\\/g, '/').replace(/^\.\//, '');
  p = p.replace(/index\.html$/, '').replace(/\.html$/, '/');
  if (!p.startsWith('/')) p = '/' + p;
  if (!p.endsWith('/')) p += '/';
  return p;
}

function _ensureTrailingSlash(href: string): string {
  const m = /^([^?#]*)([?#].*)?$/.exec(href);
  if (!m) return href;
  let pathPart = m[1];
  const suffix = m[2] || '';
  if (/\.[a-zA-Z0-9]+$/.test(pathPart)) return href;
  if (!pathPart.endsWith('/')) pathPart += '/';
  return pathPart + suffix;
}

function _isInternalPath(href: string): boolean {
  if (!href) return false;
  if (/^(mailto:|tel:|javascript:|data:|#|blob:|file:)/i.test(href)) return false;
  if (/^https?:\/\//i.test(href)) return false;
  return true;
}

function _hasLangPrefix(path: string): boolean {
  return /^\/(en|th)(\/|$)/.test(path);
}

function _shouldPrefix(path: string): boolean {
  const SKIP = [
    '/assets/',
    '/static/',
    '/api/',
    '/_next/',
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml',
    '/sw.js',
    '/manifest.json',
  ];
  return path.startsWith('/') && !SKIP.some((s) => path.startsWith(s));
}
