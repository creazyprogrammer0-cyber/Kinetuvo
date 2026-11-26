import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { ToastProvider } from '@/components/ui/InteractionPrimitives';
import { AuthLibraryProvider } from '@/components/providers/AuthLibraryProvider';
import { FirestoreErrorBoundary } from '@/components/providers/FirestoreErrorBoundary';

export const metadata: Metadata = {
  title: 'Digital Design Encyclopedia',
  description:
    'An interactive knowledge and experimentation platform for digital design systems, visual styles, UI/UX patterns, motion principles, and live code implementation.',
  openGraph: {
    title: 'Digital Design Encyclopedia',
    description:
      'An interactive knowledge and experimentation platform for digital design systems, visual styles, UI/UX patterns, motion principles, and live code implementation.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Digital Design Encyclopedia',
    description:
      'An interactive knowledge and experimentation platform for digital design systems, visual styles, UI/UX patterns, motion principles, and live code implementation.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="font-sans antialiased bg-[var(--ds-background)] text-[var(--ds-foreground)] selection:bg-[var(--ds-primary)] selection:text-white"
        suppressHydrationWarning
      >
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
