import { describe, it, expect, beforeEach } from 'vitest';

describe('FVL Material Spinner Variant Subsystem', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    const fvlPath = require.resolve('../assets/js/loading-system/fvl.js');
    delete require.cache[fvlPath];
    delete (window as any).FVL;
    delete (window as any).FVLModules;
    
    require('../assets/js/loading-system/fvl.js');
  });

  it('exposes FVL.spinner factory method', () => {
    const FVL = (window as any).FVL;
    expect(typeof FVL.spinner).toBe('function');

    const handle = FVL.spinner({ size: 'md' });
    expect(handle).toBeDefined();
    expect(handle.element).toBeInstanceOf(HTMLElement);
    expect(handle.element.classList.contains('fvl-spinner')).toBe(true);
    expect(handle.element.classList.contains('fvl-spinner--md')).toBe(true);
  });

  it('supports size variants sm, md, lg, xl and custom pixel size', () => {
    const FVL = (window as any).FVL;

    ['sm', 'md', 'lg', 'xl'].forEach((sz) => {
      const sp = FVL.spinner({ size: sz });
      expect(sp.element.classList.contains(`fvl-spinner--${sz}`)).toBe(true);
    });

    const customPx = FVL.spinner({ size: 42 });
    expect(customPx.element.style.width).toBe('42px');
    expect(customPx.element.style.height).toBe('42px');
  });

  it('supports determinate progress mode and updateProgress', () => {
    const FVL = (window as any).FVL;
    const sp = FVL.spinner({ determinate: true, progress: 25 });

    expect(sp.element.classList.contains('fvl-spinner--determinate')).toBe(true);
    expect(sp.element.getAttribute('aria-valuenow')).toBe('25');

    sp.updateProgress(75);
    expect(sp.element.getAttribute('aria-valuenow')).toBe('75');

    const arc = sp.element.querySelector('.fvl-arc') as HTMLElement;
    expect(arc.style.strokeDashoffset).toBeDefined();
  });

  it('supports custom color tokens via CSS custom properties', () => {
    const FVL = (window as any).FVL;
    const sp = FVL.spinner({ color: '#ff0000', trackColor: '#00ff00' });

    expect(sp.element.style.getPropertyValue('--fvl-spinner-color')).toBe('#ff0000');
    expect(sp.element.style.getPropertyValue('--fvl-spinner-track-color')).toBe('#00ff00');
  });

  it('allows existing modes to opt-in to spinner variants', () => {
    const FVL = (window as any).FVL;
    const target = document.createElement('div');
    target.id = 'scoped-target';
    document.body.appendChild(target);

    const handle = FVL.scoped({
      target: '#scoped-target',
      variant: { size: 'lg', color: '#123456', determinate: true, progress: 50 }
    });

    expect(handle).not.toBeNull();
    const spinner = target.querySelector('.fvl-spinner') as HTMLElement;
    expect(spinner).not.toBeNull();
    expect(spinner.classList.contains('fvl-spinner--lg')).toBe(true);
    expect(spinner.classList.contains('fvl-spinner--determinate')).toBe(true);
    expect(spinner.style.getPropertyValue('--fvl-spinner-color')).toBe('#123456');

    handle.updateProgress(80);
    expect(spinner.getAttribute('aria-valuenow')).toBe('80');
  });

  it('does not add any new class or style when no variant is passed (default UX byte-identical)', () => {
    const FVL = (window as any).FVL;
    const target = document.createElement('div');
    target.id = 'default-target';
    document.body.appendChild(target);

    const handle = FVL.scoped({ target: '#default-target' });
    const spinner = target.querySelector('.fvl-spinner') as HTMLElement;

    expect(spinner.className).toBe('fvl-spinner');
    expect(spinner.style.getPropertyValue('--fvl-spinner-color')).toBe('');
    expect(spinner.classList.contains('fvl-spinner--determinate')).toBe(false);
  });
});
