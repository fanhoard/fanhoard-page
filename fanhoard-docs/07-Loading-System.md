# 07 — Loading System (FVL — FanHoardVerse Loader)

> เอกสารนี้อธิบายระบบ **FVL (FanHoardVerse Loader)** ของ FanHoard — ระบบ loading ส่วนกลางที่แยกออกมาจาก Nav-Core เดิม ออกแบบมาเพื่อให้ทุก loading indicator ทั่วทั้งเว็บมีคุณภาพระดับเดียวกันและยืดหยุ่นพอที่จะแสดงได้ในทุกบริบท — ตั้งแต่ overlay เต็มหน้าจอ, scoped containers, inline spinners ไปจนถึง standalone spinner subsystem ที่ไม่มี dependency
>
> **สำหรับ:** AI และนักพัฒนาที่จะแก้ FVL หรือเรียกใช้ loading indicator ในโค้ดใหม่
>
> **ไฟล์หลัก:** `assets/js/loading-system/fvl.js` (orchestrator หลัก ที่โหลด sub-modules ผ่าน `LOAD_PHASES`) + `assets/js/loading-system/fvl-spinner.js` (standalone spinner) + `assets/js/loading-system/fvl-modules/` (9 sub-modules) + `assets/css/loading-system.css` (auto-injected)
>
> **Namespace:** `window.FVL` (public API, frozen), `window.FVLSpinner` (standalone spinner), `window.FVLModules` (internal registry)
>
> **เวอร์ชัน:** v3.1.0

---

## สารบัญ

1. [Overview](#1-overview)
2. [ไฟล์และโครงสร้างโมดูล](#2-ไฟล์และโครงสร้างโมดูล)
3. [ขั้นตอนการบูตและการโหลด (LOAD_PHASES)](#3-ขั้นตอนการบูตและการโหลด-load_phases)
4. [Display Modes & Flexible Options (`spinnerOnly`, `bare`, `chromeless`, `targetSlot`)](#4-display-modes--flexible-options-spinneronly-bare-chromeless-targetslot)
5. [Material Spinner Subsystem & Standalone Subsystem (`fvl-spinner.js`)](#5-material-spinner-subsystem--standalone-subsystem-fvl-spinnerjs)
6. [Public API — `window.FVL` & `window.FVLSpinner`](#6-public-api--windowfvl--windowfvlspinner)
7. [Theme System & Color Tokens](#7-theme-system--color-tokens)
8. [Z-Index Stacking Layers](#8-z-index-stacking-layers)
9. [i18n & Accessibility](#9-i18n--accessibility)
10. [Backward Compatibility (Full Proxy)](#10-backward-compatibility-full-proxy)
11. [CSS Architecture & Naming Standard](#11-css-architecture--naming-standard)
12. [วิธีเพิ่มในหน้าเว็บและตัวอย่างการใช้งาน](#12-วิธีเพิ่มในหน้าเว็บและตัวอย่างการใช้งาน)
13. [Integration กับระบบอื่น](#13-integration-กับระบบอื่น)
14. [Version History](#14-version-history)
15. [อ้างอิงข้ามเอกสาร](#15-อ้างอิงข้ามเอกสาร)

---

## 1. Overview

FVL (FanHoardVerse Loader) คือระบบ loading ส่วนกลางของ FanHoard ที่แยกออกมาจาก Nav-Core เดิม ออกแบบมาเพื่อให้ **ทุก loading indicator ทั่วทั้งเว็บมีคุณภาพระดับเดียวกัน** และยืดหยุ่นพอที่จะแสดงได้ในทุกบริบท — ตั้งแต่ overlay เต็มหน้าจอ ไปจนถึง spinner เล็กๆ ในปุ่ม หรือใช้ standalone spinner ย่อยแยกต่างหาก

### หลักการออกแบบ

- **Lightweight & Modular**: Entry point หลัก (`fvl.js`) โหลด submodules ใน `fvl-modules/` แบบ phased parallel, zero external dependencies, ทำงานลื่นไหลบนอุปกรณ์สเปคต่ำ→สูง
- **4 display modes**: `fullscreen` / `scoped` / `inline` / `topbar` — ใช้ API เดียว (`FVL.show()`)
- **Flexible Options per Mode**:
  - `spinnerOnly`: ซ่อนข้อความ message/submessage เหลือเพียงตัว spinner
  - `chromeless`: ปลด backdrop, border, padding และ shadow สำหรับวางใน UI ไร้ขอบ
  - `bare`: Shorthand ผสาน `{ spinnerOnly: true, chromeless: true }`
  - `targetSlot`: กำหนด sub-selector หรือ child element เฉพาะจุดสำหรับ mount ภายใน container หลัก
- **Standalone Spinner Subsystem (`fvl-spinner.js`)**: มอดูล spinner อิสระ zero-dependency ไม่พึ่งพา `fvl.js` หรือ `LOAD_PHASES` เหมาะกับหน้าเบาหรือ widget เฉพาะจุด
- **Material Spinner Variant Subsystem**: รองรับ opt-in sizes (`sm`/`md`/`lg`/`xl`), determinate/indeterminate mode, progress updates, animation speed, stroke width และ color tokens ผ่าน CSS custom properties โดยที่ **default rendered DOM/UX บนหน้าปัจจุบันทั้งหมดคงเดิม 100%**
- **Zero coupling กับระบบอื่น**: ทำงานได้เลยโดยไม่ต้องมี URE, NavCore, Search หรือ Language System
- **Full backward-compat**: API เดิมของ Nav-Core (`LoadingService.show/hide`, `window.showInstantLoadingOverlay`, `window._navCore_contentLoadingManager`, `window.FLV` ฯลฯ) ทำงานเหมือนเดิมผ่าน proxy อัตโนมัติ
- **ใช้ FanHoard Design Tokens**: สี/เงา/รัศมี ดึงจาก `tokens.css` ทั้งหมด
- **รองรับ i18n**: รับ `lang` option หรืออ่านจาก `localStorage.selectedLang` อัตโนมัติ
- **Accessibility first**: `role="status"`, `aria-live="polite"`, `prefers-reduced-motion`

---

## 2. ไฟล์และโครงสร้างโมดูล

```
assets/js/loading-system/
├── fvl.js                              # Orchestrator & entry point หลัก (LOAD_PHASES)
├── fvl-spinner.js                      # Standalone Material Spinner Subsystem (zero-dependency)
├── README.md                           # สถาปัตยกรรมและสัญญาบริการ
├── NAMING.md                           # มาตรฐานชื่อ CSS classes / DOM elements
├── MIGRATION.md                        # คู่มือการย้ายจาก v1.0/v2.x
└── fvl-modules/                        # 9 Specialized Sub-Service Modules
    ├── namespace.js                    # window.FVLModules registry
    ├── types.js                        # JSDoc typedefs
    ├── config.js                       # Constants, presets, z-index, timing
    ├── utils.js                        # DOM helpers, options normalization, autoTheme
    ├── state.js                        # Instance registry, group maps, event bus
    ├── renderer.js                     # DOM builders สำหรับ 4 display modes (รองรับ spinnerOnly/bare/chromeless)
    ├── animator.js                     # Double-rAF enter/exit animations
    ├── spinner.js                      # Material spinner variant bridge & progress engine
    └── engine.js                       # Lifecycle orchestrator, targetSlot resolution & handshake

assets/css/
└── loading-system.css                  # Auto-injected stylesheet (มี layer @layer fvl)

assets/js/nav-core-modules/
└── loading.js                          # Thin proxy shim (delegates to FVL)
```

---

## 3. ขั้นตอนการบูตและการโหลด (`LOAD_PHASES`)

`fvl.js` ทำหน้าที่เป็น self-loading orchestrator ที่โหลด submodules 9 ตัวตามลำดับ dependency 4 phases:

```javascript
var LOAD_PHASES = [
  ['namespace.js', 'types.js', 'config.js'],      // Phase 1: Core foundation
  ['utils.js', 'state.js'],                      // Phase 2: Utilities & State
  ['renderer.js', 'animator.js', 'spinner.js'],  // Phase 3: DOM, Animation & Spinner
  ['engine.js']                                  // Phase 4: Lifecycle Engine
];
```

### การทำงานในเบราว์เซอร์
1. `fvl.js` คำนวณ base URL จาก `<script src="...">` ของตัวเอง
2. โหลดสคริปต์ในแต่ละ phase แบบขนาน (parallel within phase)
3. เมื่อ Phase 4 (`engine.js`) โหลดเสร็จ จะทำการ freeze `window.FVL` และส่งสัญญาณ CustomEvent `fvl:ready`

---

## 4. Display Modes & Flexible Options (`spinnerOnly`, `bare`, `chromeless`, `targetSlot`)

FVL รองรับ 4 display modes หลัก พร้อมตัวเลือกการแสดงผลแบบยืดหยุ่นผ่าน options object:

### 4.1 Display Modes

| Display Mode | คำอธิบาย | DOM Structure / CSS Class | Use Case |
| :--- | :--- | :--- | :--- |
| **`fullscreen`** | Overlay เต็มหน้าจอ ยึดตาม viewport | `.fvl.fvl-fullscreen` | โหลดหน้าแรก, เปลี่ยนหน้า SPAหลัก |
| **`scoped`** | Overlay ครอบเฉพาะ container ที่กำหนด | `.fvl.fvl-scoped` + `.fvl-scoped-overlay` | โหลด widget, โหลดเนื้อหาการ์ด, filter |
| **`inline`** | Spinner ขนาดเล็กสำหรับแทรกในเนื้อหาหรือปุ่ม | `.fvl.fvl-inline` | ปุ่มกดส่งข้อมูล, async inline search |
| **`topbar`** | แถบ progress bar บางๆ ด้านบนสุด | `.fvl.fvl-topbar` | โหลดแบบ background, โหลดรูปภาพ |

### 4.2 Flexible Mode Options

สามารถส่ง options ต่อไปนี้ร่วมกับทุก display mode ใน `FVL.show()`, `FVL.scoped()`, `FVL.inline()` หรือ `FVL.topbar()`:

| Option | Type | Default | คำอธิบาย |
| :--- | :--- | :--- | :--- |
| **`spinnerOnly`** | `boolean` | `false` | ซ่อนการสร้างโหนดข้อความ (`fvl-msg`, `fvl-sub`, `fvl-text`) แสดงเฉพาะ spinner และเพิ่ม `aria-label` บน root container เพื่อคง accessibility |
| **`chromeless`** | `boolean` | `false` | ถอดพื้นหลัง overlay backdrop, border, padding และ shadow ออก (เพิ่ม class `.fvl-chromeless`) เหมาะสำหรับการแสดงผลกลมกลืนกับองค์ประกอบอื่น |
| **`bare`** | `boolean` | `false` | Shorthand สอดคล้องกับ `{ spinnerOnly: true, chromeless: true }` (เพิ่ม class `.fvl-bare` และ `.fvl-chromeless`) |
| **`targetSlot`** | `string \| HTMLElement` | `null` | กำหนด sub-selector หรือ DOM element ภายใน container หลักเพื่อเป็นที่วาง spinner โดย container หลักยังคงถูกตั้งค่า `aria-busy="true"` ตาม lifecycle |

---

## 5. Material Spinner Subsystem & Standalone Subsystem (`fvl-spinner.js`)

ระบบ Spinner ของ FVL ประกอบด้วย 2 ส่วน:
1. Material Spinner Variant Engine ใน `fvl-modules/spinner.js` สำหรับใช้งานร่วมกับ FVL Orchestrator
2. Standalone Spinner Subsystem ใน `assets/js/loading-system/fvl-spinner.js` สำหรับใช้งานแบบ zero-dependency

### 5.1 Standalone Subsystem (`fvl-spinner.js`)

`fvl-spinner.js` เป็นไฟล์มอดูลขนาดเล็ก ทำงานอิสระโดยไม่ต้องโหลด `fvl.js` หรือมอดูลย่อยใน `fvl-modules/`

- **Zero-Dependency**: ไม่ขึ้นกับ `fvl.js` หรือ `LOAD_PHASES`
- **Auto CSS Injection**: ตรวจสอบว่ามี `<link href="...loading-system.css">` อยู่หรือไม่ หากไม่มี จะสร้าง `<style id="fvl-spinner-styles">` สำหรับ keyframes `@_fvl_spin` และสไตล์หลักของ spinner อัตโนมัติ
- **Global Export**: ส่งออก `window.FVLSpinner` และสร้างสะพานเชื่อม `window.FVL.spinner` อัตโนมัติ

### 5.2 Variant Sizes & Adjustments
- **Sizes**:
  - Preset string: `'sm'` (18px), `'md'` (32px), `'lg'` (48px), `'xl'` (64px)
  - Custom pixel: ตัวเลข integer (เช่น `size: 24` กำหนด width/height เป็น `24px`)
- **Speed**: `'fast'` (0.4s), `'normal'` (0.7s), `'slow'` (1.2s)
- **Stroke Width**:
  - Preset string: `'thin'` (2px), `'medium'` (3.5px), `'thick'` (5px)
  - Custom pixel: ตัวเลข integer (เช่น `strokeWidth: 4` กำหนด `--fvl-spinner-stroke-width: 4px`)
- **Colors**:
  - `color`: กำหนด CSS `--fvl-spinner-color` สำหรับ arc
  - `trackColor`: กำหนด CSS `--fvl-spinner-track-color` สำหรับ track
- **Determinate / Progress**:
  - `determinate: true` หรือส่ง `progress: 0..100` จะเปลี่ยนเป็นวงกลมแสดงเปอร์เซ็นต์
  - `updateProgress(value)` อัปเดต `strokeDashoffset` และ `aria-valuenow` ทันที

### 5.3 Standalone API & Instance Handle

```javascript
// 1. Static Factory Create
var spinner = FVLSpinner.create({
  size: 'md',
  color: '#009688',
  speed: 'fast',
  strokeWidth: 'medium'
});

// 2. Mount to DOM
spinner.mount('#my-widget');

// 3. Dynamic Controls via Handle
spinner.setSize('lg');
spinner.setColor('#ff9800');
spinner.setSpeed('slow');
spinner.setStrokeWidth(4);
spinner.updateProgress(65);

// 4. Cleanup & Unmount
spinner.unmount(); // ถอดออกจาก DOM
spinner.destroy(); // Unmount และทำลาย handle
```

---

## 6. Public API — `window.FVL` & `window.FVLSpinner`

### 6.1 `window.FVL`

`window.FVL` ถูก freeze เพื่อความปลอดภัย (`Object.freeze`):

```javascript
window.FVL = Object.freeze({
  _initialized: true,
  VERSION: '3.1.0',
  show: function(opts) { ... },             // แสดง overlay/spinner (รองรับ spinnerOnly/bare/chromeless/targetSlot)
  hide: function(id) { ... },               // ซ่อน overlay ตาม ID
  scoped: function(target, opts) { ... },   // แสดง scoped loader บน target
  inline: function(target, opts) { ... },   // แทรก inline loader ใน target
  topbar: function(opts) { ... },           // แสดง top progress bar
  hideAll: function() { ... },              // ซ่อน loader ทั้งหมด
  isShowing: function(id) { ... },          // ตรวจสอบสถานะการแสดงผล
  getActiveCount: function(mode) { ... },   // นับจำนวน loader ที่แสดงอยู่
  on: function(event, handler) { ... },     // ลงทะเบียน event listener
  off: function(event, handler) { ... },    // ยกเลิก event listener
  readinessHandshake: function(o) { ... },  // บูตแฮนด์เชกก่อนโหลดหน้า
  boot: function(opts) { ... },             // เรียกการบูตหลัก
  spinner: FVLSpinner,                     // Standalone/Material Spinner reference
  Spinner: FVLSpinner,                     // Alias compatibility reference
  _internals: { ... }                      // อ้างอิงภายในสำหรับการทดสอบ
});
```

### 6.2 `window.FVLSpinner` Static Methods

- `FVLSpinner.create(opts)`: สร้าง spinner handle object
- `FVLSpinner.mount(target, opts)`: สร้างและ mount spinner ลงใน `target` ทันที
- `FVLSpinner.applyVariant(el, opts)`: ปรับแต่งสไตล์และคลาสของ spinner DOM element
- `FVLSpinner.updateProgress(el, value)`: อัปเดต progress offset บน SVG arc
- `FVLSpinner.renderSVG()`: คืนค่า SVG string ของ spinner

---

## 7. Theme System & Color Tokens

FVL อ่าน theme อัตโนมัติจาก `document.documentElement.getAttribute('data-theme')` หรือ `opts.theme`:
- **Dark Theme** (`data-theme="dark"`): พื้นหลัง overlay แบบเข้ม พร้อมเบลอ backdrop
- **Light Theme** (`data-theme="light"`): พื้นหลัง overlay แบบสว่าง
- **Auto Theme**: เปลี่ยนสไตล์ตามระบบหรือเอกสารอัตโนมัติ

---

## 8. Z-Index Stacking Layers

| Layer Context | Z-Index Value | Purpose |
| :--- | :--- | :--- |
| Fullscreen Overlay | `99999` | ครอบทับทุกองค์ประกอบรวมถึง Popup และ Navigation Bar |
| Scoped Overlay | `100` | ครอบเฉพาะ container ภายใน layout |
| Topbar Loader | `100000` | แสดงบนขอบบนสุดของหน้าจอ |

---

## 9. i18n & Accessibility

- **i18n**: รองรับข้อความหลายภาษา (TH/EN) โดยอ่านจาก `localStorage.selectedLang` หรือ `opts.lang`
- **Accessibility**:
  - `role="status"` และ `aria-live="polite"` สำหรับ screen readers
  - `aria-label` บน root container เมื่ออยู่ในโหมด `spinnerOnly` หรือ `bare`
  - `aria-hidden="true"` สำหรับ SVG spinner
  - `aria-valuenow`, `aria-valuemin`, `aria-valuemax` สำหรับ determinate mode
  - `aria-busy="true"` บน target container
  - ปฏิบัติตาม `prefers-reduced-motion` โดยปิด transition เมื่อผู้ใช้ตั้งค่าให้ลดการเคลื่อนไหว

---

## 10. Backward Compatibility (Full Proxy)

เพื่อความเข้ากันได้ 100% กับโค้ดเดิม Public API ต่อไปนี้ได้รับการดูแลแบบ seamless proxy:
1. `NavCoreModules.LoadingService`: `show()`, `hide()`, `hideInstant()`, `showInContent()`, `readinessHandshake()` สื่อสารตรงไปยัง FVL
2. Global overlays: `window.showInstantLoadingOverlay`, `window.removeInstantLoadingOverlay`
3. Global Aliases: `window.FLV` ถูกลงทะเบียนเป็น alias ของ `window.FVL`
4. Pre-boot Loader: Handshake กับ `#fv-boot-loader` ทำงานราบรื่นโดยไม่เกิดการ flickering

---

## 11. CSS Architecture & Naming Standard

- ไฟล์ CSS หลัก: `assets/css/loading-system.css` (auto-injected โดย `fvl.js`)
- Modifier classes หลัก:
  - `.fvl-bare`: สไตล์ bare presentation
  - `.fvl-chromeless`: ปลด backdrop, border, shadow
  - `.fvl-spinner--sm`, `.md`, `.lg`, `.xl`: ขนาด spinner
  - `.fvl-spinner--speed-fast`, `.speed-normal`, `.speed-slow`: ความเร็วอนิเมชัน
  - `.fvl-spinner--stroke-thin`, `.stroke-medium`, `.stroke-thick`: ความหนาเส้น
- ดูรายละเอียดและ BEM standard ทั้งหมดใน [`assets/js/loading-system/NAMING.md`](../assets/js/loading-system/NAMING.md)

---

## 12. วิธีเพิ่มในหน้าเว็บและตัวอย่างการใช้งาน

### 12.1 การรวมสคริปต์ใน HTML

```html
<!-- กรณีใช้ FVL Orchestrator แบบเต็ม -->
<script defer src="/assets/js/loading-system/fvl.js?v=3.1.0"></script>

<!-- กรณีใช้ Standalone Spinner แบบ zero-dependency -->
<script defer src="/assets/js/loading-system/fvl-spinner.js?v=3.1.0"></script>
```

### 12.2 ตัวอย่างการเรียกใช้งาน

#### Fullscreen Loading (แบบมาตรฐาน)
```javascript
var loaderId = FVL.show({ message: 'กำลังโหลดข้อมูล...' });
setTimeout(function() { FVL.hide(loaderId); }, 1000);
```

#### Spinner-Only Mode (ไม่แสดงข้อความ)
```javascript
FVL.scoped('#card-container', {
  spinnerOnly: true,
  ariaLabel: 'กำลังอัปเดตการ์ด...'
});
```

#### Bare & Chromeless Mode
```javascript
FVL.scoped('#widget', {
  bare: true, // เท่ากับ { spinnerOnly: true, chromeless: true }
  size: 'sm'
});
```

#### TargetSlot Mode (Mount ในปุ่มหรือ slot ย่อย)
```javascript
FVL.scoped('#form-container', {
  targetSlot: '#submit-btn-spinner-slot',
  spinnerOnly: true
});
```

#### Standalone Spinner Usage Example
```javascript
// Direct mount ด้วย FVLSpinner
var handle = FVLSpinner.mount('#profile-avatar-wrapper', {
  size: 'sm',
  color: '#009688',
  speed: 'fast'
});

// เปลี่ยนค่าภายหลัง
handle.setColor('#e91e63');

// Unmount เมื่อเสร็จงาน
handle.destroy();
```

---

## 13. Integration กับระบบอื่น

| ระบบ | วิธีใช้ FVL / FVLSpinner |
| :--- | :--- |
| **Nav-Core LoadingService** | `LoadingService.showInContent()` ส่งพารามิเตอร์เริ่มต้นเป็น `{ bare: true, size: 'md' }` เพื่อ mount bare spinner ลงใน `#content-loading` |
| **Discover Page: Tab Switch & Category Navigation** | `router.navigateTo()` และ `ContentService.clearContent()` mount bare FVL spinner ลงใน `#content-loading` ตั้งค่า `aria-busy="true"` และเริ่ม 10s fallback safety timer (`_fvlSafetyTimer`); unmount และรีเซ็ต `aria-busy="false"` เมื่อ `_appendFeedGroups` โหลดข้อมูลเสร็จ |
| **Discover Page: Feed Refresh** | `ContentService.renderFeed()` เรียก `clearContent()` mount bare FVL spinner แบบซิงโครนัส พร้อมระบบป้องกันการสร้าง spinner ซ้ำ (`!ctr.querySelector('.fvl-spinner')`); unmount เมื่อ feed batch แรกเรนเดอร์สำเร็จ |
| **Discover Page: Infinite Scroll Pagination** | IntersectionObserver บน sentinel (`#nc-feed-sentinel` / `#nc-lazy-sentinel`) mount standalone small spinner `FVLSpinner.mount(sentinel, { size: 'sm', speed: 'fast' })` พร้อม `aria-busy="true"` และถูกทำลายเสมอใน `finally` block (`spinnerHandle.destroy()`) |
| **Search System: Document Loading & URE Waiting** | `SearchController.doSearch()` (ขณะรอเอกสาร `!docsReady`) และ `RenderingService.renderResults()` (ขณะรอ `window.URE`) mount bare FVL spinner ลงใน `#searchResults` ตั้งค่า `aria-busy="true"`; รีเซ็ต `aria-busy="false"` และเคลียร์ spinner เมื่อเรนเดอร์ผลลัพธ์หรือ empty state |
| **Standalone Components** | เรียกใช้ `FVLSpinner.mount(target, opts)` ตรงโดยไม่ต้องผ่าน `fvl.js` |

---

## 14. Version History

| เวอร์ชัน | การเปลี่ยนแปลง |
| :--- | :--- |
| **v1.0.0** | เปิดตัว — 4 modes (fullscreen/scoped/inline/topbar), full backward-compat กับ Nav-Core LoadingService |
| **v3.0.8** | Structural Refactor — ปรับปรุงเป็น modular architecture (`fvl.js` orchestrator + `fvl-modules/` 9 submodules), โหลดผ่าน 4 `LOAD_PHASES`, และเพิ่ม Material Spinner Variant Subsystem (opt-in) |
| **v3.1.0** | Flexible Spinner & Standalone Subsystem — เพิ่ม standalone `fvl-spinner.js` (zero-dependency, auto CSS injection, instance handle), เพิ่ม options `spinnerOnly`, `bare`, `chromeless`, `targetSlot` ครอบคลุมทั้ง 4 display modes และเพิ่ม unit test contracts |
| **v3.1.1** | Discover Page Spinner Integration — เชื่อมต่อ flexible FVL bare spinner และ standalone `FVLSpinner` ครอบคลุม 4 content transition points บน Discover Page (tab switch, feed refresh, infinite scroll, และ search pending/URE rendering) พร้อม double-spinner protection, 10s safety fallback timer, `aria-busy` toggles, และ integration test suite (`tests/discover-loading-integration.test.ts`) |

---

## 15. อ้างอิงข้ามเอกสาร

- [`README.md`](../assets/js/loading-system/README.md) — เอกสารสถาปัตยกรรมและสัญญาบริการ
- [`NAMING.md`](../assets/js/loading-system/NAMING.md) — มาตรฐานชื่อ CSS classes และ DOM elements
- [`MIGRATION.md`](../assets/js/loading-system/MIGRATION.md) — คู่มือการย้ายระบบและ adopt คุณสมบัติใหม่
- [`15-Loading-Contract-And-Test-Plan.md`](./15-Loading-Contract-And-Test-Plan.md) — สัญญาและแผนการทดสอบ FVL Subsystem
- [`00-System-Architecture.md`](./00-System-Architecture.md) — ภาพรวมสถาปัตยกรรมทั้งโปรเจกต์
