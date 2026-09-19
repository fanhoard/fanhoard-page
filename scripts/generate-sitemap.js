#!/usr/bin/env node
'use strict';

/**
 * scripts/generate-sitemap.js - Compatibility wrapper
 * Delegates to TypeScript sitemap generator in src/build/sitemap.ts
 */

const { spawnSync } = require('child_process');
const path = require('path');

const sitemapScript = path.resolve(__dirname, '../src/build/sitemap.ts');

const result = spawnSync('npx', ['tsx', sitemapScript], {
  stdio: 'inherit',
  env: process.env,
});

process.exit(result.status ?? 0);
