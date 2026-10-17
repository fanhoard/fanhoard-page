// scripts/update-version.js — FanHoard Release Build Tool (cache-busting)
//
// หน้าที่ของไฟล์นี้: สร้าง Build ID และ cache-busting เท่านั้น
//   - STEP 1   ล้างไฟล์ legacy
//   - STEP 7   HTML cache busting (?v=)
//   - STEP 7.5 Dynamic loader + ES module cache busting (FV_BUILD_ID)
//
// ประวัติรุ่น (Ledger, Manifest, version.json, Released At) ไม่ได้อยู่ที่นี่อีกแล้ว
//   -> scripts/build-ledger.js (เรียกก่อน build ทุกสาขา ดู docs/adr/0001-release-ledger.md)
//
// Build ID เป็นค่า cache ไม่ใช่เวลาปล่อยรุ่น (Released At) อย่าสับสนสองอย่างนี้

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const NOW = new Date();
const LANGS = ['en', 'th'];                     // ภาษาที่รองรับ

const CONFIG = {
  perLangCurrent:   'assets/md/{lang}/current.md',
  perLangReleasesDir: 'assets/md/{lang}/releases',          // v6.1: releases/ folder ของแต่ละภาษา
  perLangIndex:     'assets/md/{lang}/releases/index.json', // v6.1: index.json ใน releases/
  perLangVersionMd: 'assets/md/{lang}/releases/v{version}.md', // v6.1: history files
  versionFile:      'assets/json/version.json',        // backward compat (new.js poll)
  excludeDirs:      new Set(['node_modules','.git','scripts','.cloudflare','dist','build']),
  htmlExts:         new Set(['.html','.htm']),
  assetPattern:     /((?:src|href)=["'][^"':]*?\.(?:js|css|json))\?v=[^"'\s&]*/g
};

function cleanupLegacy() {
  // v6.1: ลบไฟล์ legacy ที่ไม่ใช้แล้ว
  var legacyPaths = [
    'assets/json/release-dates.json',     // v6.0: ลบ — date อยู่ใน MD แล้ว
    'assets/md/releases/index.json',      // legacy root-level releases (เดิม)
    'assets/md/releases',                  // legacy root-level releases folder
  ];

  for (var i = 0; i < legacyPaths.length; i++) {
    var p = path.join(ROOT, legacyPaths[i]);
    if (fs.existsSync(p)) {
      try {
        if (fs.statSync(p).isDirectory()) {
          fs.rmSync(p, { recursive: true, force: true });
        } else {
          fs.unlinkSync(p);
        }
        console.log('🗑️  ลบ legacy: ' + legacyPaths[i]);
      } catch (e) {
        console.warn('⚠️  ไม่สามารถลบ ' + legacyPaths[i] + ': ' + e.message);
      }
    }
  }

  // v6.1: ย้ายไฟล์จาก v6.0 structure (lang/v*.md, lang/index.json) ไป lang/releases/
  for (var j = 0; j < LANGS.length; j++) {
    var lang = LANGS[j];
    var langDir = path.join(ROOT, 'assets/md/' + lang);
    var releasesDir = path.join(ROOT, 'assets/md/' + lang + '/releases');

    if (!fs.existsSync(langDir)) continue;
    fs.mkdirSync(releasesDir, { recursive: true });

    // ย้าย v*.md จาก langDir ไป releasesDir (v6.1: รองรับทั้ง v1.0.0 และ v.1.0.0)
    var langFiles = fs.readdirSync(langDir).filter(function(f) {
      return /^v\.?\d/.test(f) && f.endsWith('.md');
    });
    for (var k = 0; k < langFiles.length; k++) {
      var oldPath = path.join(langDir, langFiles[k]);
      var newPath = path.join(releasesDir, langFiles[k]);
      if (!fs.existsSync(newPath)) {
        fs.copyFileSync(oldPath, newPath);
        console.log('📦  ย้าย: ' + lang + '/' + langFiles[k] + ' → ' + lang + '/releases/' + langFiles[k]);
      }
      // ลบไฟล์เก่าจาก langDir
      try { fs.unlinkSync(oldPath); } catch (_) {}
    }

    // ย้าย index.json จาก langDir ไป releasesDir (ถ้ามี แต่เราจะ regenerate อยู่แล้ว)
    var oldIndex = path.join(langDir, 'index.json');
    if (fs.existsSync(oldIndex)) {
      try { fs.unlinkSync(oldIndex); } catch (_) {}
    }
  }
}

function htmlCacheBust(buildId) {
  var scanned = 0, updated = 0;
  function walk(dir) {
    var entries; try { entries = fs.readdirSync(dir, {withFileTypes:true}); } catch(_) { return; }
    for (var e of entries) {
      if (e.name.startsWith('.') || CONFIG.excludeDirs.has(e.name)) continue;
      var full = path.join(dir, e.name);
      if (e.isDirectory()) { walk(full); continue; }
      if (!CONFIG.htmlExts.has(path.extname(e.name).toLowerCase())) continue;
      scanned++;
      var orig = fs.readFileSync(full, 'utf8');
      var next = orig.replace(CONFIG.assetPattern, '$1?v='+buildId);
      if (next !== orig) { fs.writeFileSync(full, next, 'utf8'); updated++; console.log('  ✅  '+path.relative(ROOT,full)); }
    }
  }
  console.log('\nScanning HTML...'); walk(ROOT);
  return { scanned: scanned, updated: updated };
}

function dynamicLoaderCacheBust(buildId) {
  var updated = 0;
  var scanned = 0;

  // ── Phase 1: แทนที่ FV_BUILD_ID ใน dynamic loaders ──────────────────────
  console.log('\n  Phase 1: Injecting FV_BUILD_ID into dynamic loaders...');
  for (var i = 0; i < DYNAMIC_LOADERS.length; i++) {
    var relPath = DYNAMIC_LOADERS[i];
    var fullPath = path.join(ROOT, relPath);
    if (!fs.existsSync(fullPath)) {
      console.log('  ⚠️  ' + relPath + ' — file not found, skip');
      continue;
    }
    scanned++;
    var orig = fs.readFileSync(fullPath, 'utf8');
    var next = orig.replace(FV_BUILD_ID_PATTERN, "$1'" + buildId + "'");
    if (next !== orig) {
      fs.writeFileSync(fullPath, next, 'utf8');
      updated++;
      console.log('  ✅  ' + relPath + ' — FV_BUILD_ID = ' + buildId);
    } else {
      console.log('  ⚠️  ' + relPath + ' — FV_BUILD_ID pattern not found');
    }
  }

  // ── Phase 2: แทนที่ ES module import paths ──────────────────────────────
  console.log('\n  Phase 2: Cache-busting ES module import paths...');
  for (var j = 0; j < ES_MODULE_FILES.length; j++) {
    var esRelPath = ES_MODULE_FILES[j];
    var esFullPath = path.join(ROOT, esRelPath);
    if (!fs.existsSync(esFullPath)) {
      console.log('  ⚠️  ' + esRelPath + ' — file not found, skip');
      continue;
    }
    scanned++;
    var esOrig = fs.readFileSync(esFullPath, 'utf8');
    var esNext = esOrig.replace(ES_IMPORT_PATTERN, function(match, prefix, importPath, oldVersion, quote) {
      // ข้าม CDN URLs (http://, https://)
      if (/^https?:\/\//.test(importPath)) return match;
      // ถ้าไม่ใช่ relative import (./ หรือ ../) ก็ข้าม — อาจเป็น bare specifier
      if (!importPath.startsWith('./') && !importPath.startsWith('../')) return match;
      // แทนที่ด้วย importPath?v=<buildId> (เขียนทับ oldVersion ถ้ามี)
      return prefix + importPath + '?v=' + buildId + quote;
    });
    if (esNext !== esOrig) {
      fs.writeFileSync(esFullPath, esNext, 'utf8');
      updated++;
      console.log('  ✅  ' + esRelPath + ' — ES imports cache-busted');
    } else {
      console.log('  ⏭️  ' + esRelPath + ' — no ES imports to update');
    }
  }

  return { scanned: scanned, updated: updated };
}


var DYNAMIC_LOADERS = [
  'assets/js/nav-core.js',
  'assets/js/ure/ure.js',
  'assets/js/popup.js',
  'assets/js/search-system/search.js',
  'assets/js/loading-system/fvl.js',
  'assets/js/language.js',
  'assets/js/nav-core-modules/loading.js',
];

// รายชื่อไฟล์ที่มี ES module imports ที่ต้อง cache-bust:
var ES_MODULE_FILES = [
  'assets/js/con-data-service/con-data-service.js',
];

// Regex สำหรับจับ FV_BUILD_ID = '...' หรือ FV_BUILD_ID = "..."
//   จับทั้งกรณีที่มีค่าเดิม (เช่น build ครั้งก่อน) และกรณีที่เป็น '' (source)
var FV_BUILD_ID_PATTERN = /(FV_BUILD_ID\s*=\s*)['"][^'"]*['"]/;

// Regex สำหรับจับ ES module import path ที่ลงท้ายด้วย .js (มีหรือไม่มี ?v= ก็ได้)
//   จับทั้ง relative imports (./foo.js, ../bar.js) และ absolute (/assets/.../foo.js)
//   ไม่จับ CDN URLs (https://...) เพราะไม่ใช่ internal assets
var ES_IMPORT_PATTERN = /(from\s+['"])([^'"]+\.js)(\?v=[^'"]*)?(['"])/g;

// ── Main ──────────────────────────────────────────────────────────────────────
var newVersion = readVersionFromDraft();
var dateStr = NOW.toISOString().slice(0, 10).replace(/-/g, '');
var timeStr = pad2(NOW.getUTCHours()) + pad2(NOW.getUTCMinutes());
var buildId = newVersion + '-' + dateStr + timeStr;

function pad2(n) { return String(n).padStart(2, '0'); }

function readVersionFromDraft() {
  for (const lang of LANGS) {
    const fp = path.join(ROOT, CONFIG.perLangCurrent.replace('{lang}', lang));
    if (!fs.existsSync(fp)) continue;
    const m = fs.readFileSync(fp, 'utf8').match(/^version:\s*(.+)$/m);
    if (m) return m[1].trim();
  }
  return '0.0.0';
}

console.log('\n📦  FanHoard Release Build Tool (cache-busting only — v7)');
console.log('    Version:  ' + newVersion);
console.log('    Build ID: ' + buildId);
console.log('    Date:     ' + NOW.toISOString());
console.log('');

console.log('🧹  STEP 1: Cleanup legacy files...');
cleanupLegacy();
console.log('');

console.log('🌐  STEP 7: HTML cache busting...');
var htmlResult = htmlCacheBust(buildId);
console.log('');

console.log('🔌  STEP 7.5: Dynamic loader cache busting...');
var loaderResult = dynamicLoaderCacheBust(buildId);
console.log('');

console.log('\n' + '─'.repeat(56));
console.log('  Version:  ' + newVersion);
console.log('  Build ID: ' + buildId);
console.log('  HTML:     ' + htmlResult.updated + '/' + htmlResult.scanned + ' updated');
console.log('  Loaders:  ' + loaderResult.updated + '/' + loaderResult.scanned + ' updated (dynamic + ES imports)');
console.log('─'.repeat(56) + '\n🚀  Ready!\n');
