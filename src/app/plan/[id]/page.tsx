import type { Metadata } from 'next';
import Link from 'next/link';
import {
  MapPin,
  Printer,
  Mail,
  Link2,
  Star,
  ExternalLink,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatedSection, StaggerChildren, StaggerItem } from '@/components/ui/animated-section';
import { mockResultsCasualCouple } from '@/lib/mock-data';
import type { MatchResult } from '@/lib/types';

const MOCK_PLAN = {
  id: 'abc123',
  createdAt: '2026-04-02',
  preferences: ['Pinot Noir', 'Zinfandel', 'Relaxed & Scenic', '$$', 'Dog Friendly', 'Views'],
  results: mockResultsCasualCouple,
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function getPlan(_id: string) {
  return MOCK_PLAN;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const plan = getPlan(id);
  const wineryNames = plan.results.map((r) => r.winery.name);
  const description = `A ${plan.results.length}-stop Sonoma County wine day: ${wineryNames.join(', ')}. Curated by Sonoma Sip.`;

  return {
    title: `Wine Day Itinerary — ${plan.results.length} Stops`,
    description,
    openGraph: {
      title: `Wine Day Itinerary — ${plan.results.length} Stops`,
      description,
      type: 'website',
      siteName: 'Sonoma Sip',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Wine Day Itinerary — ${plan.results.length} Stops`,
      description,
    },
  };
}

export default async function SharedPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const plan = MOCK_PLAN;

  return (
    <div className="mx-auto max-w-6xl px-6 py-12 md:py-16">
      <div className="gap-12 lg:grid lg:grid-cols-[2fr_3fr]">
        <div className="lg:sticky lg:top-20 lg:self-start lg:pb-12">
          <AnimatedSection>
            <p className="font-mono text-xs tracking-widest text-wine">Sonoma Sip Plan</p>
            <h1 className="mt-2 font-heading text-3xl font-medium tracking-tight text-balance text-bark md:text-4xl">
              Your Wine Day Itinerary
            </h1>
            <p className="mt-2 text-sm text-stone">
              {plan.results.length} stops &middot; Generated {formatDate(plan.createdAt)}
            </p>

            <div className="mt-6">
              <p className="text-sm font-medium text-bark">Preferences</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {plan.preferences.map((p) => (
                  <span
                    key={p}
                    className="rounded-full bg-linen px-2.5 py-0.5 text-xs font-medium text-oak ring-1 ring-black/5"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-2">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Link2 className="size-3.5" />
                Copy Link
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Printer className="size-3.5" />
                Print
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Mail className="size-3.5" />
                Email
              </Button>
            </div>

            <div className="mt-8">
              <MapPlaceholder results={plan.results} />
            </div>
          </AnimatedSection>
        </div>

        <div className="max-lg:mt-10">
          <StaggerChildren staggerDelay={0.08}>
            {plan.results.map((result, i) => (
              <StaggerItem key={result.winery.id}>
                <WineryStop result={result} showBorder={i > 0} />
              </StaggerItem>
            ))}
          </StaggerChildren>
        </div>
      </div>

      <div className="border-t border-black/5 py-8">
        <p className="text-sm text-pretty text-stone/70">
          Sonoma Sip is an independent guide — not affiliated with any listed winery. Hours, prices,
          and policies may change. Always verify details directly with the winery before visiting.
        </p>
      </div>
    </div>
  );
}

function WineryStop({ result, showBorder }: { result: MatchResult; showBorder: boolean }) {
  const { winery, rank, score, matchReasons } = result;
  const badges: string[] = [];
  if (winery.reservationType === 'walk-in') badges.push('Walk-in');
  if (winery.reservationType === 'appointment') badges.push('Reservation required');
  if (winery.isDogFriendly) badges.push('Dog Friendly');
  if (winery.hasFoodPairing) badges.push('Food Pairing');

  return (
    <div className={`py-6 sm:py-8 ${showBorder ? 'border-t border-black/5' : ''}`}>
      <div className="flex items-start gap-5">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gold/20 font-heading text-lg font-medium tabular-nums text-bark">
          {rank}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <Link
              href={`/wineries/${winery.slug}`}
              className="font-heading text-xl font-medium tracking-tight text-bark hover:text-wine sm:text-2xl"
            >
              {winery.name}
            </Link>
            <span className="text-sm text-stone">{winery.region}</span>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-stone">
            <span className="tabular-nums">
              ${winery.minFlightPrice}&ndash;{winery.maxFlightPrice}
            </span>
            {winery.averageRating && (
              <span className="flex items-center gap-1">
                <Star className="size-3.5 fill-gold text-gold" />
                <span className="tabular-nums">{winery.averageRating}</span>
              </span>
            )}
          </div>

          <ul className="mt-3 flex flex-col gap-1" role="list">
            {matchReasons.map((reason) => (
              <li key={reason} className="flex items-start gap-2 text-sm text-pretty text-stone">
                <Check className="mt-0.5 size-3.5 shrink-0 text-sage" />
                {reason}
              </li>
            ))}
          </ul>

          {badges.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {badges.map((b) => (
                <span key={b} className="rounded-full bg-fog/80 px-2 py-0.5 text-xs text-stone">
                  {b}
                </span>
              ))}
            </div>
          )}

          <a
            href={winery.bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-wine hover:text-wine-dark"
          >
            Book a Tasting
            <ExternalLink className="size-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}

function MapPlaceholder({ results }: { results: MatchResult[] }) {
  const latRange = { min: 38.2, max: 38.85 };
  const lngRange = { min: -123.1, max: -122.5 };

  return (
    <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-black/5">
      <div className="relative aspect-[4/3] bg-linear-to-br from-sage/10 via-linen to-gold/10">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <MapPin className="mx-auto size-6 text-stone/20" />
            <p className="mt-1 text-sm text-stone/40">Map coming soon</p>
          </div>
        </div>
        {results.map((r) => {
          const x = ((r.winery.longitude - lngRange.min) / (lngRange.max - lngRange.min)) * 100;
          const y = ((latRange.max - r.winery.latitude) / (latRange.max - latRange.min)) * 100;
          return (
            <div
              key={r.winery.id}
              className="absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-wine ring-2 ring-white"
              style={{
                left: `${Math.max(10, Math.min(90, x))}%`,
                top: `${Math.max(10, Math.min(90, y))}%`,
              }}
              title={`#${r.rank} ${r.winery.name}`}
            />
          );
        })}
      </div>
    </div>
  );
}
