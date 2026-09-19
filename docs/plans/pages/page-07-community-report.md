# Page Plan 07: Bug & Issue Report Form (`/community/report/`)

**Target Path:** `community/report/index.html`  
**Route URL:** `/community/report/`  

---

## 1. Technical Assessment Findings

1. **Dead Script References**:
   - Line 6: `<script src="/assets/js/lang-sync.js"></script>` (404 error).
   - Line 7: `<script src="/assets/js/lang-coordinator.js"></script>` (404 error).
   - Line 139: `<script src="/assets/js/Intelligent-system.js"></script>` (404 error).
   - Line 188: `<script src="/fanhoard-console-bridge.js"></script>` (404 error).
2. **API Request Hangs & Missing Retry Logic**: Form submission fetches external worker endpoint without request timeout. If the endpoint hangs, loading spinner spins indefinitely.
3. **Untyped Submission Payload**: Payload constructed as loose JS object without length restrictions on optional fields.

---

## 2. Target Design

### Architecture & Component Structure
- **`ReportFormController.ts`**: Manages issue category dropdown, step-by-step description inputs, Turnstile verification, and submission retries.
- **`CommunityApiClient.ts`**: Typed client submitting reports to `POST /report` on `community-fanhoard` worker with 10-second timeout.

---

## 3. Exact Refactoring Steps

1. **Phase 1 Fixes**:
   - Purge lines 6, 7, 139, and 188 from `community/report/index.html`.
2. **Phase 2 & 3 Worker & Client Modernization**:
   - Connect report form to `CommunityApiClient.ts`.
   - Add 10s `AbortController` timeout wrapper around form submit fetch.
   - Add Cloudflare Turnstile CAPTCHA widget.
3. **Phase 4 Form Accessibility**:
   - Add `aria-invalid` and `aria-errormessage` attributes to category select and text area elements.
4. **Phase 5 Vite Bundling**:
   - Bundle `src/pages/report.ts` via Vite.
5. **Verification**:
   - Disconnect network and click submit: verify request times out after 10s and displays retry alert banner.
