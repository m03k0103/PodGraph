import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

interface SecurityHeadersConfig {
  metaCsp: string;
}

function loadSecurityHeaders(): SecurityHeadersConfig {
  const raw = readFileSync(
    resolve(__dirname, 'scripts/security-headers.json'),
    'utf-8'
  );
  return JSON.parse(raw) as SecurityHeadersConfig;
}

/**
 * float-tooltip / force-graph 内の動的 <style> 挿入をビルド時に除去する
 * （同等ルールを src/index.css へ外出しして厳格な style-src 'self' CSP に適合させる）。
 */
function stripThirdPartyStyleInject(): Plugin {
  return {
    name: 'strip-third-party-style-inject',
    apply: 'build',
    transform(code, id) {
      const normalized = id.replace(/\\/g, '/');
      if (
        (normalized.includes('/node_modules/float-tooltip/') ||
          normalized.includes('/node_modules/force-graph/')) &&
        code.includes('styleInject(css_248z)')
      ) {
        return {
          code: code.replace(
            /styleInject\(css_248z\);?/g,
            '/* css bundled in src/index.css */'
          ),
          map: null,
        };
      }
      return null;
    },
  };
}

/**
 * 本番ビルド時のみ index.html に Content-Security-Policy meta タグを注入する。
 * dev サーバー (Vite HMR) には適用しない。
 */
function injectProductionCsp(): Plugin {
  return {
    name: 'inject-production-csp',
    apply: 'build',
    transformIndexHtml() {
      const { metaCsp } = loadSecurityHeaders();
      return [
        {
          tag: 'meta',
          attrs: {
            'http-equiv': 'Content-Security-Policy',
            content: metaCsp,
          },
          injectTo: 'head',
        },
      ];
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), stripThirdPartyStyleInject(), injectProductionCsp()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'graph-vendor': ['react-force-graph-2d'],
          icons: ['lucide-react'],
        },
      },
    },
  },
});
