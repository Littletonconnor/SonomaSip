import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Star, ExternalLink, Check } from 'lucide-react';
import { AnimatedSection, StaggerChildren, StaggerItem } from '@/components/ui/animated-section';
import { PlanMap } from './plan-map';
import { PlanActions } from './plan-actions';
import { PlanHoverProvider } from './plan-hover-context';
import { PlanWineryStop } from './plan-winery-stop';
import { createServerSupabase } from '@/lib/supabase-server';
import type { MapItem } from '@/components/map/types';
import type { MatchResult, QuizAnswers, MustHaves } from '@/lib/types';

const MUST_HAVE_LABELS: Record<keyof MustHaves, string> = {
  views: 'Views',
  foodPairing: 'Food Pairing',
  outdoorSeating: 'Outdoor Seating',
  dogFriendly: 'Dog Friendly',
  kidFriendly: 'Kid Friendly',
  wheelchairAccessible: 'Accessible',
};

async function getPlan(id: string) {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from('shared_itineraries')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    createdAt: data.created_at,
    quizAnswers: data.quiz_answers as unknown as QuizAnswers,
    results: data.results as unknown as MatchResult[],
  };
}

function derivePreferenceBadges(answers: QuizAnswers): string[] {
  const badges: string[] = [];
  answers.selectedVarietals.forEach((v) => badges.push(v));
  answers.selectedVibes.forEach((v) => badges.push(v));
  if (answers.budgetBand) badges.push(answers.budgetBand);
  answers.preferredRegions.forEach((r) => badges.push(r));
  Object.entries(answers.mustHaves).forEach(([key, val]) => {
    if (val) badges.push(MUST_HAVE_LABELS[key as keyof MustHaves]);
  });
  if (answers.groupSize) badges.push(`${answers.groupSize}+ guests`);
  if (answers.includeMembersOnly) badges.push('Members-only OK');
  return badges;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const plan = await getPlan(id);

  if (!plan) {
    return { title: 'Plan Not Found' };
  }

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
  const plan = await getPlan(id);

  if (!plan) {
    notFound();
  }

  const preferences = derivePreferenceBadges(plan.quizAnswers);

  const mapItems: MapItem[] = plan.results.map((r) => ({
    id: r.winery.id,
    latitude: r.winery.latitude,
    longitude: r.winery.longitude,
    rank: r.rank,
    label: r.winery.name,
    region: r.winery.region,
    slug: r.winery.slug,
    priceRange: `$${r.winery.minFlightPrice}–${r.winery.maxFlightPrice}`,
    rating: r.winery.averageRating,
    bookingUrl: r.winery.bookingUrl,
  }));

  return (
    <PlanHoverProvider>
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

              {preferences.length > 0 && (
                <div className="mt-6">
                  <p className="text-bark text-sm font-medium">Preferences</p>
                  <div className="mt-2 flex flex-wrap gap-x-1.5 gap-y-2">
                    {preferences.map((p) => (
                      <span
                        key={p}
                        className="bg-linen text-oak rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-black/5"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <PlanActions
                planUrl={`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/plan/${plan.id}`}
              />

              <div className="mt-8">
                <PlanMap items={mapItems} />
              </div>
            </AnimatedSection>
          </div>

          <div className="max-lg:mt-10">
            <StaggerChildren staggerDelay={0.08}>
              {plan.results.map((result, i) => (
                <StaggerItem key={result.winery.id}>
                  <PlanWineryStop wineryId={result.winery.id}>
                    <WineryStop result={result} showBorder={i > 0} />
                  </PlanWineryStop>
                </StaggerItem>
              ))}
            </StaggerChildren>
          </div>
        </div>

        <div className="mt-8 border-t border-black/5 py-8">
          <p className="text-stone/70 text-sm text-pretty">
            Sonoma Sip is an independent guide — not affiliated with any listed winery. Hours,
            prices, and policies may change. Always verify details directly with the winery before
            visiting.
          </p>
        </div>
      </div>
    </PlanHoverProvider>
  );
}

function WineryStop({ result, showBorder }: { result: MatchResult; showBorder: boolean }) {
  const { winery, rank, matchReasons } = result;
  const badges: string[] = [];
  if (winery.reservationType === 'walk_ins_welcome') badges.push('Walk-in');
  if (winery.reservationType === 'reservations_recommended')
    badges.push('Reservations Recommended');
  if (winery.reservationType === 'appointment_only') badges.push('Appointment required');
  if (winery.isDogFriendly) badges.push('Dog Friendly');
  if (winery.hasFoodPairing) badges.push('Food Pairing');

  return (
    <div className={`py-6 sm:py-8 ${showBorder ? 'border-t border-black/5' : ''}`}>
      <div className="flex items-start gap-5 px-2">
        <div className="bg-gold/20 text-bark grid size-10 shrink-0 place-items-center rounded-full text-sm/10 font-medium tabular-nums">
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
                <Check className="text-wine mt-0.5 size-3.5 shrink-0" />
                {reason}
              </li>
            ))}
          </ul>

          {badges.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {badges.map((b) => (
                <span
                  key={b}
                  className="bg-linen text-oak rounded-full px-3 py-1 text-sm font-medium ring-1 ring-black/5"
                >
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
