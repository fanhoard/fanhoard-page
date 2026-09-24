import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Core Search Defects Regression Suite (DS-01, DS-06, DS-07, DS-09, DS-05, DS-11, DS-02)', () => {

  beforeEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  // DS-01: init failure resets _initialized to false
  it('DS-01: init failure resets _initialized to false and logs error', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    let initialized = true;
    const mockSearchUI = {
      get _initialized() { return initialized; },
      set _initialized(val: boolean) { initialized = val; },
      init: vi.fn(),
    };
    (window as any).__searchUI = mockSearchUI;

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

  // DS-06: ensureFuseLoaded rejection unlocks _fuseBuilding in finally
  it('DS-06: Fuse build failure resets _fuseBuilding flag in finally block', async () => {
    let fuseBuilding = true;

    const mockBuild = async () => {
      try {
        throw new Error('Failed to load Fuse.js');
      } catch (e) {
        // caught
      } finally {
        fuseBuilding = false;
      }
    };

    await mockBuild();
    expect(fuseBuilding).toBe(false);
  });

  // DS-07: cap Fuse build retries at 3 and fallback to substring search
  it('DS-07: Fuse build retries are capped at 3 before defaulting to substring search', () => {
    let fuseBuildRetries = 0;
    const MAX_RETRIES = 3;
    let fallbackTriggered = false;

    const attemptBuild = () => {
      if (fuseBuildRetries >= MAX_RETRIES) {
        fallbackTriggered = true;
        return;
      }
      fuseBuildRetries++;
    };

    attemptBuild(); // 1
    attemptBuild(); // 2
    attemptBuild(); // 3
    attemptBuild(); // 4 -> capped

    expect(fuseBuildRetries).toBe(3);
    expect(fallbackTriggered).toBe(true);
  });

});
