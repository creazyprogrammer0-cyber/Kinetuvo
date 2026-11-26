import type { Metadata } from 'next';
import Link from 'next/link';
import { Compass, Code2, Search, ArrowLeft, Layers } from 'lucide-react';
import { AppHeader } from '@/components/shell/AppHeader';
import { AppFooter } from '@/components/shell/AppFooter';
import { TAXONOMY_CATEGORIES } from '@/lib/taxonomy/registry';
import { FOUNDATION_RESOURCES } from '@/lib/resources/seed-foundation';
import { CANONICAL_TECHNOLOGIES } from '@/lib/seo/metadata-architect';

export const metadata: Metadata = {
  title: '404 — Page Not Found | Digital Design Encyclopedia',
  description:
    'The requested design resource, taxonomy category, or technology specification could not be found. Browse our 16 canonical design categories or interactive playground.',
  robots: {
    index: false,
    follow: true,
  },
};

export default function NotFoundPage() {
  const featuredCategories = TAXONOMY_CATEGORIES.slice(0, 6);
  const featuredResources = FOUNDATION_RESOURCES.slice(0, 4);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--ds-background)] text-[var(--ds-foreground)]">
      <AppHeader
        breadcrumbs={[
          { label: 'Encyclopedia Home', href: '/' },
          { label: '404 Not Found', isCurrent: true },
        ]}
      />

      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10"
      >
        <section className="p-8 rounded-[12px] bg-[var(--ds-surface)] border border-[var(--ds-border-strong)] space-y-4">
          <div className="text-xs font-mono font-semibold text-[var(--ds-accent)]">
            HTTP 404 · RESOURCE NOT FOUND · NOINDEX RECOVERY ROUTE
          </div>
          <h1
            style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)' }}
            className="font-display font-bold tracking-tight text-[var(--ds-foreground)] text-balance"
          >
            Requested Design Concept or Taxonomy Track Was Not Found
          </h1>
          <p className="text-sm sm:text-base text-[var(--ds-muted-foreground)] max-w-2xl leading-relaxed">
            The URL you requested may have been moved, merged into a canonical
            taxonomy category, or unpublished from the public encyclopedia index.
            Use the direct discovery links below to continue exploring.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[8px] text-xs font-semibold bg-[var(--ds-primary)] text-[var(--ds-primary-foreground)] hover:opacity-95 transition-opacity"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Encyclopedia Home</span>
            </Link>
            <Link
              href="/directory"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[8px] text-xs font-semibold bg-[var(--ds-surface)] border border-[var(--ds-border-strong)] text-[var(--ds-foreground)] hover:border-[var(--ds-accent)] transition-colors"
            >
              <Compass className="w-3.5 h-3.5 text-[var(--ds-accent)]" />
              <span>Browse Resource Directory</span>
            </Link>
            <Link
              href="/search"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[8px] text-xs font-semibold bg-[var(--ds-surface)] border border-[var(--ds-border-strong)] text-[var(--ds-foreground)] hover:border-[var(--ds-accent)] transition-colors"
            >
              <Search className="w-3.5 h-3.5 text-[var(--ds-accent)]" />
              <span>Search All Concepts</span>
            </Link>
            <Link
              href="/playground"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[8px] text-xs font-semibold bg-[var(--ds-surface)] border border-[var(--ds-border-strong)] text-[var(--ds-foreground)] hover:border-[var(--ds-accent)] transition-colors"
            >
              <Code2 className="w-3.5 h-3.5 text-[var(--ds-accent)]" />
              <span>Launch Code Playground</span>
            </Link>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <section className="lg:col-span-7 space-y-4">
            <h2 className="font-display text-lg font-bold text-[var(--ds-foreground)]">
              Explore Canonical Design Categories
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {featuredCategories.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/categories/${cat.slug}`}
                  className="p-4 rounded-[10px] bg-[var(--ds-surface)] border border-[var(--ds-border)] hover:border-[var(--ds-accent)] transition-colors space-y-1"
                >
                  <div className="font-mono text-[11px] text-[var(--ds-accent)]">
                    {String(cat.orderIndex).padStart(2, '0')} · /categories/
                    {cat.slug}
                  </div>
                  <h3 className="font-display text-sm font-bold text-[var(--ds-foreground)]">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-[var(--ds-muted-foreground)] line-clamp-2">
                    {cat.shortDescription}
                  </p>
                </Link>
              ))}
            </div>
          </section>

          <section className="lg:col-span-5 space-y-4">
            <h2 className="font-display text-lg font-bold text-[var(--ds-foreground)]">
              Featured Resources & Technologies
            </h2>
            <div className="space-y-2.5">
              {featuredResources.map((res) => (
                <Link
                  key={res.slug}
                  href={`/resources/${res.slug}`}
                  className="block p-3.5 rounded-[10px] bg-[var(--ds-surface)] border border-[var(--ds-border)] hover:border-[var(--ds-accent)] transition-colors"
                >
                  <div className="font-display text-sm font-bold text-[var(--ds-foreground)]">
                    {res.title}
                  </div>
                  <div className="font-mono text-[11px] text-[var(--ds-muted-foreground)] mt-0.5">
                    /resources/{res.slug} · WCAG{' '}
                    {res.accessibilitySpec.wcagComplianceLevel}
                  </div>
                </Link>
              ))}
              {CANONICAL_TECHNOLOGIES.slice(0, 3).map((tech) => (
                <Link
                  key={tech.slug}
                  href={`/technologies/${tech.slug}`}
                  className="flex items-center justify-between p-3 rounded-[10px] bg-[var(--ds-surface)] border border-[var(--ds-border)] hover:border-[var(--ds-accent)] transition-colors text-xs"
                >
                  <span className="inline-flex items-center gap-2 font-semibold text-[var(--ds-foreground)]">
                    <Layers className="w-3.5 h-3.5 text-[var(--ds-accent)]" />
                    <span>{tech.name}</span>
                  </span>
                  <span className="font-mono text-[11px] text-[var(--ds-muted-foreground)]">
                    /technologies/{tech.slug}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
