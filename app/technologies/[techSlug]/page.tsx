import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowUpRight,
  Code2,
  ExternalLink,
  Layers,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { AppHeader } from '@/components/shell/AppHeader';
import { AppFooter } from '@/components/shell/AppFooter';
import {
  CANONICAL_TECHNOLOGIES,
  buildBreadcrumbJsonLd,
  buildTechnologyArticleJsonLd,
  buildTechnologySeoMetadata,
  getResourcesForTechnology,
  getTechnologyBySlug,
} from '@/lib/seo/metadata-architect';
import { getCategoryBySlug } from '@/lib/taxonomy/registry';
import {
  ResourceMetadata,
  TechnicalLabel,
} from '@/components/ui/ContentPrimitives';

export const revalidate = 3600;

export async function generateStaticParams() {
  return CANONICAL_TECHNOLOGIES.map((tech) => ({
    techSlug: tech.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ techSlug: string }>;
}): Promise<Metadata> {
  const { techSlug } = await params;
  return buildTechnologySeoMetadata(techSlug);
}

export default async function TechnologyDetailPage({
  params,
}: {
  params: Promise<{ techSlug: string }>;
}) {
  const { techSlug } = await params;
  const tech = getTechnologyBySlug(techSlug) || CANONICAL_TECHNOLOGIES[0];
  const relatedResources = getResourcesForTechnology(tech);
  const relatedCategories = tech.relatedCategorySlugs
    .map((slug) => getCategoryBySlug(slug))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  const articleJsonLd = buildTechnologyArticleJsonLd(tech, relatedResources);
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { label: 'Encyclopedia Home', href: '/' },
    { label: 'Implementation Technologies', href: '/technologies' },
    { label: tech.name, href: `/technologies/${tech.slug}` },
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--ds-background)] text-[var(--ds-foreground)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <AppHeader
        breadcrumbs={[
          { label: 'Encyclopedia Home', href: '/' },
          { label: 'Implementation Technologies', href: '/technologies' },
          { label: tech.name, isCurrent: true },
        ]}
      />

      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Sticky Sidebar Navigation across all Technologies */}
          <aside
            aria-label="Implementation Technologies Navigation"
            className="hidden lg:block lg:col-span-3 p-4 rounded-[12px] bg-[var(--ds-surface)] border border-[var(--ds-border)] sticky top-20 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[var(--ds-border)] pb-2.5">
              <span className="text-[11px] font-mono font-bold text-[var(--ds-accent)]">
                WEB TECHNOLOGIES ({CANONICAL_TECHNOLOGIES.length})
              </span>
              <Link
                href="/technologies"
                className="text-[11px] font-semibold text-[var(--ds-muted-foreground)] hover:text-[var(--ds-foreground)]"
              >
                All →
              </Link>
            </div>
            <nav className="space-y-1">
              {CANONICAL_TECHNOLOGIES.map((item) => {
                const isCurrent = item.slug === tech.slug;
                return (
                  <Link
                    key={item.slug}
                    href={`/technologies/${item.slug}`}
                    className={`block px-3 py-2 rounded-[8px] text-xs transition-colors ${
                      isCurrent
                        ? 'bg-[var(--ds-secondary)] text-[var(--ds-foreground)] font-bold border border-[var(--ds-accent)]'
                        : 'text-[var(--ds-muted-foreground)] hover:text-[var(--ds-foreground)] hover:bg-[var(--ds-muted)]'
                    }`}
                  >
                    <div className="truncate">{item.name}</div>
                    <div className="font-mono text-[10px] text-[var(--ds-subtle-foreground)]">
                      {item.version}
                    </div>
                  </Link>
                );
              })}
            </nav>
          </aside>

          {/* Main Technology Specification Content */}
          <article className="lg:col-span-9 space-y-8">
            <header className="p-6 sm:p-8 rounded-[12px] bg-[var(--ds-surface)] border border-[var(--ds-border-strong)] space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <ResourceMetadata
                  items={[
                    tech.category,
                    `Specification: ${tech.version}`,
                    `${relatedResources.length} Associated Resources`,
                  ]}
                />
                <Link
                  href="/technologies"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--ds-muted-foreground)] hover:text-[var(--ds-foreground)]"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>All Implementation Technologies</span>
                </Link>
              </div>

              <h1
                style={{ fontSize: 'clamp(1.75rem, 2.6vw, 2.35rem)' }}
                className="font-display font-bold tracking-tight text-[var(--ds-foreground)] text-balance"
              >
                {tech.name}
              </h1>

              <p className="text-sm sm:text-base text-[var(--ds-foreground)]/90 font-medium leading-relaxed">
                {tech.shortDescription}
              </p>

              <p className="text-xs sm:text-sm text-[var(--ds-muted-foreground)] leading-relaxed">
                {tech.architecturalOverview}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  href={tech.officialSpecUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[8px] text-xs font-semibold bg-[var(--ds-primary)] text-[var(--ds-primary-foreground)] hover:opacity-95 transition-opacity"
                >
                  <span>Official W3C / Vendor Specification</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <Link
                  href="/playground"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[8px] text-xs font-semibold bg-[var(--ds-background)] border border-[var(--ds-border-strong)] text-[var(--ds-foreground)] hover:border-[var(--ds-accent)] transition-colors"
                >
                  <Code2 className="w-3.5 h-3.5 text-[var(--ds-accent)]" />
                  <span>Test in Interactive Code Playground</span>
                </Link>
              </div>
            </header>

            {/* Key Architectural Capabilities & Code Specimen */}
            <section className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-6 p-6 rounded-[12px] bg-[var(--ds-surface)] border border-[var(--ds-border)] space-y-3">
                <TechnicalLabel
                  kicker="CORE CAPABILITIES"
                  detail="Production Engineering Patterns"
                />
                <h2 className="font-display text-lg font-bold text-[var(--ds-foreground)]">
                  Architectural Capabilities
                </h2>
                <ul className="space-y-2 text-xs sm:text-sm text-[var(--ds-muted-foreground)]">
                  {tech.keyCapabilities.map((cap) => (
                    <li key={cap} className="flex items-start gap-2">
                      <span
                        aria-hidden="true"
                        className="font-mono text-[var(--ds-accent)] font-bold"
                      >
                        ·
                      </span>
                      <span>{cap}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="md:col-span-6 p-6 rounded-[12px] bg-[var(--ds-surface)] border border-[var(--ds-border)] space-y-3">
                <TechnicalLabel
                  kicker="CANONICAL CODE SPECIMEN"
                  detail={tech.version}
                />
                <h2 className="font-display text-lg font-bold text-[var(--ds-foreground)]">
                  Reference Implementation Pattern
                </h2>
                <pre className="p-4 rounded-[8px] bg-[var(--ds-background)] border border-[var(--ds-border)] font-mono text-xs text-[var(--ds-foreground)] overflow-x-auto leading-relaxed">
                  <code>{tech.codeSpecimen}</code>
                </pre>
              </div>
            </section>

            {/* Accessibility, Performance & Browser Support Matrix */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="p-5 rounded-[12px] bg-[var(--ds-surface)] border border-[var(--ds-border)] space-y-2">
                <div className="flex items-center gap-2 font-mono text-xs font-bold text-[var(--ds-foreground)]">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>WCAG 2.2 AA Accessibility</span>
                </div>
                <p className="text-xs text-[var(--ds-muted-foreground)] leading-relaxed">
                  {tech.accessibilityConsiderations}
                </p>
              </div>

              <div className="p-5 rounded-[12px] bg-[var(--ds-surface)] border border-[var(--ds-border)] space-y-2">
                <div className="flex items-center gap-2 font-mono text-xs font-bold text-[var(--ds-foreground)]">
                  <Zap className="w-4 h-4 text-[var(--ds-accent)]" />
                  <span>Performance & Core Web Vitals</span>
                </div>
                <p className="text-xs text-[var(--ds-muted-foreground)] leading-relaxed">
                  {tech.performanceGuidance}
                </p>
              </div>

              <div className="p-5 rounded-[12px] bg-[var(--ds-surface)] border border-[var(--ds-border)] space-y-2">
                <div className="flex items-center gap-2 font-mono text-xs font-bold text-[var(--ds-foreground)]">
                  <Layers className="w-4 h-4 text-[var(--ds-accent)]" />
                  <span>Browser Compatibility</span>
                </div>
                <p className="text-xs text-[var(--ds-muted-foreground)] leading-relaxed">
                  {tech.browserSupportSummary}
                </p>
              </div>
            </section>

            {/* Associated Encyclopedia Resources (/resources/[resourceSlug]) */}
            <section className="space-y-4">
              <div>
                <TechnicalLabel
                  kicker="INTERACTIVE MONOGRAPHS USING THIS TECHNOLOGY"
                  detail={`${relatedResources.length} Verified Specimens`}
                />
                <h2 className="font-display text-xl font-bold text-[var(--ds-foreground)] mt-1">
                  Related Design Resources & Live Specimens
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {relatedResources.map((res) => (
                  <Link
                    key={res.slug}
                    href={`/resources/${res.slug}`}
                    className="p-5 rounded-[12px] bg-[var(--ds-surface)] border border-[var(--ds-border)] hover:border-[var(--ds-accent)] transition-colors flex flex-col justify-between space-y-3 group"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-mono text-[var(--ds-accent)]">
                        <span>/resources/{res.slug}</span>
                        <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </div>
                      <h3 className="font-display text-base font-bold text-[var(--ds-foreground)] group-hover:text-[var(--ds-accent)]">
                        {res.title}
                      </h3>
                      <p className="text-xs text-[var(--ds-muted-foreground)] line-clamp-2 leading-relaxed">
                        {res.summary}
                      </p>
                    </div>
                    <ResourceMetadata
                      items={[
                        `WCAG ${res.accessibilitySpec.wcagComplianceLevel}`,
                        res.audienceLevel,
                        `${res.parameterSchema.length} Live Parameters`,
                      ]}
                    />
                  </Link>
                ))}
              </div>
            </section>

            {/* Related Taxonomy Categories (/categories/[categorySlug]) */}
            {relatedCategories.length > 0 && (
              <section className="space-y-4 pt-6 border-t border-[var(--ds-border)]">
                <h2 className="font-display text-lg font-bold text-[var(--ds-foreground)]">
                  Related Primary Taxonomy Categories
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {relatedCategories.map((cat) => (
                    <Link
                      key={cat.slug}
                      href={`/categories/${cat.slug}`}
                      className="p-4 rounded-[10px] bg-[var(--ds-surface)] border border-[var(--ds-border)] hover:border-[var(--ds-accent)] transition-colors space-y-1"
                    >
                      <div className="font-mono text-xs text-[var(--ds-accent)]">
                        {String(cat.orderIndex).padStart(2, '0')} · /categories/
                        {cat.slug}
                      </div>
                      <div className="font-display text-sm font-bold text-[var(--ds-foreground)]">
                        {cat.name}
                      </div>
                      <p className="text-xs text-[var(--ds-muted-foreground)] line-clamp-2">
                        {cat.shortDescription}
                      </p>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </article>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
