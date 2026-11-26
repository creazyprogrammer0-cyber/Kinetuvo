import type { MetadataRoute } from 'next';
import { buildCanonicalUrl, getCanonicalSiteUrl } from '@/lib/seo/metadata-architect';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/categories/',
          '/resources/',
          '/technologies/',
          '/playground',
          '/directory',
          '/design-system',
          '/info/',
        ],
        disallow: [
          '/admin',
          '/admin/',
          '/dashboard',
          '/dashboard/',
          '/api/',
          '/search?*',
          '/playground?*experiment=*',
          '/playground?*share=*',
        ],
      },
    ],
    sitemap: buildCanonicalUrl('/sitemap.xml'),
    host: getCanonicalSiteUrl(),
  };
}
