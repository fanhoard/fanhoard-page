/**
 * sitemap.ts
 * Generates sitemap.xml with hreflang alternates for every discovered HTML file.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { findHtmlFiles, loadDbJson } from './file-utils';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, '../..');
const ROOT_PAGE_PATH = '/home/';

const CONFIG = {
  srcDir: ROOT,
  dbJsonPath: path.join('assets', 'lang', 'options', 'db.json'),
  baseUrl: 'https://fanhoard.pages.dev',
};

interface UrlEntry {
  loc: string;
  lastmod: string;
  changefreq: string;
  priority: string;
  alternates: { lang: string; href: string }[];
}

function loadDb(): Record<string, any> {
  const db = loadDbJson(path.join(ROOT, CONFIG.dbJsonPath));
  if (!db) {
    console.error(`[sitemap] Cannot load db.json at ${CONFIG.dbJsonPath}`);
    process.exit(1);
  }
  return db;
}

function buildUrlEntries(htmlFiles: string[], langs: string[]): UrlEntry[] {
  const entries: UrlEntry[] = [];
  const today = new Date().toISOString().slice(0, 10);

  for (const file of htmlFiles) {
    let rel = path.relative(CONFIG.srcDir, file).replace(/\\/g, '/');
    if (!rel) continue;

    if (rel.endsWith('index.html')) {
      rel = rel.replace(/index\.html$/, '');
    } else if (rel.endsWith('.html')) {
      rel = rel.replace(/\.html$/, '/');
    } else {
      continue;
    }

    if (!rel.startsWith('/')) rel = '/' + rel;
    rel = rel === '/' ? ROOT_PAGE_PATH : rel;
    const pagePath = rel || ROOT_PAGE_PATH;

    const alternates = langs.map((l) => ({
      lang: l,
      href: `${CONFIG.baseUrl}/${l}${pagePath.startsWith('/') ? pagePath : '/' + pagePath}`,
    }));

    entries.push({
      loc: `${CONFIG.baseUrl}/${langs[0]}${pagePath}`,
      lastmod: today,
      changefreq: 'weekly',
      priority: pagePath === ROOT_PAGE_PATH ? '1.0' : '0.6',
      alternates,
    });
  }

  const map = new Map<string, UrlEntry>();
  for (const e of entries) {
    if (!map.has(e.loc)) map.set(e.loc, e);
  }
  return Array.from(map.values());
}

function xmlEscape(s: string): string {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function generateXml(entries: UrlEntry[]): string {
  const header =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n' +
    '        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n';
  const footer = '</urlset>\n';

  const body = entries
    .map((e) => {
      let out = '  <url>\n';
      out += `    <loc>${xmlEscape(e.loc)}</loc>\n`;
      out += `    <lastmod>${e.lastmod}</lastmod>\n`;
      out += `    <changefreq>${e.changefreq}</changefreq>\n`;
      out += `    <priority>${e.priority}</priority>\n`;
      for (const a of e.alternates) {
        out += `    <xhtml:link rel="alternate" hreflang="${a.lang}" href="${xmlEscape(a.href)}"/>\n`;
      }
      if (e.alternates.length) {
        out += `    <xhtml:link rel="alternate" hreflang="x-default" href="${xmlEscape(e.alternates[0].href)}"/>\n`;
      }
      out += '  </url>\n';
      return out;
    })
    .join('\n');

  return header + body + footer;
}

export function generateSitemap(): void {
  const db = loadDb();
  const langs = Object.keys(db);
  if (!langs.length) {
    console.error('[sitemap] db.json has no languages');
    process.exit(1);
  }

  const htmlFiles = findHtmlFiles(CONFIG.srcDir, [
    'dist',
    'node_modules',
    '.git',
    'scripts',
    'src',
    '.cloudflare',
    'google6b646fa60e0f9f2f.html',
    'index.html',
  ]);
  console.log(`[sitemap] Found ${htmlFiles.length} HTML files`);

  const entries = buildUrlEntries(htmlFiles, langs);
  const xml = generateXml(entries);

  const outPath = path.join(ROOT, 'sitemap.xml');
  fs.writeFileSync(outPath, xml, 'utf8');
  console.log(`[sitemap] Written ${outPath} (${entries.length} entries)`);
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  generateSitemap();
}
