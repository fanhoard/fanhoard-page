import { describe, it, expect } from 'vitest';
import {
  SymbolCategoryFileSchema,
  SymbolItemSchema,
  SymbolGroupIndexSchema,
  MasterIndexSchema
} from '../src/schemas/data';

describe('Symbol scope reader & breadcrumb generator', () => {
  describe('Symbol category & item schema validation', () => {
    it('validates a valid symbol category file payload', () => {
      const validCategory = {
        id: 'currency-symbols',
        kind: 'symbols',
        name: { en: 'Currency Symbols', th: 'สัญลักษณ์สกุลเงิน' },
        data: [
          {
            api: '$',
            text: '$',
            name: { en: 'Dollar Sign', th: 'เครื่องหมายดอลลาร์' },
            category: 'currency',
            tags: ['money', 'dollar']
          }
        ]
      };

      const result = SymbolCategoryFileSchema.safeParse(validCategory);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('currency-symbols');
        expect(result.data.data[0].api).toBe('$');
      }
    });

    it('rejects invalid category payloads without name object', () => {
      const invalidCategory = {
        id: 'bad-category',
        data: []
      };
      const result = SymbolCategoryFileSchema.safeParse(invalidCategory);
      expect(result.success).toBe(false);
    });

    it('validates master index with category references', () => {
      const masterIndex = {
        categories: [
          {
            id: 'arrows',
            name: { en: 'Arrows', th: 'ลูกศร' },
            file: 'assets/json/arrows.json'
          }
        ]
      };
      const result = MasterIndexSchema.safeParse(masterIndex);
      expect(result.success).toBe(true);
    });
  });

  describe('Breadcrumb path generator helper', () => {
    function generateBreadcrumbs(pathname: string, lang: 'en' | 'th') {
      const segments = pathname.split('/').filter(Boolean);
      const crumbs = [{ label: lang === 'th' ? 'หน้าแรก' : 'Home', href: `/${lang}/` }];
      
      let currPath = `/${lang}/`;
      for (const seg of segments) {
        if (seg === lang) continue;
        currPath += `${seg}/`;
        const label = seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' ');
        crumbs.push({ label, href: currPath });
      }
      return crumbs;
    }

    it('generates breadcrumbs for symbol scope path', () => {
      const crumbs = generateBreadcrumbs('/en/data/verse/scope/', 'en');
      expect(crumbs).toEqual([
        { label: 'Home', href: '/en/' },
        { label: 'Data', href: '/en/data/' },
        { label: 'Verse', href: '/en/data/verse/' },
        { label: 'Scope', href: '/en/data/verse/scope/' }
      ]);
    });

    it('generates breadcrumbs in Thai language', () => {
      const crumbs = generateBreadcrumbs('/th/data/verse/discover/', 'th');
      expect(crumbs[0].label).toBe('หน้าแรก');
      expect(crumbs[ crumbs.length - 1 ].href).toBe('/th/data/verse/discover/');
    });
  });
});
