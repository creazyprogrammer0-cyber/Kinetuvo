import type { Metadata } from 'next';
import {
  INFO_PAGES,
  InfoPageClient,
} from '@/components/info/InfoPageClient';
import {
  buildBreadcrumbJsonLd,
  buildCanonicalUrl,
} from '@/lib/seo/metadata-architect';
import { BRAND_CONFIG } from '@/config/brand.config';

export const revalidate = 3600;

export async function generateStaticParams() {
  return Object.keys(INFO_PAGES).map((pageSlug) => ({
    pageSlug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ pageSlug: string }>;
}): Promise<Metadata> {
  const { pageSlug } = await params;
  const content = INFO_PAGES[pageSlug] || INFO_PAGES.documentation;
  const canonicalUrl = buildCanonicalUrl(`/info/${content.slug}`);
  const title = `${content.title} | ${BRAND_CONFIG.productName}`;

  return {
    title,
    description: content.subtitle,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description: content.subtitle,
      url: canonicalUrl,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: content.subtitle,
    },
  };
}

export default async function InfoPage({
  params,
}: {
  params: Promise<{ pageSlug: string }>;
}) {
  const { pageSlug } = await params;
  const content = INFO_PAGES[pageSlug] || INFO_PAGES.documentation;
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { label: 'Encyclopedia Home', href: '/' },
    { label: content.title, href: `/info/${content.slug}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <InfoPageClient pageSlug={pageSlug} />
    </>
  );
}
