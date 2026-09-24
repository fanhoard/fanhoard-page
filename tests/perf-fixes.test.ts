import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('PF-05: Dead Asset References & Boot 404 Elimination', () => {
  it('does not contain references to dead legacy JSON or wave-setting assets in version-core.js and modern-navigation.js', () => {
    const versionCorePath = path.join(__dirname, '../assets/js/version-core.js');
    const modernNavPath = path.join(__dirname, '../assets/js/modern-navigation.js');

    const versionCore = fs.readFileSync(versionCorePath, 'utf8');
    const modernNav = fs.readFileSync(modernNavPath, 'utf8');

    expect(versionCore).not.toContain('/assets/json/whats-new.json');
    expect(versionCore).not.toContain('/assets/md/current.md');
    expect(modernNav).not.toContain('wave-effect.js');
  });

  it('uses absolute leading slash for lang-proxy script in home/index.html', () => {
    const homeHtmlPath = path.join(__dirname, '../home/index.html');
    const homeHtml = fs.readFileSync(homeHtmlPath, 'utf8');

    expect(homeHtml).toContain('src="/assets/js/lang-proxy.js');
    expect(homeHtml).not.toContain('src="assets/js/lang-proxy.js');
  });
});
