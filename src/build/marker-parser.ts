/**
 * marker-parser.ts
 * Port of the Web Worker translation logic from translator.js -> Node.js/TypeScript
 *
 * Parses translation strings containing markers:
 *   @br              - line break
 *   @strong text@    - bold text
 *   @lsvg[:id]@      - local SVG reference
 *   @svg[:id]@       - SVG reference
 *   @slot:name@      - slot placeholder
 *   @a text@         - anchor element
 *
 * Returns a parts array identical to what the worker returns in the browser.
 */

export type TranslationPart =
  | { type: 'text'; text: string }
  | { type: 'html'; html: string }
  | { type: 'lsvg'; id: string | null }
  | { type: 'svg'; id: string | null }
  | { type: 'slot'; name: string | null }
  | { type: 'a'; translate: boolean; text: string }
  | { type: 'br' }
  | { type: 'strong'; text: string };

const HTML_TAG_RE = /(<\/?[^>]+>)/;
const MARKER_RE_SRC =
  '(@lsvg(?::([^@]+))?@)' +
  '|(@svg(?::([^@]+))?@)' +
  '|(@slot:([^@]+)@)' +
  '|(@a(.*?)@)' +
  '|(@br)' +
  '|(@strong(.*?)@)';

/**
 * Parse a translation string into a parts array.
 */
export function parseTranslation(str: string): TranslationPart[] {
  if (!str || typeof str !== 'string') return [{ type: 'text', text: '' }];

  const htmlParts = str.split(HTML_TAG_RE);
  const parts: TranslationPart[] = [];
  const markerRegex = new RegExp(MARKER_RE_SRC, 'g');

  for (const segment of htmlParts) {
    if (!segment) continue;

    if (/^<\/?[^>]+>$/.test(segment)) {
      parts.push({ type: 'html', html: segment });
      continue;
    }

    let lastIndex = 0;
    let m: RegExpExecArray | null;
    markerRegex.lastIndex = 0;

    while ((m = markerRegex.exec(segment)) !== null) {
      if (m.index > lastIndex) {
        parts.push({ type: 'text', text: segment.slice(lastIndex, m.index) });
      }

      if (m[1]) parts.push({ type: 'lsvg', id: m[2] || null });
      else if (m[3]) parts.push({ type: 'svg', id: m[4] || null });
      else if (m[5]) parts.push({ type: 'slot', name: m[6] || null });
      else if (m[7]) parts.push({ type: 'a', translate: (m[8] || '') !== '', text: m[8] || '' });
      else if (m[9]) parts.push({ type: 'br' });
      else if (m[10]) parts.push({ type: 'strong', text: m[11] || '' });

      lastIndex = markerRegex.lastIndex;
    }

    if (lastIndex < segment.length) {
      parts.push({ type: 'text', text: segment.slice(lastIndex) });
    }
  }

  return parts;
}

/**
 * Merge consecutive text/html parts (mirrors _normalizeParts in translator.js).
 */
export function normalizeParts(parts: TranslationPart[]): TranslationPart[] {
  const out: TranslationPart[] = [];
  let buf = '';
  let bufHasHtml = false;

  const flush = () => {
    if (!buf) return;
    out.push(bufHasHtml ? { type: 'html', html: buf } : { type: 'text', text: buf });
    buf = '';
    bufHasHtml = false;
  };

  for (const p of parts) {
    if (p.type === 'text') {
      buf += p.text;
      if (/<[^>]+>/.test(p.text)) bufHasHtml = true;
    } else if (p.type === 'html') {
      buf += p.html;
      bufHasHtml = true;
    } else {
      flush();
      out.push(p);
    }
  }
  flush();
  return out;
}

/**
 * Flatten a nested JSON object (mirrors flattenLanguageJson in loader.js).
 */
export function flattenJson(json: Record<string, unknown>): Record<string, string> {
  const result: Record<string, string> = {};
  const stack: unknown[] = [json];

  while (stack.length) {
    const obj = stack.pop();
    if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
      for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
        if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
          stack.push(v);
        } else {
          result[k] = String(v ?? '');
        }
      }
    }
  }
  return result;
}
