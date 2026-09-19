#!/usr/bin/env node
'use strict';

/**
 * scripts/build.js - Compatibility wrapper
 * Delegates to TypeScript SSG pipeline in src/build/ssg.ts
 */

const { spawnSync } = require('child_process');
const path = require('path');

const ssgScript = path.resolve(__dirname, '../src/build/ssg.ts');
const args = process.argv.slice(2);

const result = spawnSync('npx', ['tsx', ssgScript, ...args], {
  stdio: 'inherit',
  env: process.env,
});

process.exit(result.status ?? 0);
