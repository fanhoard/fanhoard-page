import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  CommunityApiClient,
  ApiTimeoutError,
  ApiHttpError,
  ApiNetworkError
} from '../../src/api/CommunityApiClient';

describe('CommunityApiClient', () => {
  let client: CommunityApiClient;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    client = new CommunityApiClient({
      baseUrl: 'https://community-fanhoard.pages.dev',
      timeoutMs: 100, // Short timeout for unit tests
      maxRetries: 2
    });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('submits a report successfully', async () => {
    const mockResponse = { success: true, report_id: 'rep_12345' };
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse
    } as Response);

    const payload = {
      category: 'bug',
      message: 'Found a layout bug in dark theme',
      page: '/home',
      turnstileToken: 'test-token'
    };

    const result = await client.submitReport(payload);

    expect(result).toEqual(mockResponse);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://community-fanhoard.pages.dev/report',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
    );
  });

  it('throws ApiHttpError on 4xx status without retrying', async () => {
    const mockError = { error: 'Invalid request payload' };
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => mockError
    } as Response);

    const payload = {
      category: 'bug',
      message: '',
      page: '/home'
    };

    await expect(client.submitReport(payload)).rejects.toThrow(ApiHttpError);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1); // No retries on 400
  });

  it('retries on 5xx server errors and succeeds on retry', async () => {
    const mockSuccess = { success: true, report_id: 'rep_retry' };
    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockSuccess
      } as Response);

    const payload = {
      category: 'bug',
      message: 'Server error test',
      page: '/home'
    };

    const result = await client.submitReport(payload);
    expect(result).toEqual(mockSuccess);
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });

  it('throws ApiTimeoutError when request times out', async () => {
    globalThis.fetch = vi.fn().mockImplementation((_url, options) => {
      return new Promise((_resolve, reject) => {
        if (options?.signal) {
          options.signal.addEventListener('abort', () => {
            const err = new Error('The operation was aborted');
            err.name = 'AbortError';
            reject(err);
          });
        }
      });
    });

    const payload = {
      category: 'suggestion',
      message: 'Hanging request test',
      page: '/home'
    };

    await expect(client.submitReport(payload)).rejects.toThrow(ApiTimeoutError);
  });
});
