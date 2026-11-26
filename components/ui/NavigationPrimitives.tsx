'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  ChevronRight,
  Grid,
  Compass,
  Menu,
  ArrowUpRight,
  Layers,
  BookOpen,
} from 'lucide-react';
import { DesignResource, TaxonomyCategory } from '@/types/encyclopedia';
import { getClassificationDescriptor } from '@/lib/taxonomy/registry';
import { Button, Dialog, Drawer } from '@/components/ui/InteractionPrimitives';
import { ResourceMetadata } from '@/components/ui/ContentPrimitives';

/* ============================================================================
 * 1. BREADCRUMBS
 * ========================================================================== */

export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
  isCurrent?: boolean;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center text-xs">
      <ol className="flex flex-wrap items-center gap-1.5 text-[var(--ds-muted-foreground)]">
        {items.map((item, idx) => (
          <li key={`${item.label}-${idx}`} className="flex items-center gap-1.5">
            {idx > 0 && (
              <ChevronRight
                className="w-3.5 h-3.5 text-[var(--ds-subtle-foreground)] shrink-0"
                aria-hidden="true"
              />
            )}
            {item.isCurrent ? (
              <span
                aria-current="page"
                className="font-semibold text-[var(--ds-foreground)]"
              >
                {item.label}
              </span>
            ) : item.onClick ? (
              <button
                type="button"
                onClick={item.onClick}
                className="hover:text-[var(--ds-foreground)] hover:underline transition-colors"
              >
                {item.label}
              </button>
            ) : item.href ? (
              <Link
                href={item.href}
                className="hover:text-[var(--ds-foreground)] hover:underline transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span>{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/* ============================================================================
 * 2. COMMAND SEARCH TRIGGER & INSTANT SEARCH DIALOG
 * ========================================================================== */

export interface SearchTriggerProps {
  resources: DesignResource[];
  categories: TaxonomyCategory[];
  onSelectResource: (slug: string) => void;
}

export function SearchTrigger({
  resources,
  categories,
  onSelectResource,
}: SearchTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const matchedResources = useMemo(() => {
    if (!query.trim()) return resources;
    const q = query.toLowerCase();
    return resources.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.summary.toLowerCase().includes(q) ||
        r.classification.toLowerCase().includes(q)
    );
  }, [resources, query]);

  const matchedCategories = useMemo(() => {
    if (!query.trim()) return categories.slice(0, 3);
    const q = query.toLowerCase();
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.shortDescription.toLowerCase().includes(q)
    );
  }, [categories, query]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Search encyclopedia concepts and tokens (Shortcut Command+K)"
        className="inline-flex items-center justify-between gap-3 px-3 py-1.5 text-xs bg-[var(--ds-surface)] border border-[var(--ds-border-strong)] hover:border-[var(--ds-accent)] rounded-[8px] text-[var(--ds-muted-foreground)] hover:text-[var(--ds-foreground)] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ds-focus)]"
      >
        <span className="inline-flex items-center gap-2">
          <Search className="w-3.5 h-3.5 text-[var(--ds-accent)]" />
          <span>Search Encyclopedia...</span>
        </span>
        <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-[var(--ds-muted)] border border-[var(--ds-border)] rounded text-[var(--ds-foreground)]">
          ⌘K
        </kbd>
      </button>

      <Dialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Encyclopedia Command & Concept Lookup"
        description="Filter interactive concepts, WAI-ARIA patterns, and taxonomy tracks."
      >
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-[var(--ds-muted-foreground)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tokens, grids, spring physics, ARIA..."
              className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-[var(--ds-background)] border border-[var(--ds-border-strong)] rounded-[8px] text-[var(--ds-foreground)] focus:outline-2 focus:outline-[var(--ds-focus)]"
            />
          </div>

          <div className="max-h-72 overflow-y-auto space-y-4 pr-1">
            <div className="space-y-1.5">
              <div className="text-[11px] font-mono font-semibold text-[var(--ds-muted-foreground)]">
                INTERACTIVE DESIGN CONCEPTS ({matchedResources.length})
              </div>
              {matchedResources.length === 0 ? (
                <p className="text-xs text-[var(--ds-muted-foreground)] py-2">
                  No concepts match &quot;{query}&quot;.
                </p>
              ) : (
                <div className="divide-y divide-[var(--ds-border)] border border-[var(--ds-border)] rounded-[8px] overflow-hidden">
                  {matchedResources.map((res) => {
                    const desc = getClassificationDescriptor(res.classification);
                    return (
                      <button
                        key={res.id}
                        type="button"
                        onClick={() => {
                          onSelectResource(res.slug);
                          setIsOpen(false);
                        }}
                        className="w-full text-left px-3.5 py-2.5 bg-[var(--ds-surface)] hover:bg-[var(--ds-muted)] flex items-center justify-between gap-3 transition-colors"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-[var(--ds-foreground)] truncate">
                            {res.title}
                          </div>
                          <ResourceMetadata
                            items={[
                              desc.label,
                              `WCAG ${res.accessibilitySpec.wcagComplianceLevel}`,
                            ]}
                          />
                        </div>
                        <ArrowUpRight className="w-3.5 h-3.5 text-[var(--ds-accent)] shrink-0" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {matchedCategories.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[11px] font-mono font-semibold text-[var(--ds-muted-foreground)]">
                  TAXONOMY TRACKS ({matchedCategories.length})
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  {matchedCategories.map((cat) => (
                    <div
                      key={cat.id}
                      className="px-3 py-2 rounded-[6px] bg-[var(--ds-muted)]/60 border border-[var(--ds-border)] text-xs flex items-center justify-between"
                    >
                      <span className="font-semibold text-[var(--ds-foreground)]">
                        {cat.name}
                      </span>
                      <span className="font-mono text-[11px] text-[var(--ds-muted-foreground)]">
                        {cat.architecturalScope.split('·')[0]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Dialog>
    </>
  );
}

/* ============================================================================
 * 3. TAXONOMY MEGA MENU
 * ========================================================================== */

export interface MegaMenuProps {
  categories: TaxonomyCategory[];
  resources: DesignResource[];
  onSelectResource: (slug: string) => void;
}

export function MegaMenu({
  categories,
  resources,
  onSelectResource,
}: MegaMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        isSelected={isOpen}
        aria-expanded={isOpen}
        leftIcon={<Grid className="w-3.5 h-3.5 text-[var(--ds-accent)]" />}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        Taxonomy Mega-Index
      </Button>

      {isOpen && (
        <div
          role="region"
          aria-label="Encyclopedia Taxonomy Mega Menu"
          className="absolute left-0 mt-2 z-40 w-[92vw] max-w-4xl p-5 bg-[var(--ds-surface-elevated)] border border-[var(--ds-border-strong)] rounded-[12px] shadow-2xl space-y-4"
        >
          <div className="flex items-center justify-between border-b border-[var(--ds-border)] pb-3">
            <div>
              <div className="text-xs font-mono font-semibold text-[var(--ds-accent)]">
                8-CLASSIFICATION KNOWLEDGE DIRECTORY
              </div>
              <p className="text-xs text-[var(--ds-muted-foreground)]">
                Direct navigation across official design systems, layout grids, motion
                physics, and WAI-ARIA primitives.
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
              Close Index
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {categories.map((cat) => {
              const linkedResources = resources.filter(
                (r) => r.categorySlug === cat.slug
              );
              return (
                <div
                  key={cat.id}
                  className="p-3.5 rounded-[8px] bg-[var(--ds-background)] border border-[var(--ds-border)] space-y-2"
                >
                  <div className="text-[11px] font-mono text-[var(--ds-accent)]">
                    0{cat.orderIndex} · /taxonomy/{cat.slug}
                  </div>
                  <div className="font-display text-sm font-bold text-[var(--ds-foreground)]">
                    {cat.name}
                  </div>
                  <p className="text-xs text-[var(--ds-muted-foreground)] leading-relaxed">
                    {cat.shortDescription}
                  </p>
                  {linkedResources.length > 0 && (
                    <div className="pt-2 border-t border-[var(--ds-border)] space-y-1">
                      {linkedResources.map((lr) => (
                        <button
                          key={lr.slug}
                          type="button"
                          onClick={() => {
                            onSelectResource(lr.slug);
                            setIsOpen(false);
                          }}
                          className="w-full text-left text-xs font-semibold text-[var(--ds-accent)] hover:underline flex items-center justify-between"
                        >
                          <span className="truncate">{lr.title.split('&')[0]}</span>
                          <ArrowUpRight className="w-3 h-3 shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================================
 * 4. SIDEBAR NAVIGATION
 * ========================================================================== */

export interface SidebarSectionLink {
  id: string;
  label: string;
  badge?: string;
}

export interface SidebarNavigationProps {
  title: string;
  links: SidebarSectionLink[];
  activeId: string;
  onSelect: (id: string) => void;
}

export function SidebarNavigation({
  title,
  links,
  activeId,
  onSelect,
}: SidebarNavigationProps) {
  return (
    <aside
      aria-label={title}
      className="w-full lg:w-[264px] shrink-0 bg-[var(--ds-surface)] border border-[var(--ds-border)] rounded-[12px] p-4 space-y-3 self-start lg:sticky lg:top-20"
    >
      <div className="flex items-center gap-2 px-2 pb-2 border-b border-[var(--ds-border)]">
        <Layers className="w-3.5 h-3.5 text-[var(--ds-accent)]" />
        <h3 className="font-display text-xs font-bold text-[var(--ds-foreground)]">
          {title}
        </h3>
      </div>

      <nav className="space-y-1">
        {links.map((link) => {
          const isActive = link.id === activeId;
          return (
            <button
              key={link.id}
              type="button"
              onClick={() => onSelect(link.id)}
              className={`w-full text-left px-3 py-2 rounded-[6px] text-xs flex items-center justify-between transition-colors focus-visible:outline-2 focus-visible:outline-[var(--ds-focus)] ${
                isActive
                  ? 'bg-[var(--ds-secondary)] text-[var(--ds-secondary-foreground)] font-semibold'
                  : 'text-[var(--ds-muted-foreground)] hover:text-[var(--ds-foreground)] hover:bg-[var(--ds-muted)]'
              }`}
            >
              <span className="truncate">{link.label}</span>
              {link.badge && (
                <span className="font-mono text-[10px] opacity-80 tabular-nums">
                  {link.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

/* ============================================================================
 * 5. MOBILE NAVIGATION DRAWER
 * ========================================================================== */

export interface MobileNavigationDrawerProps {
  links: { id: string; label: string; href?: string; sectionId?: string }[];
  onNavigateSection?: (sectionId: string) => void;
}

export function MobileNavigationDrawer({
  links,
  onNavigateSection,
}: MobileNavigationDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        aria-label="Open mobile navigation menu"
        leftIcon={<Menu className="w-4 h-4" />}
        onClick={() => setIsOpen(true)}
        className="md:hidden"
      >
        Menu
      </Button>

      <Drawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Encyclopedia Navigation"
        subtitle="Touch-optimized index (>= 44px targets)"
        side="left"
      >
        <nav aria-label="Mobile Navigation" className="space-y-2">
          {links.map((item) => (
            <a
              key={item.id}
              href={item.href || `#${item.sectionId}`}
              onClick={(e) => {
                if (onNavigateSection && item.sectionId && item.href?.startsWith('/#')) {
                  e.preventDefault();
                  onNavigateSection(item.sectionId);
                }
                setIsOpen(false);
              }}
              className="flex items-center justify-between min-h-[44px] px-3.5 py-2.5 rounded-[8px] text-sm font-semibold text-[var(--ds-foreground)] hover:bg-[var(--ds-muted)] border border-transparent hover:border-[var(--ds-border)] transition-colors"
            >
              <span className="inline-flex items-center gap-2.5">
                <Compass className="w-4 h-4 text-[var(--ds-accent)]" />
                {item.label}
              </span>
              <ChevronRight className="w-4 h-4 text-[var(--ds-muted-foreground)]" />
            </a>
          ))}

          <div className="pt-4 mt-4 border-t border-[var(--ds-border)]">
            <Link
              href="/design-system"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between min-h-[44px] px-3.5 py-2.5 rounded-[8px] text-sm font-semibold bg-[var(--ds-secondary)] text-[var(--ds-secondary-foreground)]"
            >
              <span className="inline-flex items-center gap-2.5">
                <BookOpen className="w-4 h-4" />
                Design System Showcase Route
              </span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </nav>
      </Drawer>
    </>
  );
}
