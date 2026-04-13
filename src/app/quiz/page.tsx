'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSessionStorage } from '@/hooks/use-session-storage';
import { motion, AnimatePresence, type Variants } from 'motion/react';
import {
  Dog,
  Baby,
  Accessibility,
  UtensilsCrossed,
  TreePine,
  Eye,
  MapPin,
  ArrowRight,
  ArrowLeft,
  Grape,
  Sun,
  PartyPopper,
  Compass,
  Music,
  Wine,
  Sparkles,
  Cherry,
  Citrus,
  Flower2,
  Droplets,
  type LucideIcon,
} from 'lucide-react';
import type { Varietal, Vibe, BudgetBand, Region, MustHaves, QuizAnswers } from '@/lib/types';

const VARIETALS: { value: Varietal; Icon: LucideIcon }[] = [
  { value: 'Pinot Noir', Icon: Wine },
  { value: 'Chardonnay', Icon: Sun },
  { value: 'Cabernet Sauvignon', Icon: Grape },
  { value: 'Zinfandel', Icon: Cherry },
  { value: 'Sparkling', Icon: Sparkles },
  { value: 'Rosé', Icon: Flower2 },
  { value: 'Sauvignon Blanc', Icon: Citrus },
  { value: 'Merlot', Icon: Droplets },
  { value: 'Syrah', Icon: Grape },
];

const VIBES: { value: Vibe; description: string; Icon: typeof Sun }[] = [
  { value: 'Relaxed & Scenic', description: 'Beautiful views, slow pace', Icon: Sun },
  { value: 'Educational', description: 'Learn about winemaking', Icon: Grape },
  { value: 'Celebratory', description: 'Special occasion energy', Icon: PartyPopper },
  { value: 'Adventurous', description: 'Hidden gems, off the beaten path', Icon: Compass },
  { value: 'Social & Lively', description: 'Upbeat, group-friendly', Icon: Music },
];

const BUDGETS: { value: BudgetBand; label: string; range: string }[] = [
  { value: '$', label: 'Budget-friendly', range: 'Under $30' },
  { value: '$$', label: 'Mid-range', range: '$30–60' },
  { value: '$$$', label: 'Premium', range: '$60–100' },
  { value: '$$$$', label: 'Luxury', range: '$100+' },
];

const MUST_HAVE_OPTIONS: { key: keyof MustHaves; label: string; Icon: typeof Eye }[] = [
  { key: 'views', label: 'Scenic views', Icon: Eye },
  { key: 'foodPairing', label: 'Food pairing', Icon: UtensilsCrossed },
  { key: 'outdoorSeating', label: 'Outdoor seating', Icon: TreePine },
  { key: 'dogFriendly', label: 'Dog-friendly', Icon: Dog },
  { key: 'kidFriendly', label: 'Kid-friendly', Icon: Baby },
  { key: 'wheelchairAccessible', label: 'Wheelchair accessible', Icon: Accessibility },
];

const REGIONS: { value: Region; area: string }[] = [
  { value: 'Russian River Valley', area: 'Central Sonoma' },
  { value: 'Dry Creek Valley', area: 'Northern Sonoma' },
  { value: 'Sonoma Valley', area: 'Southern Sonoma' },
  { value: 'Alexander Valley', area: 'Northern Sonoma' },
  { value: 'Carneros', area: 'Southern Border' },
];

const STOP_OPTIONS = [2, 3, 4, 5] as const;

const STEPS = [
  {
    title: 'What do you love to drink?',
    subtitle: 'Pick as many as you like — or skip to stay open.',
  },
  { title: "What's your vibe?", subtitle: 'Choose the mood and set your budget.' },
  { title: 'What matters most?', subtitle: 'The practical stuff — group needs, must-haves.' },
  { title: 'Where & how many?', subtitle: 'Pick your regions and how many stops you want.' },
] as const;

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

const fadeUpVariants: Variants = {
  enter: (d: number) => ({ opacity: 0, y: d * 30 }),
  center: { opacity: 1, x: 0, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export default function QuizPage() {
  const router = useRouter();
  const [rawStep, setStep, { hydrated: stepHydrated }] = useSessionStorage('quiz-step', 0);
  const step = Math.min(Math.max(rawStep, 0), STEPS.length - 1);
  const [answers, setAnswers, { hydrated: answersHydrated, remove: clearAnswers }] =
    useSessionStorage<QuizAnswers>('quiz-answers', defaultAnswers);
  const [direction, setDirection] = useState(1);
  const hydrated = stepHydrated && answersHydrated;

  const toggleVarietal = useCallback((v: Varietal) => {
    setAnswers((prev) => ({
      ...prev,
      selectedVarietals: prev.selectedVarietals.includes(v)
        ? prev.selectedVarietals.filter((x) => x !== v)
        : [...prev.selectedVarietals, v],
    }));
  }, []);

  const toggleVibe = useCallback((v: Vibe) => {
    setAnswers((prev) => ({
      ...prev,
      selectedVibes: prev.selectedVibes.includes(v)
        ? prev.selectedVibes.filter((x) => x !== v)
        : [...prev.selectedVibes, v],
    }));
  }, []);

  const setBudget = useCallback((b: BudgetBand) => {
    setAnswers((prev) => ({
      ...prev,
      budgetBand: prev.budgetBand === b ? null : b,
    }));
  }, []);

  const toggleMustHave = useCallback((key: keyof MustHaves) => {
    setAnswers((prev) => ({
      ...prev,
      mustHaves: { ...prev.mustHaves, [key]: !prev.mustHaves[key] },
    }));
  }, []);

  const toggleRegion = useCallback((r: Region) => {
    setAnswers((prev) => ({
      ...prev,
      preferredRegions: prev.preferredRegions.includes(r)
        ? prev.preferredRegions.filter((x) => x !== r)
        : [...prev.preferredRegions, r],
    }));
  }, []);

  const setNumStops = useCallback((n: number) => {
    setAnswers((prev) => ({ ...prev, numStops: n }));
  }, []);

  const setGroupSize = useCallback((n: number | null) => {
    setAnswers((prev) => ({ ...prev, groupSize: n }));
  }, []);

  const toggleMembersOnly = useCallback(() => {
    setAnswers((prev) => ({ ...prev, includeMembersOnly: !prev.includeMembersOnly }));
  }, []);

  const next = useCallback(() => {
    if (step < 3) {
      setDirection(1);
      setStep((s) => s + 1);
    }
  }, [step]);

  const back = useCallback(() => {
    if (step > 0) {
      setDirection(-1);
      setStep((s) => s - 1);
    }
  }, [step]);

  const submit = useCallback(() => {
    setStep(0);
    router.push('/results');
  }, [router, setStep]);

  const isLast = step === 3;
  const progress = ((step + 1) / 4) * 100;

  if (!hydrated) {
    return <div className="min-h-[calc(100dvh-3.5rem)]" />;
  }

  return (
    <div className="min-h-[calc(100dvh-3.5rem)]">
      <div className="bg-fog sticky top-14 z-20 h-1">
        <motion.div
          className="bg-wine h-full"
          initial={false}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>

      <div className="mx-auto max-w-3xl px-6 py-16 md:py-24">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={fadeUpVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <span className="bg-wine/10 text-wine ring-wine/20 inline-flex items-center rounded-full px-3 py-1 text-xs font-medium tracking-wide ring-1">
              {step + 1} / 4
            </span>

            <h1 className="font-heading text-bark mt-6 max-w-[20ch] text-4xl font-medium tracking-tight text-balance md:text-5xl">
              {STEPS[step].title}
            </h1>
            <p className="text-stone mt-4 max-w-[50ch] text-lg text-pretty">
              {STEPS[step].subtitle}
            </p>

            <div className="mt-12">
              {step === 0 && (
                <VarietalsStep selected={answers.selectedVarietals} onToggle={toggleVarietal} />
              )}
              {step === 1 && (
                <VibeBudgetStep
                  selectedVibes={answers.selectedVibes}
                  budgetBand={answers.budgetBand}
                  onToggleVibe={toggleVibe}
                  onSetBudget={setBudget}
                />
              )}
              {step === 2 && (
                <MustHavesStep
                  mustHaves={answers.mustHaves}
                  groupSize={answers.groupSize}
                  includeMembersOnly={answers.includeMembersOnly}
                  onToggleMustHave={toggleMustHave}
                  onSetGroupSize={setGroupSize}
                  onToggleMembersOnly={toggleMembersOnly}
                />
              )}
              {step === 3 && (
                <RegionStopsStep
                  preferredRegions={answers.preferredRegions}
                  numStops={answers.numStops}
                  onToggleRegion={toggleRegion}
                  onSetNumStops={setNumStops}
                />
              )}
            </div>

            <div className="mt-16 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <button
                type="button"
                onClick={isLast ? submit : next}
                className="bg-wine text-cream shadow-warm hover:bg-wine-dark focus-visible:outline-wine flex items-center justify-center gap-2 rounded-full px-10 py-3.5 text-base font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 sm:w-auto"
              >
                {isLast ? 'See My Matches' : 'Continue'}
                <ArrowRight className="size-5" />
              </button>
              {step > 0 && (
                <button
                  type="button"
                  onClick={back}
                  className="text-stone hover:text-bark flex items-center justify-center gap-1.5 rounded-full py-3 text-sm font-medium transition-colors sm:py-2"
                >
                  <ArrowLeft className="size-4" />
                  Go back
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function VarietalsStep({
  selected,
  onToggle,
}: {
  selected: Varietal[];
  onToggle: (v: Varietal) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {VARIETALS.map((v) => {
        const active = selected.includes(v.value);
        return (
          <button
            key={v.value}
            type="button"
            onClick={() => onToggle(v.value)}
            className={`focus-visible:outline-wine flex items-center gap-2 rounded-full px-5 py-3 text-base font-medium transition-all focus-visible:outline-2 focus-visible:outline-offset-2 ${
              active
                ? 'bg-wine text-cream shadow-warm'
                : 'bg-linen text-bark hover:bg-fog ring-1 ring-black/5'
            }`}
          >
            <v.Icon className={`size-5 ${active ? 'text-cream' : 'text-oak'}`} />
            {v.value}
          </button>
        );
      })}
    </div>
  );
}

function VibeBudgetStep({
  selectedVibes,
  budgetBand,
  onToggleVibe,
  onSetBudget,
}: {
  selectedVibes: Vibe[];
  budgetBand: BudgetBand | null;
  onToggleVibe: (v: Vibe) => void;
  onSetBudget: (b: BudgetBand) => void;
}) {
  return (
    <div className="space-y-14">
      <div>
        <h3 className="font-heading text-bark text-xl font-medium">Pick your vibe</h3>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {VIBES.map((v) => {
            const active = selectedVibes.includes(v.value);
            return (
              <button
                key={v.value}
                type="button"
                onClick={() => onToggleVibe(v.value)}
                className={`focus-visible:outline-wine flex flex-col items-start gap-3 rounded-2xl p-6 text-left transition-all focus-visible:outline-2 focus-visible:outline-offset-2 ${
                  active
                    ? 'bg-wine/10 ring-wine ring-2'
                    : 'bg-linen ring-1 ring-black/5 hover:ring-black/10'
                }`}
              >
                <v.Icon className={`size-6 ${active ? 'text-wine' : 'text-oak'}`} />
                <div>
                  <p className={`font-medium ${active ? 'text-wine' : 'text-bark'}`}>{v.value}</p>
                  <p className="text-stone mt-1 text-sm">{v.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="font-heading text-bark text-xl font-medium">Set your budget</h3>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {BUDGETS.map((b) => {
            const active = budgetBand === b.value;
            return (
              <button
                key={b.value}
                type="button"
                onClick={() => onSetBudget(b.value)}
                className={`focus-visible:outline-wine flex flex-col items-center gap-1 rounded-2xl p-6 transition-all focus-visible:outline-2 focus-visible:outline-offset-2 ${
                  active
                    ? 'bg-wine/10 ring-wine ring-2'
                    : 'bg-linen ring-1 ring-black/5 hover:ring-black/10'
                }`}
              >
                <span
                  className={`text-2xl font-medium tabular-nums ${active ? 'text-wine' : 'text-bark'}`}
                >
                  {b.value}
                </span>
                <span className="text-stone text-sm">{b.label}</span>
                <span className="text-stone/70 text-xs">{b.range}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MustHavesStep({
  mustHaves,
  groupSize,
  includeMembersOnly,
  onToggleMustHave,
  onSetGroupSize,
  onToggleMembersOnly,
}: {
  mustHaves: MustHaves;
  groupSize: number | null;
  includeMembersOnly: boolean;
  onToggleMustHave: (key: keyof MustHaves) => void;
  onSetGroupSize: (n: number | null) => void;
  onToggleMembersOnly: () => void;
}) {
  return (
    <div className="space-y-14">
      <div>
        <h3 className="font-heading text-bark text-xl font-medium">Must-haves</h3>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MUST_HAVE_OPTIONS.map((opt) => {
            const active = mustHaves[opt.key];
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => onToggleMustHave(opt.key)}
                className={`focus-visible:outline-wine flex items-center gap-4 rounded-2xl p-5 text-left transition-all focus-visible:outline-2 focus-visible:outline-offset-2 ${
                  active
                    ? 'bg-wine/10 ring-wine ring-2'
                    : 'bg-linen ring-1 ring-black/5 hover:ring-black/10'
                }`}
              >
                <opt.Icon className={`size-6 shrink-0 ${active ? 'text-wine' : 'text-stone'}`} />
                <span className={`font-medium ${active ? 'text-wine' : 'text-bark'}`}>
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-10 sm:grid-cols-2">
        <div>
          <h3 className="font-heading text-bark text-xl font-medium">Group size</h3>
          <div className="mt-4 flex flex-wrap gap-3">
            {[null, 2, 4, 6, 8].map((n) => (
              <button
                key={n ?? 'any'}
                type="button"
                onClick={() => onSetGroupSize(n)}
                className={`focus-visible:outline-wine flex h-12 min-w-12 items-center justify-center rounded-xl px-4 text-sm font-medium tabular-nums transition-all focus-visible:outline-2 focus-visible:outline-offset-2 ${
                  groupSize === n
                    ? 'bg-wine text-cream shadow-warm'
                    : 'bg-linen text-bark hover:bg-fog ring-1 ring-black/5'
                }`}
              >
                {n === null ? 'Any' : `${n}+`}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-heading text-bark text-xl font-medium">Members-only</h3>
          <button
            type="button"
            onClick={onToggleMembersOnly}
            className="mt-4 flex items-center gap-4"
          >
            <ToggleSwitch checked={includeMembersOnly} />
            <span className="text-stone">Include members-only wineries</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function RegionStopsStep({
  preferredRegions,
  numStops,
  onToggleRegion,
  onSetNumStops,
}: {
  preferredRegions: Region[];
  numStops: number;
  onToggleRegion: (r: Region) => void;
  onSetNumStops: (n: number) => void;
}) {
  return (
    <div className="space-y-14">
      <div>
        <h3 className="font-heading text-bark text-xl font-medium">Preferred regions</h3>
        <p className="text-stone mt-1 text-sm">Leave empty to include all of Sonoma County.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {REGIONS.map((r) => {
            const active = preferredRegions.includes(r.value);
            return (
              <button
                key={r.value}
                type="button"
                onClick={() => onToggleRegion(r.value)}
                className={`focus-visible:outline-wine flex items-center gap-3 rounded-2xl p-5 text-left transition-all focus-visible:outline-2 focus-visible:outline-offset-2 ${
                  active
                    ? 'bg-wine/10 ring-wine ring-2'
                    : 'bg-linen ring-1 ring-black/5 hover:ring-black/10'
                }`}
              >
                <MapPin className={`size-5 shrink-0 ${active ? 'text-wine' : 'text-stone'}`} />
                <div>
                  <p className={`font-medium ${active ? 'text-wine' : 'text-bark'}`}>{r.value}</p>
                  <p className="text-stone text-xs">{r.area}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="font-heading text-bark text-xl font-medium">How many stops?</h3>
        <div className="mt-6 flex gap-4">
          {STOP_OPTIONS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onSetNumStops(n)}
              className={`focus-visible:outline-wine flex size-16 flex-col items-center justify-center rounded-2xl font-medium tabular-nums transition-all focus-visible:outline-2 focus-visible:outline-offset-2 ${
                numStops === n
                  ? 'bg-wine text-cream shadow-warm'
                  : 'bg-linen text-bark hover:bg-fog ring-1 ring-black/5'
              }`}
            >
              <span className="text-xl">{n}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ToggleSwitch({ checked }: { checked: boolean }) {
  return (
    <div
      className={`relative inline-flex w-11 shrink-0 rounded-full p-0.5 transition-colors duration-200 ease-in-out sm:w-9 ${
        checked ? 'bg-wine' : 'bg-fog'
      }`}
    >
      <span
        className={`aspect-square w-1/2 rounded-full bg-white shadow-sm ring-1 ring-black/5 transition-transform duration-200 ease-in-out ${
          checked ? 'translate-x-full' : ''
        }`}
      />
    </div>
  );
}
