import type { Metadata } from 'next';
import { buildCanonicalUrl } from '@/lib/seo/metadata-architect';

export const metadata: Metadata = {
  title: 'Global Discovery & Multi-Facet Search | Digital Design Encyclopedia',
  description:
    'Search across design systems, visual styles, animations, UI components, interaction patterns, technologies, and 16 primary categories.',
  alternates: {
    canonical: buildCanonicalUrl('/search'),
  },
  // Prevent search engines from indexing internal search parameter permutations
  robots: {
    index: false,
    follow: true,
    googleBot: {
      index: false,
      follow: true,
    },
  },
};

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
