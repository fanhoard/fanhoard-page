# FanHoard SEO Strategy & Technical Architecture

- **System Described**: Platform SEO Strategy, Internationalization Markup, Pre-rendered HTML Pipeline, and Core Web Vitals Optimization
- **Entry File**: `scripts/build.js`
- **Dependencies**: `_headers`, `sitemap.xml`, `robots.txt`, `assets/lang/en.json`, `assets/lang/th.json`
- **Verification**: `npm run test`

---

## 1. System Overview

FanHoard is a high-performance static web application deployed on Cloudflare Pages CDN. The platform competes globally against online emoji/symbol aggregators. SEO strategy is executed at build time through static HTML pre-rendering, full multi-language parity (`en` and `th`), structured JSON-LD data, and strict Core Web Vitals compliance.

### 1.1 Multi-Language Parity Invariant

Both supported languages (`en` and `th`) are treated as primary platform citizens. Every page, meta tag, Open Graph card, and structured data element MUST exist symmetrically across all supported language locales:

```
https://fantrove.pages.dev/en/              # English Home (Canonical for /en/)
https://fantrove.pages.dev/th/              # Thai Home (Canonical for /th/)
https://fantrove.pages.dev/en/search/       # English Search
https://fantrove.pages.dev/th/search/       # Thai Search
```

---

## 2. Technical SEO Architecture

### 2.1 Static HTML Pre-Rendering

During the build process (`scripts/build.js`), translation markers (`[data-translate]`) are expanded directly into the generated static HTML files.

```
Source Template HTML
    │
    ▼
scripts/build.js + Translation JSONs (assets/lang/{en,th}.json)
    │
    ▼
Pre-built Static HTML (en/*.html, th/*.html)
    ├── Crawlable by Googlebot without JS execution
    ├── Instant First Contentful Paint (FCP)
    └── Symmetrical meta tags & canonical links
```

### 2.2 Server Headers & HTTP Protocols

Enforced via Cloudflare Pages configuration (`_headers`):
- **Protocol**: HTTP/2 & HTTP/3 enabled.
- **Transport**: Banned plain HTTP; Cloudflare redirects HTTP → HTTPS.
- **Encoding**: Brotli / Gzip compression enabled automatically.
- **Response Latency**: Target TTFB < 200ms globally across CDN edge nodes.

---

## 3. Meta Tags Contract

Every generated HTML document MUST include the standardized meta block:

```html
<!DOCTYPE html>
<html lang="{lang}">
<head>
  <!-- Basic Meta -->
  <title>{Page Title} — FanHoard</title>
  <meta name="description" content="{Page-specific summary (150-160 chars)}">
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">

  <!-- Canonical & hreflang Links -->
  <link rel="canonical" href="https://fantrove.pages.dev/{lang}/{page}/">
  <link rel="alternate" hreflang="en" href="https://fantrove.pages.dev/en/{page}/">
  <link rel="alternate" hreflang="th" href="https://fantrove.pages.dev/th/{page}/">
  <link rel="alternate" hreflang="x-default" href="https://fantrove.pages.dev/en/{page}/">

  <!-- Open Graph -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://fantrove.pages.dev/{lang}/{page}/">
  <meta property="og:title" content="{Page Title}">
  <meta property="og:description" content="{Description}">
  <meta property="og:image" content="https://fantrove.pages.dev/assets/images/OG/fantrove-hub-og.png">
  <meta property="og:site_name" content="FanHoard">

  <!-- Twitter Cards -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{Page Title}">
  <meta name="twitter:description" content="{Description}">
  <meta name="twitter:image" content="https://fantrove.pages.dev/assets/images/OG/fantrove-hub-og.png">
</head>
```

### 3.1 Title & Description Standards

| Element | Character Count | Rule |
| :--- | :--- | :--- |
| `<title>` | 50 – 60 chars | Primary keyword + page context + brand suffix (`— FanHoard`). Unique per locale. |
| `<meta name="description">` | 150 – 160 chars | Actionable summary matching page locale. No keyword stuffing. |

---

## 4. Structured Data Schema (JSON-LD)

Every content view includes inline `application/ld+json` blocks describing the entity:

```json
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "FanHoard",
  "url": "https://fantrove.pages.dev/en/",
  "applicationCategory": "UtilitiesApplication",
  "operatingSystem": "All",
  "inLanguage": "en",
  "description": "Copy emojis, symbols, and fancy text instantly."
}
```

---

## 5. Prohibited SEO Practices

| Prohibited Action | System Impact |
| :--- | :--- |
| Rendering primary content solely via client-side JavaScript | Prevents search engine indexing and degrades FCP. |
| Referencing obsolete route paths (e.g., `search/docs`) | Causes 404 crawl errors and dilutes link equity. |
| Omitting `hreflang="x-default"` | Prevents proper fallback routing for unsupported locales. |
| Using non-localized meta titles or descriptions | Causes locale confusion in search engine result pages (SERPs). |

---

## 6. Cross-References

- [`04-Internationalization-And-Build.md`](./04-Internationalization-And-Build.md) — Build pipeline & i18n static page generator
- [`09-Deployment-Guide.md`](./09-Deployment-Guide.md) — Cloudflare Pages headers & sitemap deployment
- [`docs/engineering/ai-docs-guide.md`](../docs/engineering/ai-docs-guide.md) — AI-first documentation standards
