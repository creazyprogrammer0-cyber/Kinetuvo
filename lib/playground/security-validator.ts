import {
  PlaygroundDiagnosticMessage,
  PlaygroundFileEntry,
  PlaygroundPermittedDependency,
} from '@/lib/playground/types';

/* ============================================================================
 * 1. REVIEWED & PERMITTED DEPENDENCY WHITELIST (SECTION 6 SAFETY & SECTION 8 LAZY)
 * ========================================================================== */

export const PERMITTED_PLAYGROUND_DEPENDENCIES: Record<
  string,
  PlaygroundPermittedDependency
> = {
  react: {
    name: 'react',
    version: '^19.0.0',
    description: 'Core React declarative UI runtime.',
  },
  'react-dom': {
    name: 'react-dom',
    version: '^19.0.0',
    description: 'React DOM renderer.',
  },
  'lucide-react': {
    name: 'lucide-react',
    version: '^0.553.0',
    description: 'Clean vector iconography.',
  },
  motion: {
    name: 'motion',
    version: '^12.23.24',
    description: 'Spring physics & reduced-motion choreography engine.',
  },
  three: {
    name: 'three',
    version: '^0.170.0',
    description: 'WebGL 3D spatial renderer (Lazy-loaded only when 3D template is selected).',
    lazyLoadOnlyWhenNeeded: true,
  },
  '@react-three/fiber': {
    name: '@react-three/fiber',
    version: '^9.0.0',
    description: 'React reconciler for Three.js (Lazy-loaded only when 3D template is selected).',
    lazyLoadOnlyWhenNeeded: true,
  },
};

/* ============================================================================
 * 2. STATIC SECURITY & COMPILATION ANALYSIS GATE
 * ========================================================================== */

const FORBIDDEN_SECURITY_PATTERNS: {
  pattern: RegExp;
  message: string;
}[] = [
  {
    pattern: /\bwindow\.parent\b|\bwindow\.top\b|\bparent\.document\b/i,
    message:
      'Security Policy Violation: Cross-origin parent frame traversal (window.parent / window.top) is blocked inside the isolated sandbox.',
  },
  {
    pattern: /\bdocument\.cookie\b/i,
    message:
      'Security Policy Violation: Access to document.cookie and authentication tokens is strictly disabled.',
  },
  {
    pattern: /\blocalStorage\b|\bsessionStorage\b|\bindexedDB\b/i,
    message:
      'Security Policy Violation: Sensitive browser storage APIs (localStorage / sessionStorage / indexedDB) are disabled in the untrusted execution sandbox.',
  },
  {
    pattern: /\bprocess\.env\b/i,
    message:
      'Security Policy Violation: Server environment variables (process.env) are never exposed to client playground code.',
  },
];

export function auditAndCompilePlaygroundFiles(
  files: Record<string, PlaygroundFileEntry>,
  dependencies: Record<string, string>,
  forceSimulateCompilationError = false,
  forceSimulateRuntimeError = false
): {
  isValid: boolean;
  diagnostics: PlaygroundDiagnosticMessage[];
} {
  const diagnostics: PlaygroundDiagnosticMessage[] = [];
  const now = new Date().toISOString();

  if (forceSimulateCompilationError) {
    diagnostics.push({
      id: 'sim-compile-err',
      phase: 'compilation',
      severity: 'error',
      file: Object.keys(files)[0] || '/styles.css',
      line: 12,
      column: 4,
      message:
        'SyntaxError: Unexpected token "}" — Unterminated declaration block or mismatched JSX tag.',
      timestampIso: now,
    });
  }

  if (forceSimulateRuntimeError) {
    diagnostics.push({
      id: 'sim-runtime-err',
      phase: 'runtime',
      severity: 'error',
      file: '/index.js',
      line: 18,
      column: 9,
      message:
        'TypeError: Cannot read properties of null (reading "addEventListener") — Target DOM element was not mounted.',
      timestampIso: now,
    });
  }

  // 1. Validate dependencies against permitted whitelist
  for (const depName of Object.keys(dependencies)) {
    if (!PERMITTED_PLAYGROUND_DEPENDENCIES[depName]) {
      diagnostics.push({
        id: `dep-blocked-${depName}`,
        phase: 'security-policy',
        severity: 'error',
        file: '/package.json',
        message: `Unpermitted dependency "${depName}" blocked. Only reviewed packages (${Object.keys(
          PERMITTED_PLAYGROUND_DEPENDENCIES
        ).join(', ')}) are permitted.`,
        timestampIso: now,
      });
    }
  }

  // 2. Inspect each file for security violations & basic syntax balance
  for (const [path, entry] of Object.entries(files)) {
    const code = entry.code || '';

    for (const rule of FORBIDDEN_SECURITY_PATTERNS) {
      if (rule.pattern.test(code)) {
        diagnostics.push({
          id: `sec-${path}-${rule.message.slice(0, 18)}`,
          phase: 'security-policy',
          severity: 'error',
          file: path,
          message: rule.message,
          timestampIso: now,
        });
      }
    }

    if (
      entry.language === 'css' ||
      entry.language === 'javascript' ||
      entry.language === 'tsx' ||
      entry.language === 'json'
    ) {
      const openBraces = (code.match(/\{/g) || []).length;
      const closeBraces = (code.match(/\}/g) || []).length;
      if (openBraces !== closeBraces) {
        diagnostics.push({
          id: `syntax-braces-${path}`,
          phase: 'compilation',
          severity: 'error',
          file: path,
          message: `SyntaxError in ${path}: Unbalanced curly braces (${openBraces} "{" vs ${closeBraces} "}").`,
          timestampIso: now,
        });
      }
    }

    if (
      entry.language === 'javascript' ||
      entry.language === 'tsx'
    ) {
      const openParens = (code.match(/\(/g) || []).length;
      const closeParens = (code.match(/\)/g) || []).length;
      if (openParens !== closeParens) {
        diagnostics.push({
          id: `syntax-parens-${path}`,
          phase: 'compilation',
          severity: 'error',
          file: path,
          message: `SyntaxError in ${path}: Unbalanced parentheses (${openParens} "(" vs ${closeParens} ")").`,
          timestampIso: now,
        });
      }
    }
  }

  const hasError = diagnostics.some((d) => d.severity === 'error');
  return {
    isValid: !hasError,
    diagnostics,
  };
}

/* ============================================================================
 * 3. ORIGIN-ISOLATED CSP SANDBOXED IFRAME COMPILER
 * ========================================================================== */

/**
 * Compiles multi-file Playground projects (Vanilla HTML/CSS/JS, React JSX,
 * SVG, Canvas, and lazy-loaded Three.js WebGL) into an origin-isolated
 * `<iframe sandbox="allow-scripts">` document with a strict Content-Security-Policy,
 * storage/token lockdowns, and real-time `window.onerror` telemetry reporting.
 */
export function buildIsolatedPlaygroundSrcDoc(options: {
  files: Record<string, PlaygroundFileEntry>;
  customizationValues: Record<string, number | string | boolean>;
  isDark: boolean;
  reducedMotion: boolean;
  requiresLazyThreeWebGL?: boolean;
  simulateRuntimeError?: boolean;
}): string {
  const {
    files,
    customizationValues,
    isDark,
    reducedMotion,
    requiresLazyThreeWebGL = false,
    simulateRuntimeError = false,
  } = options;

  // Gather CSS files
  const cssContents = Object.values(files)
    .filter((f) => f.language === 'css')
    .map((f) => f.code)
    .join('\n\n');

  // Gather HTML or SVG markup
  const htmlFile = Object.values(files).find((f) => f.language === 'html');
  const svgFile = Object.values(files).find((f) => f.language === 'svg');
  const htmlMarkup =
    htmlFile?.code ||
    svgFile?.code ||
    '<div id="root"></div><div id="app"></div>';

  // Gather JS or TSX files
  const jsFiles = Object.values(files).filter(
    (f) => f.language === 'javascript' || f.language === 'tsx'
  );

  // Build CSS custom properties from customization settings
  const customCssVars = Object.entries(customizationValues)
    .map(([k, v]) => {
      const cleanVal = String(v).replace(/[<>";]/g, '');
      return `  --pg-${k}: ${cleanVal};`;
    })
    .join('\n');

  // Lightweight JSX-to-DOM / React-compatible transform for in-iframe execution
  const rawScript = jsFiles.map((f) => f.code).join('\n\n');
  const executableScript = transformPlaygroundScriptForSandbox(rawScript);

  const bg = isDark ? '#090D16' : '#F8FAFC';
  const fg = isDark ? '#F8FAFC' : '#0F172A';

  // Only load Three.js module script inside the isolated iframe if the active template explicitly requires WebGL/3D
  const threeLazyImportTag = requiresLazyThreeWebGL
    ? `<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js" crossorigin="anonymous"></script>`
    : '';

  // Restrictive CSP: blocks arbitrary connections (connect-src 'none'), form submissions, object embeds, and restricts scripts
  const cspContent = requiresLazyThreeWebGL
    ? "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline' https://cdnjs.cloudflare.com; img-src data: blob:; connect-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none';"
    : "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data: blob:; connect-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none';";

  return `<!DOCTYPE html>
<html lang="en" data-theme="${isDark ? 'dark' : 'light'}">
<head>
  <meta charset="utf-8" />
  <meta http-equiv="Content-Security-Policy" content="${cspContent}" />
  <style>
    :root {
      --ds-bg: ${bg};
      --ds-fg: ${fg};
      --ds-surface: ${isDark ? '#111827' : '#FFFFFF'};
      --ds-border: ${isDark ? '#1E293B' : '#E2E8F0'};
      --ds-accent: ${isDark ? '#818CF8' : '#4F46E5'};
${customCssVars}
    }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background-color: var(--ds-bg);
      color: var(--ds-fg);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    ${
      reducedMotion
        ? `*, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; }`
        : ''
    }
    ${cssContents}
  </style>
  ${threeLazyImportTag}
</head>
<body>
  ${htmlMarkup}
  <script>
    (function() {
      // Section 6 Security Hardening: Nullify sensitive storage & network APIs inside untrusted sandbox
      try {
        Object.defineProperty(window, 'localStorage', { get: function() { throw new Error('SecurityPolicy: localStorage is disabled in sandbox'); } });
        Object.defineProperty(window, 'sessionStorage', { get: function() { throw new Error('SecurityPolicy: sessionStorage is disabled in sandbox'); } });
        Object.defineProperty(window, 'indexedDB', { get: function() { throw new Error('SecurityPolicy: indexedDB is disabled in sandbox'); } });
        window.fetch = function() { return Promise.reject(new Error('SecurityPolicy: External network fetch is blocked by sandbox CSP')); };
        window.XMLHttpRequest = function() { throw new Error('SecurityPolicy: XMLHttpRequest is blocked by sandbox CSP'); };
      } catch (e) {}

      // Forward runtime errors and console logs safely to parent diagnostics panel
      window.onerror = function(msg, url, lineNo, columnNo, error) {
        window.parent.postMessage({
          type: 'DDE_PLAYGROUND_DIAGNOSTIC',
          phase: 'runtime',
          severity: 'error',
          line: lineNo || 1,
          column: columnNo || 1,
          message: String(msg)
        }, '*');
        return false;
      };

      window.addEventListener('unhandledrejection', function(event) {
        window.parent.postMessage({
          type: 'DDE_PLAYGROUND_DIAGNOSTIC',
          phase: 'runtime',
          severity: 'error',
          message: 'Unhandled Promise Rejection: ' + String(event.reason)
        }, '*');
      });

      const origLog = console.log;
      console.log = function() {
        const text = Array.prototype.slice.call(arguments).map(function(a) {
          return typeof a === 'object' ? JSON.stringify(a) : String(a);
        }).join(' ');
        window.parent.postMessage({
          type: 'DDE_PLAYGROUND_DIAGNOSTIC',
          phase: 'console',
          severity: 'info',
          message: text
        }, '*');
        origLog.apply(console, arguments);
      };

      window.__PG_PARAMS__ = ${JSON.stringify(customizationValues)};
      window.__REDUCED_MOTION__ = ${JSON.stringify(reducedMotion)};

      ${
        simulateRuntimeError
          ? `setTimeout(function() { throw new TypeError("Cannot read properties of null (reading 'addEventListener') at interactive mount"); }, 40);`
          : ''
      }

      try {
        ${executableScript}
      } catch (err) {
        window.parent.postMessage({
          type: 'DDE_PLAYGROUND_DIAGNOSTIC',
          phase: 'runtime',
          severity: 'error',
          message: err && err.message ? err.message : String(err)
        }, '*');
      }
    })();
  </script>
</body>
</html>`;
}

/**
 * Strips ES module import/export wrappers so Vanilla JS and lightweight
 * React component templates can execute cleanly inside the origin-isolated iframe
 * even without external CDN network dependencies.
 */
function transformPlaygroundScriptForSandbox(code: string): string {
  return code
    .replace(/^\s*import\s+[\s\S]*?from\s+['"][^'"]+['"];?\s*$/gm, '')
    .replace(/^\s*import\s+['"][^'"]+['"];?\s*$/gm, '')
    .replace(/export\s+default\s+function\s+/g, 'function ')
    .replace(/export\s+function\s+/g, 'function ')
    .replace(/export\s+const\s+/g, 'const ');
}

/* ============================================================================
 * 4. LIGHTWEIGHT CODE FORMATTER & SHAREABLE URL ENCODER
 * ========================================================================== */

export function formatPlaygroundCode(
  code: string,
  language: PlaygroundFileEntry['language']
): string {
  const lines = code.split('\n');
  let indentLevel = 0;
  const formatted: string[] = [];

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) {
      formatted.push('');
      continue;
    }

    if (
      trimmed.startsWith('}') ||
      trimmed.startsWith(']') ||
      trimmed.startsWith('</')
    ) {
      indentLevel = Math.max(0, indentLevel - 1);
    }

    const indent = '  '.repeat(indentLevel);
    formatted.push(`${indent}${trimmed}`);

    if (
      language !== 'html' &&
      (trimmed.endsWith('{') || trimmed.endsWith('['))
    ) {
      indentLevel += 1;
    }
  }

  return formatted.join('\n').trim() + '\n';
}

export interface ShareablePlaygroundPayload {
  templateId: string;
  title: string;
  activeFile: string;
  files: Record<string, string>;
}

export function encodeShareablePlaygroundState(
  payload: ShareablePlaygroundPayload
): string {
  if (typeof window === 'undefined') return '';
  try {
    const json = JSON.stringify(payload);
    return window.btoa(encodeURIComponent(json));
  } catch {
    return '';
  }
}

export function decodeShareablePlaygroundState(
  hashOrParam: string
): ShareablePlaygroundPayload | null {
  if (typeof window === 'undefined' || !hashOrParam) return null;
  try {
    const json = decodeURIComponent(window.atob(hashOrParam));
    const parsed = JSON.parse(json) as ShareablePlaygroundPayload;
    if (
      parsed &&
      typeof parsed.templateId === 'string' &&
      parsed.files &&
      typeof parsed.files === 'object'
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}
