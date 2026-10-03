import { describe, it, expect, beforeEach } from 'vitest';
import { DiscoverFeed, ResolvedGroup } from '../src/components/DiscoverFeed';
import fs from 'fs';
import path from 'path';

describe('Data Verse Discover & URE Polish Test Suite', () => {
  let feed: DiscoverFeed;
  let container: HTMLElement;

  beforeEach(() => {
    DiscoverFeed.resetInstance();
    feed = DiscoverFeed.getInstance();
    container = document.createElement('div');
    container.id = 'content-loading';
    document.body.appendChild(container);
  });

  it('sets explicit type="button" on acquired feed buttons for form/a11y safety', () => {
    const mockGroups: ResolvedGroup[] = [
      {
        _ureType: 'button-row',
        items: [{ text: '🚀', api: 'rocket' }],
      },
    ];

    const page = feed.renderFeedGroups(container, mockGroups, 'en');
    expect(page).not.toBeNull();

    const btn = page?.querySelector('.button-content') as HTMLButtonElement;
    expect(btn).not.toBeNull();
    expect(btn.type).toBe('button');
  });

  it('sets role="button", tabindex="0", and aria-label on interactive cards', () => {
    const mockGroups: ResolvedGroup[] = [
      {
        _ureType: 'card-group',
        items: [
          {
            title: 'Interactive Card',
            description: 'Card with link target',
            link: '/verse/detail/1',
          },
        ],
      },
    ];

    const page = feed.renderFeedGroups(container, mockGroups, 'en');
    expect(page).not.toBeNull();

    const card = page?.querySelector('.card') as HTMLElement;
    expect(card).not.toBeNull();
    expect(card.getAttribute('role')).toBe('button');
    expect(card.getAttribute('tabindex')).toBe('0');
    expect(card.getAttribute('aria-label')).toBe('Interactive Card');
  });

  it('cleans up a11y attributes when cards are recycled', () => {
    const mockGroups: ResolvedGroup[] = [
      {
        _ureType: 'card-group',
        items: [
          {
            title: 'Card 1',
            link: '/verse/1',
          },
        ],
      },
    ];

    feed.renderFeedGroups(container, mockGroups, 'en');
    feed.clearFeed(container);

    const stats = feed.getNodePoolStats();
    expect(stats.cards).toBe(1);

    // Re-acquire card without link
    const nonLinkGroup: ResolvedGroup[] = [
      {
        _ureType: 'card-group',
        items: [{ title: 'Plain Card' }],
      },
    ];

    const newPage = feed.renderFeedGroups(container, nonLinkGroup, 'en');
    const newCard = newPage?.querySelector('.card') as HTMLElement;

    expect(newCard).not.toBeNull();
    expect(newCard.getAttribute('role')).toBeNull();
    expect(newCard.getAttribute('tabindex')).toBeNull();
    expect(newCard.getAttribute('aria-label')).toBeNull();
  });

  it('verifies ure.css contains skeleton shimmer and CLS-safe appear transitions', () => {
    const ureCssPath = path.resolve(__dirname, '../assets/js/ure/ure.css');
    const cssContent = fs.readFileSync(ureCssPath, 'utf8');

    expect(cssContent).toContain('.ure-skeleton');
    expect(cssContent).toContain('ure-shimmer 1.5s cubic-bezier');
    expect(cssContent).toContain('@keyframes ure-appear');
    expect(cssContent).toContain('prefers-reduced-motion: reduce');
  });
});
