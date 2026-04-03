import Link from 'next/link';
import { MapPin, Printer, Mail, Link2, Star, ExternalLink, Check } from 'lucide-react';
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

export default async function SharedPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const plan = MOCK_PLAN;

  return (
    <div className="mx-auto max-w-6xl px-6 py-12 md:py-16">
      <div className="gap-12 lg:grid lg:grid-cols-[2fr_3fr]">
        <div className="lg:sticky lg:top-20 lg:self-start lg:pb-12">
          <AnimatedSection>
            <p className="text-wine font-mono text-xs tracking-widest">Sonoma Sip Plan</p>
            <h1 className="font-heading text-bark mt-2 text-3xl font-medium tracking-tight text-balance md:text-4xl">
              Your Wine Day Itinerary
            </h1>
            <p className="text-stone mt-2 text-sm">
              {plan.results.length} stops &middot; Generated {formatDate(plan.createdAt)}
            </p>

            <div className="mt-6">
              <p className="text-bark text-sm font-medium">Preferences</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {plan.preferences.map((p) => (
                  <span
                    key={p}
                    className="bg-linen text-oak rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-black/5"
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
        <p className="text-stone/70 text-sm text-pretty">
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
        <div className="bg-gold/20 font-heading text-bark flex size-10 shrink-0 items-center justify-center rounded-full text-lg font-medium tabular-nums">
          {rank}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <Link
              href={`/wineries/${winery.slug}`}
              className="font-heading text-bark hover:text-wine text-xl font-medium tracking-tight sm:text-2xl"
            >
              {winery.name}
            </Link>
            <span className="text-stone text-sm">{winery.region}</span>
          </div>

          <div className="text-stone mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span className="tabular-nums">
              ${winery.minFlightPrice}&ndash;{winery.maxFlightPrice}
            </span>
            {winery.averageRating && (
              <span className="flex items-center gap-1">
                <Star className="fill-gold text-gold size-3.5" />
                <span className="tabular-nums">{winery.averageRating}</span>
              </span>
            )}
          </div>

          <ul className="mt-3 flex flex-col gap-1" role="list">
            {matchReasons.map((reason) => (
              <li key={reason} className="text-stone flex items-start gap-2 text-sm text-pretty">
                <Check className="text-sage mt-0.5 size-3.5 shrink-0" />
                {reason}
              </li>
            ))}
          </ul>

          {badges.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {badges.map((b) => (
                <span key={b} className="bg-fog/80 text-stone rounded-full px-2 py-0.5 text-xs">
                  {b}
                </span>
              ))}
            </div>
          )}

          <a
            href={winery.bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-wine hover:text-wine-dark mt-3 inline-flex items-center gap-1.5 text-sm font-medium"
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
    <div className="bg-card overflow-hidden rounded-2xl ring-1 ring-black/5">
      <div className="from-sage/10 via-linen to-gold/10 relative aspect-[4/3] bg-linear-to-br">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <MapPin className="text-stone/20 mx-auto size-6" />
            <p className="text-stone/40 mt-1 text-sm">Map coming soon</p>
          </div>
        </div>
        {results.map((r) => {
          const x = ((r.winery.longitude - lngRange.min) / (lngRange.max - lngRange.min)) * 100;
          const y = ((latRange.max - r.winery.latitude) / (latRange.max - latRange.min)) * 100;
          return (
            <div
              key={r.winery.id}
              className="bg-wine absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white"
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
