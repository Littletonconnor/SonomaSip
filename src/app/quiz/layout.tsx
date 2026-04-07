import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Wine Tasting Quiz',
  description:
    'Take a 4-step quiz to get personalized Sonoma County winery recommendations. Tell us your favorite wines, vibe, budget, and must-haves.',
  alternates: {
    canonical: '/quiz',
  },
};

export default function QuizLayout({ children }: { children: React.ReactNode }) {
  return children;
}
