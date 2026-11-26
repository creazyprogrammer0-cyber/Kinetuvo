import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Administration Dashboard & CMS (Private) | Digital Design Encyclopedia',
  description:
    'Isolated administrative governance console and Content Management System for the Digital Design Encyclopedia.',
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

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
