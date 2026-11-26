# Digital Design Encyclopedia — Technical Architecture & Foundation Blueprint

> **Product Status:** Phase 0 — Foundation & Architectural Specification  
> **Temporary Brand Name:** Digital Design Encyclopedia (Configurable via `/config/brand.config.ts`)  
> **Runtime Environment:** Next.js 15.4.9 (App Router), React 19.2.1, TypeScript 5.9.3 (Strict Mode), Tailwind CSS 4.1.11, Node.js Server Runtime

---

## 1. Product Requirements Analysis & Experience Principles

The **Digital Design Encyclopedia** is an interactive knowledge and experimentation workbench where designers, engineers, and creative developers learn through direct manipulation ("Explore before reading, demonstrate before explaining").

### Core Functional Pillars
1. **Interactive Concept Laboratory:** Every design concept (design systems, visual styles, UI/UX patterns, motion principles) exposes real-time interactive parameters (tokens, spring physics, grid columns, contrast ratios) before presenting theoretical prose.
2. **Traceable & Verifiable Taxonomy:** Content is strictly separated into 8 canonical classifications with verifiable source attribution, license metadata, and historical context—preventing fabricated claims about real-world systems or creators.
3. **Live Code & Sandbox Playground:** Users inspect and modify live CSS Custom Properties, React/Tailwind code, and isolated sandboxed previews with deterministic state resets.
4. **Accessibility & Performance First:** Every pattern documents WCAG AA/AAA contrast compliance, WAI-ARIA keyboard navigation contracts, and `prefers-reduced-motion` fallbacks.
5. **Personal Collections & Workspace Persistence:** Users save references, parameter presets, and curated collections locally with seamless synchronization to Firebase Firestore when authenticated.

---

## 2. Validated Development Environment Audit

| Layer | Technology & Version | Validation Status & Architectural Role |
| :--- | :--- | :--- |
| **Framework** | `next@^15.4.9` (App Router) | **Verified.** Supports React Server Components (RSC) for SEO-critical encyclopedia routes, dynamic metadata generation, and API route handlers (`/app/api/*`). |
| **UI Runtime** | `react@^19.2.1`, `react-dom@^19.2.1` | **Verified.** Strict functional component architecture; client interactivity pushed to leaf nodes (`'use client'`). |
| **Type System** | `typescript@5.9.3` (`strict: true`) | **Verified.** Path alias `@/*` mapped to root. Zero `any` policy enforced across all domain models. |
| **Styling** | `tailwindcss@4.1.11`, `@tailwindcss/postcss` | **Verified.** Configured with `@custom-variant dark` and semantic CSS custom properties (`--surface-*`, `--accent-*`). |
| **Motion** | `motion@^12.23.24` (`motion/react`) | **Verified.** Installed and transpiled in `next.config.ts` for compositor-only (`transform`, `opacity`) transitions and spring physics demonstrations. |
| **Icons** | `lucide-react@^0.553.0` | **Verified.** Functional affordance icons across navigation, parameter controls, and accessibility indicators. |
| **Database & Auth** | Firebase Firestore + Auth (`firebase-tools@^15.0.0`) | **Ready for Phase 3 Provisioning.** Abstracted behind a repository adapter pattern (`LocalCollectionRepository` + `FirestoreCollectionRepository`). |

---

## 3. Modular Layered Technical Architecture

To prevent monolithic components and tightly coupled data, the codebase is partitioned into 7 strict logical layers:

```text
/
├── app/                          # Next.js App Router (Routing, RSC Layouts, SEO Metadata, API Routes)
│   ├── layout.tsx                # Root shell, typography variables, theme initialization
│   ├── page.tsx                  # Encyclopedia Foundation Workbench & Interactive Concept Lab
│   └── api/                      # Server-side endpoints (health, taxonomy validation, AI/search proxies)
├── config/                       # White-label & environment configuration
│   └── brand.config.ts           # Configurable product branding, feature flags, navigation contracts
├── types/                        # Strict TypeScript domain models (Zero runtime overhead)
│   └── encyclopedia.ts           # Primary entities: DesignResource, TaxonomyNode, InteractiveParameter, etc.
├── lib/                          # Business logic, taxonomy engine, data access & sandbox execution
│   ├── taxonomy/
│   │   └── registry.ts           # Extensible 8-classification taxonomy graph & lookup algorithms
│   ├── resources/
│   │   └── seed-foundation.ts    # Verified, attributed foundation entries with live parameter schemas
│   ├── sandbox/
│   │   └── execution-engine.ts   # Secure code generation, CSS token compiler & CSP iframe sandbox builder
│   └── collections/
│       └── storage-adapter.ts    # Personal collections storage abstraction (LocalStorage + Firestore interface)
├── components/                   # Presentation layer (Strictly separated from data definitions)
│   ├── shell/                    # Application shell (Top Bar Contract header, theme controller)
│   └── workbench/                # Interactive Concept Lab, Parameter Inspector, Architecture Explorer
└── docs/
    └── ARCHITECTURE.md           # Living architectural blueprint & phased implementation roadmap
```

---

## 4. Primary Data Entities & Domain Schema

Defined in `/types/encyclopedia.ts`:

1. **`ResourceClassification` (8 Canonical Types):**
   - `official-design-system` (e.g., Material Design 3, Apple HIG, Carbon)
   - `design-methodology` (e.g., Atomic Design, Swiss Grids, Intrinsic Web Design)
   - `visual-style` (e.g., Neo-Brutalism, Bauhaus Functionalism, Tactile Skeuomorphism)
   - `interaction-pattern` (e.g., Command Palette, Optimistic UI, Progressive Disclosure)
   - `ui-component` (e.g., Accessible Combobox, Modal Dialog, Data Grid)
   - `animation-technique` (e.g., Spring Physics, FLIP Layout Transitions, Choreography)
   - `development-technology` (e.g., CSS Container Queries, View Transitions API, WebGL Shaders)
   - `community-example` (Attributed open-source implementations)
2. **`TaxonomyCategory`:** Hierarchical, extensible category node supporting parent/child slugs, semantic relationships, and dynamic filtering without structural code changes.
3. **`DesignResource`:** Core encyclopedia record with stable `id`, URL `slug`, `classification`, `summary`, `interactiveParameters[]`, `codeTemplates`, `accessibilitySpec`, `sourceAttribution`, and `relatedSlugs[]`.
4. **`InteractiveParameter`:** Typed control schema (`range` | `select` | `boolean` | `color`) defining `key`, `label`, `unit`, `min`, `max`, `step`, `defaultValue`, and `cssVariable` or `propTarget`.
5. **`SourceAttribution`:** Verifiable provenance record containing `authorOrOrganization`, `officialUrl`, `licenseType`, `publicationYear`, and `verificationNotes`.
6. **`AccessibilityAuditSpec`:** Mandatory compliance specification (`wcagLevel`, `keyboardBindings[]`, `ariaRoles[]`, `reducedMotionBehavior`, `minContrastRatio`).
7. **`UserCollection` & `SavedPreset`:** User-curated bookmark lists and customized interactive parameter snapshots.

---

## 5. Application Routing Strategy (Next.js App Router)

Designed for clean URL ergonomics, deep-linkable parameter states, and full SSR/ISR SEO discoverability:

- `/` — **Interactive Encyclopedia Workbench & Concept Explorer** (Direct hands-on exploration, category matrix, live parameter lab, and architecture foundation).
- `/taxonomy/[categorySlug]` — *(Phase 2)* Server-rendered category index with instant faceted filtering and comparison matrices.
- `/concept/[resourceSlug]` — *(Phase 2)* Deep-dive concept page featuring the 2-Zone Sandbox Layout (Interactive Stage + Control Deck), live code playground, accessibility spec, and related concept graph.
- `/playground/[resourceSlug]?preset=[encodedState]` — *(Phase 3)* Full-viewport Sandpack/Iframe live code studio with shareable parameter URLs.
- `/collections` — *(Phase 3)* Personal reference library and custom token preset manager backed by Firebase Auth & Firestore.
- `/admin` — *(Phase 4)* Role-guarded content curation and taxonomy validation dashboard.

---

## 6. Design System Architecture

- **Typographic Hierarchy (2+1 Font Rule):**
  - *Display Face:* `Bricolage Grotesque` (Expressive architectural structure for titles and concept headings).
  - *Body Face:* `Plus Jakarta Sans` (High-legibility geometric prose at 14px–16px).
  - *Monospace / Telemetry:* `JetBrains Mono` with `font-variant-numeric: tabular-nums` (Code editors, token values, live parameter readouts, contrast ratios).
- **60-30-10 Color & Contrast System:**
  - *60% Dominant Neutral Canvas:* `#F8FAFC` (Light) / `#0F172A` (Dark).
  - *30% Structural Surfaces:* `#FFFFFF` / `#1E293B` with `1px solid` hairline dividers (`#E2E8F0` / `#1E293B`). Single-elevation depth (no cards nested within cards).
  - *10% Semantic Accent Budget:* High-intent Sky Azure (`#0284C7` / `#38BDF8`) for active controls, supplemented by dual-coded semantic badges (`Nominal / AA Pass`, `Warning`, `Critical`).
- **Strict Top Bar Contract:**
  - Single row, 3 zones separated by `gap-8`: `[Configurable Brand Wordmark]` — `[5 Single-Line Text Nav Links]` — `[1 Primary Action CTA]`.
- **Zero-Pill Metadata Discipline:**
  - All static metadata (classifications, publication years, license types, read times) renders as clean inline typography separated by `·` or `/`. Functional buttons and segmented filter tabs use tactile interactive containers.

---

## 7. Live-Demo Execution Strategy

To satisfy *"Make every published concept interactive"* while guaranteeing 60fps performance and strict security isolation, live demonstrations execute across three graduated tiers:

1. **Tier 1 — Native Parameterized Token Engine (Zero-Latency):**
   - Controls bind directly to scoped CSS Custom Properties (`--demo-radius`, `--demo-stiffness`, `--demo-columns`, `--demo-contrast`) and React state on an isolated stage container. Executes in `< 2ms` with zero iframe overhead.
2. **Tier 2 — Sandboxed Iframe Preview Engine (`ExecutionEngine`):**
   - Compiles user-modified HTML/CSS/JS templates into a strictly isolated `<iframe sandbox="allow-scripts">` using `srcdoc` with a locked Content Security Policy (`default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'`). Prevents parent DOM access, cookie theft, or network exfiltration.
3. **Tier 3 — On-Demand Sandpack Bundler (Phase 3 Expansion):**
   - Lazy-loaded multi-file React/TypeScript bundler initialized only when a user clicks *"Open Full Code Studio"*, keeping initial page load bundle size minimal.

---

## 8. Security & Performance Constraints

### Security Guardrails
- **No Arbitrary Server-Side Execution:** User-edited code in the playground never executes on the Node.js server. All code compilation and preview rendering occurs client-side inside origin-isolated sandboxed frames.
- **Strict Secret Hygiene:** Server-side API keys (`GEMINI_API_KEY`) reside exclusively in Next.js Route Handlers (`/app/api/*`) and are never prefixed with `NEXT_PUBLIC_`.
- **Attribution & License Integrity:** Every resource entity enforces mandatory `SourceAttribution` schema validation so community examples, open-source libraries, and proprietary design systems are accurately distinguished.

### Performance Budgets
- **Compositor-Only Motion:** UI animations restrict transitions to `transform` and `opacity` with routine feedback settling in `<= 150ms`.
- **Reduced-Motion Compliance:** Global `@media (prefers-reduced-motion: reduce)` CSS rules and a live workbench Reduced-Motion Simulator toggle allow users to test instant state changes without vestigial motion.
- **Zero External Image Fragility:** All visual diagrams are rendered via deterministic, interactive SVG/CSS geometry canvases or generated assets with graceful fallback containers.

---

## 9. Phased Implementation Plan

| Phase | Scope & Deliverables | Status |
| :--- | :--- | :--- |
| **Phase 0: Foundation & Architecture** | Environment validation, configurable brand system, primary TypeScript entities, extensible 8-tier taxonomy registry, live parameterized concept lab, sandboxed execution engine, and architectural blueprint viewer. | **COMPLETE (Current Turn)** |
| **Phase 1: Core Taxonomy & Concept Detail Pages** | Dynamic App Router routes (`/taxonomy/[slug]`, `/concept/[slug]`), faceted multi-criteria search engine, and 20+ verified interactive encyclopedia entries across all 8 classifications. | **Planned — Next Phase** |
| **Phase 2: Multi-File Code Playground & Accessibility Auditor** | Full client-side code editor with live AST parameter bi-directional syncing, automated WCAG contrast & ARIA tree inspector, and responsive viewport resizer. | **Planned** |
| **Phase 3: Firebase Persistence & Personal Collections** | Provision Firebase Auth & Firestore (`firestore.rules`), sync personal collections and custom parameter presets across devices, and enable shareable playground permalinks. | **Planned** |
| **Phase 4: Admin Curation & Community Submissions** | Role-based admin validation dashboard, schema linter for new design resources, and automated Playwright/Vitest accessibility regression suite. | **Planned** |
