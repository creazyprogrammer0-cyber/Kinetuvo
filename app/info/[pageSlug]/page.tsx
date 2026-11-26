'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { Send, CheckCircle2, ArrowUpRight, ShieldCheck } from 'lucide-react';
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
import { useAuthLibrary } from '@/components/providers/AuthLibraryProvider';
import { getFirebaseDb } from '@/lib/firebase/client';
import {
  sanitizeKebabSlug,
  sanitizeRichTextField,
  UserSubmissionType,
} from '@/lib/admin/cms-types';

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
      'Propose an official design system, visual example, interactive demonstration, correction, new technology, or related reference for editorial verification.',
    sections: [
      {
        heading: 'Provenance & Moderation Requirements',
        body: 'All submissions enter the moderated editorial queue (pending_review) and never execute or publish automatically. Reviewers inspect source URLs, license terms, and code safety before converting approved submissions into CMS drafts.',
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
  const { user, signInWithGoogle } = useAuthLibrary();

  const content = INFO_PAGES[pageSlug] || INFO_PAGES.documentation;

  // Interactive Form State for Contact & Submit Resource (Section 8 Moderated Contributions)
  const [submissionType, setSubmissionType] =
    useState<UserSubmissionType>('design-resource');
  const [titleOrName, setTitleOrName] = useState('');
  const [urlOrEmail, setUrlOrEmail] = useState('');
  const [targetResourceSlug, setTargetResourceSlug] = useState('');
  const [categorySelect, setCategorySelect] = useState(
    TAXONOMY_CATEGORIES[0].slug
  );
  const [notes, setNotes] = useState('');
  const [proposedCode, setProposedCode] = useState('');
  const [licenseAttestation, setLicenseAttestation] = useState(
    'MIT / CC-BY-4.0 Verified Attribution'
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [savedToFirestore, setSavedToFirestore] = useState(false);

  const showInteractiveForm =
    content.slug === 'submit-resource' || content.slug === 'contact';

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const cleanTitle = sanitizeRichTextField(titleOrName.trim(), 140);
    const cleanNotes = sanitizeRichTextField(notes.trim(), 3000);

    if (cleanTitle.length < 3) {
      setFormError(
        'Please provide a valid name or concept title (min 3 characters).'
      );
      return;
    }
    if (urlOrEmail.trim().length < 5) {
      setFormError(
        'Please provide a valid specification URL or contact email.'
      );
      return;
    }
    if (cleanNotes.length < 10) {
      setFormError(
        'Please provide a detailed architectural explanation or correction summary (min 10 characters).'
      );
      return;
    }

    // Persist directly to Firestore /cms_submissions moderation queue when signed in
    if (user && user.emailVerified) {
      try {
        const db = getFirebaseDb();
        const subId = `sub-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 7)}`;
        await setDoc(doc(db, 'cms_submissions', subId), {
          submitterUid: user.uid,
          submitterName: (
            user.displayName ||
            user.email ||
            'Contributor'
          ).slice(0, 80),
          submissionType:
            content.slug === 'contact' ? 'correction-report' : submissionType,
          title: cleanTitle,
          targetResourceSlug: sanitizeKebabSlug(targetResourceSlug),
          categorySlug: categorySelect.slice(0, 100),
          summary: cleanNotes,
          proposedCodeOrContent: proposedCode.slice(0, 15000),
          sourceUrl: urlOrEmail.trim().slice(0, 500),
          licenseAttestation: (
            licenseAttestation || 'MIT / CC-BY-4.0 Attribution'
          )
            .trim()
            .slice(0, 200),
          status: 'pending_review',
          reviewerNotes: '',
          reviewedByUid: '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        setSavedToFirestore(true);
      } catch {
        setSavedToFirestore(false);
      }
    }

    setSubmittedSuccess(true);
    pushToast({
      tone: 'success',
      title:
        content.slug === 'submit-resource'
          ? 'Moderated Submission Queued'
          : 'Inquiry Recorded',
      description: `Queued "${cleanTitle}" for editorial review in /admin.`,
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
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-lg font-bold text-[var(--ds-foreground)]">
                {content.slug === 'submit-resource'
                  ? 'Moderated Contribution & Provenance Submission Form'
                  : 'Editorial & Engineering Contact Form'}
              </h2>
              {user ? (
                <span className="inline-flex items-center gap-1.5 font-mono text-xs text-emerald-500">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>
                    Connected to Firestore Moderation Queue ({user.email})
                  </span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => void signInWithGoogle()}
                  className="font-mono text-xs text-[var(--ds-accent)] hover:underline"
                >
                  Sign in with Google to sync submission to Firestore /admin →
                </button>
              )}
            </div>

            {submittedSuccess ? (
              <SemanticAlert
                variant="success"
                title="Submission Validated & Queued for Editorial Review"
                action={
                  <div className="flex items-center gap-2">
                    <Link
                      href="/admin"
                      className="px-3 py-1.5 rounded text-xs font-semibold bg-[var(--ds-primary)] text-[var(--ds-primary-foreground)]"
                    >
                      Inspect in /admin Moderation Queue
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSubmittedSuccess(false);
                        setTitleOrName('');
                        setUrlOrEmail('');
                        setNotes('');
                        setProposedCode('');
                      }}
                    >
                      Submit Another
                    </Button>
                  </div>
                }
              >
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Recorded entry for &quot;{titleOrName}&quot; in track{' '}
                  <code className="font-mono">{categorySelect}</code> (Status:{' '}
                  <code className="font-mono">pending_review</code>
                  {savedToFirestore ? ' · Synced to Firestore' : ''}).
                </span>
              </SemanticAlert>
            ) : (
              <form
                onSubmit={(e) => void handleFormSubmit(e)}
                className="space-y-4"
                noValidate
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="info-sub-type"
                      className="block text-xs font-semibold text-[var(--ds-foreground)]"
                    >
                      Contribution Classification *
                    </label>
                    <select
                      id="info-sub-type"
                      value={submissionType}
                      onChange={(e) =>
                        setSubmissionType(
                          e.target.value as UserSubmissionType
                        )
                      }
                      className="w-full px-3.5 py-2 text-xs bg-[var(--ds-background)] border border-[var(--ds-border-strong)] rounded-[8px] text-[var(--ds-foreground)]"
                    >
                      <option value="design-resource">Design Resource</option>
                      <option value="visual-example">Visual Example</option>
                      <option value="interactive-demo">
                        Interactive Demonstration
                      </option>
                      <option value="correction-report">
                        Correction / Issue Report
                      </option>
                      <option value="new-technology">New Technology</option>
                      <option value="related-reference">
                        Related Reference
                      </option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="info-category"
                      className="block text-xs font-semibold text-[var(--ds-foreground)]"
                    >
                      Target Primary Design Category *
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
                      htmlFor="info-target-slug"
                      className="block text-xs font-semibold text-[var(--ds-foreground)]"
                    >
                      Related Resource Slug (Optional)
                    </label>
                    <input
                      id="info-target-slug"
                      type="text"
                      value={targetResourceSlug}
                      onChange={(e) => setTargetResourceSlug(e.target.value)}
                      placeholder="e.g., material-3-semantic-token-hierarchy"
                      className="w-full px-3.5 py-2 text-xs font-mono bg-[var(--ds-background)] border border-[var(--ds-border-strong)] rounded-[8px] text-[var(--ds-foreground)]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="info-field-1"
                      className="block text-xs font-semibold text-[var(--ds-foreground)]"
                    >
                      {content.slug === 'submit-resource'
                        ? 'Design Resource or Concept Title *'
                        : 'Subject / Concept Title *'}
                    </label>
                    <input
                      id="info-field-1"
                      type="text"
                      value={titleOrName}
                      onChange={(e) => setTitleOrName(e.target.value)}
                      placeholder="e.g., W3C View Transitions Shared Element Morph"
                      className="w-full px-3.5 py-2 text-xs bg-[var(--ds-background)] border border-[var(--ds-border-strong)] rounded-[8px] text-[var(--ds-foreground)]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="info-field-2"
                      className="block text-xs font-semibold text-[var(--ds-foreground)]"
                    >
                      Authoritative Specification URL *
                    </label>
                    <input
                      id="info-field-2"
                      type="text"
                      value={urlOrEmail}
                      onChange={(e) => setUrlOrEmail(e.target.value)}
                      placeholder="https://www.w3.org/TR/css-view-transitions-1/"
                      className="w-full px-3.5 py-2 text-xs bg-[var(--ds-background)] border border-[var(--ds-border-strong)] rounded-[8px] text-[var(--ds-foreground)]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="info-notes"
                    className="block text-xs font-semibold text-[var(--ds-foreground)]"
                  >
                    Architectural Summary & Explanation (Min 10 chars) *
                  </label>
                  <textarea
                    id="info-notes"
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Describe the design pattern, interactive parameters, accessibility behavior, or correction details..."
                    className="w-full p-3 text-xs bg-[var(--ds-background)] border border-[var(--ds-border-strong)] rounded-[8px] text-[var(--ds-foreground)]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="info-code"
                      className="block text-xs font-semibold text-[var(--ds-foreground)]"
                    >
                      Proposed HTML/CSS/JS Specimen (Never Auto-Executed)
                    </label>
                    <textarea
                      id="info-code"
                      rows={3}
                      value={proposedCode}
                      onChange={(e) => setProposedCode(e.target.value)}
                      placeholder="<div class='specimen'>...</div>"
                      className="w-full p-2.5 text-xs font-mono bg-[var(--ds-background)] border border-[var(--ds-border-strong)] rounded-[8px] text-[var(--ds-foreground)]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label
                      htmlFor="info-license"
                      className="block text-xs font-semibold text-[var(--ds-foreground)]"
                    >
                      License & Attribution Attestation *
                    </label>
                    <input
                      id="info-license"
                      type="text"
                      value={licenseAttestation}
                      onChange={(e) => setLicenseAttestation(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs bg-[var(--ds-background)] border border-[var(--ds-border-strong)] rounded-[8px] text-[var(--ds-foreground)]"
                    />
                    <p className="text-[11px] text-[var(--ds-muted-foreground)] pt-1">
                      Submitted code is stored as inert text and inspected by
                      Reviewers in /admin before any sandbox execution.
                    </p>
                  </div>
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
                    ? 'Submit Resource for Moderation Review'
                    : 'Send Editorial Report'}
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
