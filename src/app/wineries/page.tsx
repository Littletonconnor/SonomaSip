import { getAllWineriesForBrowse } from '@/lib/data/wineries';
import { WineriesBrowser } from './wineries-browser';

export const revalidate = 3600;

export default async function WineriesPage() {
  const wineries = await getAllWineriesForBrowse();
  return <WineriesBrowser wineries={wineries} />;
}
