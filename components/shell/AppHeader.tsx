'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Sun,
  Moon,
  Search,
  ChevronDown,
  User,
  Menu,
  Compass,
  ArrowUpRight,
  Sparkles,
  BookmarkCheck,
  Code2,
  Clock,
  Accessibility,
  LogIn,
  LogOut,
  LayoutDashboard,
} from 'lucide-react';
import { BRAND_CONFIG } from '@/config/brand.config';
import { useTheme } from '@/components/providers/ThemeProvider';
import { useAuthLibrary } from '@/components/providers/AuthLibraryProvider';
import {
  Breadcrumbs,
  BreadcrumbItem,
} from '@/components/ui/NavigationPrimitives';
import {
  Button,
  Dialog,
  Drawer,
  IconButton,
} from '@/components/ui/InteractionPrimitives';
import { ResourceMetadata } from '@/components/ui/ContentPrimitives';
import { DesignResource, TaxonomyCategory } from '@/types/encyclopedia';
import {
  TAXONOMY_CATEGORIES,
  getClassificationDescriptor,
} from '@/lib/taxonomy/registry';
import { FOUNDATION_RESOURCES } from '@/lib/resources/seed-foundation';
import {
  DEFAULT_COLLECTION,
  loadPersonalCollection,
} from '@/lib/collections/storage-adapter';

interface AppHeaderProps {
  activeSection?: string;
  onNavigateSection?: (sectionId: string) => void;
  onLaunchLab?: () => void;
  breadcrumbs?: BreadcrumbItem[];
  categories?: TaxonomyCategory[];
  resources?: DesignResource[];
  onSelectResource?: (slug: string) => void;
}

const RECENT_SEARCHES_KEY = 'dde_recent_searches_v1';

export function AppHeader({
  breadcrumbs,
  categories = TAXONOMY_CATEGORIES,
  resources = FOUNDATION_RESOURCES,
  onSelectResource,
}: AppHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isDarkTheme, toggleTheme, reducedMotionSim, toggleReducedMotionSim } =
    useTheme();
  const {
    user,
    userProfile,
    bookmarkedSlugs,
    collections,
    experiments,
    signInWithGoogle,
    signOutUser,
    authLoading,
  } = useAuthLibrary();

  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [accountDrawerOpen, setAccountDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilterScope, setSearchFilterScope] = useState<string>('all');
  const [recentSearches, setRecentSearches] = useState<string[]>([
    'Semantic Tokens',
    'Spring Physics',
    'WAI-ARIA Combobox',
  ]);
  const [currentCollection, setCurrentCollection] =
    useState(DEFAULT_COLLECTION);

  const megaMenuRef = useRef<HTMLDivElement>(null);

  // Hydrate persisted recentSearches and personalCollection after client mount
  useEffect(() => {
    const raf = window.requestAnimationFrame(() => {
      try {
        const saved = window.localStorage.getItem(RECENT_SEARCHES_KEY);
        if (saved) {
          setRecentSearches(JSON.parse(saved) as string[]);
        }
      } catch {
        // Ignore storage error
      }
      setCurrentCollection(loadPersonalCollection());
    });
    return () => window.cancelAnimationFrame(raf);
  }, [accountDrawerOpen]);

  // Close Mega Menu on outside click or Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMegaMenuOpen(false);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      }
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (
        megaMenuRef.current &&
        !megaMenuRef.current.contains(e.target as Node)
      ) {
        setMegaMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const recordRecentSearch = (term: string) => {
    const clean = term.trim();
    if (!clean) return;
    setRecentSearches((prev) => {
      const next = [clean, ...prev.filter((item) => item !== clean)].slice(0, 6);
      try {
        window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  };

  const handleNavigateConcept = (slug: string, searchTerm?: string) => {
    if (searchTerm) recordRecentSearch(searchTerm);
    setMegaMenuOpen(false);
    setSearchModalOpen(false);
    setMobileDrawerOpen(false);
    setAccountDrawerOpen(false);
    if (onSelectResource && pathname === '/') {
      onSelectResource(slug);
    } else {
      router.push(`/resources/${slug}`);
    }
  };

  const featuredResources = resources.filter((r) => r.isFeatured).slice(0, 3);
  const recentlyAddedResources = resources
    .filter((r) => r.isRecentlyAdded)
    .slice(0, 3);
  const popularSubcategories = categories
    .slice(0, 6)
    .flatMap((cat) =>
      cat.subcategories.slice(0, 2).map((sub) => ({
        categorySlug: cat.slug,
        categoryName: cat.name,
        subcategory: sub,
      }))
    )
    .slice(0, 8);

  const filteredModalResources = resources.filter((r) => {
    if (searchFilterScope !== 'all' && r.classification !== searchFilterScope) {
      return false;
    }
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.title.toLowerCase().includes(q) ||
      r.summary.toLowerCase().includes(q) ||
      r.classification.toLowerCase().includes(q) ||
      (r.subcategory && r.subcategory.toLowerCase().includes(q))
    );
  });

  const filteredModalCategories = categories.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.shortDescription.toLowerCase().includes(q) ||
      c.subcategories.some((s) => s.toLowerCase().includes(q))
    );
  });

  return (
    <>
      <header className="sticky top-0 z-40 h-16 bg-[var(--ds-surface)]/95 backdrop-blur border-b border-[var(--ds-border)] px-4 sm:px-6">
        <div className="max-w-[1400px] mx-auto h-full flex items-center justify-between gap-4">
          {/* LEFT: Configurable Brand Logo + Product Name */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 font-display text-base sm:text-lg font-bold tracking-tight text-[var(--ds-foreground)] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--ds-focus)]"
            >
              <span
                aria-hidden="true"
                className="w-7 h-7 rounded-[6px] bg-[var(--ds-primary)] text-[var(--ds-primary-foreground)] font-mono text-xs font-bold inline-flex items-center justify-center shrink-0"
              >
                {BRAND_CONFIG.shortName}
              </span>
              <span>{BRAND_CONFIG.productName}</span>
            </Link>
          </div>

          {/* CENTER: Global Navigation Links & Structured Mega Menu */}
          <nav
            aria-label="Global Encyclopedia Navigation"
            className="hidden xl:flex items-center gap-5 text-xs font-semibold text-[var(--ds-muted-foreground)]"
          >
            {/* Explore Mega Menu Trigger */}
            <div
              ref={megaMenuRef}
              className="relative"
              onMouseEnter={() => setMegaMenuOpen(true)}
            >
              <button
                type="button"
                aria-expanded={megaMenuOpen}
                aria-haspopup="true"
                onClick={() => setMegaMenuOpen((prev) => !prev)}
                className={`inline-flex items-center gap-1 py-2 whitespace-nowrap shrink-0 transition-colors hover:text-[var(--ds-foreground)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--ds-focus)] ${
                  megaMenuOpen ? 'text-[var(--ds-accent)]' : ''
                }`}
              >
                <span>Explore</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-150 ${
                    megaMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Structured Mega Menu Dropdown */}
              {megaMenuOpen && (
                <div
                  role="region"
                  aria-label="Explore Digital Design Encyclopedia Mega Menu"
                  onMouseLeave={() => setMegaMenuOpen(false)}
                  className="fixed left-1/2 -translate-x-1/2 top-16 z-50 w-[95vw] max-w-[1320px] bg-[var(--ds-surface-elevated)] border border-[var(--ds-border-strong)] rounded-b-[12px] shadow-2xl p-6"
                >
                  <div className="grid grid-cols-12 gap-6">
                    {/* Col 1-5: 16 Primary Categories */}
                    <div className="col-span-5 space-y-3 border-r border-[var(--ds-border)] pr-5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono font-bold text-[var(--ds-accent)]">
                          16 PRIMARY DESIGN CATEGORIES
                        </span>
                        <Link
                          href="/#explore-categories"
                          onClick={() => setMegaMenuOpen(false)}
                          className="text-[11px] font-semibold text-[var(--ds-muted-foreground)] hover:text-[var(--ds-foreground)]"
                        >
                          View All 16 →
                        </Link>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 max-h-72 overflow-y-auto pr-1">
                        {categories.map((cat) => (
                          <Link
                            key={cat.id}
                            href={`/categories/${cat.slug}`}
                            onClick={() => setMegaMenuOpen(false)}
                            className="p-2 rounded-[6px] hover:bg-[var(--ds-muted)] transition-colors block"
                          >
                            <div className="text-xs font-semibold text-[var(--ds-foreground)] truncate">
                              <span className="font-mono text-[10px] text-[var(--ds-accent)] mr-1">
                                {String(cat.orderIndex).padStart(2, '0')}
                              </span>
                              {cat.name}
                            </div>
                            <div className="text-[11px] text-[var(--ds-muted-foreground)] truncate mt-0.5">
                              {cat.architecturalScope}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>

                    {/* Col 6-8: Popular Subcategories & Quick Playground Access */}
                    <div className="col-span-3 space-y-4 border-r border-[var(--ds-border)] pr-5 flex flex-col justify-between">
                      <div className="space-y-2.5">
                        <div className="text-[11px] font-mono font-bold text-[var(--ds-accent)]">
                          POPULAR SUBCATEGORIES
                        </div>
                        <div className="space-y-1">
                          {popularSubcategories.map((sub, i) => (
                            <Link
                              key={`${sub.categorySlug}-${i}`}
                              href={`/categories/${sub.categorySlug}`}
                              onClick={() => setMegaMenuOpen(false)}
                              className="flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-xs text-[var(--ds-foreground)] hover:bg-[var(--ds-muted)] transition-colors"
                            >
                              <span className="font-medium truncate">
                                {sub.subcategory}
                              </span>
                              <span className="text-[10px] font-mono text-[var(--ds-subtle-foreground)] truncate ml-2">
                                {sub.categoryName.split('&')[0]}
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>

                      {/* Quick Access to Playground */}
                      <div className="p-3.5 rounded-[8px] bg-[var(--ds-secondary)] border border-[var(--ds-border-strong)] space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-[var(--ds-secondary-foreground)]">
                          <Code2 className="w-4 h-4 text-[var(--ds-accent)]" />
                          <span>Interactive Code Playground</span>
                        </div>
                        <p className="text-[11px] text-[var(--ds-muted-foreground)] leading-relaxed">
                          Modify design tokens, spring physics, and CSS rules in an
                          isolated live studio.
                        </p>
                        <Link
                          href="/playground"
                          onClick={() => setMegaMenuOpen(false)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--ds-accent)] hover:underline"
                        >
                          Launch Playground Studio
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>

                    {/* Col 9-12: Featured Resources & Recently Added */}
                    <div className="col-span-4 space-y-4">
                      <div className="space-y-2">
                        <div className="text-[11px] font-mono font-bold text-[var(--ds-accent)]">
                          FEATURED ENCYCLOPEDIA MONOGRAPHS
                        </div>
                        <div className="space-y-1.5">
                          {featuredResources.map((res) => (
                            <Link
                              key={res.id}
                              href={`/resources/${res.slug}`}
                              onClick={() => setMegaMenuOpen(false)}
                              className="block p-2.5 rounded-[8px] bg-[var(--ds-background)] hover:bg-[var(--ds-muted)] border border-[var(--ds-border)] transition-colors"
                            >
                              <div className="text-xs font-bold text-[var(--ds-foreground)] truncate">
                                {res.title}
                              </div>
                              <ResourceMetadata
                                items={[
                                  getClassificationDescriptor(res.classification).label,
                                  `WCAG ${res.accessibilitySpec.wcagComplianceLevel}`,
                                ]}
                              />
                            </Link>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-[var(--ds-border)]">
                        <div className="text-[11px] font-mono font-bold text-[var(--ds-muted-foreground)] flex items-center gap-1.5">
                          <Clock className="w-3 h-3" />
                          <span>RECENTLY ADDED ITEMS</span>
                        </div>
                        <div className="space-y-1">
                          {recentlyAddedResources.map((res) => (
                            <Link
                              key={res.id}
                              href={`/resources/${res.slug}`}
                              onClick={() => setMegaMenuOpen(false)}
                              className="flex items-center justify-between px-2 py-1 text-xs text-[var(--ds-muted-foreground)] hover:text-[var(--ds-foreground)] transition-colors"
                            >
                              <span className="truncate">{res.title}</span>
                              <ArrowUpRight className="w-3 h-3 shrink-0" />
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Link
              href="/directory"
              className={`py-2 whitespace-nowrap shrink-0 transition-colors hover:text-[var(--ds-foreground)] ${
                pathname === '/directory'
                  ? 'text-[var(--ds-foreground)] underline decoration-[var(--ds-accent)] decoration-2 underline-offset-8'
                  : ''
              }`}
            >
              Directory
            </Link>

            <Link
              href="/categories/official-design-systems"
              className={`py-2 whitespace-nowrap shrink-0 transition-colors hover:text-[var(--ds-foreground)] ${
                pathname === '/categories/official-design-systems' ||
                pathname === '/taxonomy/official-design-systems'
                  ? 'text-[var(--ds-foreground)] underline decoration-[var(--ds-accent)] decoration-2 underline-offset-8'
                  : ''
              }`}
            >
              Design Systems
            </Link>

            <Link
              href="/categories/motion-animation"
              className={`py-2 whitespace-nowrap shrink-0 transition-colors hover:text-[var(--ds-foreground)] ${
                pathname === '/categories/motion-animation' ||
                pathname === '/taxonomy/motion-animation'
                  ? 'text-[var(--ds-foreground)] underline decoration-[var(--ds-accent)] decoration-2 underline-offset-8'
                  : ''
              }`}
            >
              Motion & Animation
            </Link>

            <Link
              href="/categories/ui-components"
              className={`py-2 whitespace-nowrap shrink-0 transition-colors hover:text-[var(--ds-foreground)] ${
                pathname === '/categories/ui-components' ||
                pathname === '/taxonomy/ui-components'
                  ? 'text-[var(--ds-foreground)] underline decoration-[var(--ds-accent)] decoration-2 underline-offset-8'
                  : ''
              }`}
            >
              Components
            </Link>

            <Link
              href="/technologies"
              className={`py-2 whitespace-nowrap shrink-0 transition-colors hover:text-[var(--ds-foreground)] ${
                pathname.startsWith('/technologies')
                  ? 'text-[var(--ds-foreground)] underline decoration-[var(--ds-accent)] decoration-2 underline-offset-8'
                  : ''
              }`}
            >
              Technologies
            </Link>

            <Link
              href="/playground"
              className={`py-2 whitespace-nowrap shrink-0 transition-colors hover:text-[var(--ds-foreground)] ${
                pathname === '/playground'
                  ? 'text-[var(--ds-foreground)] underline decoration-[var(--ds-accent)] decoration-2 underline-offset-8'
                  : ''
              }`}
            >
              Playground
            </Link>

            <Link
              href="/audit"
              className={`py-2 whitespace-nowrap shrink-0 transition-colors hover:text-[var(--ds-foreground)] ${
                pathname === '/audit'
                  ? 'text-[var(--ds-foreground)] underline decoration-[var(--ds-accent)] decoration-2 underline-offset-8'
                  : ''
              }`}
            >
              SEO & A11y Audit
            </Link>
          </nav>

          {/* RIGHT: Search, Theme Toggle, User Account & Mobile Menu Trigger */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Search Button */}
            <button
              type="button"
              onClick={() => setSearchModalOpen(true)}
              aria-label="Open global search (Shortcut Command+K)"
              className="inline-flex items-center gap-2.5 px-3 py-1.5 text-xs bg-[var(--ds-background)] border border-[var(--ds-border-strong)] hover:border-[var(--ds-accent)] rounded-[8px] text-[var(--ds-muted-foreground)] hover:text-[var(--ds-foreground)] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ds-focus)]"
            >
              <Search className="w-3.5 h-3.5 text-[var(--ds-accent)]" />
              <span className="hidden sm:inline">Search...</span>
              <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-[var(--ds-surface)] border border-[var(--ds-border)] rounded text-[var(--ds-foreground)]">
                ⌘K
              </kbd>
            </button>

            {/* Theme Toggle */}
            <IconButton
              label={
                isDarkTheme
                  ? 'Switch to Light Theme'
                  : 'Switch to Dark Theme'
              }
              variant="outline"
              size="sm"
              onClick={toggleTheme}
              icon={
                isDarkTheme ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-[var(--ds-accent)]" />
                )
              }
            />

            {/* Reduced Motion Toggle */}
            <IconButton
              label={
                reducedMotionSim
                  ? 'Disable Reduced-Motion Simulation'
                  : 'Simulate prefers-reduced-motion'
              }
              variant="outline"
              size="sm"
              isSelected={reducedMotionSim}
              onClick={toggleReducedMotionSim}
              icon={<Accessibility className="w-4 h-4" />}
              className="hidden sm:inline-flex"
            />

            {/* User Account & Collections Button */}
            <button
              type="button"
              onClick={() => setAccountDrawerOpen(true)}
              aria-label="Open user account and personal collections"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold bg-[var(--ds-secondary)] text-[var(--ds-secondary-foreground)] hover:bg-[var(--ds-secondary-hover)] border border-indigo-200/60 dark:border-indigo-800/60 rounded-[8px] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ds-focus)]"
            >
              <User className="w-3.5 h-3.5" />
              <span className="hidden md:inline">
                {user
                  ? (userProfile?.displayName || user.displayName || 'Library').split(' ')[0]
                  : 'Account'}
              </span>
              <span className="font-mono text-[10px] px-1 rounded bg-[var(--ds-surface)] text-[var(--ds-foreground)] tabular-nums">
                {bookmarkedSlugs.length}
              </span>
            </button>

            {/* Mobile Menu Trigger */}
            <IconButton
              label="Open navigation menu"
              variant="outline"
              size="sm"
              icon={<Menu className="w-4 h-4" />}
              onClick={() => setMobileDrawerOpen(true)}
              className="xl:hidden"
            />
          </div>
        </div>
      </header>

      {/* Optional Contextual Breadcrumb Sub-bar for Inner Pages */}
      {breadcrumbs && breadcrumbs.length > 1 && (
        <div className="border-b border-[var(--ds-border)] bg-[var(--ds-background)] px-4 sm:px-6 py-2">
          <div className="max-w-[1360px] mx-auto flex items-center justify-between">
            <Breadcrumbs items={breadcrumbs} />
          </div>
        </div>
      )}

      {/* GLOBAL SEARCH COMMAND DIALOG */}
      <Dialog
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        title="Global Encyclopedia Search"
        description="Search design systems, concepts, animations, components, technologies, and all 16 categories. Press Enter to open full discovery hub."
      >
        <div className="space-y-4">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-[var(--ds-muted-foreground)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  e.preventDefault();
                  recordRecentSearch(searchQuery.trim());
                  setSearchModalOpen(false);
                  router.push(
                    `/search?q=${encodeURIComponent(searchQuery.trim())}`
                  );
                }
              }}
              placeholder="Search titles, tags, aliases, technologies (e.g., Spring Physics, ARIA, CSS Grid)..."
              className="w-full pl-9 pr-20 py-2.5 text-xs bg-[var(--ds-background)] border border-[var(--ds-border-strong)] rounded-[8px] text-[var(--ds-foreground)] focus:outline-2 focus:outline-[var(--ds-focus)]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 px-2 py-0.5 text-[11px] font-mono rounded bg-[var(--ds-surface)] border border-[var(--ds-border)] text-[var(--ds-muted-foreground)] hover:text-[var(--ds-foreground)]"
              >
                Clear
              </button>
            )}
          </div>

          {/* Domain Scope Filter Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1">
              {[
                { id: 'all', label: 'All Scopes' },
                { id: 'official-design-system', label: 'Design Systems' },
                { id: 'animation-technique', label: 'Animations' },
                { id: 'ui-component', label: 'Components' },
                { id: 'interaction-pattern', label: 'Interactions' },
                { id: 'development-technology', label: 'Technologies' },
              ].map((scope) => (
                <button
                  key={scope.id}
                  type="button"
                  onClick={() => setSearchFilterScope(scope.id)}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-[6px] transition-colors ${
                    searchFilterScope === scope.id
                      ? 'bg-[var(--ds-primary)] text-[var(--ds-primary-foreground)] font-semibold'
                      : 'bg-[var(--ds-muted)] text-[var(--ds-muted-foreground)] hover:text-[var(--ds-foreground)]'
                  }`}
                >
                  {scope.label}
                </button>
              ))}
            </div>

            <Link
              href={
                searchQuery.trim()
                  ? `/search?q=${encodeURIComponent(searchQuery.trim())}`
                  : '/search'
              }
              onClick={() => {
                if (searchQuery.trim()) recordRecentSearch(searchQuery.trim());
                setSearchModalOpen(false);
              }}
              className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-[var(--ds-accent)] hover:underline"
            >
              <span>Open Full Search & 11-Facet Filters</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Recent Searches & Suggestions when query is empty */}
          {!searchQuery.trim() && recentSearches.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[11px] font-mono text-[var(--ds-muted-foreground)]">
                RECENT SEARCHES & TRENDING TOPICS
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {recentSearches.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => setSearchQuery(term)}
                    className="px-2.5 py-1 text-xs bg-[var(--ds-background)] hover:bg-[var(--ds-muted)] border border-[var(--ds-border)] rounded-[6px] text-[var(--ds-foreground)] transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Results Viewport */}
          <div className="max-h-72 overflow-y-auto space-y-4 pr-1">
            <div className="space-y-1.5">
              <div className="text-[11px] font-mono font-semibold text-[var(--ds-muted-foreground)]">
                MATCHING CONCEPTS ({filteredModalResources.length})
              </div>
              {filteredModalResources.length === 0 ? (
                <div className="p-4 text-center bg-[var(--ds-background)] rounded-[8px] border border-[var(--ds-border)] space-y-2">
                  <p className="text-xs font-semibold text-[var(--ds-foreground)]">
                    No immediate concepts matched &quot;{searchQuery}&quot;.
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSearchFilterScope('all');
                      }}
                      className="text-xs font-semibold text-[var(--ds-accent)] hover:underline"
                    >
                      Reset query
                    </button>
                    <Link
                      href={`/search?q=${encodeURIComponent(searchQuery)}`}
                      onClick={() => setSearchModalOpen(false)}
                      className="text-xs font-mono text-[var(--ds-foreground)] underline"
                    >
                      Search Deep Index →
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-[var(--ds-border)] border border-[var(--ds-border)] rounded-[8px] overflow-hidden">
                  {filteredModalResources.map((res) => (
                    <button
                      key={res.id}
                      type="button"
                      onClick={() => handleNavigateConcept(res.slug, searchQuery)}
                      className="w-full text-left px-3.5 py-2.5 bg-[var(--ds-surface)] hover:bg-[var(--ds-muted)] flex items-center justify-between gap-3 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-[var(--ds-foreground)] truncate">
                          {res.title}
                        </div>
                        <ResourceMetadata
                          items={[
                            getClassificationDescriptor(res.classification).label,
                            res.subcategory || 'Core Spec',
                            `WCAG ${res.accessibilitySpec.wcagComplianceLevel}`,
                          ]}
                        />
                      </div>
                      <ArrowUpRight className="w-3.5 h-3.5 text-[var(--ds-accent)] shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {filteredModalCategories.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[11px] font-mono font-semibold text-[var(--ds-muted-foreground)]">
                  MATCHING CATEGORIES ({filteredModalCategories.length})
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {filteredModalCategories.slice(0, 6).map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/taxonomy/${cat.slug}`}
                      onClick={() => {
                        if (searchQuery) recordRecentSearch(searchQuery);
                        setSearchModalOpen(false);
                      }}
                      className="px-3 py-2 rounded-[6px] bg-[var(--ds-background)] hover:bg-[var(--ds-muted)] border border-[var(--ds-border)] text-xs flex items-center justify-between"
                    >
                      <span className="font-semibold text-[var(--ds-foreground)] truncate">
                        {cat.name}
                      </span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-[var(--ds-accent)] shrink-0" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Dialog>

      {/* MOBILE SLIDE-IN NAVIGATION DRAWER */}
      <Drawer
        isOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        title={BRAND_CONFIG.productName}
        subtitle="Mobile Encyclopedia Navigation"
        side="left"
      >
        <div className="space-y-6">
          {/* Quick Search & Account Access */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="md"
              leftIcon={<Search className="w-3.5 h-3.5" />}
              onClick={() => {
                setMobileDrawerOpen(false);
                setSearchModalOpen(true);
              }}
            >
              Search (⌘K)
            </Button>
            <Button
              variant="secondary"
              size="md"
              leftIcon={<User className="w-3.5 h-3.5" />}
              onClick={() => {
                setMobileDrawerOpen(false);
                setAccountDrawerOpen(true);
              }}
            >
              Account ({currentCollection.resourceSlugs.length})
            </Button>
          </div>

          {/* Primary Destination Links */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-mono font-bold text-[var(--ds-muted-foreground)]">
              CORE WORKSPACES
            </div>
            {[
              { label: 'Homepage & Interactive Showcase', href: '/' },
              { label: 'Global Search & Discovery Engine', href: '/search' },
              { label: 'Resource Directory & Multi-Facet Explorer', href: '/directory' },
              { label: 'Web Technologies Reference Index', href: '/technologies' },
              { label: 'Interactive Code Playground', href: '/playground' },
              { label: 'SEO, WCAG 2.2 AA & CWV Audit Console', href: '/audit' },
              { label: 'Personal Design Library & Dashboard', href: '/dashboard' },
              { label: 'Administration Dashboard & CMS', href: '/admin' },
              { label: 'Design System & Component Library', href: '/design-system' },
              { label: 'Official Design Systems Track', href: '/categories/official-design-systems' },
              { label: 'Motion & Animation Track', href: '/categories/motion-animation' },
              { label: 'UX & Interaction Patterns Track', href: '/categories/ux-interaction-patterns' },
              { label: 'UI Components Track', href: '/categories/ui-components' },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileDrawerOpen(false)}
                className="flex items-center justify-between min-h-[44px] px-3 py-2 rounded-[8px] text-xs font-semibold text-[var(--ds-foreground)] hover:bg-[var(--ds-muted)] border border-transparent hover:border-[var(--ds-border)]"
              >
                <span className="inline-flex items-center gap-2">
                  <Compass className="w-3.5 h-3.5 text-[var(--ds-accent)]" />
                  {item.label}
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 text-[var(--ds-muted-foreground)]" />
              </Link>
            ))}
          </div>

          {/* All 16 Primary Categories */}
          <div className="space-y-1.5 pt-3 border-t border-[var(--ds-border)]">
            <div className="text-[11px] font-mono font-bold text-[var(--ds-muted-foreground)]">
              ALL 16 DESIGN CATEGORIES
            </div>
            <div className="space-y-1">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/categories/${cat.slug}`}
                  onClick={() => setMobileDrawerOpen(false)}
                  className="flex items-center justify-between min-h-[40px] px-2.5 py-1.5 rounded-[6px] text-xs text-[var(--ds-muted-foreground)] hover:text-[var(--ds-foreground)] hover:bg-[var(--ds-muted)]"
                >
                  <span className="truncate">
                    <span className="font-mono text-[10px] text-[var(--ds-accent)] mr-1.5">
                      {String(cat.orderIndex).padStart(2, '0')}
                    </span>
                    {cat.name}
                  </span>
                  <ArrowUpRight className="w-3 h-3 shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </Drawer>

      {/* USER ACCOUNT & PERSONAL COLLECTIONS DRAWER */}
      <Drawer
        isOpen={accountDrawerOpen}
        onClose={() => setAccountDrawerOpen(false)}
        title="User Workspace & Personal Design Library"
        subtitle={
          user
            ? `Authenticated as ${user.email}`
            : 'Public Guest Session · Sign in for Firebase Cloud Sync'
        }
        side="right"
      >
        <div className="space-y-6">
          <div className="p-4 rounded-[10px] bg-[var(--ds-background)] border border-[var(--ds-border)] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-[var(--ds-accent)]">
                {user ? 'CLOUD-SYNCED PROFILE' : 'GUEST WORKSPACE PROFILE'}
              </span>
              <span className="text-[11px] font-mono text-[var(--ds-success)]">
                {user ? 'Firebase Auth Active' : 'Local Sync Active'}
              </span>
            </div>
            <div className="font-display text-sm font-bold text-[var(--ds-foreground)]">
              {user
                ? userProfile?.displayName || user.displayName || user.email
                : 'Product Engineer & Design Explorer'}
            </div>
            <p className="text-xs text-[var(--ds-muted-foreground)]">
              {user
                ? `${bookmarkedSlugs.length} saved bookmarks · ${collections.length} collections · ${experiments.length} experiments stored in Firestore.`
                : 'All public encyclopedia content is accessible without login. Sign in to sync your bookmarks, collections, and playground experiments with Firestore.'}
            </p>
            <div className="pt-1 flex items-center gap-2">
              {user ? (
                <button
                  type="button"
                  disabled={authLoading}
                  onClick={() => void signOutUser()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold border border-[var(--ds-border)] bg-[var(--ds-surface)] hover:border-[var(--ds-accent)]"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              ) : (
                <button
                  type="button"
                  disabled={authLoading}
                  onClick={() => void signInWithGoogle()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-[var(--ds-primary)] text-[var(--ds-primary-foreground)]"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  {authLoading ? 'Connecting...' : 'Sign In with Google'}
                </button>
              )}
              <Link
                href="/dashboard"
                onClick={() => setAccountDrawerOpen(false)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold border border-[var(--ds-border-strong)] bg-[var(--ds-surface)] text-[var(--ds-foreground)] hover:border-[var(--ds-accent)]"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-[var(--ds-accent)]" />
                Full Library Dashboard
              </Link>
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-bold text-[var(--ds-foreground)] flex items-center gap-1.5">
                <BookmarkCheck className="w-3.5 h-3.5 text-[var(--ds-accent)]" />
                SAVED CONCEPTS ({bookmarkedSlugs.length})
              </span>
              <Link
                href="/dashboard"
                onClick={() => setAccountDrawerOpen(false)}
                className="text-[11px] text-[var(--ds-accent)] hover:underline"
              >
                Manage All →
              </Link>
            </div>
            {bookmarkedSlugs.length === 0 ? (
              <p className="text-xs text-[var(--ds-muted-foreground)]">
                No concepts bookmarked yet. Explore any category or concept to save
                references.
              </p>
            ) : (
              <div className="space-y-1.5">
                {bookmarkedSlugs.slice(0, 8).map((slug) => {
                  const res = resources.find((r) => r.slug === slug);
                  return (
                    <Link
                      key={slug}
                      href={`/concept/${slug}`}
                      onClick={() => setAccountDrawerOpen(false)}
                      className="flex items-center justify-between p-2.5 rounded-[8px] bg-[var(--ds-surface)] border border-[var(--ds-border)] hover:border-[var(--ds-accent)] text-xs"
                    >
                      <span className="font-semibold text-[var(--ds-foreground)] truncate">
                        {res ? res.title : slug}
                      </span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-[var(--ds-accent)] shrink-0" />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-2.5 pt-3 border-t border-[var(--ds-border)]">
            <div className="text-xs font-mono font-bold text-[var(--ds-foreground)] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[var(--ds-accent)]" />
              SAVED PARAMETER PRESETS ({currentCollection.savedPresets.length})
            </div>
            {currentCollection.savedPresets.length === 0 ? (
              <p className="text-xs text-[var(--ds-muted-foreground)]">
                Adjust sliders in the Concept Lab or Playground and click &quot;Snapshot
                Parameter Preset&quot; to store custom tokens.
              </p>
            ) : (
              <div className="space-y-1.5">
                {currentCollection.savedPresets.map((preset) => (
                  <div
                    key={preset.id}
                    className="p-2.5 rounded-[8px] bg-[var(--ds-background)] border border-[var(--ds-border)] text-xs space-y-1"
                  >
                    <div className="font-semibold text-[var(--ds-foreground)]">
                      {preset.resourceTitle}
                    </div>
                    <div className="font-mono text-[11px] text-[var(--ds-muted-foreground)]">
                      {preset.presetName}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-[var(--ds-border)] flex flex-col gap-2">
            <Link
              href="/dashboard"
              onClick={() => setAccountDrawerOpen(false)}
              className="w-full py-2.5 px-4 text-center text-xs font-semibold rounded-[8px] bg-[var(--ds-primary)] text-[var(--ds-primary-foreground)] hover:bg-[var(--ds-primary-hover)]"
            >
              Open Personal Library & User Dashboard
            </Link>
            <Link
              href="/playground"
              onClick={() => setAccountDrawerOpen(false)}
              className="w-full py-2 px-4 text-center text-xs font-semibold rounded-[8px] bg-[var(--ds-surface)] border border-[var(--ds-border-strong)] text-[var(--ds-foreground)] hover:bg-[var(--ds-muted)]"
            >
              Open Playground Studio
            </Link>
            <Link
              href="/admin"
              onClick={() => setAccountDrawerOpen(false)}
              className="w-full py-2 px-4 text-center text-xs font-mono font-semibold rounded-[8px] bg-[var(--ds-surface)] border border-[var(--ds-border)] text-[var(--ds-accent)] hover:bg-[var(--ds-muted)]"
            >
              Admin Dashboard & CMS (/admin)
            </Link>
          </div>
        </div>
      </Drawer>
    </>
  );
}
