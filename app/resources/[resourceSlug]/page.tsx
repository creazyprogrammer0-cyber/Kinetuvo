import type { Metadata } from 'next';
import {
  FOUNDATION_RESOURCES,
  getResourceBySlug,
} from '@/lib/resources/seed-foundation';
import { getCategoryBySlug } from '@/lib/taxonomy/registry';
import {
  buildBreadcrumbJsonLd,
  buildResourceSeoMetadata,
  buildResourceTechArticleJsonLd,
} from '@/lib/seo/metadata-architect';
import { ResourceDetailPageClient } from '@/components/resources/ResourceDetailPageClient';

export const revalidate = 3600;

export async function generateStaticParams() {
  return FOUNDATION_RESOURCES.map((res) => ({
    resourceSlug: res.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ resourceSlug: string }>;
}): Promise<Metadata> {
  const { resourceSlug } = await params;
  return buildResourceSeoMetadata(resourceSlug);
}

export default async function CanonicalResourceDetailPage({
  params,
}: {
  params: Promise<{ resourceSlug: string }>;
}) {
  const { resourceSlug } = await params;
  const resource =
    getResourceBySlug(resourceSlug) || FOUNDATION_RESOURCES[0];
  const category = getCategoryBySlug(resource.categorySlug);

  const articleJsonLd = buildResourceTechArticleJsonLd(resource, category);
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { label: 'Encyclopedia Home', href: '/' },
    { label: 'Resource Directory', href: '/directory' },
    {
      label: category ? category.name : 'Categories',
      href: `/categories/${category ? category.slug : resource.categorySlug}`,
    },
    { label: resource.title, href: `/resources/${resource.slug}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <ResourceDetailPageClient resourceSlug={resourceSlug} />
    </>
  );
}
