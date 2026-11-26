'use client';

import React from 'react';
import Link from 'next/link';
import { BRAND_CONFIG } from '@/config/brand.config';
import { TAXONOMY_CATEGORIES } from '@/lib/taxonomy/registry';

export function AppFooter() {
  const primaryCategories = TAXONOMY_CATEGORIES.slice(0, 8);
  const secondaryCategories = TAXONOMY_CATEGORIES.slice(8, 16);

  return (
    <footer className="border-t border-[var(--ds-border)] bg-[var(--ds-surface)] text-[var(--ds-muted-foreground)] mt-16">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8">
          {/* Col 1-4: Platform Description & Configurable Brand */}
          <div className="lg:col-span-4 space-y-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 font-display text-base font-bold text-[var(--ds-foreground)]"
            >
              <span className="w-6 h-6 rounded-[5px] bg-[var(--ds-primary)] text-[var(--ds-primary-foreground)] font-mono text-xs font-bold inline-flex items-center justify-center">
                {BRAND_CONFIG.shortName}
              </span>
              <span>{BRAND_CONFIG.productName}</span>
            </Link>
            <p className="text-xs leading-relaxed max-w-sm">
              {BRAND_CONFIG.missionStatement}
            </p>
            <div className="text-[11px] font-mono text-[var(--ds-subtle-foreground)] pt-1">
              Explore before reading · Demonstrate before explaining · WCAG 2.1 AA/AAA
            </div>
          </div>

          {/* Col 5-7: Main Categories (Part 1) */}
          <div className="lg:col-span-3 space-y-2.5">
            <h3 className="font-mono text-xs font-bold text-[var(--ds-foreground)]">
              Primary Categories (01–08)
            </h3>
            <ul className="space-y-1.5 text-xs">
              {primaryCategories.map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/taxonomy/${cat.slug}`}
                    className="hover:text-[var(--ds-foreground)] hover:underline transition-colors"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 8-10: Main Categories (Part 2) */}
          <div className="lg:col-span-3 space-y-2.5">
            <h3 className="font-mono text-xs font-bold text-[var(--ds-foreground)]">
              Primary Categories (09–16)
            </h3>
            <ul className="space-y-1.5 text-xs">
              {secondaryCategories.map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/taxonomy/${cat.slug}`}
                    className="hover:text-[var(--ds-foreground)] hover:underline transition-colors"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 11-12: Platform, Documentation, Playground, Community & Legal */}
          <div className="lg:col-span-2 space-y-2.5">
            <h3 className="font-mono text-xs font-bold text-[var(--ds-foreground)]">
              Platform & Community
            </h3>
            <ul className="space-y-1.5 text-xs">
              <li>
                <Link
                  href="/playground"
                  className="hover:text-[var(--ds-foreground)] hover:underline transition-colors font-semibold text-[var(--ds-accent)]"
                >
                  Interactive Playground
                </Link>
              </li>
              <li>
                <Link
                  href="/design-system"
                  className="hover:text-[var(--ds-foreground)] hover:underline transition-colors"
                >
                  Design System Showcase
                </Link>
              </li>
              <li>
                <Link
                  href="/info/documentation"
                  className="hover:text-[var(--ds-foreground)] hover:underline transition-colors"
                >
                  Documentation
                </Link>
              </li>
              <li>
                <Link
                  href="/info/submit-resource"
                  className="hover:text-[var(--ds-foreground)] hover:underline transition-colors"
                >
                  Submit Resource
                </Link>
              </li>
              <li>
                <Link
                  href="/info/community"
                  className="hover:text-[var(--ds-foreground)] hover:underline transition-colors"
                >
                  Community
                </Link>
              </li>
              <li>
                <Link
                  href="/info/about"
                  className="hover:text-[var(--ds-foreground)] hover:underline transition-colors"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/info/contact"
                  className="hover:text-[var(--ds-foreground)] hover:underline transition-colors"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  href="/admin"
                  className="hover:text-[var(--ds-foreground)] hover:underline transition-colors font-mono text-[var(--ds-accent)]"
                >
                  Admin CMS (/admin)
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Legal & Attribution Bar */}
        <div className="pt-6 border-t border-[var(--ds-border)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div>
            © {new Date().getFullYear()} {BRAND_CONFIG.productName}. Configurable Brand
            Architecture · Verifiable Open Attribution.
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <Link
              href="/info/legal"
              className="hover:text-[var(--ds-foreground)] hover:underline transition-colors"
            >
              Legal Information
            </Link>
            <Link
              href="/info/privacy"
              className="hover:text-[var(--ds-foreground)] hover:underline transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/info/terms"
              className="hover:text-[var(--ds-foreground)] hover:underline transition-colors"
            >
              Terms of Use
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
