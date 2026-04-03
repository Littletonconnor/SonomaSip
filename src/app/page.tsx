import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center py-24 md:py-32">
        <Container className="flex flex-col items-center text-center">
          <p className="text-sm font-medium tracking-widest text-wine uppercase">
            Sonoma County Winery Guide
          </p>
          <h1 className="mt-4 text-5xl font-semibold tracking-tight text-bark md:text-6xl lg:text-7xl">
            Sonoma Sip
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground md:text-xl">
            Answer a few questions about your wine preferences, budget, and group — and get a
            personalized, ranked list of Sonoma County wineries that fit.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/quiz">Plan Your Visit</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/wineries">Browse All Wineries</Link>
            </Button>
          </div>
        </Container>
      </section>

      {/* How it works */}
      <section className="border-t border-border bg-card py-16 md:py-24">
        <Container>
          <h2 className="text-center text-3xl font-semibold text-bark md:text-4xl">
            How It Works
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              {
                step: '01',
                title: 'Tell Us Your Preferences',
                description:
                  'Varietals, vibe, budget, must-haves — a short quiz to understand what matters to you.',
              },
              {
                step: '02',
                title: 'Get Matched',
                description:
                  'Our matching engine scores 68 curated wineries and ranks the best fits with clear reasons why.',
              },
              {
                step: '03',
                title: 'Plan & Share',
                description:
                  'View your results on a map, read winery details, then share, print, or email your plan.',
              },
            ].map((item) => (
              <div key={item.step} className="text-center md:text-left">
                <span className="text-sm font-medium text-gold">{item.step}</span>
                <h3 className="mt-2 text-xl font-semibold text-bark">{item.title}</h3>
                <p className="mt-3 text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <Container>
          <div className="flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground md:flex-row">
            <p>
              Sonoma Sip is an independent guide. Verify hours, prices, and policies before
              visiting.
            </p>
            <div className="flex gap-6">
              <Link href="/privacy" className="transition-colors hover:text-foreground">
                Privacy
              </Link>
              <Link href="/terms" className="transition-colors hover:text-foreground">
                Terms
              </Link>
            </div>
          </div>
        </Container>
      </footer>
    </>
  );
}
