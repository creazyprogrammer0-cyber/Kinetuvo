'use client';

import React, { useMemo } from 'react';
import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackPreview,
} from '@codesandbox/sandpack-react';
import {
  PlaygroundEditorTheme,
  PlaygroundFileEntry,
  PlaygroundTemplateCategory,
} from '@/lib/playground/types';

interface SandpackLazyBridgeProps {
  templateCategory: PlaygroundTemplateCategory;
  files: Record<string, PlaygroundFileEntry>;
  editorTheme: PlaygroundEditorTheme;
  showLineNumbers?: boolean;
}

export default function SandpackLazyBridge({
  templateCategory,
  files,
  editorTheme,
  showLineNumbers = true,
}: SandpackLazyBridgeProps) {
  const sandpackConfig = useMemo(() => {
    const fileList = Object.values(files);
    const fileMap: Record<string, { code: string; active?: boolean }> = {};

    const htmlFile = fileList.find(
      (f) => f.language === 'html' || f.language === 'svg'
    );
    const cssFile = fileList.find((f) => f.language === 'css');
    const jsOrTsxFile = fileList.find(
      (f) => f.language === 'javascript' || f.language === 'tsx'
    );

    if (templateCategory === 'react') {
      const rawCode = jsOrTsxFile?.code || '';
      const normalizedReactApp = rawCode.includes('export default')
        ? rawCode
        : `import React, { useState, useEffect, useMemo, useRef } from 'react';\nimport './styles.css';\n\n${rawCode}\n\nexport default function FallbackSpecimen() { return <div style={{padding: 24}}>Interactive React Specimen Ready</div>; };`;

      fileMap['/App.js'] = {
        code: normalizedReactApp,
        active: true,
      };
      fileMap['/styles.css'] = {
        code:
          cssFile?.code ||
          'body { margin: 0; font-family: system-ui, sans-serif; }',
      };
      return {
        template: 'react' as const,
        files: fileMap,
        customSetup: {
          dependencies: {
            'lucide-react': 'latest',
          },
        },
      };
    }

    const htmlContent =
      htmlFile?.code || '<div id="app">Interactive Specimen Stage</div>';
    const cssContent =
      cssFile?.code ||
      'body { margin: 0; font-family: system-ui, sans-serif; }';
    const jsContent = jsOrTsxFile?.code || '';

    fileMap['/index.html'] = {
      code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Playground Sandpack Runtime</title>
  ${
    templateCategory === 'three-webgl'
      ? '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>'
      : ''
  }
</head>
<body>
  ${htmlContent}
  <script src="index.js"></script>
</body>
</html>`,
      active: htmlFile !== undefined && !jsOrTsxFile,
    };

    fileMap['/styles.css'] = {
      code: cssContent,
    };

    fileMap['/index.js'] = {
      code: `import './styles.css';\n\n${jsContent}`,
      active: Boolean(jsOrTsxFile),
    };

    return {
      template: 'vanilla' as const,
      files: fileMap,
      customSetup: {},
    };
  }, [templateCategory, files]);

  return (
    <div className="w-full overflow-hidden rounded-md border border-[var(--ds-border)] bg-[var(--ds-surface)]">
      <div className="flex items-center justify-between border-b border-[var(--ds-border)] bg-[var(--ds-background)] px-3.5 py-2 text-xs text-[var(--ds-muted-foreground)]">
        <div className="flex items-center gap-2">
          <span className="font-mono font-semibold uppercase tracking-wider text-[var(--ds-accent)]">
            Sandpack Bundler Runtime
          </span>
          <span>·</span>
          <span>Template: {sandpackConfig.template}</span>
        </div>
        <span className="font-mono text-[11px] text-[var(--ds-muted-foreground)]">
          In-Browser Bundler Active
        </span>
      </div>

      <SandpackProvider
        template={sandpackConfig.template}
        theme={editorTheme === 'graphite-dark' ? 'dark' : 'light'}
        files={sandpackConfig.files}
        customSetup={sandpackConfig.customSetup}
      >
        <SandpackLayout
          style={{
            borderRadius: 0,
            border: 'none',
            minHeight: '480px',
          }}
        >
          <SandpackCodeEditor
            showTabs
            showLineNumbers={showLineNumbers}
            showInlineErrors
            wrapContent
            style={{ height: '480px' }}
          />
          <SandpackPreview
            showNavigator={false}
            showRefreshButton
            showOpenInCodeSandbox={false}
            style={{ height: '480px' }}
          />
        </SandpackLayout>
      </SandpackProvider>
    </div>
  );
}
