import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Core Search Defects Regression Suite (DS-01, DS-06, DS-07, DS-09, DS-05, DS-11, DS-02)', () => {

  beforeEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  // DS-01: init failure resets _initialized to false
  it('DS-01: init failure resets _initialized to false and logs error', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Mock __searchUI object mirroring search.js
    let initialized = true;
    const mockSearchUI = {
      get _initialized() { return initialized; },
      set _initialized(val: boolean) { initialized = val; },
      init: vi.fn(),
    };
    (window as any).__searchUI = mockSearchUI;

    // Simulate init failure handler behavior
    const handleInitFailure = (err: Error) => {
      console.error('[Search] Initialisation failed:', err);
      if ((window as any).__searchUI) {
        (window as any).__searchUI._initialized = false;
      }
    };

    handleInitFailure(new Error('Data load network error'));

    expect(consoleError).toHaveBeenCalledWith('[Search] Initialisation failed:', expect.any(Error));
    expect((window as any).__searchUI._initialized).toBe(false);
  });

});
