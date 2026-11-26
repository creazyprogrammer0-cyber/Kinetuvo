import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Personal Design Library & User Workspace (Private) | Digital Design Encyclopedia',
  description:
    'Private user workspace for saved bookmarks, personal design collections, and playground experiments.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
