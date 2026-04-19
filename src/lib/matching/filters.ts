import type {
  BudgetBand,
  GroupComposition,
  QuizAnswers,
  WineryForMatching,
} from '../types';

const BUDGET_CEILING: Record<Exclude<BudgetBand, '$$$$'>, number> = {
  $: 35,
  $$: 65,
  $$$: 100,
};

export function getBudgetCeiling(band: BudgetBand | null): number | null {
  if (!band || band === '$$$$') return null;
  return BUDGET_CEILING[band];
}

const GROUP_MIN_CAPACITY: Record<GroupComposition, number> = {
  solo: 0,
  couple: 2,
  small_group: 5,
  big_group: 6,
};

function passesGroupCompositionFilter(
  winery: WineryForMatching,
  answers: QuizAnswers,
): boolean {
  if (!answers.groupComposition) return true;
  const required = GROUP_MIN_CAPACITY[answers.groupComposition];
  if (required === 0) return true;
  if (winery.groupCapacity === null) return true;
  return winery.groupCapacity >= required;
}

function passesBudgetFilter(winery: WineryForMatching, answers: QuizAnswers): boolean {
  const ceiling = getBudgetCeiling(answers.budgetBand);
  if (ceiling === null) return true;
  if (winery.minFlightPrice === null) return true;
  return winery.minFlightPrice <= ceiling;
}

function passesRegionFilter(winery: WineryForMatching, answers: QuizAnswers): boolean {
  if (answers.preferredRegions.length === 0) return true;
  return answers.preferredRegions.some((r) => winery.region === r || winery.regionSecondary === r);
}

function passesMustHavesFilter(winery: WineryForMatching, answers: QuizAnswers): boolean {
  const checks: [boolean, boolean][] = [
    [answers.mustHaves.views, winery.hasViews],
    [answers.mustHaves.foodPairing, winery.hasFoodPairing],
    [answers.mustHaves.outdoorSeating, winery.hasOutdoorSeating],
    [answers.mustHaves.dogFriendly, winery.isDogFriendly],
    [answers.mustHaves.kidFriendly, winery.kidWelcome],
    [answers.mustHaves.picnic, winery.hasPicnic],
    [answers.mustHaves.walkInsWelcome, winery.reservationType === 'walk_ins_welcome'],
  ];
  return checks.every(([required, has]) => !required || has);
}

function passesDealbreakerFilter(
  winery: WineryForMatching,
  answers: QuizAnswers,
): boolean {
  if (answers.skipVarietals.length === 0) return true;
  return !answers.skipVarietals.some((v) => winery.houseSpecialty.includes(v));
}

export type FilterName = 'region' | 'mustHaves' | 'budget' | 'dealbreaker';

type NamedFilter = {
  name: FilterName;
  fn: (winery: WineryForMatching, answers: QuizAnswers) => boolean;
};

const RELAXABLE_FILTERS: NamedFilter[] = [
  { name: 'region', fn: passesRegionFilter },
  { name: 'mustHaves', fn: passesMustHavesFilter },
  { name: 'budget', fn: passesBudgetFilter },
  { name: 'dealbreaker', fn: passesDealbreakerFilter },
];

const ALWAYS_APPLIED = [passesGroupCompositionFilter];

export function applyHardFilters(
  wineries: WineryForMatching[],
  answers: QuizAnswers,
): WineryForMatching[] {
  const allFilters = [...ALWAYS_APPLIED, ...RELAXABLE_FILTERS.map((f) => f.fn)];
  return wineries.filter((w) => allFilters.every((f) => f(w, answers)));
}

export function applyFiltersWithRelaxation(
  wineries: WineryForMatching[],
  answers: QuizAnswers,
  minResults: number,
): { filtered: WineryForMatching[]; relaxed: FilterName[] } {
  const relaxed: FilterName[] = [];

  let activeFilters = [...RELAXABLE_FILTERS];
  let filtered = wineries.filter((w) =>
    [...ALWAYS_APPLIED, ...activeFilters.map((f) => f.fn)].every((f) => f(w, answers)),
  );

  if (filtered.length >= minResults) return { filtered, relaxed };

  for (const filter of RELAXABLE_FILTERS) {
    activeFilters = activeFilters.filter((f) => f.name !== filter.name);
    relaxed.push(filter.name);

    filtered = wineries.filter((w) =>
      [...ALWAYS_APPLIED, ...activeFilters.map((f) => f.fn)].every((f) => f(w, answers)),
    );

    if (filtered.length >= minResults) break;
  }

  return { filtered, relaxed };
}
