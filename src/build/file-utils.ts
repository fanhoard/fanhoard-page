/**
 * file-utils.ts
 * File discovery and I/O helpers for the build system.
 */

import fs from 'fs';
import path from 'path';

/**
 * Recursively find all .html files under `dir`, excluding specified folders.
 */
export function findHtmlFiles(
  dir: string,
  exclude: string[] = [],
  files: string[] = [],
  rootDir: string | null = null
): string[] {
  if (rootDir === null) rootDir = dir;

  let entries: string[];
  try {
    entries = fs.readdirSync(dir);
  } catch {
    return files;
  }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    const relFromRoot = path.relative(rootDir, fullPath).replace(/\\/g, '/');

    const isExcluded = exclude.some((ex) => {
      if (!ex) return false;
      if (relFromRoot === ex) return true;
      if (relFromRoot.startsWith(ex + '/')) return true;
      return false;
    });
    if (isExcluded) continue;
    if (entry.startsWith('.')) continue;

    let stat: fs.Stats;
    try {
      stat = fs.statSync(fullPath);
    } catch {
      continue;
    }

    if (stat.isDirectory()) {
      findHtmlFiles(fullPath, exclude, files, rootDir);
    } else if (entry.endsWith('.html')) {
      files.push(fullPath.replace(/\\/g, '/'));
    }
  }

  return files;
}

/**
 * Recursively copy a directory tree.
 * Skips hidden directories that start with '.' (e.g. .well-known, .github).
 */
export function copyDir(src: string, dest: string): void {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });

  for (const entry of fs.readdirSync(src)) {
    if (entry.startsWith('.')) continue;

    const srcPath = path.join(src, entry);
    const destPath = path.join(dest, entry);
    const stat = fs.statSync(srcPath);

    if (stat.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Ensure a directory exists (create if needed).
 */
export function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

/**
 * Write a file, creating parent directories as needed.
 */
export function writeFile(filePath: string, content: string): void {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, 'utf8');
}

/**
 * Load and flatten a translation JSON file.
 * Returns null if the file doesn't exist.
 */
export function loadTranslationFile(
  filePath: string,
  flattenFn: (json: Record<string, unknown>) => Record<string, string>
): Record<string, string> | null {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  try {
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return flattenFn(raw);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[build] ✗ Error parsing ${filePath}:`, msg);
    return {};
  }
}

/**
 * Load db.json (language config).
 */
export function loadDbJson(filePath: string): Record<string, any> | null {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[build] ✗ Error parsing db.json:', msg);
    return null;
  }
}
