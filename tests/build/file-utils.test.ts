import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  findHtmlFiles,
  copyDir,
  ensureDir,
  writeFile,
  loadTranslationFile,
  loadDbJson
} from '../../src/build/file-utils';

describe('file-utils', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fanhoard-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('ensureDir and writeFile create directory and file recursively', () => {
    const file = path.join(tmpDir, 'sub', 'nested', 'test.txt');
    writeFile(file, 'hello world');
    expect(fs.existsSync(file)).toBe(true);
    expect(fs.readFileSync(file, 'utf8')).toBe('hello world');
  });

  it('findHtmlFiles lists all html files excluding ignored directories', () => {
    writeFile(path.join(tmpDir, 'index.html'), '<html></html>');
    writeFile(path.join(tmpDir, 'sub', 'page.html'), '<html></html>');
    writeFile(path.join(tmpDir, 'sub', 'test.txt'), 'not html');
    writeFile(path.join(tmpDir, 'ignored', 'skip.html'), '<html></html>');

    const htmls = findHtmlFiles(tmpDir, ['ignored']);
    expect(htmls).toHaveLength(2);
    expect(htmls.some(f => f.endsWith('index.html'))).toBe(true);
    expect(htmls.some(f => f.endsWith('page.html'))).toBe(true);
  });

  it('copyDir copies directory contents skipping hidden entries', () => {
    writeFile(path.join(tmpDir, 'src', 'file.txt'), 'content');
    writeFile(path.join(tmpDir, 'src', '.hidden'), 'secret');
    writeFile(path.join(tmpDir, 'src', 'sub', 'subfile.txt'), 'subcontent');

    const destDir = path.join(tmpDir, 'dest');
    copyDir(path.join(tmpDir, 'src'), destDir);

    expect(fs.existsSync(path.join(destDir, 'file.txt'))).toBe(true);
    expect(fs.existsSync(path.join(destDir, 'sub', 'subfile.txt'))).toBe(true);
    expect(fs.existsSync(path.join(destDir, '.hidden'))).toBe(false);
  });

  it('loadTranslationFile loads and flattens json file or returns null if missing', () => {
    const jsonPath = path.join(tmpDir, 'en.json');
    writeFile(jsonPath, JSON.stringify({ key: 'value', nested: { sub: 'subval' } }));

    const dummyFlatten = (j: Record<string, unknown>) => ({ key: String(j.key) });
    const loaded = loadTranslationFile(jsonPath, dummyFlatten);
    expect(loaded).toEqual({ key: 'value' });

    expect(loadTranslationFile(path.join(tmpDir, 'missing.json'), dummyFlatten)).toBeNull();
  });

  it('loadDbJson reads db.json or returns null if missing', () => {
    const dbPath = path.join(tmpDir, 'db.json');
    writeFile(dbPath, JSON.stringify({ default_language: 'en' }));

    expect(loadDbJson(dbPath)).toEqual({ default_language: 'en' });
    expect(loadDbJson(path.join(tmpDir, 'missing.json'))).toBeNull();
  });
});
