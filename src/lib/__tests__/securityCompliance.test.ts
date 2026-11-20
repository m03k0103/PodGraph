import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(process.cwd());

interface SecurityHeadersConfig {
  metaCsp: string;
  headers: Record<string, string>;
}

function loadConfig(): SecurityHeadersConfig {
  return JSON.parse(
    readFileSync(resolve(ROOT, 'scripts/security-headers.json'), 'utf-8')
  ) as SecurityHeadersConfig;
}

describe('Security hardening & OWASP ZAP Track C compliance', () => {
  it('defines all required HTTP security headers in scripts/security-headers.json', () => {
    const { headers } = loadConfig();
    expect(headers['Content-Security-Policy']).toBeTruthy();
    expect(headers['X-Frame-Options']).toBe('DENY');
    expect(headers['X-Content-Type-Options']).toBe('nosniff');
    expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
    expect(headers['Permissions-Policy']).toContain('camera=()');
    expect(headers['Cross-Origin-Opener-Policy']).toBe('same-origin');
    expect(headers['Cross-Origin-Embedder-Policy']).toBe('credentialless');
    expect(headers['Cross-Origin-Resource-Policy']).toBe('same-origin');
    expect(headers['Cache-Control']).toContain('no-store');
  });

  it('enforces strict script-src/style-src self without unsafe-inline/unsafe-eval or hashes, and omits frame-ancestors from metaCsp', () => {
    const { metaCsp, headers } = loadConfig();
    const httpCsp = headers['Content-Security-Policy'];

    for (const csp of [metaCsp, httpCsp]) {
      expect(csp).not.toContain("'unsafe-inline'");
      expect(csp).not.toContain("'unsafe-eval'");
      expect(csp).not.toContain("'sha256-");
      expect(csp).toContain("script-src 'self'");
      expect(csp).toContain("style-src 'self'");
      expect(csp).toContain("object-src 'none'");
      expect(csp).toContain("base-uri 'self'");
      expect(csp).toContain("form-action 'none'");
      expect(csp).toContain("img-src 'self' data: https:");
    }

    expect(httpCsp).toContain("frame-ancestors 'none'");
    expect(metaCsp).not.toContain('frame-ancestors');
  });

  it('externalizes float-tooltip and force-graph CSS in src/index.css and strips runtime styleInject in vite.config.ts', () => {
    const css = readFileSync(resolve(ROOT, 'src/index.css'), 'utf-8');
    const viteConfig = readFileSync(resolve(ROOT, 'vite.config.ts'), 'utf-8');

    expect(css).toContain('.float-tooltip-kap');
    expect(css).toContain('.force-graph-container canvas');
    expect(viteConfig).toContain('stripThirdPartyStyleInject');
    expect(viteConfig).toContain('injectProductionCsp');
  });

  it('wires hardened serve_dist.py into start.bat and zap-dast workflow', () => {
    const serveDist = readFileSync(resolve(ROOT, 'scripts/serve_dist.py'), 'utf-8');
    const startBat = readFileSync(resolve(ROOT, 'start.bat'), 'utf-8');
    const workflow = readFileSync(
      resolve(ROOT, '.github/workflows/zap-dast.yml'),
      'utf-8'
    );

    expect(serveDist).toContain('security-headers.json');
    expect(serveDist).toContain('keyword.lower() == "server"');
    expect(serveDist).toContain('def list_directory');
    expect(startBat).toContain('serve_dist.py');
    expect(workflow).toContain('python3 scripts/serve_dist.py');
  });

  it('keeps active rules in .zap/rules.tsv strictly tab-separated', () => {
    const tsv = readFileSync(resolve(ROOT, '.zap/rules.tsv'), 'utf-8');
    for (const rawLine of tsv.split(/\r?\n/)) {
      const trimmed = rawLine.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const parts = rawLine.split('\t');
      expect(parts.length).toBeGreaterThanOrEqual(2);
      expect(['IGNORE', 'WARN', 'FAIL', 'OUTOFSCOPE']).toContain(parts[1].trim());
    }
  });
});
