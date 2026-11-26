import type { MetadataRoute } from 'next';
import { FOUNDATION_RESOURCES } from '@/lib/resources/seed-foundation';
import { TAXONOMY_CATEGORIES } from '@/lib/taxonomy/registry';
import {
  CANONICAL_TECHNOLOGIES,
  buildCanonicalUrl,
} from '@/lib/seo/metadata-architect';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: buildCanonicalUrl('/'),
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: buildCanonicalUrl('/directory'),
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: buildCanonicalUrl('/playground'),
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: buildCanonicalUrl('/technologies'),
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: buildCanonicalUrl('/design-system'),
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.75,
    },
    {
      url: buildCanonicalUrl('/audit'),
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ];

  // Clean Canonical Category Routes: /categories/category-name
  const categoryRoutes: MetadataRoute.Sitemap = TAXONOMY_CATEGORIES.map(
    (cat) => ({
      url: buildCanonicalUrl(`/categories/${cat.slug}`),
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.85,
    })
  );

  // Clean Canonical Resource Routes: /resources/resource-name
  const resourceRoutes: MetadataRoute.Sitemap = FOUNDATION_RESOURCES.map(
    (res) => ({
      url: buildCanonicalUrl(`/resources/${res.slug}`),
      lastModified: res.lastVerifiedDate
        ? new Date(res.lastVerifiedDate)
        : now,
      changeFrequency: 'weekly',
      priority: 0.9,
    })
  );

  // Clean Canonical Technology Routes: /technologies/technology-name
  const technologyRoutes: MetadataRoute.Sitemap = CANONICAL_TECHNOLOGIES.map(
    (tech) => ({
      url: buildCanonicalUrl(`/technologies/${tech.slug}`),
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    })
  );

  // Public Info, Legal, Privacy, Terms & Contribution Guidelines Pages
  const publicInfoSlugs = [
    'documentation',
    'about',
    'community',
    'submit-resource',
    'contribution-guidelines',
    'privacy',
    'terms',
    'cookies',
    'data-deletion',
    'legal',
    'contact',
  ];

  const infoRoutes: MetadataRoute.Sitemap = publicInfoSlugs.map((slug) => ({
    url: buildCanonicalUrl(`/info/${slug}`),
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.65,
  }));

  // Note: Private routes (/admin, /dashboard, /api/*, /search?*) are strictly excluded from sitemap.xml
  return [
    ...staticRoutes,
    ...categoryRoutes,
    ...resourceRoutes,
    ...technologyRoutes,
    ...infoRoutes,
  ];
}
