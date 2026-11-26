import React from 'react';
import type { Metadata } from 'next';
import { DesignSystemShowcase } from '@/components/design-system/DesignSystemShowcase';

export const metadata: Metadata = {
  title: 'Design System & Component Showcase — Digital Design Encyclopedia',
  description:
    'Interactive specification and live component showcase for the Digital Design Encyclopedia semantic color tokens, fluid typography, layout architecture, and WAI-ARIA primitives.',
};

export default function DesignSystemPage() {
  return <DesignSystemShowcase />;
}
