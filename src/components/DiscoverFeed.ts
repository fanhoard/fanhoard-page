/**
 * DiscoverFeed.ts
 *
 * Discover Feed Component with DOM Node Recycling & DocumentFragment Batching.
 * Eliminates layout thrashing and full subtree string re-renders during infinite scrolling.
 */

export interface FeedItemHeader {
  title?: string | Record<string, string>;
  description?: string | Record<string, string>;
  className?: string;
}

export interface FeedButtonItem {
  text: string;
  api?: string;
}

export interface FeedCardItem {
  title?: string | Record<string, string>;
  description?: string | Record<string, string>;
  className?: string;
  link?: string;
  image?: string;
  imageAlt?: string | Record<string, string>;
}

export interface ResolvedGroup {
  _ureType?: 'card-group' | 'card-group-h' | 'button-row';
  _rowPos?: 'only' | 'first' | 'mid' | 'last';
  header?: string | FeedItemHeader;
  items: Array<FeedButtonItem | FeedCardItem>;
}

interface NodePools {
  pages: HTMLElement[];
  groups: HTMLElement[];
  btnRows: HTMLElement[];
  cardContainers: HTMLElement[];
  buttons: HTMLButtonElement[];
  cards: HTMLElement[];
  headers: HTMLElement[];
}

export class DiscoverFeed {
  private static instance: DiscoverFeed;

  private pools: NodePools = {
    pages: [],
    groups: [],
    btnRows: [],
    cardContainers: [],
    buttons: [],
    cards: [],
    headers: [],
  };

  private maxPoolCap = 100;
  private activePages: Set<HTMLElement> = new Set();
  private observer: IntersectionObserver | null = null;

  public static getInstance(): DiscoverFeed {
    if (!DiscoverFeed.instance) {
      DiscoverFeed.instance = new DiscoverFeed();
    }
    return DiscoverFeed.instance;
  }

  // ── Node Acquisition & Pool Management ────────────────────────────────────

  private acquirePage(): HTMLElement {
    if (this.pools.pages.length > 0) {
      const page = this.pools.pages.pop()!;
      page.className = 'feed-page';
      page.textContent = '';
      return page;
    }
    const page = document.createElement('div');
    page.className = 'feed-page';
    return page;
  }

  private acquireGroup(): HTMLElement {
    if (this.pools.groups.length > 0) {
      const group = this.pools.groups.pop()!;
      group.className = 'cm-group';
      group.textContent = '';
      return group;
    }
    const group = document.createElement('div');
    group.className = 'cm-group';
    return group;
  }

  private acquireBtnRow(pos = 'only'): HTMLElement {
    const className = `ure-btn-row ure-btn-row--${pos}`;
    if (this.pools.btnRows.length > 0) {
      const row = this.pools.btnRows.pop()!;
      row.className = className;
      row.textContent = '';
      return row;
    }
    const row = document.createElement('div');
    row.className = className;
    return row;
  }

  private acquireCardContainer(isHorizontal = false): HTMLElement {
    const className = `card-content-container${isHorizontal ? ' card-content-container--h' : ''}`;
    if (this.pools.cardContainers.length > 0) {
      const ctr = this.pools.cardContainers.pop()!;
      ctr.className = className;
      ctr.textContent = '';
      return ctr;
    }
    const ctr = document.createElement('div');
    ctr.className = className;
    return ctr;
  }

  private acquireButton(item: FeedButtonItem): HTMLButtonElement {
    let btn: HTMLButtonElement;
    if (this.pools.buttons.length > 0) {
      btn = this.pools.buttons.pop()!;
      btn.className = 'button-content';
      btn.textContent = '';
    } else {
      btn = document.createElement('button');
      btn.className = 'button-content';
    }
    btn.dataset.text = item.text;
    btn.dataset.api = item.api || '';
    btn.textContent = item.text;
    return btn;
  }

  private acquireCard(item: FeedCardItem, lang: string): HTMLElement {
    let card: HTMLElement;
    if (this.pools.cards.length > 0) {
      card = this.pools.cards.pop()!;
      card.className = 'card';
      card.textContent = '';
      card.removeAttribute('data-link');
    } else {
      card = document.createElement('div');
      card.className = 'card';
    }

    if (item.className) {
      card.classList.add(item.className);
    }
    if (item.link) {
      card.dataset.link = item.link;
    }

    // Append image if present
    if (item.image) {
      const img = document.createElement('img');
      img.className = 'card-image';
      img.src = item.image;
      img.loading = 'lazy';
      img.decoding = 'async';
      img.setAttribute('fetchpriority', 'low');
      img.alt = this.getText(item.imageAlt, lang);
      card.appendChild(img);
    }

    // Card Content Wrapper
    const content = document.createElement('div');
    content.className = 'card-content';

    const titleEl = document.createElement('div');
    titleEl.className = 'card-title';
    titleEl.textContent = this.getText(item.title, lang);
    content.appendChild(titleEl);

    const descEl = document.createElement('div');
    descEl.className = 'card-description';
    descEl.textContent = this.getText(item.description, lang);
    content.appendChild(descEl);

    card.appendChild(content);
    return card;
  }

  private acquireHeader(cfg: string | FeedItemHeader, lang: string): HTMLElement {
    let headerEl: HTMLElement;
    if (this.pools.headers.length > 0) {
      headerEl = this.pools.headers.pop()!;
      headerEl.className = 'group-header';
      headerEl.textContent = '';
    } else {
      headerEl = document.createElement('div');
      headerEl.className = 'group-header';
    }

    if (typeof cfg === 'string') {
      const h2 = document.createElement('h2');
      h2.className = 'group-header-text';
      h2.textContent = cfg;
      headerEl.appendChild(h2);
      return headerEl;
    }

    if (cfg.className) {
      headerEl.classList.add(cfg.className);
    }

    const h2 = document.createElement('h2');
    h2.className = 'group-header-text';
    h2.textContent = this.getText(cfg.title, lang);
    headerEl.appendChild(h2);

    const descText = this.getText(cfg.description, lang);
    if (descText) {
      const p = document.createElement('p');
      p.className = 'group-header-description';
      p.textContent = descText;
      headerEl.appendChild(p);
    }

    return headerEl;
  }

  private getText(val: string | Record<string, string> | undefined, lang: string): string {
    if (!val) return '';
    if (typeof val === 'string') return val;
    return val[lang] || val.en || val.th || Object.values(val)[0] || '';
  }

  // ── DocumentFragment Batch Rendering ─────────────────────────────────────

  /**
   * Batch render groups into a .feed-page element using DocumentFragment.
   * Avoids innerHTML string re-parsing and layout thrashing.
   */
  public renderFeedGroups(
    container: HTMLElement,
    resolvedItems: ResolvedGroup[],
    lang: string,
    sentinel?: HTMLElement | null
  ): HTMLElement | null {
    if (!resolvedItems.length) return null;

    const page = this.acquirePage();
    const fragment = document.createDocumentFragment();

    for (const groupItem of resolvedItems) {
      const groupWrapper = this.acquireGroup();
      let innerContainer: HTMLElement;

      if (groupItem._ureType === 'card-group' || groupItem._ureType === 'card-group-h') {
        const isHorizontal = groupItem._ureType === 'card-group-h';
        innerContainer = this.acquireCardContainer(isHorizontal);

        if (groupItem.header) {
          innerContainer.appendChild(this.acquireHeader(groupItem.header, lang));
        }

        for (const cardData of groupItem.items as FeedCardItem[]) {
          innerContainer.appendChild(this.acquireCard(cardData, lang));
        }
      } else {
        const pos = groupItem._rowPos || 'only';
        innerContainer = this.acquireBtnRow(pos);

        if (groupItem.header) {
          innerContainer.appendChild(this.acquireHeader(groupItem.header, lang));
        }

        for (const btnData of groupItem.items as FeedButtonItem[]) {
          innerContainer.appendChild(this.acquireButton(btnData));
        }
      }

      groupWrapper.appendChild(innerContainer);
      fragment.appendChild(groupWrapper);
    }

    page.appendChild(fragment);
    this.activePages.add(page);

    if (sentinel && sentinel.parentNode === container) {
      container.insertBefore(page, sentinel);
    } else {
      container.appendChild(page);
    }

    return page;
  }

  // ── DOM Node Recycling & Cleanup ──────────────────────────────────────────

  /**
   * Recycles a single feed page element and returns all child nodes to pool.
   */
  public recyclePage(pageEl: HTMLElement): void {
    if (!pageEl) return;
    if (this.observer) {
      try { this.observer.unobserve(pageEl); } catch {}
    }
    this.activePages.delete(pageEl);

    // Recycle all children
    const groupEls = Array.from(pageEl.querySelectorAll('.cm-group')) as HTMLElement[];
    for (const group of groupEls) {
      // Recycle buttons
      const buttons = Array.from(group.querySelectorAll('.button-content')) as HTMLButtonElement[];
      for (const btn of buttons) {
        btn.textContent = '';
        delete btn.dataset.text;
        delete btn.dataset.api;
        if (this.pools.buttons.length < this.maxPoolCap) {
          this.pools.buttons.push(btn);
        }
      }

      // Recycle cards
      const cards = Array.from(group.querySelectorAll('.card')) as HTMLElement[];
      for (const card of cards) {
        card.textContent = '';
        card.className = 'card';
        card.removeAttribute('data-link');
        if (this.pools.cards.length < this.maxPoolCap) {
          this.pools.cards.push(card);
        }
      }

      // Recycle headers
      const headers = Array.from(group.querySelectorAll('.group-header')) as HTMLElement[];
      for (const hdr of headers) {
        hdr.textContent = '';
        hdr.className = 'group-header';
        if (this.pools.headers.length < this.maxPoolCap) {
          this.pools.headers.push(hdr);
        }
      }

      // Recycle containers
      const btnRows = Array.from(group.querySelectorAll('.ure-btn-row')) as HTMLElement[];
      for (const row of btnRows) {
        row.textContent = '';
        if (this.pools.btnRows.length < this.maxPoolCap) {
          this.pools.btnRows.push(row);
        }
      }

      const cardCtrs = Array.from(group.querySelectorAll('.card-content-container')) as HTMLElement[];
      for (const ctr of cardCtrs) {
        ctr.textContent = '';
        if (this.pools.cardContainers.length < this.maxPoolCap) {
          this.pools.cardContainers.push(ctr);
        }
      }

      group.textContent = '';
      group.className = 'cm-group';
      if (this.pools.groups.length < this.maxPoolCap) {
        this.pools.groups.push(group);
      }
    }

    pageEl.textContent = '';
    pageEl.className = 'feed-page';
    if (pageEl.parentNode) {
      pageEl.parentNode.removeChild(pageEl);
    }
    if (this.pools.pages.length < this.maxPoolCap) {
      this.pools.pages.push(pageEl);
    }
  }

  /**
   * Clears and recycles all active feed pages in container.
   */
  public clearFeed(container?: HTMLElement | null): void {
    if (this.observer) {
      for (const page of this.activePages) {
        try { this.observer.unobserve(page); } catch {}
      }
      this.observer.disconnect();
      this.observer = null;
    }

    const pagesToRecycle = Array.from(this.activePages);
    for (const page of pagesToRecycle) {
      this.recyclePage(page);
    }
    this.activePages.clear();

    if (container) {
      const remainingPages = Array.from(container.querySelectorAll('.feed-page')) as HTMLElement[];
      for (const p of remainingPages) {
        this.recyclePage(p);
      }
      container.textContent = '';
    }
  }

  /**
   * Return stats of pooled DOM nodes.
   */
  public getNodePoolStats(): Record<string, number> {
    return {
      pages: this.pools.pages.length,
      groups: this.pools.groups.length,
      btnRows: this.pools.btnRows.length,
      cardContainers: this.pools.cardContainers.length,
      buttons: this.pools.buttons.length,
      cards: this.pools.cards.length,
      headers: this.pools.headers.length,
      activePages: this.activePages.size,
    };
  }

  public static resetInstance(): void {
    if (DiscoverFeed.instance) {
      DiscoverFeed.instance.clearFeed();
    }
    DiscoverFeed.instance = new DiscoverFeed();
  }
}

export const discoverFeed = DiscoverFeed.getInstance();

// Expose on window for legacy non-module scripts
if (typeof window !== 'undefined') {
  (window as unknown as { DiscoverFeed: DiscoverFeed }).DiscoverFeed = discoverFeed;
}
