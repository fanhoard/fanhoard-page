# 07 — Loading System (FVL — FanHoardVerse Loader)

> เอกสารนี้อธิบายระบบ **FVL (FanHoardVerse Loader)** ของ FanHoard — ระบบ loading ส่วนกลางที่แยกออกมาจาก Nav-Core เดิม ออกแบบมาเพื่อให้ทุก loading indicator ทั่วทั้งเว็บมีคุณภาพระดับเดียวกันและยืดหยุ่นพอที่จะแสดงได้ในทุกบริบท — ตั้งแต่ overlay เต็มหน้าจอ ไปจนถึง spinner เล็ก ๆ ในปุ่ม
>
> **สำหรับ:** AI และนักพัฒนาที่จะแก้ FVL หรือเรียกใช้ loading indicator ในโค้ดใหม่
>
> **ไฟล์หลัก (v3.0.8):** `assets/js/loading-system/fvl.js` (orchestrator หลัก ที่โหลด sub-modules ผ่าน `LOAD_PHASES`) + `assets/js/loading-system/fvl-modules/` (9 sub-modules) + `assets/css/loading-system.css` (auto-injected)
>
> **Namespace:** `window.FVL` (public API, frozen) + `window.FVLModules` (internal registry)
>
> **เวอร์ชัน:** v3.0.8

---

## สารบัญ

1. [Overview](#1-overview)
2. [ไฟล์และโครงสร้างโมดูล](#2-ไฟล์และโครงสร้างโมดูล)
3. [ขั้นตอนการบูตและการโหลด (LOAD_PHASES)](#3-ขั้นตอนการบูตและการโหลด-load_phases)
4. [Display Modes (4 แบบ)](#4-display-modes-4-แบบ)
5. [Material Spinner Variant Subsystem (Opt-In API)](#5-material-spinner-variant-subsystem-opt-in-api)
6. [Public API — `window.FVL`](#6-public-api--windowfvl)
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

FVL (FanHoardVerse Loader) คือระบบ loading ส่วนกลางของ FanHoard ที่แยกออกมาจาก Nav-Core เดิม ออกแบบมาเพื่อให้ **ทุก loading indicator ทั่วทั้งเว็บมีคุณภาพระดับเดียวกัน** และยืดหยุ่นพอที่จะแสดงได้ในทุกบริบท — ตั้งแต่ overlay เต็มหน้าจอ ไปจนถึง spinner เล็กๆ ในปุ่ม

### หลักการออกแบบ

- **Lightweight & Modular**: Entry point หลัก (`fvl.js`) โหลด submodules ใน `fvl-modules/` แบบ phased parallel, zero external dependencies, ทำงานลื่นไหลบนอุปกรณ์สเปคต่ำ→สูง
- **4 display modes**: `fullscreen` / `scoped` / `inline` / `topbar` — ใช้ API เดียว (`FVL.show()`)
- **Material Spinner Variant Subsystem**: รองรับ opt-in sizes (`sm`/`md`/`lg`/`xl`), determinate/indeterminate mode, progress updates, และ color tokens ผ่าน CSS custom properties โดยที่ **default rendered DOM/UX บนหน้าปัจจุบันทั้งหมดคงเดิม 100% (byte-identical)**
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
├── README.md                           # สถาปัตยกรรมและสัญญาบริการ
├── NAMING.md                           # มาตรฐานชื่อ CSS classes / DOM elements
├── MIGRATION.md                        # คู่มือการย้ายจาก v1.0/v2.x
└── fvl-modules/                        # 9 Specialized Sub-Service Modules
    ├── namespace.js                    # window.FVLModules registry
    ├── types.js                        # JSDoc typedefs
    ├── config.js                       # Constants, presets, z-index, timing
    ├── utils.js                        # DOM helpers, options normalization, autoTheme
    ├── state.js                        # Instance registry, group maps, event bus
    ├── renderer.js                     # DOM builders สำหรับ 4 display modes
    ├── animator.js                     # Double-rAF enter/exit animations
    ├── spinner.js                      # Material spinner variant & progress engine
    └── engine.js                       # Lifecycle orchestrator, scroll lock & handshake

assets/css/
└── loading-system.css                  # Auto-injected stylesheet

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
3. เมื่อ Phase 4 (`engine.js`) โหลดเสร็จ จะทำการ freeze `window.FVL` และส่งส่งสัญญาณ CustomEvent `fvl:ready`

### การทำงานใน Node.js / JSDOM Test Environment
ในสภาพแวดล้อมการทดสอบ (Node.js/Vitest) `fvl.js` จะทำการโหลดและประเมินผลไฟล์ใน `fvl-modules/` แบบ synchronous เพื่อให้การทดสอบทำงานได้อย่างแม่นยำและไม่ติด network async race.

---

## 4. Display Modes (4 แบบ)

| Display Mode | คำอธิบาย | DOM Structure / CSS Class | Use Case |
| :--- | :--- | :--- | :--- |
| **`fullscreen`** | Overlay เต็มหน้าจอ ยึดตาม viewport | `.fvl.fvl-fullscreen` | โหลดหน้าแรก, เปลี่ยนหน้า SPAหลัก |
| **`scoped`** | Overlay ครอบเฉพาะ container ที่กำหนด | `.fvl.fvl-scoped` + `.fvl-scoped-overlay` | โหลด widget, โหลดเนื้อหาการ์ด, filter |
| **`inline`** | Spinner ขนาดเล็กสำหรับแทรกในเนื้อหาหรือปุ่ม | `.fvl.fvl-inline` | ปุ่มกดส่งข้อมูล, async inline search |
| **`topbar`** | แถบ progress bar บางๆ ด้านบนสุด | `.fvl.fvl-topbar` | โหลดแบบ background, โหลดรูปภาพ |

---

## 5. Material Spinner Variant Subsystem (Opt-In API)

โมดูล `fvl-modules/spinner.js` เป็นระบบ spinner ย่อยสไตล์ Material Design ที่ปรับแต่งได้ตามความต้องการ โดยไม่กระทบโครงสร้าง DOM หรือ UX เดิมของหน้าเว็บปัจจุบัน

### 5.1 Variant Sizes
- **`sm`**: 16px × 16px (`.fvl-spinner--sm`)
- **`md`**: 24px × 24px (`.fvl-spinner--md`)
- **`lg`**: 40px × 40px (`.fvl-spinner--lg`)
- **`xl`**: 64px × 64px (`.fvl-spinner--xl`)
- **Custom Pixel Size**: ส่งตัวเลข (เช่น `size: 32`) เพื่อกำหนด width/height เป็น pixel โดยตรง

### 5.2 Determinate vs Indeterminate Modes
- **Indeterminate** (default): หมุนวนต่อเนื่องแบบ CSS keyframe animation (`@_fvl_spin`)
- **Determinate**: กำหนด `determinate: true` และ `progress: 0..100` ตัว spinner จะสลับเป็น mode กำหนดความก้าวหน้า และปรับ `strokeDashoffset` ตามเปอร์เซ็นต์
- **`updateProgress(percent)`**: API อัปเดตเปอร์เซ็นต์บน spinner instance ได้ทันที

### 5.3 Color Tokens & Customization
- `--fvl-spinner-color`: กำหนดสีของเส้นวงกลม arc
- `--fvl-spinner-track-color`: กำหนดสีของเส้นวงกลม track พื้นหลัง

### 5.4 Standalone Factory API

```javascript
// สร้าง standalone spinner object
var spinner = FVL.Spinner.create({
  size: 'md',
  determinate: true,
  progress: 50,
  color: 'var(--fv-color-primary)'
});

// เพิ่มลงใน DOM
document.querySelector('#my-container').appendChild(spinner.element);

// อัปเดตความก้าวหน้า
spinner.updateProgress(75);

// ทำลายเมื่อใช้งานเสร็จ
spinner.destroy();
```

---

## 6. Public API — `window.FVL`

`window.FVL` ถูก freeze เพื่อความปลอดภัย (`Object.freeze`) โดยมี API หลักดังนี้:

```javascript
window.FVL = Object.freeze({
  _initialized: true,
  VERSION: '3.0.8',
  show: function(opts) { ... },             // แสดง overlay/spinner
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
  Spinner: Spinner,                        // Material spinner variant API
  _internals: { ... }                      // อ้างอิงภายในสำหรับการทดสอบ
});
```

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
  - `aria-hidden="true"` สำหรับ SVG spinner
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
- ใช้ prefix `.fvl-` สำหรับทุก class
- ดูรายละเอียดและ BEM standard ทั้งหมดใน [`assets/js/loading-system/NAMING.md`](../assets/js/loading-system/NAMING.md)

---

## 12. วิธีเพิ่มในหน้าเว็บและตัวอย่างการใช้งาน

### 12.1 การรวมสคริปต์ใน HTML
```html
<script defer src="/assets/js/loading-system/fvl.js?v=3.0.8"></script>
```

### 12.2 ตัวอย่างการเรียกใช้งาน
```javascript
// Fullscreen Loading Overlay
var loaderId = FVL.show({ message: 'กำลังโหลดข้อมูล...' });

// Hide after async task
setTimeout(function() {
  FVL.hide(loaderId);
}, 1000);

// Scoped Overlay
FVL.scoped('#card-container', { message: 'Updating...' });
```

---

## 13. Integration กับระบบอื่น

| ระบบ | วิธีใช้ FVL |
| :--- | :--- |
| **Nav-Core** | ผ่าน `LoadingService` proxy |
| **Discover Page** | `LoadingService.show()` → `FVL.fullscreen()` |
| **Router Transitions** | `LoadingService.show()` / `.hide()` |
| **Search System** | `FVL.scoped({ target: '#search-results' })` |

---

## 14. Version History

| เวอร์ชัน | การเปลี่ยนแปลง |
| :--- | :--- |
| **v1.0.0** | เปิดตัว — 4 modes (fullscreen/scoped/inline/topbar), full backward-compat กับ Nav-Core LoadingService |
| **v3.0.8** | Structural Refactor — ปรับปรุงเป็น modular architecture (`fvl.js` orchestrator + `fvl-modules/` 9 submodules), โหลดผ่าน 4 `LOAD_PHASES`, และเพิ่ม Material Spinner Variant Subsystem (opt-in) |

---

## 15. อ้างอิงข้ามเอกสาร

- [`README.md`](../assets/js/loading-system/README.md) — เอกสารสถาปัตยกรรมและสัญญาบริการ
- [`NAMING.md`](../assets/js/loading-system/NAMING.md) — มาตรฐานชื่อ CSS classes และ DOM elements
- [`MIGRATION.md`](../assets/js/loading-system/MIGRATION.md) — คู่มือการย้ายระบบและ adopt คุณสมบัติใหม่
- [`00-System-Architecture.md`](./00-System-Architecture.md) — ภาพรวมสถาปัตยกรรมทั้งโปรเจกต์
- [`03-Navigation-And-Content.md`](./03-Navigation-And-Content.md) — Nav-Core integration
