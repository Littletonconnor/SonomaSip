'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronDown, Star, Check, Map as MapIcon, Loader2, ArrowRight } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AnimatedSection, StaggerChildren, StaggerItem } from '@/components/ui/animated-section';
import { useSessionStorage } from '@/hooks/use-session-storage';
import { useIsMobile } from '@/hooks/use-mobile';
import { submitQuiz } from '@/lib/actions/quiz';
import { createPlan } from '@/lib/actions/plan';
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
  const [results, setResults] = useState<MatchResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!hydrated) return;

    startTransition(async () => {
      try {
        const data = await submitQuiz(answers);
        setResults(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      }
    });
  }, [hydrated, answers]);

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
      (results ?? []).map((r) => ({
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

  const router = useRouter();
  const isMobile = useIsMobile();
  const [showMap, setShowMap] = useState(false);
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  const [hoveredWineryId, setHoveredWineryId] = useState<string | null>(null);
  const [activeWineryId, setActiveWineryId] = useState<string | null>(null);

  async function handleCreatePlan() {
    if (!results || isCreatingPlan) return;
    setIsCreatingPlan(true);
    try {
      const planId = await createPlan(answers, results);
      router.push(`/plan/${planId}`);
    } catch {
      setIsCreatingPlan(false);
    }
  }

  function handleCardClick(id: string, slug: string) {
    if (isMobile && !showMap) {
      router.push(`/wineries/${slug}`);
      return;
    }
    setActiveWineryId(id);
    setTimeout(() => {
      router.push(`/wineries/${slug}`);
    }, 650);
  }

  if (!hydrated || isPending) {
    return <ResultsSkeleton />;
  }

  if (error) {
    return (
      <ErrorState
        message={error}
        onRetry={() => {
          setError(null);
          setResults(null);
          startTransition(async () => {
            try {
              const data = await submitQuiz(answers);
              setResults(data);
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Something went wrong');
            }
          });
        }}
      />
    );
  }

  if (results === null) {
    return <ResultsSkeleton />;
  }

  if (results.length === 0) {
    return <EmptyState answers={answers} />;
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
                  {`We found ${results.length} wineries we think you\u2019ll love`}
                </p>
              </div>
              <Button
                onClick={handleCreatePlan}
                disabled={isCreatingPlan}
                className="group shrink-0 gap-2 rounded-full py-2.5 pr-5 pl-6 text-sm font-medium"
              >
                {isCreatingPlan ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Creating&hellip;
                  </>
                ) : (
                  <>
                    Create Your Plan
                    <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </>
                )}
              </Button>
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
                  <ResultCard
                    result={result}
                    showBorder={i > 0}
                    isHighlighted={hoveredWineryId === result.winery.id}
                    onHover={setHoveredWineryId}
                    onCardClick={handleCardClick}
                  />
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
                      <SonomaMap
                        items={mapItems}
                        showLegend
                        hoveredId={hoveredWineryId}
                        onMarkerHover={setHoveredWineryId}
                        activeId={activeWineryId}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <AnimatedSection delay={0.3} direction="right">
                <SonomaMap
                  items={mapItems}
                  showLegend
                  hoveredId={hoveredWineryId}
                  onMarkerHover={setHoveredWineryId}
                  activeId={activeWineryId}
                />
              </AnimatedSection>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ResultCard({
  result,
  showBorder,
  isHighlighted,
  onHover,
  onCardClick,
}: {
  result: MatchResult;
  showBorder: boolean;
  isHighlighted?: boolean;
  onHover?: (id: string | null) => void;
  onCardClick?: (id: string, slug: string) => void;
}) {
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
      onClick={(e) => {
        if (onCardClick) {
          e.preventDefault();
          onCardClick(winery.id, winery.slug);
        }
      }}
      className={`group flex gap-5 py-7 sm:gap-7 ${showBorder ? 'border-t border-black/5' : ''} ${isHighlighted ? 'bg-linen/50' : ''}`}
      onMouseEnter={() => onHover?.(winery.id)}
      onMouseLeave={() => onHover?.(null)}
    >
      <div className="relative flex size-16 shrink-0 items-center justify-center sm:size-20">
        <svg className="absolute inset-0 size-full -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="15.5" fill="none" className="stroke-fog" strokeWidth="2" />
          <motion.circle
            cx="18"
            cy="18"
            r="15.5"
            fill="none"
            className="stroke-wine"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="100 100"
            initial={{ strokeDashoffset: 100 }}
            whileInView={{ strokeDashoffset: 100 - score * 0.974 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1], delay: 0.2 }}
          />
        </svg>
        <span className="font-heading text-bark text-lg/none font-medium tabular-nums sm:text-xl/none">
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
              <Check className="text-wine mt-0.5 size-3.5 shrink-0" />
              {reason}
            </li>
          ))}
        </ul>

        {featureBadges.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {featureBadges.map((badge) => (
              <span
                key={badge}
                className="bg-linen text-oak rounded-full px-3 py-1 text-sm font-medium ring-1 ring-black/5"
              >
                {badge}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

function ResultsSkeleton() {
  return (
    <div className="min-h-[calc(100dvh-3.5rem)]">
      <div className="border-b border-black/5">
        <div className="mx-auto max-w-6xl px-6 py-12 md:py-16">
          <div className="bg-fog/60 h-9 w-72 animate-pulse rounded-lg" />
          <div className="bg-fog/40 mt-3 h-5 w-56 animate-pulse rounded-lg" />
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-6 py-12 md:py-16">
        <div className="gap-12 lg:grid lg:grid-cols-[3fr_2fr]">
          <div className="flex flex-col gap-7">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={`flex gap-5 py-7 ${i > 0 ? 'border-t border-black/5' : ''}`}>
                <div className="bg-fog/40 size-16 animate-pulse rounded-full sm:size-20" />
                <div className="flex-1 space-y-3">
                  <div className="bg-fog/40 h-4 w-20 animate-pulse rounded" />
                  <div className="bg-fog/60 h-7 w-48 animate-pulse rounded" />
                  <div className="bg-fog/40 h-4 w-64 animate-pulse rounded" />
                  <div className="space-y-2 pt-1">
                    <div className="bg-fog/30 h-4 w-56 animate-pulse rounded" />
                    <div className="bg-fog/30 h-4 w-48 animate-pulse rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="max-lg:hidden">
            <div className="bg-fog/30 h-80 animate-pulse rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <motion.div
      className="flex min-h-[calc(100dvh-3.5rem)] flex-col items-center justify-center px-6 py-24"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <div className="bg-linen flex size-20 items-center justify-center rounded-full">
        <svg
          className="text-wine/60 size-10"
          viewBox="0 0 48 48"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        >
          <circle cx="24" cy="24" r="18" />
          <path d="M24 16v10" />
          <circle cx="24" cy="33" r="0.5" fill="currentColor" />
        </svg>
      </div>
      <h1 className="font-heading text-bark mt-6 text-2xl font-medium tracking-tight text-balance">
        Something didn&rsquo;t go as planned
      </h1>
      <p className="text-stone mt-2 max-w-sm text-center text-sm text-pretty">{message}</p>
      <p className="text-stone/60 mt-1 text-center text-sm">
        Don&rsquo;t worry &mdash; your quiz answers are saved.
      </p>
      <div className="mt-8 flex items-center gap-3">
        <Button className="rounded-full px-8" onClick={onRetry}>
          Try Again
        </Button>
        <Button variant="outline" className="rounded-full px-8" asChild>
          <Link href="/quiz">Retake the Quiz</Link>
        </Button>
      </div>
      <p className="text-stone/40 mt-6 text-xs">
        If this keeps happening, email us at help@sonomasip.com
      </p>
    </motion.div>
  );
}

function getEmptyStateTips(answers: QuizAnswers): string[] {
  const tips: string[] = [];
  const activeMustHaves = Object.entries(answers.mustHaves).filter(([, v]) => v);
  if (activeMustHaves.length >= 3) {
    const label = MUST_HAVE_LABELS[activeMustHaves[0][0] as keyof MustHaves];
    tips.push(`Try removing a must-have like "${label}"`);
  }
  if (answers.selectedVarietals.length > 3) tips.push('Try selecting fewer grape varietals');
  if (answers.budgetBand === '$') tips.push('Expanding your budget range opens up more options');
  if (answers.preferredRegions.length >= 3) tips.push('Consider exploring all Sonoma regions');
  if (tips.length === 0 && !answers.includeMembersOnly)
    tips.push('Including members-only wineries can reveal hidden gems');
  if (tips.length === 0) tips.push('Try selecting fewer filters to see more wineries');
  return tips.slice(0, 3);
}

function EmptyState({ answers }: { answers: QuizAnswers }) {
  const tips = getEmptyStateTips(answers);

  return (
    <motion.div
      className="flex min-h-[calc(100dvh-3.5rem)] flex-col items-center justify-center px-6 py-24"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <div className="bg-linen flex size-20 items-center justify-center rounded-full">
        <svg
          className="text-wine/50 size-10"
          viewBox="0 0 48 48"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M17 6c0 0-3 8-3 14 0 6 4 10 10 10s10-4 10-10c0-6-3-14-3-14" />
          <line x1="24" y1="30" x2="24" y2="38" />
          <line x1="18" y1="40" x2="30" y2="40" />
        </svg>
      </div>
      <h1 className="font-heading text-bark mt-6 text-3xl font-medium tracking-tight text-balance">
        We couldn&rsquo;t find a perfect match &mdash; yet
      </h1>
      <p className="text-stone mt-2 max-w-md text-center text-sm text-pretty">
        Your preferences were very specific, which is great &mdash; it just means we need to cast a
        wider net.
      </p>

      <ul className="mt-6 flex flex-col gap-2" role="list">
        {tips.map((tip) => (
          <li key={tip} className="text-stone flex items-start gap-2 text-sm">
            <Check className="text-wine mt-0.5 size-3.5 shrink-0" />
            {tip}
          </li>
        ))}
      </ul>

      <div className="mt-8 flex items-center gap-4">
        <Button className="rounded-full px-8" asChild>
          <Link href="/quiz">Retake the Quiz</Link>
        </Button>
        <Link
          href="/wineries"
          className="text-wine decoration-wine/30 hover:decoration-wine text-sm font-medium underline underline-offset-4"
        >
          Browse all wineries
        </Link>
      </div>
    </motion.div>
  );
}
