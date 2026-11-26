'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import { Send, CheckCircle2, ArrowUpRight } from 'lucide-react';
import { AppHeader } from '@/components/shell/AppHeader';
import { AppFooter } from '@/components/shell/AppFooter';
import { BRAND_CONFIG } from '@/config/brand.config';
import { TAXONOMY_CATEGORIES } from '@/lib/taxonomy/registry';
import {
  ResourceMetadata,
  TechnicalLabel,
  SemanticAlert,
} from '@/components/ui/ContentPrimitives';
import { Button, useToast } from '@/components/ui/InteractionPrimitives';

interface InfoPageContent {
  slug: string;
  kicker: string;
  title: string;
  subtitle: string;
  sections: { heading: string; body: string }[];
}

const INFO_PAGES: Record<string, InfoPageContent> = {
  documentation: {
    slug: 'documentation',
    kicker: 'PLATFORM DOCUMENTATION',
    title: 'Architecture, Taxonomy & Live-Demo Specification',
    subtitle:
      'Complete technical guide to how the Digital Design Encyclopedia classifies, validates, and executes interactive design concepts.',
    sections: [
      {
        heading: '01. The 8 Canonical Resource Classifications',
        body: 'Every entry in the encyclopedia is strictly categorized as an Official Design System, Design Methodology, Visual Style, Interaction Pattern, UI Component Primitive, Animation Technique, Development Technology, or Community Example. Each classification enforces specific provenance and attribution validation rules.',
      },
      {
        heading: '02. Multi-Tier Live-Demo Execution Engine',
        body: 'Tier 1 binds range sliders and controls directly to CSS Custom Properties for sub-2ms visual feedback. Tier 2 compiles editable HTML and CSS templates into a Content-Security-Policy (CSP) locked iframe srcdoc sandbox with zero server-side code execution risk.',
      },
      {
        heading: '03. Accessibility & Reduced-Motion Compliance',
        body: 'All published patterns document WAI-ARIA role contracts, keyboard interaction matrices, minimum contrast ratios, and prefers-reduced-motion fallback behaviors.',
      },
    ],
  },
  about: {
    slug: 'about',
    kicker: 'ABOUT THE PLATFORM',
    title: `About ${BRAND_CONFIG.productName}`,
    subtitle:
      'An all-in-one interactive digital design knowledge and experimentation workbench built for designers, frontend engineers, and creative developers.',
    sections: [
      {
        heading: 'Explore Before Reading · Demonstrate Before Explaining',
        body: 'Conventional design directories rely on static screenshots and abstract text. This platform requires every published design concept to be experienced through direct manipulation before reading theoretical prose.',
      },
      {
        heading: 'Verifiable Attribution & Editorial Integrity',
        body: 'We never fabricate claims about real design systems, creators, or popularity metrics. Every official specification and historical design canon entry links directly to its authoritative source.',
      },
    ],
  },
  contact: {
    slug: 'contact',
    kicker: 'EDITORIAL & ENGINEERING INQUIRIES',
    title: 'Contact the Product Engineering Team',
    subtitle:
      'Report an attribution correction, request a taxonomy track expansion, or inquire about white-label brand configuration.',
    sections: [
      {
        heading: 'Direct Architecture & Curation Feedback',
        body: 'Use the validated inquiry form below to send structured feedback regarding design system specifications, accessibility audits, or platform features.',
      },
    ],
  },
  'submit-resource': {
    slug: 'submit-resource',
    kicker: 'COMMUNITY & CURATION SUBMISSIONS',
    title: 'Submit a Design Resource or Interactive Specimen',
    subtitle:
      'Propose an official design system, methodology, WAI-ARIA pattern, or open-source community experiment for editorial verification.',
    sections: [
      {
        heading: 'Provenance & License Requirements',
        body: 'All submissions must include an authoritative specification URL, clear authorship attribution, license metadata, and at least one interactive parameter that can be demonstrated live.',
      },
    ],
  },
  community: {
    slug: 'community',
    kicker: 'DESIGN & ENGINEERING COMMUNITY',
    title: 'Open Knowledge & Creative Developer Collective',
    subtitle:
      'Connecting design systems architects, accessibility specialists, motion engineers, and frontend developers.',
    sections: [
      {
        heading: 'Collaborative Standards & W3C Alignment',
        body: 'Our community taxonomy aligns with the W3C Design Tokens Community Group, WAI-ARIA Authoring Practices Guide, and CSS Working Group specifications.',
      },
      {
        heading: 'Contributing Open-Source Specimens',
        body: 'Community-contributed examples are clearly distinguished from official corporate design systems and preserve full creator attribution and open-source licensing.',
      },
    ],
  },
  legal: {
    slug: 'legal',
    kicker: 'LEGAL & ATTRIBUTION GOVERNANCE',
    title: 'Legal Information & Intellectual Property Notice',
    subtitle:
      'How third-party trademarks, official design system specifications, and open-source licenses are governed on this platform.',
    sections: [
      {
        heading: 'Trademarks & Official Design Systems',
        body: 'References to third-party design systems (such as Google Material Design, Apple Human Interface Guidelines, or IBM Carbon) are provided strictly for comparative educational analysis and link directly to their official documentation.',
      },
      {
        heading: 'Original Explanatory Content & Code Templates',
        body: 'All interactive parameter schemas, explanatory summaries, and sandbox demonstrations are original educational implementations created for the Digital Design Encyclopedia.',
      },
    ],
  },
  privacy: {
    slug: 'privacy',
    kicker: 'PRIVACY POLICY',
    title: 'Data Privacy & Local Workspace Storage',
    subtitle:
      'Transparent handling of your personal collections, saved parameter presets, and theme preferences.',
    sections: [
      {
        heading: 'Client-Side Persistence First',
        body: 'Your theme polarity (dde_theme_preference_v1), reduced-motion settings, recent searches, and personal concept collections (dde_personal_collection_v1) are stored locally in your browser via localStorage.',
      },
      {
        heading: 'Zero Unsolicited Tracking',
        body: 'We do not sell user data or execute third-party advertising trackers inside the interactive code playground.',
      },
    ],
  },
  terms: {
    slug: 'terms',
    kicker: 'TERMS OF USE',
    title: 'Platform Terms of Use & Sandbox Policy',
    subtitle:
      'Guidelines for using the interactive playground, code templates, and community submission tools.',
    sections: [
      {
        heading: 'Acceptable Sandbox Experimentation',
        body: 'The interactive code playground executes strictly inside a client-side CSP-isolated iframe sandbox. Users may freely copy and adapt our educational CSS and React code templates for their own projects.',
      },
      {
        heading: 'Attribution Preservation',
        body: 'When referencing third-party specifications discovered through the encyclopedia, users must respect the original license terms noted in each concept’s SourceAttribution block.',
      },
    ],
  },
};

export default function InfoPage({
  params,
}: {
  params: Promise<{ pageSlug: string }>;
}) {
  const { pageSlug } = use(params);
  const { pushToast } = useToast();

  const content = INFO_PAGES[pageSlug] || INFO_PAGES.documentation;

  // Interactive Form State for Contact & Submit Resource
  const [titleOrName, setTitleOrName] = useState('');
  const [urlOrEmail, setUrlOrEmail] = useState('');
  const [categorySelect, setCategorySelect] = useState(
    TAXONOMY_CATEGORIES[0].slug
  );
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const showInteractiveForm =
    content.slug === 'submit-resource' || content.slug === 'contact';

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (titleOrName.trim().length < 3) {
      setFormError('Please provide a valid name or concept title (min 3 characters).');
      return;
    }
    if (urlOrEmail.trim().length < 5) {
      setFormError('Please provide a valid specification URL or contact email.');
      return;
    }
    setSubmittedSuccess(true);
    pushToast({
      tone: 'success',
      title:
        content.slug === 'submit-resource'
          ? 'Resource Proposal Recorded'
          : 'Inquiry Recorded',
      description: `Thank you for contributing to ${BRAND_CONFIG.productName}.`,
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--ds-background)] text-[var(--ds-foreground)]">
      <AppHeader
        breadcrumbs={[
          { label: 'Encyclopedia Home', href: '/' },
          { label: content.title, isCurrent: true },
        ]}
      />

      <main className="flex-1 w-full max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        <section className="p-6 sm:p-8 rounded-[12px] bg-[var(--ds-surface)] border border-[var(--ds-border-strong)] space-y-3">
          <TechnicalLabel
            kicker={content.kicker}
            detail={BRAND_CONFIG.productName}
          />
          <h1
            style={{ fontSize: 'clamp(1.625rem, 2.5vw, 2.25rem)' }}
            className="font-display font-bold tracking-tight text-[var(--ds-foreground)]"
          >
            {content.title}
          </h1>
          <p className="text-sm sm:text-base text-[var(--ds-muted-foreground)] leading-relaxed max-w-[68ch]">
            {content.subtitle}
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {content.sections.map((sec) => (
            <div
              key={sec.heading}
              className="p-5 rounded-[12px] bg-[var(--ds-surface)] border border-[var(--ds-border)] space-y-2"
            >
              <h2 className="font-display text-base font-bold text-[var(--ds-foreground)]">
                {sec.heading}
              </h2>
              <p className="text-xs sm:text-sm text-[var(--ds-muted-foreground)] leading-relaxed">
                {sec.body}
              </p>
            </div>
          ))}
        </section>

        {showInteractiveForm && (
          <section className="p-6 rounded-[12px] bg-[var(--ds-surface)] border border-[var(--ds-border-strong)] space-y-5">
            <h2 className="font-display text-lg font-bold text-[var(--ds-foreground)]">
              {content.slug === 'submit-resource'
                ? 'Resource & Provenance Submission Form'
                : 'Editorial & Engineering Contact Form'}
            </h2>

            {submittedSuccess ? (
              <SemanticAlert
                variant="success"
                title="Submission Validated & Logged"
                action={
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSubmittedSuccess(false);
                      setTitleOrName('');
                      setUrlOrEmail('');
                      setNotes('');
                    }}
                  >
                    Submit Another
                  </Button>
                }
              >
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Recorded entry for &quot;{titleOrName}&quot; in track{' '}
                  <code className="font-mono">{categorySelect}</code>.
                </span>
              </SemanticAlert>
            ) : (
              <form onSubmit={handleFormSubmit} className="space-y-4" noValidate>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="info-field-1"
                      className="block text-xs font-semibold text-[var(--ds-foreground)]"
                    >
                      {content.slug === 'submit-resource'
                        ? 'Design Resource or Concept Title *'
                        : 'Your Name or Role *'}
                    </label>
                    <input
                      id="info-field-1"
                      type="text"
                      value={titleOrName}
                      onChange={(e) => setTitleOrName(e.target.value)}
                      placeholder={
                        content.slug === 'submit-resource'
                          ? 'e.g., W3C View Transitions API'
                          : 'e.g., Design Systems Architect'
                      }
                      className="w-full px-3.5 py-2 text-xs bg-[var(--ds-background)] border border-[var(--ds-border-strong)] rounded-[8px] text-[var(--ds-foreground)]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="info-field-2"
                      className="block text-xs font-semibold text-[var(--ds-foreground)]"
                    >
                      {content.slug === 'submit-resource'
                        ? 'Authoritative Specification URL *'
                        : 'Contact Email or GitHub URL *'}
                    </label>
                    <input
                      id="info-field-2"
                      type="text"
                      value={urlOrEmail}
                      onChange={(e) => setUrlOrEmail(e.target.value)}
                      placeholder={
                        content.slug === 'submit-resource'
                          ? 'https://www.w3.org/TR/...'
                          : 'architect@example.com'
                      }
                      className="w-full px-3.5 py-2 text-xs bg-[var(--ds-background)] border border-[var(--ds-border-strong)] rounded-[8px] text-[var(--ds-foreground)]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="info-category"
                    className="block text-xs font-semibold text-[var(--ds-foreground)]"
                  >
                    Target Primary Design Category
                  </label>
                  <select
                    id="info-category"
                    value={categorySelect}
                    onChange={(e) => setCategorySelect(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-[var(--ds-background)] border border-[var(--ds-border-strong)] rounded-[8px] text-[var(--ds-foreground)]"
                  >
                    {TAXONOMY_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.slug}>
                        {String(cat.orderIndex).padStart(2, '0')}. {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="info-notes"
                    className="block text-xs font-semibold text-[var(--ds-foreground)]"
                  >
                    Interactive Parameter & License Notes
                  </label>
                  <textarea
                    id="info-notes"
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Describe the interactive parameters, license terms, and accessibility behavior..."
                    className="w-full p-3 text-xs bg-[var(--ds-background)] border border-[var(--ds-border-strong)] rounded-[8px] text-[var(--ds-foreground)]"
                  />
                </div>

                {formError && (
                  <SemanticAlert variant="error" title="Validation Error">
                    {formError}
                  </SemanticAlert>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  leftIcon={<Send className="w-3.5 h-3.5" />}
                >
                  {content.slug === 'submit-resource'
                    ? 'Submit Resource for Verification'
                    : 'Send Inquiry'}
                </Button>
              </form>
            )}
          </section>
        )}

        {/* Quick Navigation across Platform Info Pages */}
        <section className="p-5 rounded-[12px] bg-[var(--ds-surface)] border border-[var(--ds-border)] flex flex-wrap items-center justify-between gap-3">
          <ResourceMetadata
            items={['Platform Reference Pages', 'All Routes Verified']}
          />
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {Object.values(INFO_PAGES).map((p) => (
              <Link
                key={p.slug}
                href={`/info/${p.slug}`}
                className={`inline-flex items-center gap-1 hover:underline ${
                  p.slug === content.slug
                    ? 'font-bold text-[var(--ds-accent)]'
                    : 'text-[var(--ds-muted-foreground)]'
                }`}
              >
                {p.slug}
                <ArrowUpRight className="w-3 h-3" />
              </Link>
            ))}
          </div>
        </section>
      </main>

      <AppFooter />
    </div>
  );
}
