# Page Plan 06: Contact Us Form (`/community/contact/`)

**Target Path:** `community/contact/index.html`  
**Route URL:** `/community/contact/`  

---

## 1. Current Problems from Technical Assessment

1. **Dead CSS & Script References**:
   - Line 9: `<script src="/assets/js/lang-sync.js"></script>` (404 error).
   - Line 23: `<link rel="stylesheet" href="/assets/css/language-error.css">` (Missing file; 404 error).
   - Line 190: `<script src="/fanhoard-console-bridge.js"></script>` (404 error).
2. **Missing Form Validation & Bot Protection**:
   - Form submits without client-side field validation or rate limiting.
   - Lacks anti-bot CAPTCHA protection (Cloudflare Turnstile).

---

## 2. Target Design

### Architecture & Component Structure
- **`ContactFormController.ts`**: Manages form field state, input validation, Turnstile token handling, and submission state.
- **`TurnstileWidget.ts`**: Cloudflare Turnstile anti-bot widget wrapper.
- **`FeedbackAlert.ts`**: Toast/Alert banner indicating submission outcome.

### Form Validation Schema
```typescript
interface ContactFormPayload {
  name: string;
  email: string;
  subject: string;
  message: string;
  turnstileToken: string;
}
```

---

## 3. Exact Refactoring Steps

1. **Phase 1 Fixes**:
   - Delete line 9 (`lang-sync.js`), line 23 (`language-error.css`), and line 190 (`fanhoard-console-bridge.js`) from `community/contact/index.html`.
2. **Phase 2 & 3 API Integration**:
   - Integrate `CommunityApiClient.ts` for transmitting contact inquiries to `community-fanhoard` edge worker.
   - Embed Cloudflare Turnstile widget (`https://challenges.cloudflare.com/turnstile/v0/api.js`).
3. **Phase 4 Form Accessibility**:
   - Ensure all input fields have explicitly associated `<label for="...">` tags and `aria-describedby` error regions.
4. **Phase 5 Vite Bundling**:
   - Bundle `src/pages/contact.ts` into a minified Vite entry point.
5. **Verification**:
   - Submit contact form with empty fields: verify client-side Zod validation errors display under fields.
   - Submit valid form: verify Turnstile token passes and success toast displays.
