import React from 'react';
import { EncyclopediaFoundationShell } from '@/components/workbench/EncyclopediaFoundationShell';
import { TAXONOMY_CATEGORIES } from '@/lib/taxonomy/registry';
import {
  FOUNDATION_RESOURCES,
  ARCHITECTURAL_LAYERS,
} from '@/lib/resources/seed-foundation';

export default function HomePage() {
  return (
    <EncyclopediaFoundationShell
      categories={TAXONOMY_CATEGORIES}
      resources={FOUNDATION_RESOURCES}
      layers={ARCHITECTURAL_LAYERS}
    />
  );
}
