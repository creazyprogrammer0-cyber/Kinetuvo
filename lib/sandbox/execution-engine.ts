import { CodeImplementationTemplate } from '@/types/encyclopedia';

/**
 * Safely interpolates user-adjusted parameter values into code templates.
 * Escapes unsafe HTML characters to prevent injection while keeping valid CSS/TSX syntax clean.
 */
export function interpolateCodeTemplate(
  template: string,
  params: Record<string, number | string | boolean>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const val = params[key];
    if (val === undefined) return `{{${key}}}`;
    return String(val).replace(/[<>]/g, '');
  });
}

/**
 * Compiles all code templates for a resource with current live parameters.
 */
export function compileResourceTemplates(
  templates: CodeImplementationTemplate[],
  params: Record<string, number | string | boolean>
): {
  language: CodeImplementationTemplate['language'];
  filename: string;
  description: string;
  compiledCode: string;
}[] {
  return templates.map((tpl) => ({
    language: tpl.language,
    filename: tpl.filename,
    description: tpl.description,
    compiledCode: interpolateCodeTemplate(tpl.codeTemplate, params),
  }));
}

/**
 * Builds an origin-isolated, CSP-restricted HTML document for safe iframe srcdoc execution.
 * Enforces Engineering Rule: "No insecure use of user-submitted code. No direct arbitrary server-side code execution."
 */
export function buildSandboxedIframeSrcDoc(options: {
  cssCode: string;
  htmlBody: string;
  isDark: boolean;
  reducedMotion: boolean;
}): string {
  const bg = options.isDark ? '#0F172A' : '#F8FAFC';
  const fg = options.isDark ? '#F8FAFC' : '#0F172A';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'none'; img-src data:;" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background: ${bg};
      color: ${fg};
      padding: 16px;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    ${
      options.reducedMotion
        ? `*, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }`
        : ''
    }
    ${options.cssCode}
  </style>
</head>
<body>
  ${options.htmlBody}
</body>
</html>`;
}
