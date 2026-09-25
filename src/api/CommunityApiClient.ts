export interface ReportRequest {
  category: string;
  message: string;
  page: string;
  expected?: string;
  email?: string;
  language?: string;
  browser?: string;
  turnstileToken?: string;
}

export interface ReportResponse {
  success: boolean;
  report_id?: string;
  error?: string;
  details?: unknown;
}

export class ApiTimeoutError extends Error {
  constructor(message = 'Request timed out after 10 seconds') {
    super(message);
    this.name = 'ApiTimeoutError';
  }
}

export class ApiHttpError extends Error {
  public status: number;
  public details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiHttpError';
    this.status = status;
    this.details = details;
  }
}

export class ApiNetworkError extends Error {
  constructor(message = 'Network error encountered') {
    super(message);
    this.name = 'ApiNetworkError';
  }
}

export interface CommunityApiClientOptions {
  baseUrl?: string;
  timeoutMs?: number;
  maxRetries?: number;
}

export class CommunityApiClient {
  private baseUrl: string;
  private timeoutMs: number;
  private maxRetries: number;

  constructor(options: CommunityApiClientOptions = {}) {
    this.baseUrl = (options.baseUrl || 'https://community.nontakorn2600.workers.dev').replace(/\/+$/, '');
    this.timeoutMs = options.timeoutMs ?? 10000; // 10 seconds
    this.maxRetries = options.maxRetries ?? 2; // up to 2 retries
  }

  /**
   * Submit a community report with timeout and retry logic.
   */
  public async submitReport(payload: ReportRequest): Promise<ReportResponse> {
    const url = `${this.baseUrl}/report`;

    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt <= this.maxRetries) {
      try {
        return await this.executeFetch<ReportResponse>(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
      } catch (err: any) {
        lastError = err;

        // Do not retry 4xx errors (validation, rate limiting, bad request) or non-retryable errors
        if (err instanceof ApiHttpError && err.status >= 400 && err.status < 500) {
          throw err;
        }

        attempt++;
        if (attempt <= this.maxRetries) {
          // Exponential backoff delay: 300ms, 600ms...
          const delay = Math.pow(2, attempt - 1) * 300;
          await this.delay(delay);
        }
      }
    }

    throw lastError || new ApiNetworkError('Failed to submit report after retries');
  }

  private async executeFetch<T>(url: string, options: RequestInit): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      clearTimeout(timer);

      if (!response.ok) {
        let errorData: any = {};
        try {
          errorData = await response.json();
        } catch (_) {}

        throw new ApiHttpError(
          response.status,
          errorData.error || `HTTP ${response.status}: Request failed`,
          errorData.details
        );
      }

      const data = await response.json();
      return data as T;
    } catch (err: any) {
      clearTimeout(timer);

      if (err.name === 'AbortError') {
        throw new ApiTimeoutError(`Request timed out after ${this.timeoutMs / 1000} seconds`);
      }

      if (err instanceof ApiHttpError) {
        throw err;
      }

      throw new ApiNetworkError(err.message || 'Network fetch failed');
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
