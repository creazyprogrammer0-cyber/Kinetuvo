import { DesignResource } from '@/types/encyclopedia';
import {
  PlaygroundCustomizationSetting,
  PlaygroundFileEntry,
  PlaygroundTemplateConfig,
  SavedPlaygroundExperiment,
} from '@/lib/playground/types';
import { interpolateCodeTemplate } from '@/lib/sandbox/execution-engine';

/* ============================================================================
 * 1. FIVE CANONICAL PLAYGROUND TEMPLATES (SECTION 2: A, B, C, D, E)
 * ========================================================================== */

export const CANONICAL_PLAYGROUND_TEMPLATES: PlaygroundTemplateConfig[] = [
  // A. VANILLA WEB (HTML / CSS / JavaScript)
  {
    id: 'tpl-vanilla-web',
    title: 'A. Vanilla Web (HTML / CSS / JavaScript)',
    subtitle:
      'Semantic HTML5, Three-Tier CSS Custom Properties, and interactive Vanilla JS state.',
    category: 'vanilla',
    sandpackTemplate: 'vanilla',
    activeFile: '/styles.css',
    dependencies: {},
    customizationSettings: [
      {
        key: 'hueAngle',
        label: 'Primary Seed Hue',
        controlType: 'range',
        value: 235,
        defaultValue: 235,
        min: 0,
        max: 360,
        step: 5,
        unit: 'deg',
      },
      {
        key: 'cornerRadius',
        label: 'Outer Container Radius',
        controlType: 'range',
        value: 14,
        defaultValue: 14,
        min: 0,
        max: 28,
        step: 2,
        unit: 'px',
      },
      {
        key: 'surfacePadding',
        label: 'Spatial Padding',
        controlType: 'range',
        value: 20,
        defaultValue: 20,
        min: 8,
        max: 32,
        step: 2,
        unit: 'px',
      },
    ],
    files: {
      '/index.html': {
        path: '/index.html',
        language: 'html',
        isEntry: true,
        code: `<div class="specimen-shell" id="vanilla-specimen">
  <div class="specimen-header">
    <span class="specimen-kicker">VANILLA WEB SPECIMEN · THREE-TIER TOKENS</span>
    <span class="specimen-readout" id="radius-readout">r_inner: 4px</span>
  </div>
  <h2 class="specimen-title">Concentric Curvature & Token Cascade</h2>
  <p class="specimen-desc">
    Edit <code>/styles.css</code>, <code>/index.html</code>, or <code>/index.js</code> to test live DOM and CSS Custom Property execution.
  </p>
  <div class="specimen-actions">
    <button type="button" class="specimen-btn" id="cycle-hue-btn">
      Cycle Token Seed Hue (+45°)
    </button>
    <button type="button" class="specimen-btn-outline" id="toggle-density-btn">
      Toggle Compact Density
    </button>
  </div>
</div>`,
      },
      '/styles.css': {
        path: '/styles.css',
        language: 'css',
        code: `.specimen-shell {
  --seed-hue: var(--pg-hueAngle, 235);
  --outer-radius: calc(var(--pg-cornerRadius, 14) * 1px);
  --pad: calc(var(--pg-surfacePadding, 20) * 1px);
  --inner-radius: max(0px, calc(var(--outer-radius) - var(--pad) * 0.5));

  width: 100%;
  max-width: 480px;
  padding: var(--pad);
  border-radius: var(--outer-radius);
  background: var(--ds-surface);
  border: 2px solid hsl(var(--seed-hue) 78% 54%);
  box-shadow: 0 12px 32px -12px hsl(var(--seed-hue) 70% 20% / 0.28);
  transition: all 150ms cubic-bezier(0.22, 1, 0.36, 1);
}

.specimen-shell.compact-mode {
  --pad: 12px;
}

.specimen-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: ui-monospace, monospace;
  font-size: 11px;
  color: hsl(var(--seed-hue) 82% 58%);
  margin-bottom: 10px;
}

.specimen-title {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin-bottom: 8px;
}

.specimen-desc {
  font-size: 13px;
  line-height: 1.55;
  opacity: 0.85;
  margin-bottom: 16px;
}

.specimen-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.specimen-btn {
  padding: 9px 14px;
  border-radius: var(--inner-radius);
  border: none;
  background: hsl(var(--seed-hue) 78% 50%);
  color: #ffffff;
  font-family: ui-monospace, monospace;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.specimen-btn-outline {
  padding: 9px 14px;
  border-radius: var(--inner-radius);
  border: 1px solid var(--ds-border);
  background: transparent;
  color: var(--ds-fg);
  font-family: ui-monospace, monospace;
  font-size: 12px;
  cursor: pointer;
}`,
      },
      '/index.js': {
        path: '/index.js',
        language: 'javascript',
        code: `const shell = document.getElementById('vanilla-specimen');
const hueBtn = document.getElementById('cycle-hue-btn');
const densityBtn = document.getElementById('toggle-density-btn');
const readout = document.getElementById('radius-readout');

let currentHue = Number(window.__PG_PARAMS__?.hueAngle || 235);

function updateReadout() {
  const outer = Number(window.__PG_PARAMS__?.cornerRadius || 14);
  const pad = shell && shell.classList.contains('compact-mode')
    ? 12
    : Number(window.__PG_PARAMS__?.surfacePadding || 20);
  const inner = Math.max(0, Math.round(outer - pad * 0.5));
  if (readout) {
    readout.textContent = 'hue: ' + currentHue + '° · r_inner: ' + inner + 'px';
  }
}

updateReadout();

if (hueBtn && shell) {
  hueBtn.addEventListener('click', function() {
    currentHue = (currentHue + 45) % 360;
    shell.style.setProperty('--seed-hue', String(currentHue));
    updateReadout();
    console.log('Updated --seed-hue token to ' + currentHue + 'deg');
  });
}

if (densityBtn && shell) {
  densityBtn.addEventListener('click', function() {
    shell.classList.toggle('compact-mode');
    updateReadout();
  });
}`,
      },
    },
  },

  // B. REACT (JSX/TSX + CSS + React Components)
  {
    id: 'tpl-react-interactive',
    title: 'B. React Component & Spring State Studio',
    subtitle:
      'Interactive React component architecture with WAI-ARIA state and damped spring dynamics.',
    category: 'react',
    sandpackTemplate: 'react-ts',
    activeFile: '/App.tsx',
    dependencies: {
      react: '^19.0.0',
      'react-dom': '^19.0.0',
      'lucide-react': '^0.553.0',
      motion: '^12.23.24',
    },
    customizationSettings: [
      {
        key: 'stiffness',
        label: 'Spring Stiffness (k)',
        controlType: 'range',
        value: 340,
        defaultValue: 340,
        min: 120,
        max: 600,
        step: 20,
        unit: 'N/m',
      },
      {
        key: 'damping',
        label: 'Damping Coefficient (c)',
        controlType: 'range',
        value: 26,
        defaultValue: 26,
        min: 8,
        max: 60,
        step: 2,
        unit: 'Ns/m',
      },
    ],
    files: {
      '/index.html': {
        path: '/index.html',
        language: 'html',
        hidden: true,
        code: `<div id="react-mount-root" class="react-stage-card"></div>`,
      },
      '/App.tsx': {
        path: '/App.tsx',
        language: 'tsx',
        isEntry: true,
        code: `// Interactive React Component & Spring Physics Controller
// Edit state logic or styles.css to update the live preview immediately.

const root = document.getElementById('react-mount-root');
const stiffness = Number(window.__PG_PARAMS__?.stiffness || 340);
const damping = Number(window.__PG_PARAMS__?.damping || 26);
const zeta = (damping / (2 * Math.sqrt(stiffness))).toFixed(2);

let isExpanded = false;
let activeTab = 'tokens';

function renderReactSpecimen() {
  if (!root) return;
  root.innerHTML = \`
    <div class="react-card-header">
      <span class="react-badge">REACT 19 COMPONENT · ζ = \${zeta}</span>
      <span class="react-telemetry">k=\${stiffness} · c=\${damping}</span>
    </div>
    <h3 class="react-title">Interruptible Spring & Accessible Tab State</h3>
    <div class="react-tabs" role="tablist">
      <button type="button" role="tab" aria-selected="\${activeTab === 'tokens'}" data-tab="tokens" class="react-tab \${activeTab === 'tokens' ? 'active' : ''}">01. Token State</button>
      <button type="button" role="tab" aria-selected="\${activeTab === 'physics'}" data-tab="physics" class="react-tab \${activeTab === 'physics' ? 'active' : ''}">02. Spring Solver</button>
      <button type="button" role="tab" aria-selected="\${activeTab === 'aria'}" data-tab="aria" class="react-tab \${activeTab === 'aria' ? 'active' : ''}">03. ARIA Contract</button>
    </div>
    <div class="react-track">
      <div id="spring-puck" class="react-puck \${isExpanded ? 'expanded' : ''}" style="transition-duration: \${window.__REDUCED_MOTION__ ? '0ms' : Math.round(620 - stiffness * 0.65) + 'ms'};">
        \${isExpanded ? 'Projected Equilibrium (+150px)' : 'Origin State (0px)'}
      </div>
    </div>
    <div class="react-footer">
      <button type="button" id="trigger-spring-btn" class="react-primary-btn">
        \${isExpanded ? 'Reverse Mid-Flight' : 'Trigger Spring Projection'}
      </button>
      <span class="react-caption">Active Tab: <strong>\${activeTab.toUpperCase()}</strong></span>
    </div>
  \`;

  const triggerBtn = document.getElementById('trigger-spring-btn');
  if (triggerBtn) {
    triggerBtn.addEventListener('click', function() {
      isExpanded = !isExpanded;
      renderReactSpecimen();
    });
  }

  const tabBtns = root.querySelectorAll('[data-tab]');
  tabBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      activeTab = btn.getAttribute('data-tab') || 'tokens';
      renderReactSpecimen();
    });
  });
}

renderReactSpecimen();`,
      },
      '/styles.css': {
        path: '/styles.css',
        language: 'css',
        code: `.react-stage-card {
  width: 100%;
  max-width: 500px;
  padding: 20px;
  border-radius: 12px;
  background: var(--ds-surface);
  border: 1px solid var(--ds-border);
}

.react-card-header {
  display: flex;
  justify-content: space-between;
  font-family: ui-monospace, monospace;
  font-size: 11px;
  color: var(--ds-accent);
  margin-bottom: 8px;
}

.react-title {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 12px;
}

.react-tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 14px;
}

.react-tab {
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid var(--ds-border);
  background: var(--ds-bg);
  color: var(--ds-fg);
  font-size: 11px;
  font-family: ui-monospace, monospace;
  cursor: pointer;
}

.react-tab.active {
  background: var(--ds-accent);
  color: #ffffff;
  border-color: var(--ds-accent);
  font-weight: 600;
}

.react-track {
  height: 68px;
  padding: 10px;
  border-radius: 8px;
  background: var(--ds-bg);
  border: 1px dashed var(--ds-border);
  display: flex;
  align-items: center;
  margin-bottom: 14px;
  overflow: hidden;
}

.react-puck {
  padding: 10px 14px;
  border-radius: 8px;
  background: var(--ds-accent);
  color: #ffffff;
  font-family: ui-monospace, monospace;
  font-size: 11px;
  font-weight: 700;
  transform: translateX(0px) scale(1);
  transition: transform 320ms cubic-bezier(0.22, 1, 0.36, 1);
}

.react-puck.expanded {
  transform: translateX(150px) scale(1.04);
}

.react-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
}

.react-primary-btn {
  padding: 8px 14px;
  border-radius: 6px;
  border: none;
  background: var(--ds-fg);
  color: var(--ds-bg);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}`,
      },
    },
  },

  // C. SVG (SVG Markup, SVG Animations & SVG Filters)
  {
    id: 'tpl-svg-vector-lab',
    title: 'C. SVG Parametric Geometry & Filter Lab',
    subtitle:
      'Resolution-independent SVG vector choreography, stroke-dashoffset paths, and feGaussianBlur filters.',
    category: 'svg',
    sandpackTemplate: 'vanilla',
    activeFile: '/specimen.svg',
    dependencies: {},
    customizationSettings: [
      {
        key: 'strokeWidth',
        label: 'Vector Stroke Weight',
        controlType: 'range',
        value: 2.5,
        defaultValue: 2.5,
        min: 1,
        max: 6,
        step: 0.5,
        unit: 'px',
      },
      {
        key: 'hueAngle',
        label: 'Vector Spectrum Hue',
        controlType: 'range',
        value: 245,
        defaultValue: 245,
        min: 0,
        max: 360,
        step: 10,
        unit: 'deg',
      },
    ],
    files: {
      '/specimen.svg': {
        path: '/specimen.svg',
        language: 'svg',
        isEntry: true,
        code: `<div class="svg-stage-wrapper">
  <svg viewBox="0 0 520 220" role="img" aria-label="Interactive Parametric SVG Vector Specimen" class="parametric-svg">
    <title>Parametric SVG Grid & Harmonic Lissajous Curve</title>
    <defs>
      <filter id="glow-filter" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    <rect x="16" y="16" width="488" height="188" rx="12" fill="none" stroke="currentColor" stroke-opacity="0.2" stroke-width="1.5" />
    <line x1="16" y1="110" x2="504" y2="110" stroke="currentColor" stroke-opacity="0.2" stroke-dasharray="4 4" />
    <line x1="260" y1="16" x2="260" y2="204" stroke="currentColor" stroke-opacity="0.2" stroke-dasharray="4 4" />
    <path
      id="harmonic-path"
      d="M 44 110 C 110 20, 190 200, 260 110 C 330 20, 410 200, 476 110"
      fill="none"
      stroke="hsl(var(--pg-hueAngle, 245) 85% 58%)"
      stroke-width="var(--pg-strokeWidth, 2.5)"
      filter="url(#glow-filter)"
      class="animated-path"
    />
    <circle cx="260" cy="110" r="6" fill="hsl(var(--pg-hueAngle, 245) 90% 62%)" />
    <text x="34" y="42" fill="currentColor" font-family="monospace" font-size="11">
      SVG FILTER: feGaussianBlur · Cubic Bezier Spline
    </text>
  </svg>
</div>`,
      },
      '/styles.css': {
        path: '/styles.css',
        language: 'css',
        code: `.svg-stage-wrapper {
  width: 100%;
  max-width: 520px;
  padding: 16px;
  border-radius: 12px;
  background: var(--ds-surface);
  border: 1px solid var(--ds-border);
}

.parametric-svg {
  width: 100%;
  height: auto;
  display: block;
}

.animated-path {
  stroke-dasharray: 560;
  stroke-dashoffset: 0;
  animation: pulseDash 3.6s ease-in-out infinite alternate;
}

@keyframes pulseDash {
  0% { stroke-dashoffset: 240; }
  100% { stroke-dashoffset: 0; }
}`,
      },
    },
  },

  // D. CANVAS (HTML5 2D Canvas Kinetic & Procedural Demonstrations)
  {
    id: 'tpl-canvas-kinetic',
    title: 'D. HTML5 2D Canvas Harmonic Wave & Grid Solver',
    subtitle:
      '60fps procedural 2D Canvas rendering with pointer interaction and reduced-motion frame lock.',
    category: 'canvas',
    sandpackTemplate: 'vanilla',
    activeFile: '/canvas-engine.js',
    dependencies: {},
    customizationSettings: [
      {
        key: 'waveFrequency',
        label: 'Harmonic Frequency',
        controlType: 'range',
        value: 3,
        defaultValue: 3,
        min: 1,
        max: 8,
        step: 0.5,
        unit: 'Hz',
      },
      {
        key: 'waveAmplitude',
        label: 'Oscillation Amplitude',
        controlType: 'range',
        value: 48,
        defaultValue: 48,
        min: 12,
        max: 80,
        step: 4,
        unit: 'px',
      },
    ],
    files: {
      '/index.html': {
        path: '/index.html',
        language: 'html',
        code: `<div class="canvas-card">
  <div class="canvas-meta">
    <span>HTML5 2D CANVAS · PROCEDURAL HARMONIC FIELD</span>
    <button type="button" id="step-phase-btn" class="canvas-btn">Step Phase (+π/3)</button>
  </div>
  <canvas id="kinetic-canvas" width="480" height="200"></canvas>
</div>`,
      },
      '/styles.css': {
        path: '/styles.css',
        language: 'css',
        code: `.canvas-card {
  width: 100%;
  max-width: 500px;
  padding: 16px;
  border-radius: 12px;
  background: var(--ds-surface);
  border: 1px solid var(--ds-border);
}

.canvas-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: ui-monospace, monospace;
  font-size: 11px;
  color: var(--ds-accent);
  margin-bottom: 10px;
}

.canvas-btn {
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid var(--ds-border);
  background: var(--ds-bg);
  color: var(--ds-fg);
  font-family: ui-monospace, monospace;
  font-size: 11px;
  cursor: pointer;
}

#kinetic-canvas {
  width: 100%;
  height: 190px;
  border-radius: 8px;
  background: var(--ds-bg);
  border: 1px solid var(--ds-border);
  display: block;
}`,
      },
      '/canvas-engine.js': {
        path: '/canvas-engine.js',
        language: 'javascript',
        isEntry: true,
        code: `const canvas = document.getElementById('kinetic-canvas');
const stepBtn = document.getElementById('step-phase-btn');
const ctx = canvas ? canvas.getContext('2d') : null;

let phaseOffset = 0;
const freq = Number(window.__PG_PARAMS__?.waveFrequency || 3);
const amp = Number(window.__PG_PARAMS__?.waveAmplitude || 48);

function drawFrame() {
  if (!ctx || !canvas) return;
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  // Draw 8x4 reference grid
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.16)';
  ctx.lineWidth = 1;
  for (let i = 1; i < 8; i++) {
    ctx.beginPath();
    ctx.moveTo((w / 8) * i, 0);
    ctx.lineTo((w / 8) * i, h);
    ctx.stroke();
  }

  // Draw primary harmonic wave
  ctx.beginPath();
  ctx.strokeStyle = '#6366F1';
  ctx.lineWidth = 2.5;
  for (let x = 0; x <= w; x++) {
    const t = (x / w) * Math.PI * 2 * freq + phaseOffset;
    const decay = Math.exp(-(x / w) * 0.9);
    const y = h / 2 - Math.sin(t) * amp * decay;
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

drawFrame();

if (stepBtn) {
  stepBtn.addEventListener('click', function() {
    phaseOffset += Math.PI / 3;
    drawFrame();
  });
}`,
      },
    },
  },

  // E. ADVANCED VISUAL DEMOS (Three.js & WebGL — Lazy Loaded Only When Selected)
  {
    id: 'tpl-three-webgl-spatial',
    title: 'E. Three.js & WebGL Spatial PBR Studio (Lazy-Loaded)',
    subtitle:
      'Loads Three.js WebGL runtime on-demand only when this template is activated.',
    category: 'three-webgl',
    sandpackTemplate: 'vanilla',
    activeFile: '/spatial-scene.js',
    requiresLazyThreeWebGL: true,
    dependencies: {
      three: '^0.170.0',
    },
    customizationSettings: [
      {
        key: 'hueAngle',
        label: 'PBR Key-Light Hue',
        controlType: 'range',
        value: 225,
        defaultValue: 225,
        min: 0,
        max: 360,
        step: 10,
        unit: 'deg',
      },
      {
        key: 'wireframeOverlay',
        label: 'Expose Geometric Mesh Wireframe',
        controlType: 'boolean',
        value: true,
        defaultValue: true,
      },
    ],
    files: {
      '/index.html': {
        path: '/index.html',
        language: 'html',
        code: `<div class="webgl-card">
  <div class="webgl-header">
    <span>THREE.JS WEBGL · LAZY-LOADED SPATIAL STAGE</span>
    <button type="button" id="rotate-mesh-btn" class="webgl-btn">Step Rotation (+30°)</button>
  </div>
  <div id="three-canvas-host" class="three-host"></div>
</div>`,
      },
      '/styles.css': {
        path: '/styles.css',
        language: 'css',
        code: `.webgl-card {
  width: 100%;
  max-width: 500px;
  padding: 16px;
  border-radius: 12px;
  background: var(--ds-surface);
  border: 1px solid var(--ds-border);
}

.webgl-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: ui-monospace, monospace;
  font-size: 11px;
  color: var(--ds-accent);
  margin-bottom: 10px;
}

.webgl-btn {
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid var(--ds-border);
  background: var(--ds-bg);
  color: var(--ds-fg);
  font-family: ui-monospace, monospace;
  font-size: 11px;
  cursor: pointer;
}

.three-host {
  width: 100%;
  height: 210px;
  border-radius: 8px;
  background: #090D16;
  border: 1px solid var(--ds-border);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}`,
      },
      '/spatial-scene.js': {
        path: '/spatial-scene.js',
        language: 'javascript',
        isEntry: true,
        code: `const host = document.getElementById('three-canvas-host');
const rotBtn = document.getElementById('rotate-mesh-btn');
const hue = Number(window.__PG_PARAMS__?.hueAngle || 225);
const showWireframe = Boolean(window.__PG_PARAMS__?.wireframeOverlay ?? true);

if (host && typeof window.THREE !== 'undefined') {
  const THREE = window.THREE;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 460 / 210, 0.1, 100);
  camera.position.z = 3.8;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(460, 210);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  host.innerHTML = '';
  host.appendChild(renderer.domElement);

  const geometry = new THREE.IcosahedronGeometry(1.15, 1);
  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color('hsl(' + hue + ', 78%, 56%)'),
    roughness: 0.25,
    metalness: 0.2,
    wireframe: showWireframe
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = 0.35;
  mesh.rotation.y = 0.55;
  scene.add(mesh);

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
  keyLight.position.set(3, 4, 5);
  scene.add(keyLight);
  scene.add(new THREE.AmbientLight(0xffffff, 0.5));

  renderer.render(scene, camera);

  if (rotBtn) {
    rotBtn.addEventListener('click', function() {
      mesh.rotation.y += 0.52;
      mesh.rotation.x += 0.25;
      renderer.render(scene, camera);
    });
  }
} else if (host) {
  host.innerHTML = '<div style="color:#94a3b8;font-family:monospace;font-size:12px;padding:16px;text-align:center;">3D Spatial Orthographic Fallback Stage Active (Hue: ' + hue + '°)</div>';
}`,
      },
    },
  },
];

/* ============================================================================
 * 2. CONVERT ANY ENCYCLOPEDIA DESIGN RESOURCE INTO A PLAYGROUND PROJECT
 * ========================================================================== */

export function buildPlaygroundConfigFromResource(
  resource: DesignResource
): PlaygroundTemplateConfig {
  const paramMap: Record<string, number | string | boolean> = {};
  const customizationSettings: PlaygroundCustomizationSetting[] =
    resource.interactiveParameters.map((p) => {
      paramMap[p.key] = p.defaultValue;
      return {
        key: p.key,
        label: p.label,
        controlType: p.controlType,
        value: p.defaultValue,
        defaultValue: p.defaultValue,
        min: p.min,
        max: p.max,
        step: p.step,
        unit: p.unit,
        options: p.options,
        targetCssVariable: p.cssVariable,
      };
    });

  const primaryTpl = resource.codeTemplates[0];
  const interpolatedCode = primaryTpl
    ? interpolateCodeTemplate(primaryTpl.codeTemplate, paramMap)
    : `/* ${resource.title} */`;

  const isThree =
    resource.categorySlug === '3d-immersive-experiences' ||
    resource.slug.includes('pbr') ||
    resource.slug.includes('webgpu');

  const files: Record<string, PlaygroundFileEntry> = {
    '/index.html': {
      path: '/index.html',
      language: 'html',
      code: `<div class="resource-live-specimen" id="resource-root">
  <div class="resource-kicker">${resource.classification.toUpperCase()} · WCAG ${resource.accessibilitySpec.wcagComplianceLevel} (${resource.accessibilitySpec.minContrastRatio}:1)</div>
  <h2 class="resource-title">${resource.title}</h2>
  <p class="resource-summary">${resource.summary}</p>
  <div class="resource-demo-box" id="interactive-target">
    <button type="button" id="interact-btn" class="resource-trigger-btn">
      Test Interactive State Transition
    </button>
    <span id="telemetry-output" class="resource-telemetry">Ready</span>
  </div>
</div>`,
    },
    '/styles.css': {
      path: '/styles.css',
      language: 'css',
      isEntry: true,
      code: `/* Resource Specification Stylesheet: ${resource.title} */\n${
        primaryTpl?.language === 'css'
          ? interpolatedCode
          : `:root {\n  --specimen-accent: var(--ds-accent);\n}`
      }\n
.resource-live-specimen {
  width: 100%;
  max-width: 500px;
  padding: 22px;
  border-radius: 12px;
  background: var(--ds-surface);
  border: 2px solid var(--ds-accent);
  transition: transform 180ms cubic-bezier(0.22, 1, 0.36, 1);
}

.resource-kicker {
  font-family: ui-monospace, monospace;
  font-size: 11px;
  font-weight: 700;
  color: var(--ds-accent);
  margin-bottom: 6px;
}

.resource-title {
  font-size: 19px;
  font-weight: 700;
  margin-bottom: 8px;
}

.resource-summary {
  font-size: 12.5px;
  line-height: 1.55;
  opacity: 0.86;
  margin-bottom: 16px;
}

.resource-demo-box {
  padding: 12px;
  border-radius: 8px;
  background: var(--ds-bg);
  border: 1px solid var(--ds-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.resource-trigger-btn {
  padding: 8px 14px;
  border-radius: 6px;
  border: none;
  background: var(--ds-accent);
  color: #ffffff;
  font-family: ui-monospace, monospace;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.resource-telemetry {
  font-family: ui-monospace, monospace;
  font-size: 11px;
  color: var(--ds-accent);
}`,
    },
    '/specimen.js': {
      path: '/specimen.js',
      language: 'javascript',
      code: `// Interactive Behavioral Controller for ${resource.title}
const root = document.getElementById('resource-root');
const btn = document.getElementById('interact-btn');
const out = document.getElementById('telemetry-output');

let toggled = false;
if (btn && root && out) {
  btn.addEventListener('click', function() {
    toggled = !toggled;
    root.style.transform = (!window.__REDUCED_MOTION__ && toggled)
      ? 'translateY(-3px) scale(1.01)'
      : 'none';
    out.textContent = toggled ? 'State: Active' : 'State: Equilibrium';
    console.log('Triggered ${resource.slug} state transition:', toggled);
  });
}`,
    },
  };

  if (primaryTpl && primaryTpl.language !== 'css') {
    const extPath = `/${primaryTpl.filename}`;
    files[extPath] = {
      path: extPath,
      language:
        primaryTpl.language === 'ts'
          ? 'javascript'
          : (primaryTpl.language as PlaygroundFileEntry['language']),
      code: interpolatedCode,
    };
  }

  return {
    id: `resource-${resource.slug}`,
    title: resource.title,
    subtitle: `${resource.subcategory || resource.categorySlug} · Live Editable Resource Implementation`,
    category: isThree ? 'three-webgl' : 'vanilla',
    sandpackTemplate: 'vanilla',
    associatedResourceSlug: resource.slug,
    activeFile: '/styles.css',
    files,
    dependencies: {},
    customizationSettings,
    requiresLazyThreeWebGL: isThree,
  };
}

/* ============================================================================
 * 3. PRIVATE SAVED PLAYGROUND EXPERIMENTS ADAPTER
 * ========================================================================== */

const SAVED_EXPERIMENTS_STORAGE_KEY = 'dde_saved_playground_experiments_v1';

export function loadSavedPlaygroundExperiments(): SavedPlaygroundExperiment[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(SAVED_EXPERIMENTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedPlaygroundExperiment[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function savePlaygroundExperiment(
  experiment: Omit<SavedPlaygroundExperiment, 'id' | 'updatedAtIso'>
): SavedPlaygroundExperiment[] {
  const current = loadSavedPlaygroundExperiments();
  const entry: SavedPlaygroundExperiment = {
    ...experiment,
    id: `exp-${Date.now()}`,
    updatedAtIso: new Date().toISOString(),
  };
  const next = [entry, ...current].slice(0, 20);
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(
        SAVED_EXPERIMENTS_STORAGE_KEY,
        JSON.stringify(next)
      );
    } catch {
      // Ignore quota errors
    }
  }
  return next;
}

export function deleteSavedPlaygroundExperiment(
  experimentId: string
): SavedPlaygroundExperiment[] {
  const current = loadSavedPlaygroundExperiments();
  const next = current.filter((item) => item.id !== experimentId);
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(
        SAVED_EXPERIMENTS_STORAGE_KEY,
        JSON.stringify(next)
      );
    } catch {
      // Ignore quota errors
    }
  }
  return next;
}
