# API Subsystem Plan

**Subsystem Name:** API Client & Edge Worker Architecture  
**Scope:** `fanhoard/fanhoard-page` & `Jeffy2600II/community-fanhoard`  

---

## 1. Target API Architecture

The API Subsystem provides type-safe communication between the FanHoard frontend and the Cloudflare Worker edge backend.

### Architecture Blueprint
```
[ Frontend Client ] (CommunityApiClient.ts)
       │
       ├── AbortController Timeout (10s limit)
       ├── Exponential Backoff Retry (Max 2 retries)
       │
       ▼  HTTP POST /report
[ Edge Worker ] (community-fanhoard / Hono Framework)
       │
       ├── KV Rate Limiter Middleware
       ├── Turnstile Verification Middleware
       ├── Sanitization Engine (sanitizeDiscordText)
       │
       ▼  Webhook POST
[ Discord Webhook Channel ]
```

---

## 2. API Contract Specification (`POST /report`)

### Request Payload
```typescript
interface ReportRequest {
  category: string;      // Required, e.g. "Bug", "Suggestion"
  message: string;       // Required, max 2000 chars
  page: string;          // Required, URL path or page title
  expected?: string;     // Optional, max 2000 chars
  email?: string;        // Optional, valid email format
  language?: string;     // Optional, e.g. "en", "th"
  turnstileToken: string;// Required Turnstile token
}
```

### Response Formats
- **201 Created**: `{ "success": true, "report_id": "rep_9f8a3c" }`
- **400 Bad Request**: `{ "error": "Invalid request payload", "details": [...] }`
- **429 Too Many Requests**: `{ "error": "Rate limit exceeded. Please try again later." }`
- **500 Internal Server Error**: `{ "error": "Failed to submit report. Downstream dispatch failed." }`

---

## 3. Frontend API Client (`CommunityApiClient.ts`)

```typescript
export class CommunityApiClient {
  private baseUrl: string;

  constructor(baseUrl = 'https://community-fanhoard.pages.dev') {
    this.baseUrl = baseUrl;
  }

  async submitReport(payload: ReportRequest): Promise<{ success: boolean; report_id: string }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
      const response = await fetch(`${this.baseUrl}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error('Request timed out. Please check your network connection.');
      }
      throw err;
    }
  }
}
```

---

## 4. Migration Steps

1. **Phase 2: Edge Worker Implementation**: Refactor `community-fanhoard` to TypeScript + Hono with Discord sanitization and KV rate limiting.
2. **Phase 3: Frontend Client Integration**: Build `CommunityApiClient.ts` in `fanhoard-page` and connect to report form.
3. **Verification**: Run unit tests in `tests/api/CommunityApiClient.test.ts` verifying request timeouts and error handling.
