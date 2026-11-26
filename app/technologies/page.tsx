import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight, Code2, Layers, ShieldCheck, Zap } from 'lucide-react';
import { AppHeader } from '@/components/shell/AppHeader';
import { AppFooter } from '@/components/shell/AppFooter';
import {
  CANONICAL_TECHNOLOGIES,
  buildBreadcrumbJsonLd,
  buildCanonicalUrl,
  getResourcesForTechnology,
} from '@/lib/seo/metadata-architect';
import {
  ResourceMetadata,
  TechnicalLabel,
} from '@/components/ui/ContentPrimitives';

export const revalidate = 3600;

export const metadata: Metadata = {
  title:
    'Frontend Implementation Technologies & Web Standards | Digital Design Encyclopedia',
  description:
    'Explore canonical W3C Web Standards, WAI-ARIA 1.2 accessibility specifications, CSS Custom Properties, CSS Grid & Subgrid, Web Animations API, SVG Filters, HTML5 Canvas, React 19, and Three.js WebGL.',
  alternates: {
    canonical: buildCanonicalUrl('/technologies'),
  },
  openGraph: {
    title:
      'Frontend Implementation Technologies & Web Standards | Digital Design Encyclopedia',
    description:
      'Explore canonical W3C Web Standards, WAI-ARIA 1.2 accessibility specifications, CSS Custom Properties, CSS Grid & Subgrid, Web Animations API, SVG Filters, HTML5 Canvas, React 19, and Three.js WebGL.',
    url: buildCanonicalUrl('/technologies'),
    type: 'website',
  },
};

export default function TechnologiesDirectoryPage() {
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { label: 'Encyclopedia Home', href: '/' },
    { label: 'Implementation Technologies', href: '/technologies' },
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--ds-background)] text-[var(--ds-foreground)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <AppHeader
        breadcrumbs={[
          { label: 'Encyclopedia Home', href: '/' },
          { label: 'Implementation Technologies', isCurrent: true },
        ]}
      />

      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10"
      >
        <section className="p-6 sm:p-8 rounded-[12px] bg-[var(--ds-surface)] border border-[var(--ds-border-strong)] space-y-4">
          <ResourceMetadata
            items={[
              `${CANONICAL_TECHNOLOGIES.length} Canonical Web Technologies`,
              'W3C & WHATWG Standards',
              'WCAG 2.2 AA & Core Web Vitals Guidance',
            ]}
          />
          <h1
            style={{ fontSize: 'clamp(1.75rem, 2.8vw, 2.5rem)' }}
            className="font-display font-bold tracking-tight text-[var(--ds-foreground)] text-balance"
          >
            Frontend Implementation Technologies & Web Standards
          </h1>
          <p className="text-sm sm:text-base text-[var(--ds-muted-foreground)] max-w-3xl leading-relaxed">
            Every design system, visual style, interaction pattern, and motion
            principle in the Digital Design Encyclopedia is grounded in
            verifiable web standards. Select any technology below to inspect its
            architectural capabilities, accessibility contracts, performance
            budgets, and associated interactive resources.
          </p>
        </section>

        <section
          aria-label="Canonical Implementation Technologies"
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {CANONICAL_TECHNOLOGIES.map((tech, idx) => {
            const linkedResources = getResourcesForTechnology(tech);
            return (
              <article
                key={tech.slug}
                className="p-6 rounded-[12px] bg-[var(--ds-surface)] border border-[var(--ds-border)] hover:border-[var(--ds-accent)] transition-colors flex flex-col justify-between space-y-5"
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <TechnicalLabel
                      kicker={`0${idx + 1} · ${tech.category.toUpperCase()}`}
                      detail={tech.version}
                    />
                    <span className="font-mono text-xs text-[var(--ds-accent)] tabular-nums">
                      {linkedResources.length} monographs
                    </span>
                  </div>

                  <h2 className="font-display text-xl font-bold text-[var(--ds-foreground)]">
                    <Link
                      href={`/technologies/${tech.slug}`}
                      className="hover:text-[var(--ds-accent)] transition-colors"
                    >
                      {tech.name}
                    </Link>
                  </h2>

                  <p className="text-xs sm:text-sm text-[var(--ds-muted-foreground)] leading-relaxed">
                    {tech.shortDescription}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                    <div className="p-3 rounded-[8px] bg-[var(--ds-background)] border border-[var(--ds-border)] space-y-1">
                      <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-[var(--ds-foreground)]">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        <span>WCAG 2.2 AA Contract</span>
                      </div>
                      <p className="text-[11px] text-[var(--ds-muted-foreground)] line-clamp-2">
                        {tech.accessibilityConsiderations}
                      </p>
                    </div>
                    <div className="p-3 rounded-[8px] bg-[var(--ds-background)] border border-[var(--ds-border)] space-y-1">
                      <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-[var(--ds-foreground)]">
                        <Zap className="w-3.5 h-3.5 text-[var(--ds-accent)]" />
                        <span>Performance Budget</span>
                      </div>
                      <p className="text-[11px] text-[var(--ds-muted-foreground)] line-clamp-2">
                        {tech.performanceGuidance}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[var(--ds-border)] flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[var(--ds-muted-foreground)]">
                    <Layers className="w-3.5 h-3.5 text-[var(--ds-accent)]" />
                    <span>/technologies/{tech.slug}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <Link
                      href={`/technologies/${tech.slug}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[8px] text-xs font-semibold bg-[var(--ds-primary)] text-[var(--ds-primary-foreground)] hover:opacity-95 transition-opacity"
                    >
                      <Code2 className="w-3.5 h-3.5" />
                      <span>Open Specification</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      </main>

      <AppFooter />
    </div>
  );
}
