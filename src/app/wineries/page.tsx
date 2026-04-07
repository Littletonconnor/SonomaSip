import type { Metadata } from 'next';
import { getAllWineriesForBrowse } from '@/lib/data/wineries';
import { WineriesBrowser } from './wineries-browser';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Browse Sonoma County Wineries',
  description:
    'Explore 68 curated Sonoma County wineries. Filter by region, price, amenities, and more. Find dog-friendly, walk-in, and food-pairing wineries across every AVA.',
  alternates: {
    canonical: '/wineries',
  },
};

export default async function WineriesPage() {
  const wineries = await getAllWineriesForBrowse();
  return <WineriesBrowser wineries={wineries} />;
}
