import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('FVL Standalone Spinner Subsystem (fvl-spinner.js)', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.head.innerHTML = '';

    delete (window as any).FVLSpinner;
    delete (window as any).FVL;
    delete (window as any).FVLModules;

    const spinnerCode = fs.readFileSync(
      path.resolve(__dirname, '../assets/js/loading-system/fvl-spinner.js'),
      'utf-8'
    );
    const runScript = new Function('window', 'document', 'localStorage', spinnerCode);
    runScript(window, document, window.localStorage);
  });

  it('exports window.FVLSpinner and window.FVL.spinner without booting orchestrator', () => {
    const FVLSpinner = (window as any).FVLSpinner;
    expect(FVLSpinner).toBeDefined();
    expect(typeof FVLSpinner.create).toBe('function');
    expect(typeof FVLSpinner.mount).toBe('function');
    expect(typeof FVLSpinner.applyVariant).toBe('function');
    expect(typeof FVLSpinner.updateProgress).toBe('function');
    expect(typeof FVLSpinner.renderSVG).toBe('function');

    expect((window as any).FVL).toBeDefined();
    expect((window as any).FVL.spinner).toBe(FVLSpinner);
  });

  it('automatically injects fvl-spinner-styles into document.head if missing', () => {
    const FVLSpinner = (window as any).FVLSpinner;
    FVLSpinner.create();

    const styleEl = document.getElementById('fvl-spinner-styles');
    expect(styleEl).not.toBeNull();
    expect(styleEl?.textContent).toContain('.fvl-spinner');
  });

  it('creates valid spinner handle and element with SVG markup', () => {
    const FVLSpinner = (window as any).FVLSpinner;
    const handle = FVLSpinner.create({ size: 'lg', color: '#009688' });

    expect(handle).toBeDefined();
    expect(handle.element).toBeInstanceOf(HTMLElement);
    expect(handle.element.classList.contains('fvl-spinner')).toBe(true);
    expect(handle.element.classList.contains('fvl-spinner--lg')).toBe(true);
    expect(handle.element.querySelector('svg')).not.toBeNull();
    expect(handle.element.querySelector('.fvl-arc')).not.toBeNull();
  });

  it('supports direct mounting helper and unmounting/destroying', () => {
    const target = document.createElement('div');
    target.id = 'mount-container';
    document.body.appendChild(target);

    const FVLSpinner = (window as any).FVLSpinner;
    const handle = FVLSpinner.mount('#mount-container', { size: 'sm' });

    expect(target.children.length).toBe(1);
    expect(target.querySelector('.fvl-spinner')).not.toBeNull();

    handle.unmount();
    expect(target.children.length).toBe(0);
  });

  it('supports interactive updates: setSize, setColor, setTrackColor, setSpeed, setStrokeWidth, updateProgress', () => {
    const FVLSpinner = (window as any).FVLSpinner;
    const handle = FVLSpinner.create({ size: 'sm' });

    handle.setSize('xl');
    expect(handle.element.classList.contains('fvl-spinner--xl')).toBe(true);

    handle.setColor('#ff0000');
    expect(handle.element.style.getPropertyValue('--fvl-spinner-color')).toBe('#ff0000');

    handle.setTrackColor('#00ff00');
    expect(handle.element.style.getPropertyValue('--fvl-spinner-track-color')).toBe('#00ff00');

    handle.setSpeed('fast');
    expect(handle.element.classList.contains('fvl-spinner--speed-fast')).toBe(true);

    handle.setStrokeWidth('thick');
    expect(handle.element.classList.contains('fvl-spinner--stroke-thick')).toBe(true);

    handle.setStrokeWidth(6);
    expect(handle.element.style.getPropertyValue('--fvl-spinner-stroke-width')).toBe('6px');

    handle.updateProgress(50);
    expect(handle.element.classList.contains('fvl-spinner--determinate')).toBe(true);
    expect(handle.element.getAttribute('aria-valuenow')).toBe('50');
  });

  it('supports function calling syntax FVLSpinner(opts) for full backward compatibility', () => {
    const FVLSpinner = (window as any).FVLSpinner;
    const handle = FVLSpinner({ size: 'md' });

    expect(handle).toBeDefined();
    expect(handle.element.classList.contains('fvl-spinner--md')).toBe(true);
  });
});
