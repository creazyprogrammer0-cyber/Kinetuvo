import type { Metadata } from 'next';
import {
  TAXONOMY_CATEGORIES,
  getCategoryBySlug,
  resourceBelongsToCategory,
} from '@/lib/taxonomy/registry';
import { FOUNDATION_RESOURCES } from '@/lib/resources/seed-foundation';
import {
  buildBreadcrumbJsonLd,
  buildCategoryCollectionJsonLd,
  buildCategorySeoMetadata,
} from '@/lib/seo/metadata-architect';
import { CategoryDetailPageClient } from '@/components/directory/CategoryDetailPageClient';

export const revalidate = 3600;

export async function generateStaticParams() {
  return TAXONOMY_CATEGORIES.map((cat) => ({
    categorySlug: cat.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ categorySlug: string }>;
}): Promise<Metadata> {
  const { categorySlug } = await params;
  // Resolves canonical link strictly to /categories/{slug} to prevent duplicate URL indexing
  return buildCategorySeoMetadata(categorySlug);
}

export default async function TaxonomyCategoryDetailPage({
  params,
}: {
  params: Promise<{ categorySlug: string }>;
}) {
  const { categorySlug } = await params;
  const category =
    getCategoryBySlug(categorySlug) || TAXONOMY_CATEGORIES[0];
  const categoryResources = FOUNDATION_RESOURCES.filter((r) =>
    resourceBelongsToCategory(r, category)
  );

  const collectionJsonLd = buildCategoryCollectionJsonLd(
    category,
    categoryResources
  );
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { label: 'Encyclopedia Home', href: '/' },
    { label: 'Resource Directory', href: '/directory' },
    {
      label: `${String(category.orderIndex).padStart(2, '0')}. ${category.name}`,
      href: `/categories/${category.slug}`,
    },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <CategoryDetailPageClient categorySlug={categorySlug} />
    </>
  );
}
