import type { BudgetBand, QuizAnswers, WineryForMatching } from '../types';

const BUDGET_CEILING: Record<Exclude<BudgetBand, '$$$$'>, number> = {
  $: 35,
  $$: 65,
  $$$: 100,
};

export function getBudgetCeiling(band: BudgetBand | null): number | null {
  if (!band || band === '$$$$') return null;
  return BUDGET_CEILING[band];
}

function passesVarietalFilter(winery: WineryForMatching, answers: QuizAnswers): boolean {
  if (answers.selectedVarietals.length === 0) return true;
  return answers.selectedVarietals.some((v) => winery.varietals.includes(v));
}

function passesBudgetFilter(winery: WineryForMatching, answers: QuizAnswers): boolean {
  const ceiling = getBudgetCeiling(answers.budgetBand);
  if (ceiling === null) return true;
  if (winery.minFlightPrice === null) return true;
  return winery.minFlightPrice <= ceiling;
}

function passesRegionFilter(winery: WineryForMatching, answers: QuizAnswers): boolean {
  if (answers.preferredRegions.length === 0) return true;
  return answers.preferredRegions.includes(winery.region);
}

function passesMembersOnlyFilter(winery: WineryForMatching, answers: QuizAnswers): boolean {
  if (!winery.isMembersOnly) return true;
  return answers.includeMembersOnly;
}

function passesMustHavesFilter(winery: WineryForMatching, answers: QuizAnswers): boolean {
  const checks: [boolean, boolean][] = [
    [answers.mustHaves.views, winery.hasViews],
    [answers.mustHaves.foodPairing, winery.hasFoodPairing],
    [answers.mustHaves.outdoorSeating, winery.hasOutdoorSeating],
    [answers.mustHaves.dogFriendly, winery.isDogFriendly],
    [answers.mustHaves.kidFriendly, winery.isKidFriendly],
    [answers.mustHaves.wheelchairAccessible, winery.isWheelchairAccessible],
  ];
  return checks.every(([required, has]) => !required || has);
}

function passesGroupSizeFilter(winery: WineryForMatching, answers: QuizAnswers): boolean {
  if (answers.groupSize === null || answers.groupSize < 8) return true;
  if (winery.groupSizeMax === null) return true;
  return winery.groupSizeMax >= answers.groupSize;
}

const ALL_FILTERS = [
  passesVarietalFilter,
  passesBudgetFilter,
  passesRegionFilter,
  passesMembersOnlyFilter,
  passesMustHavesFilter,
  passesGroupSizeFilter,
];

export function applyHardFilters(
  wineries: WineryForMatching[],
  answers: QuizAnswers,
): WineryForMatching[] {
  return wineries.filter((w) => ALL_FILTERS.every((f) => f(w, answers)));
}
