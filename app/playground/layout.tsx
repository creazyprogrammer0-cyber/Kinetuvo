import type { Metadata } from 'next';
import { buildCanonicalUrl } from '@/lib/seo/metadata-architect';

export const metadata: Metadata = {
  title:
    'Live Preview Engine & Interactive Code Playground | Digital Design Encyclopedia',
  description:
    'Experiment with Vanilla HTML/CSS/JS, React 19, SVG Vector Filters, HTML5 2D Canvas, and Three.js WebGL specimens inside an origin-isolated CSP sandbox.',
  alternates: {
    canonical: buildCanonicalUrl('/playground'),
  },
  openGraph: {
    title:
      'Live Preview Engine & Interactive Code Playground | Digital Design Encyclopedia',
    description:
      'Experiment with Vanilla HTML/CSS/JS, React 19, SVG Vector Filters, HTML5 2D Canvas, and Three.js WebGL specimens inside an origin-isolated CSP sandbox.',
    url: buildCanonicalUrl('/playground'),
    type: 'website',
  },
};

export default function PlaygroundLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
