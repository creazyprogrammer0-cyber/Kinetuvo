import type { Metadata } from 'next';
import {
  Bricolage_Grotesque,
  Plus_Jakarta_Sans,
  JetBrains_Mono,
} from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { ToastProvider } from '@/components/ui/InteractionPrimitives';

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-display',
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-mono',
});

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
    <html
      lang="en"
      className={`${bricolage.variable} ${jakarta.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body
        className="font-sans antialiased bg-[var(--ds-background)] text-[var(--ds-foreground)] selection:bg-[var(--ds-primary)] selection:text-white"
        suppressHydrationWarning
      >
        <ThemeProvider>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
