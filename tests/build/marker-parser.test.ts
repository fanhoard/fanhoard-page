import { describe, it, expect } from 'vitest';
import { parseTranslation, normalizeParts, flattenJson } from '../../src/build/marker-parser';

describe('marker-parser', () => {
  describe('parseTranslation', () => {
    it('returns empty text part for empty/non-string input', () => {
      expect(parseTranslation('')).toEqual([{ type: 'text', text: '' }]);
      expect(parseTranslation(null as any)).toEqual([{ type: 'text', text: '' }]);
    });

    it('parses plain text', () => {
      expect(parseTranslation('Hello World')).toEqual([{ type: 'text', text: 'Hello World' }]);
    });

    it('parses HTML tags as html parts', () => {
      const parts = parseTranslation('Hello <span>World</span>!');
      expect(parts).toEqual([
        { type: 'text', text: 'Hello ' },
        { type: 'html', html: '<span>' },
        { type: 'text', text: 'World' },
        { type: 'html', html: '</span>' },
        { type: 'text', text: '!' }
      ]);
    });

    it('parses markers: br, strong, svg, lsvg, slot, a', () => {
      const input = 'Line1@br Line2 @strongBold Text@ @svg:icon-1@ @lsvg:logo@ @slot:userName@ @aLink Text@';
      const parts = parseTranslation(input);
      expect(parts).toContainEqual({ type: 'br' });
      expect(parts).toContainEqual({ type: 'strong', text: 'Bold Text' });
      expect(parts).toContainEqual({ type: 'svg', id: 'icon-1' });
      expect(parts).toContainEqual({ type: 'lsvg', id: 'logo' });
      expect(parts).toContainEqual({ type: 'slot', name: 'userName' });
      expect(parts).toContainEqual({ type: 'a', translate: true, text: 'Link Text' });
    });
  });

  describe('normalizeParts', () => {
    it('merges consecutive text/html parts', () => {
      const parts = [
        { type: 'text' as const, text: 'Hello ' },
        { type: 'text' as const, text: 'World' },
        { type: 'br' as const },
        { type: 'text' as const, text: 'Next' }
      ];
      const norm = normalizeParts(parts);
      expect(norm).toEqual([
        { type: 'text', text: 'Hello World' },
        { type: 'br' },
        { type: 'text', text: 'Next' }
      ]);
    });

    it('marks merged part as html if HTML tags exist in text', () => {
      const parts = [
        { type: 'text' as const, text: '<b>Hello</b> ' },
        { type: 'text' as const, text: 'World' }
      ];
      const norm = normalizeParts(parts);
      expect(norm).toEqual([{ type: 'html', html: '<b>Hello</b> World' }]);
    });
  });

  describe('flattenJson', () => {
    it('flattens nested object structures into single key-value store', () => {
      const input = {
        app: {
          title: 'FanHoard',
          nav: {
            home: 'Home',
            search: 'Search'
          }
        },
        footer: 'Copyright'
      };
      const flat = flattenJson(input);
      expect(flat).toEqual({
        title: 'FanHoard',
        home: 'Home',
        search: 'Search',
        footer: 'Copyright'
      });
    });
  });
});
