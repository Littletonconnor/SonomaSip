'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  Share2,
  Printer,
  Mail,
  ChevronDown,
  Star,
  Search,
  Check,
  Map as MapIcon,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AnimatedSection, StaggerChildren, StaggerItem } from '@/components/ui/animated-section';
import { useSessionStorage } from '@/hooks/use-session-storage';
import { useIsMobile } from '@/hooks/use-mobile';
import { mockResultsCasualCouple } from '@/lib/mock-data';
import type { MapItem } from '@/components/map/types';
import type { QuizAnswers, MatchResult, MustHaves } from '@/lib/types';

const SonomaMap = dynamic(() => import('@/components/map/sonoma-map'), { ssr: false });

const defaultAnswers: QuizAnswers = {
  selectedVarietals: [],
  selectedVibes: [],
  budgetBand: null,
  mustHaves: {
    views: false,
    foodPairing: false,
    outdoorSeating: false,
    dogFriendly: false,
    kidFriendly: false,
    wheelchairAccessible: false,
  },
  preferredRegions: [],
  numStops: 3,
  includeMembersOnly: false,
  groupSize: null,
};

const MUST_HAVE_LABELS: Record<keyof MustHaves, string> = {
  views: 'Views',
  foodPairing: 'Food',
  outdoorSeating: 'Outdoor',
  dogFriendly: 'Dogs',
  kidFriendly: 'Kids',
  wheelchairAccessible: 'Accessible',
};

export default function ResultsPage() {
  const [answers, , { hydrated }] = useSessionStorage<QuizAnswers>('quiz-answers', defaultAnswers);
  const results = mockResultsCasualCouple;

  const hasAnswers = useMemo(() => {
    if (!hydrated) return false;
    return (
      answers.selectedVarietals.length > 0 ||
      answers.selectedVibes.length > 0 ||
      answers.budgetBand !== null ||
      answers.preferredRegions.length > 0 ||
      Object.values(answers.mustHaves).some(Boolean)
    );
  }, [answers, hydrated]);

  const preferenceBadges = useMemo(() => {
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
  }, [answers]);

  const mapItems: MapItem[] = useMemo(
    () =>
      results.map((r) => ({
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
      })),
    [results],
  );

  const isMobile = useIsMobile();
  const [showMap, setShowMap] = useState(false);

  if (!hydrated) {
    return <div className="min-h-[calc(100dvh-3.5rem)]" />;
  }

  if (results.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="min-h-[calc(100dvh-3.5rem)]">
      <div className="border-b border-black/5">
        <div className="mx-auto max-w-6xl px-6 py-12 md:py-16">
          <AnimatedSection>
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="font-heading text-bark text-3xl font-medium tracking-tight text-balance md:text-4xl">
                  Your Recommendations
                </h1>
                <p className="text-stone mt-2 text-pretty">
                  {results.length} wineries matched your preferences
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Share2 className="size-3.5" />
                  Share
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
            </div>
          </AnimatedSection>

          {hasAnswers && preferenceBadges.length > 0 && (
            <AnimatedSection delay={0.1}>
              <Collapsible className="mt-6">
                <CollapsibleTrigger className="group text-stone hover:text-bark flex items-center gap-1.5 text-sm font-medium">
                  Your preferences
                  <ChevronDown className="size-4 transition-transform group-data-open:rotate-180" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {preferenceBadges.map((badge) => (
                      <span
                        key={badge}
                        className="bg-linen text-oak rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-black/5"
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </AnimatedSection>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-12 md:py-16">
        <div className="gap-12 lg:grid lg:grid-cols-[3fr_2fr]">
          <div>
            <StaggerChildren className="flex flex-col" staggerDelay={0.08}>
              {results.map((result, i) => (
                <StaggerItem key={result.winery.id}>
                  <ResultCard result={result} showBorder={i > 0} />
                </StaggerItem>
              ))}
            </StaggerChildren>

            <div className="flex items-center gap-4 pt-6">
              <Button variant="outline" asChild>
                <Link href="/quiz">Retake Quiz</Link>
              </Button>
              <Link
                href="/wineries"
                className="text-wine decoration-wine/30 hover:decoration-wine text-sm font-medium underline underline-offset-4"
              >
                Browse all wineries
              </Link>
            </div>
          </div>

          <div className="max-lg:mt-10 lg:sticky lg:top-20 lg:self-start">
            {isMobile ? (
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mb-4 w-full gap-1.5"
                  onClick={() => setShowMap((v) => !v)}
                >
                  <MapIcon className="size-3.5" />
                  {showMap ? 'Hide Map' : 'Show Map'}
                </Button>
                <AnimatePresence>
                  {showMap && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <SonomaMap items={mapItems} showLegend />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <AnimatedSection delay={0.3} direction="right">
                <SonomaMap items={mapItems} showLegend />
              </AnimatedSection>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ResultCard({ result, showBorder }: { result: MatchResult; showBorder: boolean }) {
  const { winery, rank, score, matchReasons } = result;

  const featureBadges: string[] = [];
  if (winery.reservationType === 'walk_ins_welcome') featureBadges.push('Walk-in');
  if (winery.reservationType === 'reservations_recommended')
    featureBadges.push('Reservations Recommended');
  if (winery.reservationType === 'appointment_only') featureBadges.push('Appointment');
  if (winery.isMembersOnly) featureBadges.push('Members Only');
  if (winery.isDogFriendly) featureBadges.push('Dog Friendly');
  if (winery.isKidFriendly) featureBadges.push('Kid Friendly');
  if (winery.hasFoodPairing) featureBadges.push('Food Pairing');
  if (winery.hasViews) featureBadges.push('Views');

  return (
    <Link
      href={`/wineries/${winery.slug}`}
      className={`group flex gap-5 py-7 sm:gap-7 ${showBorder ? 'border-t border-black/5' : ''}`}
    >
      <div className="relative flex size-16 shrink-0 items-center justify-center sm:size-20">
        <svg className="absolute inset-0 size-full -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="15.5" fill="none" className="stroke-fog" strokeWidth="2" />
          <circle
            cx="18"
            cy="18"
            r="15.5"
            fill="none"
            className="stroke-wine"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={`${score * 0.974} 100`}
          />
        </svg>
        <span className="font-heading text-bark text-lg font-medium tabular-nums sm:text-xl">
          {score}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-wine text-xs font-medium">#{rank} match</p>
        <h2 className="font-heading text-bark group-hover:text-wine text-xl font-medium tracking-tight sm:text-2xl">
          {winery.name}
        </h2>
        <div className="text-stone mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm">
          <span>{winery.region}</span>
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

        {featureBadges.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {featureBadges.map((badge) => (
              <span key={badge} className="bg-fog/80 text-stone rounded-full px-2 py-0.5 text-xs">
                {badge}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)] flex-col items-center justify-center px-6 py-24">
      <div className="bg-fog flex size-16 items-center justify-center rounded-full">
        <Search className="text-stone size-7" />
      </div>
      <h1 className="font-heading text-bark mt-6 text-2xl font-medium tracking-tight">
        No wineries matched
      </h1>
      <p className="text-stone mt-2 max-w-sm text-center text-sm text-pretty">
        Try relaxing your filters — fewer constraints means more matches.
      </p>
      <Button className="mt-8 rounded-full px-8" asChild>
        <Link href="/quiz">Retake the Quiz</Link>
      </Button>
    </div>
  );
}
