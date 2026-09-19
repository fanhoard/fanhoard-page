# Auth & Access Subsystem Plan

**Subsystem Name:** Security, Headers, CORS & CAPTCHA  
**Scope:** `fanhoard/fanhoard-page` & `Jeffy2600II/community-fanhoard`  

---

## 1. Target Security Architecture

The Auth & Access Subsystem enforces defense-in-depth security controls across the static web host (Cloudflare Pages) and the edge API worker (Cloudflare Workers).

### Security Architecture Diagram
```
[ User Browser ]
       │
       ├── OWASP Security Headers Check (_headers: CSP, X-Frame-Options, nosniff)
       │
       ├── Cloudflare Turnstile Verification (CAPTCHA Token Generation)
       │
       ▼
[ Cloudflare Edge Worker ] (community-fanhoard)
       │
       ├── Dynamic Origin CORS Middleware (Allows fanhoard.pages.dev, localhost)
       │
       ├── Cloudflare KV Rate Limiter (Max 5 req / 10 min per IP)
       │
       └── Turnstile Secret Key Verification
```

---

## 2. OWASP Security Headers (`_headers`)

Cloudflare Pages configuration in `_headers` must enforce strict HTTP response headers:

```
/*
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://community-fanhoard.pages.dev https://*.cloudflare.com; frame-src https://challenges.cloudflare.com;
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
```

---

## 3. Bot Protection & CORS Security

### Cloudflare Turnstile Integration
- Frontend contact (`/community/contact/`) and report (`/community/report/`) pages render Cloudflare Turnstile CAPTCHA widget.
- Form submissions require a valid `cf-turnstile-response` token.
- Edge worker verifies token against `https://challenges.cloudflare.com/turnstile/v0/siteverify` using `env.TURNSTILE_SECRET_KEY`.

### Dynamic Origin CORS Middleware
```typescript
export function corsMiddleware(origin: string | null): Record<string, string> {
  const allowedOrigins = [
    'https://fanhoard.pages.dev',
    'https://fanhoard.com',
    'http://localhost:5173',
    'http://localhost:3000'
  ];

  const isAllowed = origin && allowedOrigins.includes(origin);

  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : 'https://fanhoard.pages.dev',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Turnstile-Token',
    'Access-Control-Max-Age': '86400'
  };
}
```

---

## 4. Migration & Refactoring Steps

1. **Phase 1: Security Headers**: Update `_headers` in `fanhoard-page` with complete OWASP security headers.
2. **Phase 2: Worker Middleware**: Implement Turnstile verification and dynamic CORS in `community-fanhoard`.
3. **Phase 3: Frontend Turnstile Component**: Create `src/components/TurnstileWidget.ts` embedding widget on contact and report forms.
4. **Verification**: Audit header score on securityheaders.com and test Turnstile token verification end-to-end.
