import { describe, it, expect, beforeEach } from 'vitest';
import { DiscoverFeed, ResolvedGroup } from '../../src/components/DiscoverFeed';

describe('DiscoverFeed DOM Recycling & Batch Rendering', () => {
  let feed: DiscoverFeed;
  let container: HTMLElement;

  beforeEach(() => {
    DiscoverFeed.resetInstance();
    feed = DiscoverFeed.getInstance();
    container = document.createElement('div');
    container.id = 'content-loading';
    document.body.appendChild(container);
  });

  it('renders button groups using DocumentFragment batching', () => {
    const mockGroups: ResolvedGroup[] = [
      {
        _ureType: 'button-row',
        _rowPos: 'only',
        header: 'Test Header',
        items: [{ text: '😀', api: 'grinning' }, { text: '😃', api: 'smiley' }],
      },
    ];

    const page = feed.renderFeedGroups(container, mockGroups, 'en');
    expect(page).not.toBeNull();
    expect(container.children.length).toBe(1);

    const groupEl = page?.querySelector('.cm-group');
    expect(groupEl).not.toBeNull();

    const headerText = groupEl?.querySelector('.group-header-text');
    expect(headerText?.textContent).toBe('Test Header');

    const buttons = groupEl?.querySelectorAll('.button-content');
    expect(buttons?.length).toBe(2);
    expect(buttons?.[0].textContent).toBe('😀');
    expect(buttons?.[0].getAttribute('data-text')).toBe('😀');
    expect(buttons?.[0].getAttribute('data-api')).toBe('grinning');
  });

  it('renders card groups with image and link attributes', () => {
    const mockGroups: ResolvedGroup[] = [
      {
        _ureType: 'card-group',
        header: { title: 'Cards Header', description: 'Description' },
        items: [
          {
            title: 'Card Title',
            description: 'Card Desc',
            link: '/detail/1',
            image: '/assets/images/j.png',
            imageAlt: 'Logo',
          },
        ],
      },
    ];

    const page = feed.renderFeedGroups(container, mockGroups, 'en');
    expect(page).not.toBeNull();

    const card = page?.querySelector('.card');
    expect(card).not.toBeNull();
    expect(card?.getAttribute('data-link')).toBe('/detail/1');

    const img = card?.querySelector('.card-image') as HTMLImageElement;
    expect(img).not.toBeNull();
    expect(img?.src).toContain('/assets/images/j.png');

    const title = card?.querySelector('.card-title');
    expect(title?.textContent).toBe('Card Title');
  });

  it('recycles DOM nodes back to pool on clearFeed', () => {
    const mockGroups: ResolvedGroup[] = [
      {
        _ureType: 'button-row',
        items: [{ text: 'A' }, { text: 'B' }],
      },
    ];

    feed.renderFeedGroups(container, mockGroups, 'en');
    let stats = feed.getNodePoolStats();
    expect(stats.activePages).toBe(1);
    expect(stats.buttons).toBe(0);

    feed.clearFeed(container);
    stats = feed.getNodePoolStats();
    expect(stats.activePages).toBe(0);
    expect(stats.pages).toBe(1);
    expect(stats.groups).toBe(1);
    expect(stats.btnRows).toBe(1);
    expect(stats.buttons).toBe(2);
    expect(container.children.length).toBe(0);
  });

  it('reuses pooled DOM nodes on subsequent renders', () => {
    const mockGroups: ResolvedGroup[] = [
      {
        _ureType: 'button-row',
        items: [{ text: 'X' }],
      },
    ];

    feed.renderFeedGroups(container, mockGroups, 'en');
    feed.clearFeed(container);

    let stats = feed.getNodePoolStats();
    expect(stats.buttons).toBe(1);
    expect(stats.pages).toBe(1);

    // Render again
    feed.renderFeedGroups(container, mockGroups, 'en');
    stats = feed.getNodePoolStats();
    // Pooled nodes were acquired
    expect(stats.buttons).toBe(0);
    expect(stats.pages).toBe(0);
    expect(stats.activePages).toBe(1);
  });
});
