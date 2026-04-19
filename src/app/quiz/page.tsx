'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSessionStorage } from '@/hooks/use-session-storage';
import { motion, AnimatePresence, type Variants } from 'motion/react';
import {
  Dog,
  Baby,
  UtensilsCrossed,
  TreePine,
  Eye,
  MapPin,
  ArrowRight,
  ArrowLeft,
  Compass,
  BookOpen,
  GraduationCap,
  PartyPopper,
  Heart,
  UsersRound,
  Users,
  User as UserIcon,
  Grape,
  Wine,
  Sun,
  Sparkles,
  Cherry,
  Citrus,
  Flower2,
  Droplets,
  Leaf,
  DoorOpen,
  type LucideIcon,
} from 'lucide-react';
import type {
  Archetype,
  BudgetBand,
  GroupComposition,
  MustHaves,
  QuizAnswers,
  Region,
  Varietal,
} from '@/lib/types';

const ARCHETYPES: { value: Archetype; title: string; description: string; Icon: LucideIcon }[] = [
  {
    value: 'explorer',
    title: 'Explorer',
    description: 'Hidden gems, new varietals, off the beaten path',
    Icon: Compass,
  },
  {
    value: 'collector',
    title: 'Collector',
    description: 'Library releases, winemaker chats, serious wines',
    Icon: BookOpen,
  },
  {
    value: 'student',
    title: 'Student',
    description: 'Learn how wine is made — barrels, blending, soil',
    Icon: GraduationCap,
  },
  {
    value: 'socializer',
    title: 'Socializer',
    description: 'Lively rooms, live music, group-friendly energy',
    Icon: PartyPopper,
  },
  {
    value: 'romantic',
    title: 'Romantic',
    description: 'Scenic, intimate, unforgettable',
    Icon: Heart,
  },
];

const GROUP_COMPOSITIONS: {
  value: GroupComposition;
  title: string;
  subtitle: string;
  Icon: LucideIcon;
}[] = [
  { value: 'solo', title: 'Just me', subtitle: 'Flying solo', Icon: UserIcon },
  { value: 'couple', title: 'Me and my partner', subtitle: 'Two of us', Icon: Users },
  { value: 'small_group', title: 'Small group', subtitle: '3–5 people', Icon: UsersRound },
  { value: 'big_group', title: 'Big group', subtitle: '6+ people', Icon: UsersRound },
];

const BUDGETS: { value: BudgetBand; label: string; range: string }[] = [
  { value: '$', label: 'Budget-friendly', range: 'Under $30' },
  { value: '$$', label: 'Mid-range', range: '$30–60' },
  { value: '$$$', label: 'Premium', range: '$60–100' },
  { value: '$$$$', label: 'Luxury', range: '$100+' },
];

const MUST_HAVE_OPTIONS: { key: keyof MustHaves; label: string; Icon: LucideIcon }[] = [
  { key: 'views', label: 'Scenic views', Icon: Eye },
  { key: 'outdoorSeating', label: 'Outdoor seating', Icon: TreePine },
  { key: 'foodPairing', label: 'Food available', Icon: UtensilsCrossed },
  { key: 'dogFriendly', label: 'Dog-friendly', Icon: Dog },
  { key: 'kidFriendly', label: 'Kid-friendly', Icon: Baby },
  { key: 'picnic', label: 'Picnic-friendly', Icon: Leaf },
  { key: 'walkInsWelcome', label: 'Walk-ins welcome', Icon: DoorOpen },
];

const SKIP_VARIETALS: { value: Varietal; Icon: LucideIcon }[] = [
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
    title: 'Which one sounds like you?',
    subtitle: 'This helps us match the experience to you.',
  },
  {
    title: "Who's coming along?",
    subtitle: 'So we can match group size, noise level, and vibe.',
  },
  {
    title: 'The practical stuff',
    subtitle: 'Budget, must-haves, and anything to avoid.',
  },
  { title: 'Where & how many?', subtitle: 'Pick your regions and how many stops you want.' },
] as const;

const defaultAnswers: QuizAnswers = {
  archetype: null,
  groupComposition: null,
  budgetBand: null,
  mustHaves: {
    views: false,
    foodPairing: false,
    outdoorSeating: false,
    dogFriendly: false,
    kidFriendly: false,
    picnic: false,
    walkInsWelcome: false,
  },
  skipVarietals: [],
  preferredRegions: [],
  numStops: 3,
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
  const [answers, setAnswers, { hydrated: answersHydrated }] = useSessionStorage<QuizAnswers>(
    'quiz-answers',
    defaultAnswers,
  );
  const [direction, setDirection] = useState(1);
  const hydrated = stepHydrated && answersHydrated;

  const setArchetype = useCallback((value: Archetype) => {
    setAnswers((prev) => ({ ...prev, archetype: prev.archetype === value ? null : value }));
  }, []);

  const setGroupComposition = useCallback((value: GroupComposition) => {
    setAnswers((prev) => ({
      ...prev,
      groupComposition: prev.groupComposition === value ? null : value,
    }));
  }, []);

  const setBudget = useCallback((b: BudgetBand) => {
    setAnswers((prev) => ({ ...prev, budgetBand: prev.budgetBand === b ? null : b }));
  }, []);

  const toggleMustHave = useCallback((key: keyof MustHaves) => {
    setAnswers((prev) => ({
      ...prev,
      mustHaves: { ...prev.mustHaves, [key]: !prev.mustHaves[key] },
    }));
  }, []);

  const toggleSkipVarietal = useCallback((v: Varietal) => {
    setAnswers((prev) => ({
      ...prev,
      skipVarietals: prev.skipVarietals.includes(v)
        ? prev.skipVarietals.filter((x) => x !== v)
        : [...prev.skipVarietals, v],
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

  const next = useCallback(() => {
    if (step < STEPS.length - 1) {
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

  const isLast = step === STEPS.length - 1;
  const progress = ((step + 1) / STEPS.length) * 100;

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
              {step + 1} / {STEPS.length}
            </span>

            <h1 className="font-heading text-bark mt-6 max-w-[20ch] text-4xl font-medium tracking-tight text-balance md:text-5xl">
              {STEPS[step].title}
            </h1>
            <p className="text-stone mt-4 max-w-[50ch] text-lg text-pretty">
              {STEPS[step].subtitle}
            </p>

            <div className="mt-12">
              {step === 0 && (
                <ArchetypeStep selected={answers.archetype} onSelect={setArchetype} />
              )}
              {step === 1 && (
                <GroupCompositionStep
                  selected={answers.groupComposition}
                  onSelect={setGroupComposition}
                />
              )}
              {step === 2 && (
                <BudgetMustHavesStep
                  budgetBand={answers.budgetBand}
                  mustHaves={answers.mustHaves}
                  skipVarietals={answers.skipVarietals}
                  onSetBudget={setBudget}
                  onToggleMustHave={toggleMustHave}
                  onToggleSkipVarietal={toggleSkipVarietal}
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

function ArchetypeStep({
  selected,
  onSelect,
}: {
  selected: Archetype | null;
  onSelect: (value: Archetype) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {ARCHETYPES.map((a) => {
        const active = selected === a.value;
        return (
          <button
            key={a.value}
            type="button"
            onClick={() => onSelect(a.value)}
            className={`focus-visible:outline-wine flex flex-col items-start gap-3 rounded-2xl p-6 text-left transition-all focus-visible:outline-2 focus-visible:outline-offset-2 ${
              active
                ? 'bg-wine/10 ring-wine ring-2'
                : 'bg-linen ring-1 ring-black/5 hover:ring-black/10'
            }`}
          >
            <a.Icon className={`size-6 ${active ? 'text-wine' : 'text-oak'}`} />
            <div>
              <p className={`font-medium ${active ? 'text-wine' : 'text-bark'}`}>{a.title}</p>
              <p className="text-stone mt-1 text-sm">{a.description}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function GroupCompositionStep({
  selected,
  onSelect,
}: {
  selected: GroupComposition | null;
  onSelect: (value: GroupComposition) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {GROUP_COMPOSITIONS.map((g) => {
        const active = selected === g.value;
        return (
          <button
            key={g.value}
            type="button"
            onClick={() => onSelect(g.value)}
            className={`focus-visible:outline-wine flex items-center gap-4 rounded-2xl p-6 text-left transition-all focus-visible:outline-2 focus-visible:outline-offset-2 ${
              active
                ? 'bg-wine/10 ring-wine ring-2'
                : 'bg-linen ring-1 ring-black/5 hover:ring-black/10'
            }`}
          >
            <g.Icon className={`size-6 shrink-0 ${active ? 'text-wine' : 'text-oak'}`} />
            <div>
              <p className={`font-medium ${active ? 'text-wine' : 'text-bark'}`}>{g.title}</p>
              <p className="text-stone mt-1 text-sm">{g.subtitle}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function BudgetMustHavesStep({
  budgetBand,
  mustHaves,
  skipVarietals,
  onSetBudget,
  onToggleMustHave,
  onToggleSkipVarietal,
}: {
  budgetBand: BudgetBand | null;
  mustHaves: MustHaves;
  skipVarietals: Varietal[];
  onSetBudget: (b: BudgetBand) => void;
  onToggleMustHave: (key: keyof MustHaves) => void;
  onToggleSkipVarietal: (v: Varietal) => void;
}) {
  return (
    <div className="space-y-14">
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

      <div>
        <h3 className="font-heading text-bark text-xl font-medium">Must-haves (optional)</h3>
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

      <div>
        <h3 className="font-heading text-bark text-xl font-medium">Any dealbreakers? (optional)</h3>
        <p className="text-stone mt-2 text-sm">
          Skip wineries that specialize in these varietals.
        </p>
        <div className="mt-6 flex flex-wrap gap-2.5">
          {SKIP_VARIETALS.map((v) => {
            const active = skipVarietals.includes(v.value);
            return (
              <button
                key={v.value}
                type="button"
                onClick={() => onToggleSkipVarietal(v.value)}
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
