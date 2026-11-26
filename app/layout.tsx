import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { ToastProvider } from '@/components/ui/InteractionPrimitives';
import { AuthLibraryProvider } from '@/components/providers/AuthLibraryProvider';
import { FirestoreErrorBoundary } from '@/components/providers/FirestoreErrorBoundary';
import {
  buildCanonicalUrl,
  buildSiteOrganizationJsonLd,
  getCanonicalSiteUrl,
} from '@/lib/seo/metadata-architect';

export const metadata: Metadata = {
  metadataBase: new URL(getCanonicalSiteUrl()),
  title: {
    default:
      'Digital Design Encyclopedia — Interactive Design Systems, Motion & UI Specifications',
    template: '%s',
  },
  description:
    'An interactive knowledge and experimentation platform for digital design systems, visual styles, UI/UX patterns, motion physics, WCAG 2.2 AA accessibility, and live code implementation.',
  alternates: {
    canonical: buildCanonicalUrl('/'),
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
    },
  },
  openGraph: {
    title:
      'Digital Design Encyclopedia — Interactive Design Systems, Motion & UI Specifications',
    description:
      'An interactive knowledge and experimentation platform for digital design systems, visual styles, UI/UX patterns, motion physics, WCAG 2.2 AA accessibility, and live code implementation.',
    type: 'website',
    url: buildCanonicalUrl('/'),
    siteName: 'Digital Design Encyclopedia',
  },
  twitter: {
    card: 'summary_large_image',
    title:
      'Digital Design Encyclopedia — Interactive Design Systems, Motion & UI Specifications',
    description:
      'An interactive knowledge and experimentation platform for digital design systems, visual styles, UI/UX patterns, motion physics, WCAG 2.2 AA accessibility, and live code implementation.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const siteJsonLd = buildSiteOrganizationJsonLd();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }}
        />
      </head>
      <body
        className="font-sans antialiased bg-[var(--ds-background)] text-[var(--ds-foreground)] selection:bg-[var(--ds-primary)] selection:text-white"
        suppressHydrationWarning
      >
        {/* WCAG 2.2 AA Skip Navigation Link (2.4.1 Bypass Blocks) */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2.5 focus:rounded-[8px] focus:bg-[var(--ds-primary)] focus:text-[var(--ds-primary-foreground)] focus:text-xs focus:font-semibold focus:shadow-lg focus:outline-2 focus:outline-offset-2 focus:outline-[var(--ds-focus)]"
        >
          Skip to main content
        </a>
        <ThemeProvider>
          <ToastProvider>
            <FirestoreErrorBoundary>
              <AuthLibraryProvider>{children}</AuthLibraryProvider>
            </FirestoreErrorBoundary>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
