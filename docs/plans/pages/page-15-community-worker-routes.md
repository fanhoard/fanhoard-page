# Page Plan 15: Edge Worker Routes (`community-fanhoard`)

**Target Repository:** `Jeffy2600II/community-fanhoard`  
**Routes:** `POST /report`, `OPTIONS /report`, `ALL /*`  

---

## 1. Technical Assessment Findings

1. **Security Vulnerabilities**:
   - In-memory rate limiting (`rateLimitMap`) fails across stateless Cloudflare edge nodes.
   - Raw user text injected into Discord embeds without escaping Markdown or mention triggers (`@everyone`, `@here`).
   - `POST /report` is unauthenticated without bot protection.
2. **Architecture Debt**:
   - Monolithic 159-line `index.js` with untyped JS code.
   - Hardcoded CORS origin (`https://fanhoard.pages.dev`).
   - Returns 200 OK instead of `201 Created` with tracking ID.

---

## 2. Target Design

### Hono Edge Worker Architecture
```
src/
├── index.ts              # Entry point & CORS routing
├── routes/
│   └── report.ts         # POST /report & OPTIONS handler
├── middleware/
│   ├── rateLimit.ts      # Cloudflare KV sliding window rate limiter
│   └── turnstile.ts      # Cloudflare Turnstile token validator
├── services/
│   └── discord.ts        # Discord embed payload client
└── utils/
    └── sanitize.ts       # Markdown & mention trigger escaping
```

---

## 3. Exact Refactoring Steps

1. **Phase 2 Implementation**:
   - Convert worker to TypeScript + Hono.
   - Configure Cloudflare KV binding (`RATE_LIMIT_KV`).
   - Add `sanitizeDiscordText()` escaping `@everyone`, `@here`, `<@&...>`, and Markdown characters.
   - Add Turnstile verification middleware.
   - Implement dynamic origin CORS middleware supporting `fanhoard.pages.dev`, `fanhoard.com`, and `localhost`.
   - Update success response to HTTP `201 Created` returning `{ success: true, report_id: "rep_..." }`.
2. **Phase 2 Vitest Integration**:
   - Write unit and integration tests in `tests/report.test.ts`.
3. **Verification**:
   - Run `npm run test` in `community-fanhoard`: verify 100% test pass.
   - Deploy to Cloudflare Worker test environment via `wrangler deploy`.
