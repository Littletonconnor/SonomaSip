import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Your Winery Recommendations',
  description:
    'Your personalized Sonoma County winery matches, ranked by how well they fit your taste, budget, and group. View on a map, share, or print your itinerary.',
  robots: {
    index: false,
  },
};

export default function ResultsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
