# Digital Design Encyclopedia — Global Visual Design Language & Design System Specification

> **Phase 1 Deliverable:** Editorial-Technical Design System & Reusable Component Architecture  
> **Live Interactive Showcase Route:** `/design-system`  
> **Token Source of Truth:** `/app/globals.css` & `/lib/design-system/tokens.ts`

---

## 1. Art Direction & Visual Philosophy

The visual identity of the **Digital Design Encyclopedia** synthesizes four disciplines:
1. **Editorial Monograph:** High-contrast typography, generous structural margins, unboxed inline metadata separated by middots (`·`), and balanced headline measures.
2. **Interactive Creative Playground:** Direct-manipulation sliders, responsive device viewport switchers, and tactile spring physics.
3. **Modern Developer Tool:** Tabular monospace numerals (`tabular-nums`), syntax code blocks with line numbers, and origin-isolated CSP sandboxes.
4. **Structured Design Systems Library:** Single-elevation 1px hairline borders, 60-30-10 color allocation, and deterministic WCAG 2.1 AA/AAA keyboard focus states.

---

## 2. Semantic Color System (`--ds-*`)

Color selection persists across sessions via `ThemeProvider` (`localStorage` key `dde_theme_preference_v1`) and never relies on hue alone to communicate status.

| Token Variable | Semantic Role | Light Theme | Dark Theme | Contrast / Allocation Rule |
| :--- | :--- | :--- | :--- | :--- |
| `--ds-background` | Dominant Canvas | `#F6F8FA` (Cool Neutral) | `#0B0F17` (Deep Charcoal) | 60% Viewport Field |
| `--ds-surface` | Container Surface | `#FFFFFF` | `#111827` (Graphite) | 30% Structural Panels |
| `--ds-surface-elevated` | Overlay Surface | `#FFFFFF` | `#1A2333` | Modals, Drawers, Dropdowns |
| `--ds-muted` | Sunken / Track Surface | `#F1F5F9` | `#1E293B` | Segmented Tracks & Code Headers |
| `--ds-foreground` | Primary Ink | `#111827` | `#F8FAFC` | 15.4:1 / 16.8:1 (WCAG AAA) |
| `--ds-muted-foreground` | Secondary Ink | `#4B5563` | `#CBD5E1` | 7.1:1 / 11.2:1 (WCAG AAA) |
| `--ds-primary` | Brand Primary Action | `#4338CA` (Blue-Violet) | `#6366F1` | 10% Focal Action Budget |
| `--ds-secondary` | Tonal Accent Surface | `#EEF2FF` | `#1E1B4B` | Active Selections & Callouts |
| `--ds-accent` | Interactive Highlight | `#4F46E5` | `#818CF8` | Active Underlines & Sliders |
| `--ds-border` | Hairline Divider | `#E2E8F0` | `#1E293B` | 1px Structural Separation |
| `--ds-border-strong` | Interactive Boundary | `#CBD5E1` | `#334155` | Inputs, Buttons, Overlays |
| `--ds-focus` | Keyboard Focus Ring | `#4F46E5` | `#818CF8` | 2px Solid Outline + 2px Offset |
| `--ds-success` | Verified / Nominal | `#047857` | `#34D399` | Paired with Check Icon + Label |
| `--ds-warning` | Architectural Caution | `#B45309` | `#FBBF24` | Paired with Triangle Icon + Label |
| `--ds-error` | Critical / Violation | `#B91C1C` | `#F87171` | Paired with Octagon Icon + Label |

---

## 3. Typography Hierarchy (2+1 Font Rule)

- **Display & Headings (`--font-display`):** `Bricolage Grotesque` (Weights 600, 700)
- **Body & UI Controls (`--font-sans`):** `Plus Jakarta Sans` (Weights 400, 500, 600, 700)
- **Code & Tabular Telemetry (`--font-mono`):** `JetBrains Mono` (`tabular-nums`)

| Scale Role | Fluid / Fixed Size | Line Height | Measure Limit | Application |
| :--- | :--- | :--- | :--- | :--- |
| **Display** | `clamp(2rem, 3.2vw, 2.75rem)` | `1.12` | `26ch` | Workbench mastheads |
| **Page Title (H1)** | `clamp(1.625rem, 2.4vw, 2.125rem)` | `1.18` | `34ch` | Concept & route titles |
| **Section Title (H2)** | `clamp(1.25rem, 1.8vw, 1.5rem)` | `1.25` | `45ch` | Major section headers |
| **Subheading (H3)** | `1.0625rem (17px)` | `1.35` | `55ch` | Card & modal headers |
| **Body Text** | `0.9375rem (15px)` | `1.65` | `68ch` | Encyclopedia prose |
| **Supporting Text** | `0.8125rem (13px)` | `1.55` | `62ch` | Parameter descriptions |
| **Labels & Controls** | `0.75rem (12px)` | `1.40` | `nowrap` | Buttons, tabs, inputs |
| **Metadata** | `0.75rem (12px)` | `1.40` | Inline flow | Unboxed `·` separated items |
| **Code Typography** | `0.75rem (12px)` | `1.60` | Pre / Scroll | Live code & token values |

---

## 4. Layout & Spatial Architecture

- **Main Content Width (`--ds-layout-max-width`):** `1360px`
- **Wide Showcase Width (`--ds-layout-wide-width`):** `1440px`
- **Optimal Reading Width (`--ds-layout-reading-width`):** `68ch`
- **Sidebar Width (`--ds-layout-sidebar-width`):** `264px`
- **Top Navigation Height (`--ds-layout-nav-height`):** `64px`
- **4px Harmonic Spacing Scale:** `4px, 8px, 12px, 16px, 20px, 24px, 32px, 48px, 64px`

---

## 5. Reusable Component Library Inventory

All primitives reside in `/components/ui/` and are demonstrated live at `/design-system`:

1. **Navigation (`/components/ui/NavigationPrimitives.tsx` & `/components/shell/AppHeader.tsx`):**
   - `AppHeader` (Strict 3-zone Top Bar Contract + Contextual Workspace Toolbar)
   - `MegaMenu` (8-classification taxonomy directory popover)
   - `Breadcrumbs` (Semantic `<nav aria-label="Breadcrumb">`)
   - `SidebarNavigation` (Sticky 264px vertical outline navigation)
   - `MobileNavigationDrawer` (Off-canvas sheet with `>= 44px` touch targets)
   - `SearchTrigger` (`⌘K` instant command lookup dialog)
2. **Content (`/components/ui/ContentPrimitives.tsx`):**
   - `ResourceCard`, `CategoryCard`, `FeaturedResourceCard`, `RelatedResourceCard`
   - `ResourceMetadata` (Zero-pill inline text with `·` separators)
   - `TechnicalLabel` (Editorial monospace section kicker)
   - `SemanticAlert` (Dual-coded status callouts without thick left accent borders)
3. **Interaction (`/components/ui/InteractionPrimitives.tsx`):**
   - `Button` (`primary`, `secondary`, `outline`, `ghost`, `danger`; `sm`, `md`, `lg`; loading & selected states)
   - `IconButton` (Accessible icon control with mandatory `aria-label`)
   - `Tabs` (`segmented` and `underline` variants with `ArrowLeft`/`ArrowRight` keyboard support)
   - `DropdownMenu`, `Tooltip`, `Dialog`, `Drawer`, `Accordion`, `ToastProvider` (`useToast`)
4. **Technical (`/components/ui/TechnicalPrimitives.tsx`):**
   - `CodeBlock` (Line numbers, language header, copy button)
   - `CopyButton`, `EditorPanel`
   - `LivePreviewContainer` & `DevicePreviewSelector` (`Desktop 100%`, `Tablet 768px`, `Mobile 375px`, plus fullscreen mode)
   - `ResizableSplitPanel` (Pointer drag + keyboard `ArrowLeft`/`ArrowRight` on `role="separator"`)
   - `LoadingSkeleton` (`card`, `code`, `table-row` geometry placeholders)
