import type { Metadata } from 'next';
import { getAllWineriesForBrowse } from '@/lib/data/wineries';
import { WineriesBrowser } from './wineries-browser';

export const revalidate = 3600;

const title = 'Browse Sonoma County Wineries';
const description =
  'Explore 68 curated Sonoma County wineries. Filter by region, price, amenities, and more. Find dog-friendly, walk-in, and food-pairing wineries across every AVA.';

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    type: 'website',
    siteName: 'Sonoma Sip',
    images: ['/opengraph-image'],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: ['/opengraph-image'],
  },
  alternates: {
    canonical: '/wineries',
  },
};

export default async function WineriesPage() {
  const wineries = await getAllWineriesForBrowse();
  return <WineriesBrowser wineries={wineries} />;
}
